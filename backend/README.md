# Build-a-Recruiter-Bot (Backend Assignment)

A small candidate-to-job matching service built with Python, FastAPI, and SQLite using hand-written raw SQL queries only (no ORMs, no query builders).

---

## How to Run

1. Install dependencies:
```bash
pip install fastapi uvicorn httpx pytest
```

2. Seed the database with the test candidates and jobs:
```bash
python seed.py
```
Expected output:
```text
Database successfully seeded at recruiterbot.db with 15 candidates and 6 jobs.
```

3. Start the server:
```bash
uvicorn main:app --reload --port 8000
```
Swagger docs will be live at http://127.0.0.1:8000/docs.

4. Run the tests and the SQL challenge:
```bash
# Run API and matching algorithm tests
python -m pytest test_api.py

# Run and print results for all 5 SQL Detective challenge queries
python test_sql_detective.py
```

---

## Expected Outputs

### `python -m pytest test_api.py`
```text
============================= test session starts =============================
platform win32 -- Python 3.12.0, pytest-8.3.5, pluggy-1.5.0
collected 6 items

test_api.py ......                                                      [100%]

======================== 6 passed, 1 warning in 1.85s =========================
```

### `python test_sql_detective.py`
```text
============================
[Testing Query] 1. List all currently open job postings, along with the name of the recruiter who owns each one.
============================
Columns: ['job_id', 'job_title', 'recruiter_name']
(1, 'Backend Engineer I', 'Priya Shah')
(2, 'Backend Engineer I', 'Daniel Ortiz')
(4, 'Backend Engineer II', 'Priya Shah')
(5, 'DevOps Engineer', 'Wei Zhang')

============================
[Testing Query] 2. For each job posting, how many applicants reached the Final interview stage?
============================
Columns: ['job_id', 'job_title', 'final_stage_applicant_count']
(1, 'Backend Engineer I', 2)
(2, 'Backend Engineer I', 2)
(3, 'Data Analyst', 1)
(4, 'Backend Engineer II', 2)
(5, 'DevOps Engineer', 0)
(6, 'Data Analyst', 0)
(7, 'Backend Engineer I', 2)

============================
[Testing Query] 3. Find every person who effectively applied to more than one job posting.
============================
Columns: ['normalized_email', 'applicant_name', 'distinct_jobs_applied']
('ananya.rao@mail.com', 'Ananya Rao', 2)
('ben.turner@mail.com', 'Ben Turner', 2)
('elena.popescu@mail.com', 'Elena Popescu', 2)

============================
[Testing Query] 4. For each recruiter, compute their Final-stage conversion rate (passed / total Final-stage interviews),
============================
Columns: ['recruiter_id', 'recruiter_name', 'passed_final_interviews', 'total_final_interviews', 'final_stage_conversion_rate']
(1, 'Priya Shah', 3, 4, 0.75)
(2, 'Daniel Ortiz', 2, 4, 0.5)

============================
[Testing Query] 5. (Bonus) Using a window function, find the recruiter with the most successful placements
============================
Columns: ['department', 'recruiter_id', 'recruiter_name', 'successful_placements']
('Data', 3, 'Fatima Al-Sayed', 1)
('Engineering', 1, 'Priya Shah', 3)

All 5 SQL Detective queries executed successfully against SQLite!
```

---

## Example API Call

```bash
curl http://127.0.0.1:8000/jobs/1/matches
```

Response for Job #1 ("Backend Detective"):
```json
{
  "job_id": 1,
  "job_title": "Backend Detective",
  "min_experience": 3,
  "required_skills": ["deduction", "pattern-recognition", "forensics"],
  "matches": [
    {
      "candidate_id": 1,
      "candidate_name": "Sherlock H.",
      "score": 95,
      "reason": "Matched 3/3 required skills (deduction, forensics, pattern-recognition). Has 8 yrs exp (meets min 3 yrs). Culture fit on: analytical. Immediate availability.",
      "breakdown": {
        "skills": 50,
        "experience": 30,
        "traits": 5,
        "availability": 10
      },
      "experience_years": 8,
      "availability": "Immediate",
      "quirk": "Solves problems by eliminating the impossible; occasionally insufferable in standups."
    }
  ]
}
```

---

## How the Matching Works

I kept the scoring system simple and easy to explain:
1. **Required Skills (up to 50 pts)**: What percentage of the job's needed skills does the candidate have?
2. **Experience (up to 30 pts)**: If they meet or beat the minimum years, they get full points. If not, they get a proportional score (`years / min_years * 30`) instead of getting disqualified.
3. **Culture / Traits (up to 10 pts)**: Overlap between the candidate's traits and the job's culture keywords (+5 per match, up to 10).
4. **Availability (up to 10 pts)**: Immediate (+10), 2 weeks (+7), not looking (0).
5. **Tie-breaking**: If scores match, higher experience years ranks first.

### Key Decisions
- **Normalized SQLite tables**: Instead of dumping skills into comma-separated strings inside a single column, I created `candidate_skills` and `job_skills` tables. This made skill counting and matching clean SQL set operations.
- **Explainable logic**: For a small candidate pool, a clear scoring breakdown that tells recruiters why someone matched is much more useful than opaque machine learning embeddings.
