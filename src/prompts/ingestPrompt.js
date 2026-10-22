const { categoriesBlock, skillsBlock, FIELD_RULES } = require('./taxonomyBlock');

const INGEST_PROMPT = `You are given raw text extracted from a screenshot of a LinkedIn post. The text \
includes UI noise from the LinkedIn app itself (things like "Like Comment Share", relative \
timestamps such as "2d" or "3h", "Follow"/"Connect" buttons, reaction counts, "... more" \
truncation markers).

First decide whether this post is actually a job posting (someone sharing/announcing a job \
opening, hiring, or recruiting), as opposed to an unrelated post (opinion, article share, \
personal update, etc). Jobs of ANY kind count — technical and non-technical.

Also inspect any relative timestamps in the UI noise (e.g. "2h", "1d", "5d", "2w", "1mo", "3mo") \
or date text:
- If the post explicitly indicates it is older than 3 days (e.g. ">3d", "4d", "1w", "2w", "1mo", or an expired deadline), \
set "isStale": true. Otherwise set "isStale": false.
- Set "postAge" to the detected relative timestamp string (e.g. "2h", "1d", "3d") or null if not found.

If it IS a job post, extract the following fields. Respond with ONLY a single JSON object, no \
markdown code fences, matching exactly this shape:

{
  "is_job_post": true,
  "isStale": boolean,
  "postAge": string or null,
  "company": string,
  "isCompanyNameFallback": boolean,
  "contactEmail": string or null,
  "applicationLink": string or null,
  "posterName": string or null,
  "jobs": [
    {
      "jobTitle": string,
      "categories": [string, ...],
      "skills": [string, ...],
      "unknownSkills": [string, ...],
      "experienceYears": number or null,
      "country": string or null,
      "cities": [string, ...],
      "remoteType": "remote" | "hybrid" | "onsite" | null,
      "remoteScope": string or null,
      "description": string
    }
  ]
}

Post-level field rules:
- "company": the hiring company's name, ONLY if it is stated in prose somewhere in the post \
text (e.g. "join our team at Acme Corp"). Never derive a company name from an email address or \
domain (e.g. do NOT turn "jane@acme.com" into "acme" or "acme.com") — an email domain is not a \
reliable company name. If no company name is stated in the post's prose, set "company" to the \
name of the person who posted it (the same value as "posterName") instead, and set \
"isCompanyNameFallback" to true. Otherwise set "isCompanyNameFallback" to false.
- "contactEmail" / "applicationLink": only if actually present in the text; otherwise null.
- "posterName": the name of the person who shared the post, if identifiable; otherwise null.
- "jobs": one entry per DISTINCT job opening in the post. Most posts describe exactly one role — \
in that case "jobs" has exactly one entry. Only create multiple entries when the post explicitly \
lists multiple different job titles/openings (e.g. a numbered/bulleted list of different roles, \
or phrasing like "we're hiring for the following positions"). Do NOT split into multiple entries \
just because a single role mentions multiple skills or technologies or spans several categories \
(e.g. "Fullstack Developer skilled in React and Node" is ONE job, not two; "Full Stack AI \
Engineer" is ONE job with two categories).

Per-job field rules (extract each role independently):
- "jobTitle": that role's title.
${FIELD_RULES}
- "description": clean up OCR and UI artifacts, but preserve the exact qualifications, requirements, \
responsibilities, and visa/residency stipulations verbatim. Do NOT summarize or invent criteria.

=== CATEGORY LIST (closed — use these exact strings) ===
${categoriesBlock()}

=== SKILLS LIST (closed — use these exact strings) ===
${skillsBlock()}

If it is NOT a job post, respond with ONLY this JSON object:
{ "is_job_post": false }

Raw extracted text:
"""
{{RAW_TEXT}}
"""`;

module.exports = { INGEST_PROMPT };
