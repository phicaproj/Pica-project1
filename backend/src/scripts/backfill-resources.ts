/**
 * backfill-resources.ts
 * ---------------------------------------------------------------------------
 * One-off migration for existing DigitalResource documents after the resource
 * schema changed:
 *   1. `pricingType` did not exist before. Backfill it from the price:
 *        price > 0 -> 'paid'  |  price <= 0 -> 'free'
 *   2. `category` is now an enum of 6 values. Older free-text categories are
 *      normalized to the closest canonical value. Anything unrecognized falls
 *      back to 'Guides' and is reported so an admin can review it.
 *
 * Usage (run from the `backend` folder):
 *
 *   npx tsx src/scripts/backfill-resources.ts            # apply changes
 *   npx tsx src/scripts/backfill-resources.ts --dry-run  # preview only
 * ---------------------------------------------------------------------------
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongo } from '../Config/mongoDb';
import { DigitalResource } from '../beauvision-module/resource/resource.model';
import { RESOURCE_CATEGORIES } from '../beauvision-module/resource/resource.types';

type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

const CATEGORY_SET = new Set<string>(RESOURCE_CATEGORIES);

function normalizeCategory(raw?: string | null): ResourceCategory {
  if (!raw || !raw.trim()) return 'Guides';
  const trimmed = raw.trim();
  if (CATEGORY_SET.has(trimmed)) return trimmed as ResourceCategory;

  const key = trimmed.toLowerCase().replace(/[^a-z]/g, '');
  switch (key) {
    case 'toolkit':
    case 'toolkits':
      return 'Toolkit';
    case 'workbook':
    case 'workbooks':
      return 'Workbook';
    case 'worksheet':
    case 'worksheets':
      return 'Worksheet';
    case 'guide':
    case 'guides':
      return 'Guides';
    case 'casestudy':
    case 'casestudies':
      return 'Case Studies';
    case 'whitepaper':
    case 'whitepapers':
      return 'White Paper';
    default:
      return 'Guides';
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('===================================================================');
  console.log(' Backfill DigitalResource: pricingType + category enum');
  console.log(` Mode: ${dryRun ? 'DRY RUN (no writes)' : 'APPLY'}`);
  console.log('===================================================================');

  await connectMongo();

  const total = await DigitalResource.countDocuments();
  console.log(`\n  Resources found: ${total}`);

  if (total === 0) {
    console.log('\n  Nothing to backfill.');
    await mongoose.disconnect();
    process.exit(0);
  }

  let pricingUpdated = 0;
  let categoryUpdated = 0;
  let unchanged = 0;
  const unknownCategories: { id: string; from: string | null; to: ResourceCategory }[] = [];

  const cursor = DigitalResource.find({}).cursor();

  for await (const doc of cursor) {
    const updates: Record<string, unknown> = {};

    // 1. pricingType
    if (!(doc as { pricingType?: string }).pricingType) {
      updates.pricingType = (doc.price ?? 0) > 0 ? 'paid' : 'free';
    }

    // 2. category
    const normalized = normalizeCategory(doc.category);
    if (normalized !== doc.category) {
      updates.category = normalized;

      if (!CATEGORY_SET.has((doc.category ?? '').trim())) {
        unknownCategories.push({
          id: String(doc._id),
          from: doc.category ?? null,
          to: normalized,
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      unchanged += 1;
      continue;
    }

    if (!dryRun) {
      await DigitalResource.updateOne({ _id: doc._id }, { $set: updates });
    }

    if ('pricingType' in updates) pricingUpdated += 1;
    if ('category' in updates) categoryUpdated += 1;
  }

  console.log('\n  Summary');
  console.log(`    pricingType set: ${pricingUpdated}`);
  console.log(`    category normalized: ${categoryUpdated}`);
  console.log(`    unchanged: ${unchanged}`);

  if (unknownCategories.length > 0) {
    console.log(`\n  ⚠ ${unknownCategories.length} resource(s) had an unrecognized category`);
    console.log('    mapped to a default. Review these:');
    for (const item of unknownCategories) {
      console.log(`      - ${item.id}: "${item.from ?? ''}" -> ${item.to}`);
    }
  }

  console.log(
    dryRun
      ? '\n  ✓ Dry run complete. Re-run without --dry-run to apply.'
      : '\n  ✓ Backfill complete.'
  );

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (error) => {
  console.error('\n  Backfill failed:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
