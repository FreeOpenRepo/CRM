-- =============================================================================
-- Sales CRM Pipeline Engine Initial Database Schema & Seed Data (crm_db)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS "Activities" CASCADE;
DROP TABLE IF EXISTS "Deals" CASCADE;
DROP TABLE IF EXISTS "Contacts" CASCADE;

-- 1. Contacts & Organizations
CREATE TABLE "Contacts" (
    "Id" SERIAL PRIMARY KEY,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(150) NOT NULL UNIQUE,
    "Phone" VARCHAR(50),
    "Company" VARCHAR(150),
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Deals (Kanban Pipeline Stages: LEAD, QUALIFIED, PROPOSAL, WON, LOST)
CREATE TABLE "Deals" (
    "Id" SERIAL PRIMARY KEY,
    "Title" VARCHAR(200) NOT NULL,
    "Value" NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    "Stage" VARCHAR(50) DEFAULT 'LEAD', -- LEAD, QUALIFIED, PROPOSAL, WON, LOST
    "ContactId" INT REFERENCES "Contacts"("Id") ON DELETE SET NULL,
    "ExpectedCloseDate" TIMESTAMP WITH TIME ZONE,
    "ProbabilityPercent" INT DEFAULT 20,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Activities / Timeline
CREATE TABLE "Activities" (
    "Id" SERIAL PRIMARY KEY,
    "DealId" INT NOT NULL REFERENCES "Deals"("Id") ON DELETE CASCADE,
    "Type" VARCHAR(50) NOT NULL, -- NOTE, CALL, EMAIL, MEETING, STAGE_CHANGE
    "Description" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Contacts & Deals
INSERT INTO "Contacts" ("Id", "FirstName", "LastName", "Email", "Phone", "Company") VALUES
(1, 'Thanaporn', 'Siriwat', 'thanaporn@bangkokretail.co.th', '+66 81 234 5678', 'Bangkok Retail Group'),
(2, 'Michael', 'Chang', 'm.chang@apac-logistics.com', '+65 6789 0123', 'APAC Logistics Pte Ltd')
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "Deals" ("Id", "Title", "Value", "Stage", "ContactId", "ProbabilityPercent") VALUES
(1, 'Enterprise ERP & POS Rollout (50 Stores)', 2500000.00, 'PROPOSAL', 1, 75),
(2, 'Warehouse Route Optimization Subscription', 850000.00, 'QUALIFIED', 2, 50),
(3, 'Multi-Branch Signature Verification Pilot', 350000.00, 'LEAD', 1, 20)
ON CONFLICT ("Id") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Contacts"', 'Id'), COALESCE(max("Id"), 1)) FROM "Contacts";
SELECT setval(pg_get_serial_sequence('"Deals"', 'Id'), COALESCE(max("Id"), 1)) FROM "Deals";
