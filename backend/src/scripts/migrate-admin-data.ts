/**
 * migrate-admin-data.ts
 * ---------------------------------------------------------------------------
 * Copies the admin-controlled ("configuration") data from a SOURCE database
 * (your current/dev DB) into a TARGET database (the one you want to use for
 * production).
 *
 * What it moves:
 *   - Admin roles / permissions (AdminRole)
 *   - Pillars + per-pillar score labels + weights
 *   - Questions + options (observations, recommendations, action plans, scores,
 *     risk types, knockout flags) for every phase
 *   - Scoring settings (bands, labels, question limits)
 *   - Global score labels
 *   - App settings (singleton)
 *   - Plan prices, subscription plans, consultation tiers (pricing)
 *   - Coupons / discounts
 *   - SUPER ADMIN users only (admins with department OR role name === 'SUPER ADMIN').
 *     All other admins and regular users are NOT copied.
 *
 * What it does NOT move: users (except super admins), sessions, responses,
 * results, payments, webhooks, subscriptions/usage, consultation bookings,
 * phase2b unlocks, phase2a credits, audit logs.
 *
 * Order of operations:
 *   1. (optional) `prisma migrate deploy` against the TARGET database, so its
 *      schema + migration history are up to date first.
 *   2. Read every config table from the SOURCE.
 *   3. Replace the corresponding rows in the TARGET (delete then insert) inside
 *      a single transaction, in FK-safe order, preserving all IDs so
 *      relationships stay intact.
 *
 * Usage (run from the `backend` folder):
 *
 *   PowerShell:
 *     $env:SOURCE_DATABASE_URL="postgres://...current..."
 *     $env:TARGET_DATABASE_URL="postgres://...production..."
 *     npx tsx src/scripts/migrate-admin-data.ts --yes
 *
 *   If SOURCE_DATABASE_URL is omitted it falls back to DATABASE_URL (.env).
 *
 * Flags:
 *   --yes           Actually perform the deploy + copy. Without it the script
 *                   only previews (reads source, prints counts, changes nothing).
 *   --dry-run       Explicit preview mode (same as omitting --yes).
 *   --skip-deploy   Skip `prisma migrate deploy` (copy only).
 *   --force         Bypass the "target already has transactional data" guard.
 *                   (You can also set FORCE_TARGET=true.)
 *
 * SAFETY: run against a fresh/empty target. The guard aborts if the target
 * already contains sessions/payments/responses. This script REPLACES the target
 * config tables (delete-all then insert), so do not point it at a DB with live
 * transactional data you care about.
 * ---------------------------------------------------------------------------
 */

import path from 'path';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';
import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const { PrismaClient } = pkg;

type Client = InstanceType<typeof PrismaClient>;
type Row = Record<string, any>;

const args = process.argv.slice(2);
const APPLY = args.includes('--yes') && !args.includes('--dry-run');
const SKIP_DEPLOY = args.includes('--skip-deploy');
const FORCE = args.includes('--force') || process.env.FORCE_TARGET === 'true';

const SOURCE_URL = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const TARGET_URL = process.env.TARGET_DATABASE_URL;
const SUPER_ADMIN = 'SUPER ADMIN';

function fail(message: string): never {
  console.error(`\n  ERROR: ${message}\n`);
  process.exit(1);
}

if (!SOURCE_URL) {
  fail('Set SOURCE_DATABASE_URL (or DATABASE_URL) to the current database.');
}
if (!TARGET_URL) {
  fail('Set TARGET_DATABASE_URL to the production database.');
}
if (SOURCE_URL === TARGET_URL) {
  fail('SOURCE_DATABASE_URL and TARGET_DATABASE_URL must point to different databases.');
}

const makeClient = (connectionString: string): Client =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const source = makeClient(SOURCE_URL);
const target = makeClient(TARGET_URL);

const backendRoot = path.resolve(__dirname, '..', '..');

function runMigrateDeploy() {
  console.log('\n▶ Step 1/3 — Applying migrations to the TARGET database...');
  console.log(`  cwd : ${backendRoot}`);
  console.log('  cmd : npx prisma migrate deploy');
  const result = spawnSync('npx prisma migrate deploy', {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: TARGET_URL },
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    fail(`\`prisma migrate deploy\` exited with code ${result.status}.`);
  }
  console.log('  ✓ migrations applied.');
}

const CHUNK = 500;

async function insertChunked(client: Client, delegate: string, rows: Row[], label: string) {
  if (rows.length === 0) {
    console.log(`  • ${label}: nothing to insert`);
    return;
  }
  for (let i = 0; i < rows.length; i += CHUNK) {
    await (client as any)[delegate].createMany({
      data: rows.slice(i, i + CHUNK) as any,
      skipDuplicates: true,
    });
  }
  console.log(`  • ${label}: inserted ${rows.length}`);
}

async function main() {
  console.log('===================================================================');
  console.log(' PICA — admin/config data migration');
  console.log('===================================================================');
  console.log(` mode           : ${APPLY ? 'APPLY (writes to target)' : 'PREVIEW (no writes)'}`);
  console.log(` skip deploy    : ${SKIP_DEPLOY}`);
  console.log(` force          : ${FORCE}`);
  console.log(` source (masked): ${mask(SOURCE_URL!)}`);
  console.log(` target (masked): ${mask(TARGET_URL!)}`);

  // ---------------------------------------------------------------------
  // Read ALL source config first. If anything is wrong on the source side we
  // stop before touching the target.
  // ---------------------------------------------------------------------
  console.log('\n▶ Step 2/3 — Reading configuration from the SOURCE database...');

  const superAdminWhere = {
    role: 'ADMIN' as const,
    OR: [{ department: SUPER_ADMIN }, { adminRole: { name: SUPER_ADMIN } }],
  };

  const [
    adminRoles,
    pillars,
    superAdmins,
    scoringSettings,
    appSettings,
    scoreLabels,
    subscriptionPlans,
    consultationTiers,
    questions,
    questionOptions,
    pillarScoreLabels,
    planPrices,
    discounts,
  ] = await Promise.all([
    source.adminRole.findMany(),
    source.pillar.findMany(),
    source.user.findMany({ where: superAdminWhere }),
    source.scoringSettings.findMany(),
    source.appSettings.findMany(),
    source.scoreLabel.findMany(),
    source.subscriptionPlan.findMany(),
    source.consultationTier.findMany(),
    source.question.findMany(),
    source.questionOption.findMany(),
    source.pillarScoreLabel.findMany(),
    source.planPrice.findMany(),
    source.discount.findMany(),
  ]);

  const superAdminIds = new Set(superAdmins.map((u) => u.id));

  // Null out user references that point at users we are NOT migrating, so the
  // inserts don't fail on a foreign key.
  const appSettingsRows = appSettings.map((row) => ({
    ...row,
    updatedBy: row.updatedBy && superAdminIds.has(row.updatedBy) ? row.updatedBy : null,
  }));
  const discountRows = discounts.map((row) => ({
    ...row,
    userId: row.userId && superAdminIds.has(row.userId) ? row.userId : null,
  }));

  console.log('  Source row counts:');
  const sourceCounts: Record<string, number> = {
    'Admin roles': adminRoles.length,
    Pillars: pillars.length,
    'Super admins': superAdmins.length,
    'Scoring settings': scoringSettings.length,
    'App settings': appSettings.length,
    'Score labels': scoreLabels.length,
    'Subscription plans': subscriptionPlans.length,
    'Consultation tiers': consultationTiers.length,
    Questions: questions.length,
    'Question options': questionOptions.length,
    'Pillar score labels': pillarScoreLabels.length,
    'Plan prices': planPrices.length,
    Coupons: discountRows.length,
  };
  for (const [label, count] of Object.entries(sourceCounts)) {
    console.log(`    - ${label.padEnd(22)} ${count}`);
  }

  const warnings: string[] = [];
  if (superAdmins.length === 0) {
    warnings.push('no super admins found in the source — no admin user will be moved.');
  }
  if (appSettings.length === 0) {
    warnings.push('source app_settings is empty — the target will have no app settings.');
  }
  if (scoringSettings.length === 0) {
    warnings.push('source scoring_settings is empty — the target will have no scoring settings.');
  }
  if (pillars.length === 0) {
    warnings.push('source pillars is empty.');
  }
  if (!adminRoles.some((r) => r.name === SUPER_ADMIN)) {
    warnings.push(`source admin_roles has no "${SUPER_ADMIN}" role.`);
  }
  for (const warning of warnings) {
    console.log(`\n  WARNING: ${warning}`);
  }

  if (!APPLY) {
    console.log('\n▶ Preview only — nothing was written.');
    console.log('  Re-run with `--yes` to run the deploy + copy.');
    return;
  }

  // ---------------------------------------------------------------------
  // Safety guard: the target must not already hold live transactional data.
  // ---------------------------------------------------------------------
  if (!FORCE) {
    const [sessions, payments, responses] = await Promise.all([
      target.assessmentSession.count(),
      target.payment.count(),
      target.sessionResponse.count(),
    ]);
    const total = sessions + payments + responses;
    if (total > 0) {
      fail(
        `Target already contains transactional data (sessions=${sessions}, ` +
          `payments=${payments}, responses=${responses}). Point the script at a fresh ` +
          `database, or pass --force if you are certain.`
      );
    }
  }

  if (!SKIP_DEPLOY) {
    runMigrateDeploy();
  } else {
    console.log('\n▶ Step 1/3 — Skipped migrate deploy (--skip-deploy).');
  }

  // ---------------------------------------------------------------------
  // Step 3: replace target config in one transaction, FK-safe order.
  // ---------------------------------------------------------------------
  console.log('\n▶ Step 3/3 — Writing configuration to the TARGET database...');

  await target.$transaction(
    async (tx) => {
      // --- delete (reverse dependency order) ---
      console.log('  Clearing target config tables...');
      await tx.discount.deleteMany({});
      await tx.planPrice.deleteMany({});
      await tx.pillarScoreLabel.deleteMany({});
      await tx.questionOption.deleteMany({});
      await tx.question.deleteMany({});
      await tx.appSettings.deleteMany({});
      await tx.user.deleteMany({
        where: { role: 'ADMIN', OR: [{ department: SUPER_ADMIN }, { adminRole: { name: SUPER_ADMIN } }] },
      });
      await tx.scoringSettings.deleteMany({});
      await tx.scoreLabel.deleteMany({});
      await tx.subscriptionPlan.deleteMany({});
      await tx.consultationTier.deleteMany({});
      await tx.pillar.deleteMany({});
      await tx.adminRole.deleteMany({});

      // --- insert (dependency order) ---
      console.log('  Inserting config rows...');
      await insertChunked(tx as any, 'adminRole', adminRoles as Row[], 'Admin roles');
      await insertChunked(tx as any, 'pillar', pillars as Row[], 'Pillars');
      await insertChunked(tx as any, 'user', superAdmins as Row[], 'Super admins');
      await insertChunked(tx as any, 'scoringSettings', scoringSettings as Row[], 'Scoring settings');
      await insertChunked(tx as any, 'appSettings', appSettingsRows as Row[], 'App settings');
      await insertChunked(tx as any, 'scoreLabel', scoreLabels as Row[], 'Score labels');
      await insertChunked(
        tx as any,
        'subscriptionPlan',
        subscriptionPlans as Row[],
        'Subscription plans'
      );
      await insertChunked(
        tx as any,
        'consultationTier',
        consultationTiers as Row[],
        'Consultation tiers'
      );
      await insertChunked(tx as any, 'question', questions as Row[], 'Questions');
      await insertChunked(tx as any, 'questionOption', questionOptions as Row[], 'Question options');
      await insertChunked(
        tx as any,
        'pillarScoreLabel',
        pillarScoreLabels as Row[],
        'Pillar score labels'
      );
      await insertChunked(tx as any, 'planPrice', planPrices as Row[], 'Plan prices');
      await insertChunked(tx as any, 'discount', discountRows as Row[], 'Coupons');
    },
    { timeout: 180_000, maxWait: 20_000 }
  );

  console.log('\n  ✓ Migration complete.');
}

function mask(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = '****';
    return u.toString();
  } catch {
    return '<invalid url>';
  }
}

main()
  .catch((error) => {
    console.error('\n  Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await source.$disconnect().catch(() => undefined);
    await target.$disconnect().catch(() => undefined);
  });
