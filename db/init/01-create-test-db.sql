-- Runs once, the first time the Docker database starts.
-- Tests use their own database, so they can wipe it without touching your dev data.
CREATE DATABASE study_blog_test OWNER study;
