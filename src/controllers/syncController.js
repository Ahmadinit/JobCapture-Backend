const ApiError = require('../utils/ApiError');

const DEBOUNCE_MS = 10 * 1000; // 10 second debounce to prevent rapid double-clicks
let activeWorker = null;
let lastTriggeredAt = null;
let lastTriggerStatus = null;

async function trigger(req, res, next) {
  try {
    const now = Date.now();

    // Prevent overlapping runs if worker is still running
    if (activeWorker && !activeWorker.killed) {
      throw new ApiError(429, 'Harvester worker is currently running in the background. Please wait for it to complete.');
    }

    if (lastTriggeredAt && now - lastTriggeredAt < DEBOUNCE_MS) {
      const remainingSec = Math.ceil((DEBOUNCE_MS - (now - lastTriggeredAt)) / 1000);
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

    // Run local harvester worker in background
    const { spawn } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    const scriptPath = path.resolve(__dirname, '../../scripts/harvester.py');
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const logPath = path.resolve(__dirname, '../../scripts/harvester.log');
    const logOut = fs.openSync(logPath, 'a');

    const { keywords, locations, limit } = req.body || {};
    const args = [scriptPath];
    if (keywords && typeof keywords === 'string') args.push(`--keywords=${keywords.trim()}`);
    if (locations && typeof locations === 'string') args.push(`--locations=${locations.trim()}`);
    if (limit && Number(limit) > 0) args.push(`--limit=${Number(limit)}`);

    const child = spawn(pythonExe, args, {
      cwd: path.resolve(__dirname, '../../'),
      detached: true,
      stdio: ['ignore', logOut, logOut],
    });

    activeWorker = child;
    child.on('exit', code => {
      activeWorker = null;
      lastTriggerStatus = { success: code === 0, exitCode: code, at: new Date().toISOString() };
    });
    child.on('error', err => {
      activeWorker = null;
      lastTriggerStatus = { success: false, error: err.message, at: new Date().toISOString() };
    });
    child.unref();

    lastTriggerStatus = { success: true, mode: 'local_worker', at: new Date().toISOString() };
    res.json({
      status: 'dispatched',
      mode: 'local_worker',
      message: 'Local harvester worker started in background. Crawling fresh LinkedIn and Indeed jobs...',
      triggeredAt: new Date(now).toISOString(),
    });
  } catch (e) {
    next(e);
  }
}

async function archiveStale(req, res, next) {
  try {
    const Job = require('../models/Job');
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = await Job.updateMany(
      {
        status: 'open',
        $or: [
          { isStale: true },
          { postedAt: { $lt: threeDaysAgo } },
        ],
      },
      { $set: { status: 'archived' } }
    );

    res.json({
      success: true,
      archivedCount: result.modifiedCount,
      message: `Archived ${result.modifiedCount} stale roles (> 3 days old).`,
    });
  } catch (e) {
    next(e);
  }
}

function status(req, res) {
  const now = Date.now();
  const isRunning = Boolean(activeWorker && !activeWorker.killed);
  const cooldownRemaining = lastTriggeredAt && now - lastTriggeredAt < DEBOUNCE_MS
    ? Math.ceil((DEBOUNCE_MS - (now - lastTriggeredAt)) / 1000)
    : 0;

  res.json({
    isRunning,
    canTrigger: !isRunning && cooldownRemaining === 0,
    cooldownRemainingSec: cooldownRemaining,
    lastTriggeredAt: lastTriggeredAt ? new Date(lastTriggeredAt).toISOString() : null,
    lastStatus: lastTriggerStatus,
    configured: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO),
  });
}

module.exports = { trigger, status, archiveStale };
