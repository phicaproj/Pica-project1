import { Phase } from '@prisma/client';
import prisma from '../Config/db';
import { deleteObject } from '../service/shared/storage.service';

/**
 * Cleanup script to remove PDF reports older than 30 days from Cloudflare R2 bucket
 * and set their DB URLs to null to save storage space.
 * 
 * Since the backend generates PDFs on-demand when the DB URL is null,
 * the PDFs will be seamlessly recreated whenever a user requests them again.
 */
export async function cleanupExpiredReports() {
  console.log('Starting monthly report PDF cleanup script...');
  
  // Clean up reports that haven't been accessed/updated in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const results = await prisma.sessionResult.findMany({
      where: {
        reportPdfUrl: { not: null },
        updatedAt: { lt: thirtyDaysAgo }
      },
      select: {
        sessionId: true,
        reportPdfUrl: true,
        session: {
          select: {
            phase: true,
          }
        }
      }
    });

    console.log(`Found ${results.length} report PDFs older than 30 days to clean up.`);

    let deletedCount = 0;

    for (const result of results) {
      const sessionId = result.sessionId;
      const phase = result.session.phase;
      
      const phaseFolder =
        phase === Phase.PHASE2B ? 'phase2b' : phase === Phase.PHASE2A ? 'phase2a' : 'phase1';
      
      const r2Key = `reports/${phaseFolder}/${sessionId}.pdf`;
      
      try {
        console.log(`Deleting ${r2Key} from R2 bucket...`);
        await deleteObject(r2Key);
        
        // Clear URL reference in DB
        await prisma.sessionResult.update({
          where: { sessionId },
          data: { reportPdfUrl: null }
        });
        
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete storage file for session ${sessionId}:`, err);
      }
    }

    console.log(`Cleanup run finished. Removed ${deletedCount} PDF files from storage.`);
  } catch (error) {
    console.error('Fatal error running reports cleanup:', error);
  }
}

// Support direct execution via ts-node
if (require.main === module) {
  cleanupExpiredReports()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
