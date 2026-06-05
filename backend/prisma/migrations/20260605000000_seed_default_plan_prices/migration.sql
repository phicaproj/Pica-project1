-- Seed initial DB-owned prices for existing environments.
-- Admins can update these through /api/admin/pricing after migration.

INSERT INTO "plan_prices" ("id", "plan", "pillar_id", "price", "updated_at")
SELECT
    '00000000-0000-4000-8000-000000000001',
    'PHASE2A'::"Plan",
    NULL,
    50000.00,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM "plan_prices"
    WHERE "plan" = 'PHASE2A'::"Plan"
      AND "pillar_id" IS NULL
);

INSERT INTO "plan_prices" ("id", "plan", "pillar_id", "price", "updated_at")
SELECT
    (
        substr(md5('plan-price:phase2b:' || p."id"), 1, 8) || '-' ||
        substr(md5('plan-price:phase2b:' || p."id"), 9, 4) || '-' ||
        substr(md5('plan-price:phase2b:' || p."id"), 13, 4) || '-' ||
        substr(md5('plan-price:phase2b:' || p."id"), 17, 4) || '-' ||
        substr(md5('plan-price:phase2b:' || p."id"), 21, 12)
    ),
    'PHASE2B_PILLAR'::"Plan",
    p."id",
    50000.00,
    CURRENT_TIMESTAMP
FROM "pillars" p
WHERE p."is_active" = true
  AND NOT EXISTS (
      SELECT 1
      FROM "plan_prices" pp
      WHERE pp."plan" = 'PHASE2B_PILLAR'::"Plan"
        AND pp."pillar_id" = p."id"
  );
