require('dotenv').config();
const { callLlmJson } = require('../src/services/llmClient');

const MODELS_TO_TEST = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

const testPrompt = `Extract the role details and return ONLY a JSON object:
Text: "We are hiring a Senior MLOps Engineer at Careem based in Dubai, UAE. 4+ years experience required."
JSON shape:
{
  "title": string,
  "company": string,
  "city": string,
  "country": string
}`;

async function testModel(modelName) {
  process.stdout.write(`Testing model: ${modelName}... `);
  const start = Date.now();
  try {
    const res = await callLlmJson(testPrompt, {
      model: modelName,
      maxTokens: 512,
      fallback: false,
    });
    const ms = Date.now() - start;
    console.log(`SUCCESS (${ms}ms)`);
    console.log(`   Output:`, JSON.stringify(res));
    return { ok: true, model: modelName, ms, res };
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`FAILED (${ms}ms)`);
    console.log(`   Error: ${err.message}`);
    return { ok: false, model: modelName, ms, error: err.message };
  }
}

async function main() {
  console.log(`Using OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'Present (ending in ...' + process.env.OPENROUTER_API_KEY.slice(-6) + ')' : 'MISSING'}\n`);
  
  for (const model of MODELS_TO_TEST) {
    await testModel(model);
    console.log('');
  }
}

main();
