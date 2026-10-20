const ApiError = require('../utils/ApiError');

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minute debounce between runs
let lastTriggeredAt = null;
let lastTriggerStatus = null;

async function trigger(req, res, next) {
  try {
    const now = Date.now();
    if (lastTriggeredAt && now - lastTriggeredAt < COOLDOWN_MS) {
      const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastTriggeredAt)) / 1000);
      throw new ApiError(429, `Fetch sync is on cooldown. Please wait ${remainingSec}s before triggering again.`);
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO; // e.g. "Muhammad-Hammad-Malik/JobCapture-Backend"
    const workflow = process.env.GITHUB_WORKFLOW || 'job-sync.yml';
    const ref = process.env.GITHUB_REF || 'main';

    lastTriggeredAt = now;

    if (token && repo) {
      const ghUrl = `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`;
      const ghRes = await fetch(ghUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'JobCapture-Backend',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref }),
      });

      if (!ghRes.ok) {
        const errText = await ghRes.text();
        lastTriggerStatus = { success: false, error: errText, at: new Date().toISOString() };
        throw new ApiError(502, `GitHub Actions dispatch failed: ${errText}`);
      }

      lastTriggerStatus = { success: true, mode: 'github_actions', at: new Date().toISOString() };
      return res.json({
        status: 'dispatched',
        mode: 'github_actions',
        message: `Dispatched ${workflow} on ${repo} (${ref}). Jobs will populate via Ingest API once runner completes.`,
        triggeredAt: new Date(now).toISOString(),
      });
    }

    // Fallback when GitHub Actions token is not configured in local environment
    lastTriggerStatus = { success: true, mode: 'local_ready', at: new Date().toISOString() };
    res.json({
      status: 'acknowledged',
      mode: 'local_ready',
      message: 'Sync request acknowledged. Set GITHUB_TOKEN and GITHUB_REPO in .env to dispatch live GitHub Actions runners automatically.',
      triggeredAt: new Date(now).toISOString(),
    });
  } catch (e) {
    next(e);
  }
}

function status(req, res) {
  const now = Date.now();
  const cooldownRemaining = lastTriggeredAt && now - lastTriggeredAt < COOLDOWN_MS
    ? Math.ceil((COOLDOWN_MS - (now - lastTriggeredAt)) / 1000)
    : 0;

  res.json({
    lastTriggeredAt: lastTriggeredAt ? new Date(lastTriggeredAt).toISOString() : null,
    cooldownRemainingSec: cooldownRemaining,
    canTrigger: cooldownRemaining === 0,
    lastStatus: lastTriggerStatus,
    configured: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO),
  });
}

module.exports = { trigger, status };
