#  Matching logic for Recruiter-Bot.

def score_match(candidate, job):
    reasons = []

    # 1. skills (max 50 pts)
    job_skills = set(job["skills"])
    candidate_skills = set(candidate["skills"])
    matched_skills = job_skills.intersection(candidate_skills)

    if job_skills:
        skill_ratio = len(matched_skills) / len(job_skills)
        skill_points = round(skill_ratio * 50)
    else:
        skill_ratio = 1.0
        skill_points = 50

    if matched_skills:
        reasons.append(f"Matched {len(matched_skills)}/{len(job_skills)} required skills ({', '.join(sorted(matched_skills))})")
    else:
        reasons.append(f"No required skills matched")

    # 2. experience (max 30 pts)
    cand_exp = candidate["experience_years"]
    min_exp = job["min_experience"]

    if cand_exp >= min_exp:
        exp_points = 30
        reasons.append(f"Has {cand_exp} yrs exp (meets min {min_exp} yrs)")
    else:
        exp_ratio = cand_exp / max(min_exp, 1)
        exp_points = round(exp_ratio * 30)
        reasons.append(f"Has {cand_exp} yrs exp (below min {min_exp} yrs)")

    # 3. culture fit (max 10 pts)
    job_keywords = set(job["keywords"])
    cand_traits = set(candidate["traits"])
    matched_traits = job_keywords.intersection(cand_traits)
    trait_points = min(10, len(matched_traits) * 5)
    if matched_traits:
        reasons.append(f"Culture fit on: {', '.join(sorted(matched_traits))}")

    # 4. Availability bonus (max 10 pts)
    avail = candidate["availability"].lower()
    if "immediate" in avail:
        avail_points = 10
        reasons.append("Immediate availability")
    elif "2 week" in avail:
        avail_points = 7
        reasons.append("Available in 2 weeks")
    else:
        avail_points = 0
        reasons.append("Currently not looking")

    # final verdict
    total_score = min(100, skill_points + exp_points + trait_points + avail_points)
    reason_str = ". ".join(reasons) + "."

    return {
        "score": total_score,
        "reason": reason_str,
        "breakdown": {
            "skills": skill_points,
            "experience": exp_points,
            "traits": trait_points,
            "availability": avail_points
        }
    }
