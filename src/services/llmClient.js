const ApiError = require('../utils/ApiError');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_PRIMARY_MODEL = 'google/gemini-2.5-flash-lite';
const DEFAULT_FALLBACK_MODEL = '';
const DEFAULT_MAX_TOKENS = 8192;

function stripCodeFences(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

const DEFAULT_GEMINI_DIRECT_MODEL = 'gemini-2.0-flash-lite';
let geminiQuotaExhaustedUntil = 0;

function getGeminiKey() {
  return process.env['Job-Capture'] || process.env.GEMINI_API_KEY || null;
}

function isGeminiAvailable() {
  return Boolean(getGeminiKey() && Date.now() > geminiQuotaExhaustedUntil);
}

function handleGeminiError(e) {
  const msg = String(e?.message || '');
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
    geminiQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
    console.warn('[llm] Gemini direct quota reached. Circuit breaker engaged for 30m; routing calls to OpenRouter.');
  }
}

async function callGeminiDirect(prompt, { model = DEFAULT_GEMINI_DIRECT_MODEL } = {}) {
  const apiKey = getGeminiKey();
  if (!apiKey) return null;

  const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini direct API error (${response.status}): ${body}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Gemini response had no text parts.');
  }
  return content;
}

function configuredModels({ model, fallback = true } = {}) {
  const primary = model || process.env.LLM_MODEL || DEFAULT_PRIMARY_MODEL;
  const fallbackModel = fallback ? (process.env.LLM_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL || null) : null;
  return { primary, fallback: fallbackModel && fallbackModel !== primary ? fallbackModel : null };
}

async function callOpenRouter(prompt, { models, maxTokens } = {}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new ApiError(500, 'OPENROUTER_API_KEY is not configured on the server.');
  }
  const list = models && models.length ? models : [configuredModels().primary];

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      models: list,
      response_format: { type: 'json_object' },
      max_tokens: maxTokens || DEFAULT_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(502, `OpenRouter request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new ApiError(502, 'OpenRouter response had no message content.');
  }

  if (data.model && data.model !== list[0]) {
    console.warn(`[llm] primary model "${list[0]}" not used; answered by "${data.model}"`);
  }
  return content;
}

// Sends one prompt to the primary provider (Gemini direct) or falls back to OpenRouter.
async function callLlm(prompt, options = {}) {
  if (isGeminiAvailable()) {
    try {
      return await callGeminiDirect(prompt, options);
    } catch (e) {
      handleGeminiError(e);
      console.warn(`[llm] Gemini direct call failed; falling back to OpenRouter: ${e.message}`);
    }
  }
  return await callOpenRouter(prompt, options);
}

/**
 * Calls the LLM and parses JSON.
 *  - Tries Gemini direct first if available and not on quota cooldown.
 *  - Falls back to OpenRouter models if Gemini fails or quota is exhausted.
 */
async function callLlmJson(prompt, { model, validate, maxTokens, fallback = true } = {}) {
  if (isGeminiAvailable()) {
    try {
      const text = await callGeminiDirect(prompt, { model: DEFAULT_GEMINI_DIRECT_MODEL });
      const parsed = JSON.parse(stripCodeFences(text));
      if (validate) validate(parsed);
      return parsed;
    } catch (e) {
      handleGeminiError(e);
      console.warn(`[llm] Gemini direct JSON failed; falling back to OpenRouter: ${e.message}`);
    }
  }

  const { primary, fallback: fallbackModel } = configuredModels({ model, fallback });
  const attempts = [
    fallbackModel ? [primary, fallbackModel] : [primary],
    fallbackModel ? [fallbackModel] : [primary],
  ];

  let lastError;
  for (const models of attempts) {
    try {
      const parsed = JSON.parse(stripCodeFences(await callOpenRouter(prompt, { models, maxTokens })));
      if (validate) validate(parsed);
      return parsed;
    } catch (e) {
      lastError = e;
    }
  }
  throw new ApiError(502, `Failed to get a structured response from the LLM: ${lastError?.message || 'unknown error'}`, {
    cause: lastError?.message,
  });
}

module.exports = { callLlm, callLlmJson, configuredModels, DEFAULT_PRIMARY_MODEL, DEFAULT_FALLBACK_MODEL, getGeminiKey };
