import os
import sys
import pytest
import httpx

backend_dir = os.path.dirname(__file__)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from seed import init_db
from matcher import score_match

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.fixture
async def async_client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

def test_score_match_perfect():
    candidate = {
        "skills": ["deduction", "pattern-recognition", "forensics"],
        "experience_years": 8,
        "availability": "Immediate",
        "traits": ["analytical"]
    }
    job = {
        "skills": ["deduction", "pattern-recognition", "forensics"],
        "min_experience": 3,
        "keywords": ["analytical"]
    }
    result = score_match(candidate, job)
    # Skills: 50, Exp: 30, Trait: 5, Avail: 10 => 95
    assert result["score"] == 95
    assert "Matched 3/3" in result["reason"]
    assert "Immediate availability" in result["reason"]

def test_score_match_low_exp_and_no_skills():
    candidate = {
        "skills": ["cooking"],
        "experience_years": 1,
        "availability": "Not looking",
        "traits": ["friendly"]
    }
    job = {
        "skills": ["rust", "systems"],
        "min_experience": 5,
        "keywords": ["autonomous"]
    }
    result = score_match(candidate, job)
    assert result["breakdown"]["skills"] == 0
    assert result["breakdown"]["availability"] == 0
    # Exp ratio: 1/5 * 30 = 6
    assert result["breakdown"]["experience"] == 6
    assert result["score"] == 6

@pytest.mark.anyio
async def test_get_job_matches_backend_detective(async_client):
    # Job 1 is Backend Detective
    response = await async_client.get("/jobs/1/matches")
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == 1
    assert data["job_title"] == "Backend Detective"
    assert len(data["matches"]) > 0

    # Top match must be Sherlock H.
    top_match = data["matches"][0]
    assert top_match["candidate_name"] == "Sherlock H."
    assert top_match["score"] >= 90
    assert "deduction" in top_match["reason"]

@pytest.mark.anyio
async def test_get_candidate_matches_sherlock(async_client):
    # Candidate 1 is Sherlock H.
    response = await async_client.get("/candidates/1/matches")
    assert response.status_code == 200
    data = response.json()
    assert data["candidate_id"] == 1
    assert data["candidate_name"] == "Sherlock H."
    
    # Top match must be Backend Detective
    top_match = data["matches"][0]
    assert top_match["job_title"] == "Backend Detective"

@pytest.mark.anyio
async def test_not_found_errors(async_client):
    res_job = await async_client.get("/jobs/999/matches")
    assert res_job.status_code == 404

    res_cand = await async_client.get("/candidates/999/matches")
    assert res_cand.status_code == 404

@pytest.mark.anyio
async def test_seed_endpoint(async_client):
    res = await async_client.post("/seed")
    assert res.status_code == 200
    assert "re-seeded" in res.json()["message"]
