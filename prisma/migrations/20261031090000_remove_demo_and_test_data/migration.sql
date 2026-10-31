-- One-off cleanup before launch: remove the fictional demo complaints and test submissions
-- created while the site was being tested. Evidence and status history cascade.
DELETE FROM "Complaint";
DELETE FROM "RateLimit";
