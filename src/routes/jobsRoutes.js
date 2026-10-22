const express = require('express');
const { allowSubmitterOrAdmin } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { ingest } = require('../controllers/ingestController');
const publicJobsController = require('../controllers/publicJobsController');

const router = express.Router();

// Admins are not throttled; submitter key allows up to 500 submissions per 10 minutes.
const submissionLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 500, skip: req => !req.submitter, message: 'Too many submissions.' });

router.get('/', publicJobsController.list);
router.get('/facets', publicJobsController.facets);
router.post('/ingest', allowSubmitterOrAdmin, submissionLimiter, ingest);

module.exports = router;
