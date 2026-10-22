"""
JobCapture Harvester: automated sourcing of fresh (<= 3 days) tech jobs via JobSpy.
Pulls from LinkedIn & Indeed, formats with explicit 'Posted Nd ago' metadata,
and posts to JobCapture backend ingest API with rate-limit pacing.
"""

import os
import sys
import time
import datetime
from pathlib import Path
import requests

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

try:
    from jobspy import scrape_jobs
except ImportError:
    print("Error: python-jobspy is not installed. Run: pip install python-jobspy")
    sys.exit(1)


def load_env(env_path):
    """Simple .env reader without requiring extra external libraries."""
    if not env_path.exists():
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def calculate_days_ago(date_posted):
    """Calculates days elapsed since post date (capped at 0-3 for fresh posts)."""
    if not date_posted or str(date_posted) in ("NaT", "None", ""):
        return 1
    try:
        if isinstance(date_posted, (datetime.date, datetime.datetime)):
            d = date_posted if isinstance(date_posted, datetime.date) else date_posted.date()
        else:
            d = datetime.date.fromisoformat(str(date_posted).split("T")[0])
        diff = (datetime.date.today() - d).days
        return max(0, min(diff, 3))
    except Exception:
        return 1


def build_raw_text(job):
    """Formats job dictionary into raw text with a guaranteed 'Posted Nd ago' header."""
    days = calculate_days_ago(job.get("date_posted"))
    title = str(job.get("title") or "Software Engineer").strip()
    company = str(job.get("company") or "Hiring Company").strip()
    location = str(job.get("location") or "").strip()
    url = str(job.get("job_url") or "").strip()
    desc = str(job.get("description") or "").strip()

    loc_line = f"{company} | {location}" if location else company
    return (
        f"Posted {days}d ago\n"
        f"{title}\n"
        f"{loc_line}\n"
        f"{url}\n\n"
        f"{desc}"
    )


def ingest_job(api_url, submit_key, raw_text, source_url):
    """POSTs a single job to JobCapture ingest API."""
    headers = {
        "Content-Type": "application/json",
        "X-Submit-Key": submit_key,
    }
    payload = {
        "rawText": raw_text,
        "sourceUrl": source_url,
    }
    try:
        resp = requests.post(
            f"{api_url.rstrip('/')}/api/jobs/ingest",
            json=payload,
            headers=headers,
            timeout=30,
        )
        if resp.status_code == 200:
            data = resp.json()
            created = data.get("createdCount", 0)
            duplicates = data.get("duplicateCount", 0)
            print(f"  [OK] Ingested successfully (created: {created}, duplicates: {duplicates})")
            return "created"
        elif resp.status_code == 409:
            print(f"  [SKIP] Duplicate post ({source_url})")
            return "duplicate"
        elif resp.status_code == 422:
            print(f"  [SKIP] Stale or non-job content ({resp.text[:80]})")
            return "stale"
        else:
            print(f"  [WARN] Ingest returned HTTP {resp.status_code}: {resp.text[:120]}")
            return "error"
    except Exception as e:
        print(f"  [ERROR] Ingest request failed: {e}")
        return "error"


def resolve_country_indeed(location):
    l = (location or "").lower()
    if "pakistan" in l:
        return "pakistan"
    if any(x in l for x in ("dubai", "abu dhabi", "uae", "emirates")):
        return "uae"
    if any(x in l for x in ("riyadh", "saudi", "jeddah")):
        return "saudi arabia"
    if "qatar" in l or "doha" in l:
        return "qatar"
    return "usa"


DEFAULT_TARGETS = [
    {"search_term": "software engineer", "location": "Pakistan", "country_indeed": "pakistan"},
    {"search_term": "full stack developer", "location": "Pakistan", "country_indeed": "pakistan"},
    {"search_term": "software engineer", "location": "Dubai", "country_indeed": "uae"},
    {"search_term": "software engineer", "location": "Riyadh", "country_indeed": "saudi arabia"},
]


def run_harvest(keywords=None, locations=None, results_per_target=10, dry_run=False):
    root_dir = Path(__file__).resolve().parent.parent
    load_env(root_dir / ".env")

    api_url = os.environ.get("JOB_CAPTURE_API_URL", "http://localhost:3000")
    submit_key = os.environ.get("SUBMIT_API_KEY", "")

    if not dry_run and not submit_key:
        print("[ERROR] SUBMIT_API_KEY is not set in environment or .env file.")
        sys.exit(1)

    raw_proxies = os.environ.get("PROXIES", os.environ.get("PROXY_LIST", ""))
    proxies = [p.strip() for p in raw_proxies.split(",") if p.strip()] if raw_proxies else None
    if proxies:
        print(f"  [INFO] Rotating through {len(proxies)} configured proxies.")

    targets = []
    if keywords or locations:
        kw_list = [k.strip() for k in keywords.split(",") if k.strip()] if keywords else ["software engineer"]
        loc_list = [l.strip() for l in locations.split(",") if l.strip()] if locations else ["Pakistan", "Dubai", "Riyadh"]
        for l in loc_list:
            c_indeed = resolve_country_indeed(l)
            for k in kw_list:
                targets.append({"search_term": k, "location": l, "country_indeed": c_indeed})
    else:
        targets = DEFAULT_TARGETS

    print(f"[{datetime.datetime.now().isoformat()}] Starting harvest across {len(targets)} targets (API: {api_url})...")
    total_found = 0
    total_ingested = 0

    for target in targets:
        term = target["search_term"]
        loc = target["location"]
        print(f"\n--- Searching: '{term}' in '{loc}' (last 72 hours) ---")

        try:
            scrape_opts = {
                "site_name": ["indeed", "linkedin"],
                "search_term": term,
                "location": loc,
                "results_wanted": results_per_target,
                "hours_old": 72,
                "country_indeed": target.get("country_indeed", "usa"),
                "linkedin_fetch_description": False,
            }
            if proxies:
                scrape_opts["proxies"] = proxies
            jobs_df = scrape_jobs(**scrape_opts)
        except Exception as e:
            print(f"  [ERROR] Scraper failed for {term} in {loc}: {e}")
            continue

        if jobs_df is None or jobs_df.empty:
            print("  No jobs returned.")
            continue

        count = len(jobs_df)
        total_found += count
        print(f"  Found {count} candidate jobs.")

        for _, row in jobs_df.iterrows():
            job_dict = row.to_dict()
            raw_text = build_raw_text(job_dict)
            source_url = job_dict.get("job_url") or ""

            if dry_run:
                print(f"  [DRY-RUN] {job_dict.get('company')} - {job_dict.get('title')} ({source_url})")
                continue

            status = ingest_job(api_url, submit_key, raw_text, source_url)
            if status == "created":
                total_ingested += 1
                time.sleep(1)
            else:
                time.sleep(0.3)

    print(f"\nHarvest completed. Total candidates found: {total_found}, newly ingested: {total_ingested}")


def self_check():
    """Unit self-check verifying raw_text formatting."""
    dummy_job = {
        "title": "Senior Backend Engineer",
        "company": "Acme Corp",
        "location": "Lahore, Pakistan",
        "job_url": "https://linkedin.com/jobs/view/12345",
        "description": "Building microservices with Node.js and MongoDB.",
        "date_posted": datetime.date.today(),
    }
    raw = build_raw_text(dummy_job)
    first_line = raw.split("\n")[0]
    assert first_line == "Posted 0d ago", f"Self-check failed: {first_line}"
    assert "Acme Corp | Lahore, Pakistan" in raw
    assert "https://linkedin.com/jobs/view/12345" in raw
    print("[OK] Harvester self-check passed.")


if __name__ == "__main__":
    if "--self-check" in sys.argv:
        self_check()
    else:
        is_dry = "--dry-run" in sys.argv
        kw = None
        loc = None
        lim = 10
        for arg in sys.argv[1:]:
            if arg.startswith("--keywords="):
                kw = arg.split("=", 1)[1]
            elif arg.startswith("--locations="):
                loc = arg.split("=", 1)[1]
            elif arg.startswith("--limit="):
                try:
                    lim = int(arg.split("=", 1)[1])
                except ValueError:
                    lim = 10
        run_harvest(keywords=kw, locations=loc, results_per_target=lim, dry_run=is_dry)
