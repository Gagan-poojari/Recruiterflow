import sqlite3
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from seed import init_db, DB_FILE
from matcher import score_match

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.path.exists(DB_FILE):
        init_db()
    yield

app = FastAPI(title="Recruiter-Bot API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    if not os.path.exists(DB_FILE):
        init_db()
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def fetch_candidate_by_id(cur, candidate_id: int):
    # Raw SQL query
    cur.execute("SELECT id, name, experience_years, availability, quirk FROM candidates WHERE id = ?", (candidate_id,))
    row = cur.fetchone()
    if not row:
        return None
    
    cand = dict(row)
    cur.execute("SELECT skill FROM candidate_skills WHERE candidate_id = ?", (candidate_id,))
    cand["skills"] = [r["skill"] for r in cur.fetchall()]

    cur.execute("SELECT trait FROM candidate_traits WHERE candidate_id = ?", (candidate_id,))
    cand["traits"] = [r["trait"] for r in cur.fetchall()]
    return cand

def fetch_all_candidates(cur):
    cur.execute("SELECT id, name, experience_years, availability, quirk FROM candidates")
    rows = cur.fetchall()
    candidates = []
    for r in rows:
        cid = r["id"]
        c = dict(r)
        cur.execute("SELECT skill FROM candidate_skills WHERE candidate_id = ?", (cid,))
        c["skills"] = [s["skill"] for s in cur.fetchall()]
        cur.execute("SELECT trait FROM candidate_traits WHERE candidate_id = ?", (cid,))
        c["traits"] = [t["trait"] for t in cur.fetchall()]
        candidates.append(c)
    return candidates

def fetch_job_by_id(cur, job_id: int):
    # Raw SQL query
    cur.execute("SELECT id, title, min_experience, tagline FROM jobs WHERE id = ?", (job_id,))
    row = cur.fetchone()
    if not row:
        return None
    
    job = dict(row)
    cur.execute("SELECT skill FROM job_skills WHERE job_id = ?", (job_id,))
    job["skills"] = [r["skill"] for r in cur.fetchall()]

    cur.execute("SELECT keyword FROM job_keywords WHERE job_id = ?", (job_id,))
    job["keywords"] = [r["keyword"] for r in cur.fetchall()]
    return job

def fetch_all_jobs(cur):
    cur.execute("SELECT id, title, min_experience, tagline FROM jobs")
    rows = cur.fetchall()
    jobs = []
    for r in rows:
        jid = r["id"]
        j = dict(r)
        cur.execute("SELECT skill FROM job_skills WHERE job_id = ?", (jid,))
        j["skills"] = [s["skill"] for s in cur.fetchall()]
        cur.execute("SELECT keyword FROM job_keywords WHERE job_id = ?", (jid,))
        j["keywords"] = [k["keyword"] for k in cur.fetchall()]
        jobs.append(j)
    return jobs

@app.post("/seed")
def seed_database():
    init_db()
    return {"message": "Database successfully re-seeded from seed data."}

@app.get("/candidates")
def list_candidates():
    conn = get_db()
    cur = conn.cursor()
    cands = fetch_all_candidates(cur)
    conn.close()
    return cands

@app.get("/jobs")
def list_jobs():
    conn = get_db()
    cur = conn.cursor()
    jobs = fetch_all_jobs(cur)
    conn.close()
    return jobs

@app.get("/jobs/{job_id}/matches")
def get_job_matches(job_id: int):
    conn = get_db()
    cur = conn.cursor()
    
    job = fetch_job_by_id(cur, job_id)
    if not job:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Job with id {job_id} not found")

    candidates = fetch_all_candidates(cur)
    conn.close()

    ranked = []
    for cand in candidates:
        match_res = score_match(cand, job)
        ranked.append({
            "candidate_id": cand["id"],
            "candidate_name": cand["name"],
            "score": match_res["score"],
            "reason": match_res["reason"],
            "breakdown": match_res["breakdown"],
            "experience_years": cand["experience_years"],
            "availability": cand["availability"],
            "quirk": cand["quirk"]
        })

    # Sort descending by score, tie-break by candidate experience
    ranked.sort(key=lambda x: (x["score"], x["experience_years"]), reverse=True)

    return {
        "job_id": job["id"],
        "job_title": job["title"],
        "min_experience": job["min_experience"],
        "required_skills": job["skills"],
        "matches": ranked
    }

@app.get("/candidates/{candidate_id}/matches")
def get_candidate_matches(candidate_id: int):
    conn = get_db()
    cur = conn.cursor()
    
    cand = fetch_candidate_by_id(cur, candidate_id)
    if not cand:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Candidate with id {candidate_id} not found")

    jobs = fetch_all_jobs(cur)
    conn.close()

    ranked = []
    for job in jobs:
        match_res = score_match(cand, job)
        ranked.append({
            "job_id": job["id"],
            "job_title": job["title"],
            "score": match_res["score"],
            "reason": match_res["reason"],
            "breakdown": match_res["breakdown"],
            "min_experience": job["min_experience"],
            "tagline": job["tagline"]
        })

    # Sort descending by score, tie-break by job min_experience
    ranked.sort(key=lambda x: (x["score"], x["min_experience"]), reverse=True)

    return {
        "candidate_id": cand["id"],
        "candidate_name": cand["name"],
        "skills": cand["skills"],
        "experience_years": cand["experience_years"],
        "availability": cand["availability"],
        "matches": ranked
    }
