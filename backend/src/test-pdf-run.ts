import { generateReportPDF } from './service/shared/pdf.service';
import { Phase } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const mockResult = {
  totalScore: 78,
  colorBand: 'GREEN' as any,
  hasAnyKnockout: false,
  knockoutQuestionIds: [],
  pillarScores: [
    {
      pillarId: 'fl-1',
      pillarName: 'Founder & Leadership',
      pillarCode: 'FL',
      rawScore: 8,
      maxPossibleScore: 10,
      weightedScore: 80,
      hasKnockout: false,
      colorBand: 'GREEN' as any,
      insightRuleApplied: 'RULE_FL' as any,
      findings: [
        {
          optionId: 'opt-1',
          questionText: 'Is decision making documented?',
          selectedLabel: 'Yes, fully',
          observation: 'Decision-making paths are documented and clear.',
          recommendation: 'Establish formal advisory board structures.',
          riskType: 'NORMAL' as any,
          score: 80,
        }
      ],
      allFindings: [
        {
          optionId: 'opt-1',
          questionText: 'Is decision making documented?',
          selectedLabel: 'Yes, fully',
          observation: 'Decision-making paths are documented and clear.',
          recommendation: 'Establish formal advisory board structures.',
          riskType: 'NORMAL' as any,
          score: 80,
        }
      ],
    },
    {
      pillarId: 'fr-1',
      pillarName: 'Financial Resilience',
      pillarCode: 'FR',
      rawScore: 9,
      maxPossibleScore: 10,
      weightedScore: 90,
      hasKnockout: false,
      colorBand: 'GREEN' as any,
      insightRuleApplied: 'RULE_FR' as any,
      findings: [],
      allFindings: [],
    },
    {
      pillarId: 'bm-1',
      pillarName: 'Business Model & Sales',
      pillarCode: 'BM',
      rawScore: 7,
      maxPossibleScore: 10,
      weightedScore: 70,
      hasKnockout: false,
      colorBand: 'GREEN' as any,
      insightRuleApplied: 'RULE_BM' as any,
      findings: [],
      allFindings: [],
    },
    {
      pillarId: 'op-1',
      pillarName: 'Operations',
      pillarCode: 'OP',
      rawScore: 5,
      maxPossibleScore: 10,
      weightedScore: 50,
      hasKnockout: false,
      colorBand: 'AMBER' as any,
      insightRuleApplied: 'RULE_OP' as any,
      findings: [
        {
          optionId: 'opt-2',
          questionText: 'Are operational procedures standardized?',
          selectedLabel: 'No, ad-hoc',
          observation: 'Procedures are mostly undocumented and key-person dependent.',
          recommendation: 'Document standard operating systems.',
          riskType: 'RISK' as any,
          score: 40,
        }
      ],
      allFindings: [
        {
          optionId: 'opt-2',
          questionText: 'Are operational procedures standardized?',
          selectedLabel: 'No, ad-hoc',
          observation: 'Procedures are mostly undocumented and key-person dependent.',
          recommendation: 'Document standard operating systems.',
          riskType: 'RISK' as any,
          score: 40,
        }
      ],
    },
    {
      pillarId: 'ms-1',
      pillarName: 'Marketing & Velocity',
      pillarCode: 'MS',
      rawScore: 6,
      maxPossibleScore: 10,
      weightedScore: 60,
      hasKnockout: false,
      colorBand: 'AMBER' as any,
      insightRuleApplied: 'RULE_MS' as any,
      findings: [],
      allFindings: [],
    },
    {
      pillarId: 'gc-1',
      pillarName: 'Governance & Compliance',
      pillarCode: 'GC',
      rawScore: 4,
      maxPossibleScore: 10,
      weightedScore: 40,
      hasKnockout: true,
      colorBand: 'RED' as any,
      insightRuleApplied: 'RULE_GC' as any,
      findings: [
        {
          optionId: 'opt-3',
          questionText: 'Is the business legally compliant?',
          selectedLabel: 'Major gaps',
          observation: 'Critical gaps in regulatory compliance were flagged.',
          recommendation: 'Conduct annual regulatory compliance review.',
          riskType: 'KNOCKOUT' as any,
          score: 20,
        }
      ],
      allFindings: [
        {
          optionId: 'opt-3',
          questionText: 'Is the business legally compliant?',
          selectedLabel: 'Major gaps',
          observation: 'Critical gaps in regulatory compliance were flagged.',
          recommendation: 'Conduct annual regulatory compliance review.',
          riskType: 'KNOCKOUT' as any,
          score: 20,
        }
      ],
    },
    {
      pillarId: 'ss-1',
      pillarName: 'Strategy & Scale',
      pillarCode: 'SS',
      rawScore: 7,
      maxPossibleScore: 10,
      weightedScore: 75,
      hasKnockout: false,
      colorBand: 'GREEN' as any,
      insightRuleApplied: 'RULE_SS' as any,
      findings: [],
      allFindings: [],
    }
  ]
};

// Set hasAnyKnockout because GC is knocked out
mockResult.hasAnyKnockout = true;

async function run() {
  console.log('Generating PDF...');
  try {
    const buffer = await generateReportPDF(
      mockResult as any,
      'Lumina Strategic Systems Consulting Services Ltd', // Wrap test
      Phase.PHASE2A,
      {
        businessSize: 'SMALL',
        sessionId: 'test-session-id-12345678',
        completedAt: new Date(),
      }
    );
    const destPath = path.join(__dirname, '..', 'test-report.pdf');
    fs.writeFileSync(destPath, buffer);
    console.log(`PDF successfully written to: ${destPath}`);
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
}

run();
