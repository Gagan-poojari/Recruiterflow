# Recruiterflow Take-Home (Full Stack Submission)

Hey! I'm Gagan (final-year B.Tech student at UVCE). This repo has my work for the Recruiterflow internship take-home assignment, organized as three standalone sub-projects:

1. **`backend/`** (Build-a-Recruiter-Bot + SQL Detective)
   - Python, FastAPI, and SQLite using hand-written raw SQL only (no ORM).
   - Matching algorithm that scores candidate-to-job fit with plain-English reasoning.
   - Answers to all 5 SQL Detective hiring ops queries in `sql_detective.sql`.

2. **`frontend/`** (Trip Splitter)
   - React + Redux Toolkit + strict TypeScript (no `any`, no `as`, no `!`).
   - Split expenses equally, by exact amounts, or by percentage.
   - Stored in integer paise so we never lose or invent money.
   - Built with plain HTML/CSS (no component or form libraries used).

3. **`qa/`** (QA Automation)
   - Playwright + TypeScript test suite.
   - UI tests against SauceDemo (login, cart, logout with Page Object Model).
   - API tests against ReqRes using Playwright's headless `request` fixture.

---

## Quick Start

### Backend
```bash
cd backend
pip install fastapi uvicorn httpx pytest
python seed.py
uvicorn main:app --reload --port 8000
python -m pytest test_api.py
python test_sql_detective.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
npm test
npm run typecheck
npm run lint
```

### QA
```bash
cd qa
npm install
npx playwright install chromium
npx playwright test
```

---

## Three Key Decisions

1. **Integer Paise Math (Frontend)**: Floating point arithmetic in JavaScript (`0.1 + 0.2 === 0.30000000000000004`) causes rounding errors. Storing money in paise (`₹100` = `10000`) and giving any remaining paisa to the first person in order means balances always add up to exactly ₹0.
2. **Raw SQL with Normalized Tables (Backend)**: Instead of comma-separated strings or an ORM, I split skills and culture tags into junction tables (`candidate_skills`, `job_skills`). This made counting and matching skills clean relational set operations.
3. **Transparent Match Scoring (Backend)**: Instead of a black-box model, I used a clear linear score (50% skills, 30% experience, 10% traits, 10% availability). Recruiters can look at any match and immediately see why the score was given.
