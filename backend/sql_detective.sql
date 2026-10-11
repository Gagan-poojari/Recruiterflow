-- SQL Detective Challenge
-- Database : SQLite

-- 1. List all currently open job postings, along with the name of the recruiter who owns each one.
SELECT 
    jp.id AS job_id,
    jp.title AS job_title,
    r.name AS recruiter_name
FROM job_postings jp
JOIN recruiters r ON jp.recruiter_id = r.id
WHERE jp.status = 'open';


-- 2. For each job posting, how many applicants reached the Final interview stage?
-- We use LEFT JOIN so postings with 0 final-stage candidates still show up with count 0.
-- DISTINCT applicant_id ensures an applicant isn't double-counted if multiple final entries exist.
SELECT 
    jp.id AS job_id,
    jp.title AS job_title,
    COUNT(DISTINCT i.applicant_id) AS final_stage_applicant_count
FROM job_postings jp
LEFT JOIN interviews i 
    ON jp.id = i.job_posting_id 
    AND i.stage = 'Final'
GROUP BY jp.id, jp.title;


-- 3. Find every person who effectively applied to more than one job posting.
-- Careful: The applicants table has dirty data (e.g. Ananya Rao appears twice with different case emails: 'ananya.rao@mail.com' and 'Ananya.Rao@mail.com').
-- We normalize applicant identities using LOWER(email) and count distinct job_posting_ids they were interviewed for.
SELECT 
    LOWER(a.email) AS normalized_email,
    MIN(a.full_name) AS applicant_name,
    COUNT(DISTINCT i.job_posting_id) AS distinct_jobs_applied
FROM applicants a
JOIN interviews i ON a.id = i.applicant_id
GROUP BY LOWER(a.email)
HAVING COUNT(DISTINCT i.job_posting_id) > 1;


-- 4. For each recruiter, compute their Final-stage conversion rate (passed / total Final-stage interviews),
-- but only include recruiters with at least 3 Final-stage interviews.
-- Note: We cast to REAL/FLOAT to avoid integer division truncation.
SELECT 
    r.id AS recruiter_id,
    r.name AS recruiter_name,
    COUNT(CASE WHEN i.stage = 'Final' AND i.outcome = 'passed' THEN 1 END) AS passed_final_interviews,
    COUNT(CASE WHEN i.stage = 'Final' THEN 1 END) AS total_final_interviews,
    ROUND(
        CAST(COUNT(CASE WHEN i.stage = 'Final' AND i.outcome = 'passed' THEN 1 END) AS REAL) / 
        COUNT(CASE WHEN i.stage = 'Final' THEN 1 END),
        4
    ) AS final_stage_conversion_rate
FROM recruiters r
JOIN job_postings jp ON r.id = jp.recruiter_id
JOIN interviews i ON jp.id = i.job_posting_id
WHERE i.stage = 'Final'
GROUP BY r.id, r.name
HAVING COUNT(CASE WHEN i.stage = 'Final' THEN 1 END) >= 3;


-- 5. (Bonus) Using a window function, find the recruiter with the most successful placements 
-- (passed at Final stage) per department.
WITH placement_counts AS (
    SELECT 
        jp.department,
        r.id AS recruiter_id,
        r.name AS recruiter_name,
        COUNT(i.id) AS successful_placements,
        DENSE_RANK() OVER (
            PARTITION BY jp.department 
            ORDER BY COUNT(i.id) DESC
        ) AS rank_in_dept
    FROM recruiters r
    JOIN job_postings jp ON r.id = jp.recruiter_id
    JOIN interviews i ON jp.id = i.job_posting_id
    WHERE i.stage = 'Final' AND i.outcome = 'passed'
    GROUP BY jp.department, r.id, r.name
)
SELECT 
    department,
    recruiter_id,
    recruiter_name,
    successful_placements
FROM placement_counts
WHERE rank_in_dept = 1;
