/**
 * upgrade-all-admins.ts
 * ---------------------------------------------------------------------------
 * Upgrades every BeauvisionAdmin in MongoDB to the OWNER (super admin) role.
 *
 * For each admin document it:
 *   1. Sets `role` to 'OWNER'
 *   2. Clears `permissions` to [] (owners have implicit full access)
 *
 * Usage (run from the `backend` folder):
 *
 *   PowerShell:
 *     npx tsx src/scripts/upgrade-all-admins.ts
 *
 * Safety:
 *   - Prints the count before/after so you can verify.
 *   - Requires DATABASE_URL / MONGODB_URI to be set via .env (loaded by
 *     `dotenv/config` in server.ts / app boot).
 * ---------------------------------------------------------------------------
 */

import 'dotenv/config';
import { connectMongo } from '../Config/mongoDb';
import { BeauvisionAdmin } from '../beauvision-module/admin/admin.model';

async function main() {
  console.log('===================================================================');
  console.log(' Upgrade all BeauvisionAdmins to OWNER (super admin)');
  console.log('===================================================================');

  await connectMongo();

  const before = await BeauvisionAdmin.countDocuments();
  console.log(`\n  Admins found before upgrade: ${before}`);

  if (before === 0) {
    console.log('\n  No admins to upgrade. Nothing to do.');
    process.exit(0);
  }

  const result = await BeauvisionAdmin.updateMany(
    {},
    {
      $set: {
        role: 'OWNER',
        permissions: [],
      },
    }
  );

  const after = await BeauvisionAdmin.countDocuments({ role: 'OWNER' });
  console.log(`\n  Matched: ${result.matchedCount}`);
  console.log(`  Modified: ${result.modifiedCount}`);
  console.log(`  Admins with role OWNER after upgrade: ${after}`);

  console.log('\n  ✓ All admins upgraded to OWNER.');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n  Upgrade failed:', error);
  process.exitCode = 1;
});
