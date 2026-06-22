import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Phase } from '@prisma/client';
import type {
  ScoringResultPayload,
  ScoringPillarPayload,
} from '../../module/scoring/scoring.types';

// ============================================================
// CONSTANTS — PICA brand palette
// ============================================================
const COLORS = {
  primary: '#111827', // PICA dark navy
  primaryLight: '#1F2937', // lighter navy
  accent: '#F97316', // PICA orange
  accentDark: '#EA6C0A', // darker orange
  bodyText: '#1F2937', // near-navy body
  mutedText: '#6B7280', // muted grey
  green: '#047857', // emerald-700
  greenBg: '#ECFDF5', // emerald-50
  greenBorder: '#10B981', // emerald-500
  amber: '#B45309', // amber-700
  amberBg: '#FFFBEB', // amber-50
  amberBorder: '#F59E0B', // amber-500
  red: '#E11D48', // rose-600
  redBg: '#FFF1F2', // rose-50
  redBorder: '#F43F5E', // rose-500
  white: '#FFFFFF',
  lightGrey: '#F9FAFB',
  borderGrey: '#E5E7EB',
  pageWidth: 515, // usable width with 40pt margins on each side
} as const;

const PAGE_MARGIN = 40;

// Logo lives in the assets folder
const LOGO_PATH = path.join(process.cwd(), 'assets', 'logo.png');
const LOGO_BUFFER: Buffer | null = (() => {
  try {
    return fs.readFileSync(LOGO_PATH);
  } catch {
    return null;
  }
})();

// Cover Page Image
const COVER_PATH = path.join(process.cwd(), 'assets', 'cover.jpg');
const COVER_BUFFER: Buffer | null = (() => {
  try {
    return fs.readFileSync(COVER_PATH);
  } catch {
    try {
      return fs.readFileSync(path.join(process.cwd(), '..', 'PDF report design', 'Cover page image.jpg'));
    } catch {
      return null;
    }
  }
})();

// Phase → human label shown on the cover + summary header.
const phaseLabel = (phase: Phase): string => {
  if (phase === Phase.PHASE2A) return 'PICA Level 2A – Structured Diagnosis';
  if (phase === Phase.PHASE2B) return 'PICA Level 2B – Deep Dive';
  return 'PICA Level 1 – Snapshot Assessment';
};

const bandInterpretation = (band: string): string => {
  if (band === 'GREEN') return 'This pillar is performing well with no critical risks flagged.';
  if (band === 'AMBER') return 'This pillar is functional but has moderate risks worth addressing.';
  return 'This pillar shows critical gaps that need immediate attention.';
};

type BandColors = { text: string; bg: string; border: string; label: string };

const bandColors = (band: string): BandColors => {
  if (band === 'GREEN')
    return {
      text: COLORS.green,
      bg: COLORS.greenBg,
      border: COLORS.greenBorder,
      label: 'OPTIMIZED',
    };
  if (band === 'AMBER')
    return {
      text: COLORS.amber,
      bg: COLORS.amberBg,
      border: COLORS.amberBorder,
      label: 'NEEDS WORK',
    };
  return { text: COLORS.red, bg: COLORS.redBg, border: COLORS.redBorder, label: 'ATTENTION' };
};

const bandEmoji = (band: string): string => {
  if (band === 'GREEN') return '✓';
  if (band === 'AMBER') return '!';
  return '✕';
};

const getExecutiveNarrative = (score: number, band: string): string => {
  if (band === 'GREEN') {
    if (score >= 91) {
      return "Your business is Future-Proofed and scale-ready. You have built a highly adaptive operational architecture that matches global benchmarks, minimizing friction and enabling aggressive market expansion with high resilience.";
    }
    return "You have built a solid and defensible business architecture. The core 'skeleton' of the organization is strong, with established systems and clear governance. While there are minor operational refinements needed to reach peak efficiency, your business demonstrates the stability required to support sustainable growth and handle increased institutional scrutiny.";
  }
  if (band === 'AMBER') {
    return "Your business is Foundational but structurally vulnerable in key areas. While core transaction processing is functional, key operational bottlenecks and governance gaps limit scalability and increase dependency on key individuals.";
  }
  return "Your organization is currently operating in a Reactive state. Gaps in critical compliance, financial controls, or structural redundancy represent high-risk exposure. Immediate remediation of highlighted risk factors is required to prevent operational disruption.";
};

const getCanonicalPillars = (pillars: ScoringPillarPayload[]) => {
  const canonicalOrder = ['FL', 'FR', 'BM', 'OP', 'MS', 'GC', 'SS'];
  return [...pillars].sort(
    (a, b) => canonicalOrder.indexOf(a.pillarCode) - canonicalOrder.indexOf(b.pillarCode)
  );
};

// ============================================================
// VECTOR ICON DRAWERS
// ============================================================
const drawCheckIcon = (doc: PDFKit.PDFDocument, x: number, y: number, size: number) => {
  doc.save();
  doc.translate(x, y);
  doc.scale(size / 16);
  doc.circle(8, 8, 7.5).fillColor('#10B981').fill();
  doc.lineWidth(1.5).strokeColor('#FFFFFF');
  doc.moveTo(4.5, 8).lineTo(7, 10.5).lineTo(11.5, 5.5).stroke();
  doc.restore();
};

const drawWarningIcon = (doc: PDFKit.PDFDocument, x: number, y: number, size: number, color = '#F59E0B') => {
  doc.save();
  doc.translate(x, y);
  doc.scale(size / 16);
  doc.circle(8, 8, 7.5).fillColor(color).fill();
  doc.lineWidth(1.5).strokeColor('#FFFFFF');
  doc.moveTo(8, 4.5).lineTo(8, 9).stroke();
  doc.moveTo(8, 11.5).circle(8, 11.5, 0.5).stroke();
  doc.restore();
};

const drawShieldIcon = (doc: PDFKit.PDFDocument, x: number, y: number, size: number, color: string) => {
  doc.save();
  doc.translate(x, y);
  doc.scale(size / 16);
  doc.moveTo(8, 0)
     .lineTo(15, 2.5)
     .lineTo(15, 7.5)
     .quadraticCurveTo(15, 12.5, 8, 15.5)
     .quadraticCurveTo(1, 12.5, 1, 7.5)
     .lineTo(1, 2.5)
     .closePath()
     .fillColor(color)
     .fill();
  doc.restore();
};

// ============================================================
// LAYOUT HELPERS
// ============================================================
const roundedRect = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: string,
  strokeColor?: string
) => {
  doc.save();
  doc
    .moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y)
    .closePath();

  if (strokeColor) {
    doc.fillAndStroke(fillColor, strokeColor);
  } else {
    doc.fill(fillColor);
  }
  doc.restore();
};

const hr = (
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  color: string = COLORS.borderGrey
) => {
  doc
    .save()
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_MARGIN + COLORS.pageWidth, y)
    .lineWidth(0.5)
    .strokeColor(color)
    .stroke()
    .restore();
};

// ============================================================
// HEADER / FOOTER
// ============================================================
const drawHeader = (doc: PDFKit.PDFDocument, businessName: string, date: string) => {
  // Mini Header band
  doc.rect(0, 0, doc.page.width, 50).fill(COLORS.primary);
  doc.rect(0, 50, doc.page.width, 2).fill(COLORS.accent);

  let textX = PAGE_MARGIN;
  if (LOGO_BUFFER) {
    try {
      doc.image(LOGO_BUFFER, PAGE_MARGIN, 13, { height: 24 });
      textX = PAGE_MARGIN + 32;
    } catch {}
  }

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(COLORS.white)
    .text('PICA', textX, 18, { lineBreak: false });

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#D1D5DB')
    .text('Beauvision Associates', textX + 35, 21, { lineBreak: false });

  // PICA Seal checkmark indicator on right
  drawCheckIcon(doc, PAGE_MARGIN + COLORS.pageWidth - 80, 17, 16);
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text('PICA SEAL', PAGE_MARGIN + COLORS.pageWidth - 58, 21, { lineBreak: false });

  doc.y = 75;
};

const drawFooter = (doc: PDFKit.PDFDocument, businessName: string, sessionId?: string) => {
  const footerY = doc.page.height - 40;
  const prevBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  hr(doc, footerY - 8);

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text(
      `© ${new Date().getFullYear()} Beauvision Associates | PICA-V4.2`,
      PAGE_MARGIN,
      footerY,
      { align: 'left', width: COLORS.pageWidth / 2, lineBreak: false }
    );

  const displayId = sessionId ? `ID: BV-${sessionId.substring(0, 8).toUpperCase()}` : '';
  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text(
      `${businessName.substring(0, 30)}   ${displayId}`,
      PAGE_MARGIN,
      footerY,
      { align: 'right', width: COLORS.pageWidth, lineBreak: false }
    );

  doc.page.margins.bottom = prevBottom;
};

// ============================================================
// COVER PAGE
// ============================================================
const drawCoverPage = (
  doc: PDFKit.PDFDocument,
  businessName: string,
  phase: Phase,
  date: string,
  metadata?: {
    businessSize?: string | null;
    sessionId?: string;
    completedAt?: Date | null;
  }
) => {
  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Thin orange rules framing the page top + bottom.
  doc.rect(0, 40, pageW, 2).fill(COLORS.accent);
  doc.rect(0, pageH - 42, pageW, 2).fill(COLORS.accent);

  // Top header: CONFIDENTIAL ADVISORY
  doc.save();
  doc.lineWidth(0.5).strokeColor(COLORS.borderGrey);
  doc.moveTo(PAGE_MARGIN, 80).lineTo(PAGE_MARGIN + 120, 80).stroke();
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('CONFIDENTIAL ADVISORY', PAGE_MARGIN + 130, 76, {
      width: 235,
      align: 'center',
      characterSpacing: 2,
    });
  doc.moveTo(PAGE_MARGIN + 365, 80).lineTo(PAGE_MARGIN + COLORS.pageWidth, 80).stroke();
  doc.restore();

  // Title block
  doc
    .fontSize(28)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('PICA – Business Health', PAGE_MARGIN, 130, {
      width: COLORS.pageWidth,
      align: 'center',
    });
  doc
    .fontSize(28)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Assessment Report', PAGE_MARGIN, 165, {
      width: COLORS.pageWidth,
      align: 'center',
    });

  doc
    .fontSize(12)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text('Prepared by Beauvision Associates', PAGE_MARGIN, 210, {
      width: COLORS.pageWidth,
      align: 'center',
    });

  // Centered Image Card (Y = 250 to 520)
  const cardY = 250;
  const cardH = 340; // Increased height to make it more elegant

  if (COVER_BUFFER) {
    try {
      doc.image(COVER_BUFFER, PAGE_MARGIN, cardY, {
        fit: [COLORS.pageWidth, cardH],
        align: 'center',
        valign: 'center',
      });
      // Draw subtle border around image
      doc.save().lineWidth(1).strokeColor(COLORS.borderGrey);
      roundedRect(doc, PAGE_MARGIN, cardY, COLORS.pageWidth, cardH, 8, 'transparent', COLORS.borderGrey);
      doc.restore();
    } catch {
      // Fallback
      roundedRect(doc, PAGE_MARGIN, cardY, COLORS.pageWidth, cardH, 10, COLORS.primary);
    }
  } else {
    // Elegant fallback card
    roundedRect(doc, PAGE_MARGIN, cardY, COLORS.pageWidth, cardH, 10, COLORS.primary);
    
    // Draw abstract technological/network nodes inside the dark card
    doc.save();
    doc.lineWidth(1).strokeColor('#374151');
    const nodes = [
      { x: 100, y: 300 }, { x: 200, y: 350 }, { x: 150, y: 440 },
      { x: 420, y: 320 }, { x: 380, y: 450 }, { x: 480, y: 400 }
    ];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < 180) {
          doc.moveTo(nodes[i].x, nodes[i].y).lineTo(nodes[j].x, nodes[j].y).stroke();
        }
      }
    }
    doc.fillColor('#4B5563');
    for (const n of nodes) {
      doc.circle(n.x, n.y, 4).fill();
    }
    doc.restore();
  }

  // Bottom Grid Details (Moved closer to the footer orange line at bottom)
  const gridY = 675;
  hr(doc, gridY - 15);

  // Col 1: Strategic Partner
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('STRATEGIC PARTNER', PAGE_MARGIN, gridY, { characterSpacing: 1 });
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(businessName, PAGE_MARGIN, gridY + 14, { width: 160, ellipsis: true });

  const sizeText = metadata?.businessSize === 'SMALL' ? 'Small Business' : 'Medium Business';
  roundedRect(doc, PAGE_MARGIN, gridY + 48, 100, 20, 4, '#F3F4F6', COLORS.borderGrey);
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(sizeText, PAGE_MARGIN, gridY + 54, { width: 100, align: 'center' });

  // Col 2: Assessment Metadata
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('ASSESSMENT TYPE', PAGE_MARGIN + 190, gridY, { characterSpacing: 1 });
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(phaseLabel(phase), PAGE_MARGIN + 190, gridY + 14, { width: 180 });

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('DATE OF ASSESSMENT', PAGE_MARGIN + 190, gridY + 40, { characterSpacing: 1 });
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(COLORS.primary)
    .text(date, PAGE_MARGIN + 190, gridY + 54);

  // Col 3: Report Identity
  const displayId = metadata?.sessionId ? `BV-${metadata.sessionId.substring(0, 8).toUpperCase()}` : 'BV-DIAG-TEMP';
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('REPORT ID', PAGE_MARGIN + 380, gridY, { characterSpacing: 1 });
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(COLORS.primary)
    .text(displayId, PAGE_MARGIN + 380, gridY + 14);

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('SECURITY STATUS', PAGE_MARGIN + 380, gridY + 40, { characterSpacing: 1 });
  
  drawShieldIcon(doc, PAGE_MARGIN + 380, gridY + 52, 12, COLORS.accent);
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text('PROPRIETARY', PAGE_MARGIN + 396, gridY + 54);
};

// ============================================================
// SPIDER GRAPH RENDERER
// ============================================================
const drawRadarChart = (
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  r: number,
  pillars: ScoringPillarPayload[],
  benchmarks: number[]
) => {
  const numAxes = 7;
  const getAngle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI / numAxes);

  const stablePillars = getCanonicalPillars(pillars);

  // 1. Background grid heptagons
  doc.save();
  doc.lineWidth(0.5).strokeColor('#E5E7EB');
  const grids = [0.2, 0.4, 0.6, 0.8, 1.0];
  for (const pct of grids) {
    const startAngle = getAngle(0);
    doc.moveTo(cx + r * pct * Math.cos(startAngle), cy + r * pct * Math.sin(startAngle));
    for (let i = 1; i < numAxes; i++) {
      const angle = getAngle(i);
      doc.lineTo(cx + r * pct * Math.cos(angle), cy + r * pct * Math.sin(angle));
    }
    doc.closePath().stroke();
  }

  // 2. Axis lines
  for (let i = 0; i < numAxes; i++) {
    const angle = getAngle(i);
    doc.moveTo(cx, cy).lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle)).stroke();
  }
  doc.restore();

  // 3. Axis labels (only if large enough)
  if (r > 60) {
    doc.save();
    for (let i = 0; i < numAxes; i++) {
      const pillar = stablePillars[i];
      if (!pillar) continue;
      const angle = getAngle(i);
      const labelDist = r + 15;
      const lx = cx + labelDist * Math.cos(angle);
      const ly = cy + labelDist * Math.sin(angle);

      doc.font('Helvetica-Bold').fontSize(7).fillColor(COLORS.primary);
      const codeText = pillar.pillarCode;

      let align: PDFKit.Mixins.TextOptions['align'] = 'center';
      let offsetX = -30;
      let offsetY = -4;

      if (Math.cos(angle) > 0.3) {
        align = 'left';
        offsetX = 5;
      } else if (Math.cos(angle) < -0.3) {
        align = 'right';
        offsetX = -65;
      }

      doc.text(codeText, lx + offsetX, ly + offsetY, { width: 60, align });
    }
    doc.restore();
  }

  // 4. Industry Standard Baseline (Dashed Red)
  doc.save();
  const benchmarkColor = '#EF4444';
  doc.lineWidth(1).strokeColor(benchmarkColor).dash(2, { space: 2 });
  if (numAxes > 0) {
    const firstScore = benchmarks[0] ?? 60;
    const firstAngle = getAngle(0);
    doc.moveTo(
      cx + (firstScore / 100) * r * Math.cos(firstAngle),
      cy + (firstScore / 100) * r * Math.sin(firstAngle)
    );
    for (let i = 1; i < numAxes; i++) {
      const score = benchmarks[i] ?? 60;
      const angle = getAngle(i);
      doc.lineTo(
        cx + (score / 100) * r * Math.cos(angle),
        cy + (score / 100) * r * Math.sin(angle)
      );
    }
    doc.closePath().stroke();
  }
  doc.restore();

  // 5. Company Data Polygon (Yellow Translucent)
  doc.save();
  const companyColor = '#F59E0B';
  doc.lineWidth(1.5).strokeColor(companyColor);
  if (numAxes > 0) {
    const firstScore = stablePillars[0]?.weightedScore ?? 0;
    const firstAngle = getAngle(0);
    doc.moveTo(
      cx + (firstScore / 100) * r * Math.cos(firstAngle),
      cy + (firstScore / 100) * r * Math.sin(firstAngle)
    );
    for (let i = 1; i < numAxes; i++) {
      const score = stablePillars[i]?.weightedScore ?? 0;
      const angle = getAngle(i);
      doc.lineTo(
        cx + (score / 100) * r * Math.cos(angle),
        cy + (score / 100) * r * Math.sin(angle)
      );
    }
    doc.closePath();
    doc.fillColor('#FCD34D', 0.35).fillAndStroke(companyColor);
  }
  doc.restore();
};

// ============================================================
// EXECUTIVE SUMMARY PAGE (PAGE 2)
// ============================================================
const drawExecutiveSummaryPage = (
  doc: PDFKit.PDFDocument,
  result: ScoringResultPayload,
  businessName: string,
  date: string
) => {
  drawHeader(doc, businessName, date);

  // Centered Dial Gauge - Bold, Big and spaced away from header
  const dialY = 120;
  const centerScoreX = PAGE_MARGIN + COLORS.pageWidth / 2;
  const radius = 70; // Larger radius for a bold circular design
  const ringW = 16;  // Wider ring width for a thick gauge
  
  drawDonutGauge(doc, centerScoreX, dialY + 75, radius, result.totalScore, result.colorBand, '', ringW);

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('COMPOSITE HEALTH SCORE', PAGE_MARGIN, dialY + 160, {
      width: COLORS.pageWidth,
      align: 'center',
      characterSpacing: 1.5,
    });

  // Score Status title
  const colors = bandColors(result.colorBand);
  let statusTitle = 'Reactive State';
  if (result.colorBand === 'GREEN') statusTitle = result.totalScore >= 91 ? 'Future-Proofed' : 'Structurally Sound';
  else if (result.colorBand === 'AMBER') statusTitle = 'Foundational / Vulnerable';

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor(colors.text)
    .text(statusTitle, PAGE_MARGIN, dialY + 176, {
      width: COLORS.pageWidth,
      align: 'center',
    });

  // Narrative Paragraph
  doc
    .fontSize(9.5)
    .font('Helvetica')
    .fillColor(COLORS.bodyText)
    .text(
      `"${getExecutiveNarrative(result.totalScore, result.colorBand)}"`,
      PAGE_MARGIN + 30,
      dialY + 200,
      {
        width: COLORS.pageWidth - 60,
        align: 'center',
        lineGap: 2.5,
      }
    );

  // Three columns layout (Moved down to provide more space)
  const colY = 415;
  const colW = 158;
  const colGap = 20;

  // --- COLUMN 1: STRUCTURAL STRENGTHS ---
  const sx = PAGE_MARGIN;
  roundedRect(doc, sx, colY, colW, 230, 6, COLORS.lightGrey, COLORS.borderGrey);
  roundedRect(doc, sx, colY, 3, 230, 2, COLORS.greenBorder);
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.green)
    .text('STRUCTURAL STRENGTHS', sx + 12, colY + 12, { characterSpacing: 0.5 });

  const strengths = result.pillarScores.filter((p) => p.weightedScore >= 70);
  if (strengths.length === 0) {
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(COLORS.mutedText)
      .text(
        'No organizational pillars are currently operating above the 70% efficiency threshold.',
        sx + 12,
        colY + 35,
        { width: colW - 24, lineGap: 2 }
      );
  } else {
    let cursorY = colY + 32;
    for (const pillar of strengths.slice(0, 3)) {
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor(COLORS.primary)
        .text(`${pillar.pillarName}`, sx + 12, cursorY, { width: colW - 24, ellipsis: true });
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(COLORS.green)
        .text(`${Math.round(pillar.weightedScore)}%`, sx + colW - 40, cursorY, { align: 'right', width: 28 });
      
      cursorY += 12;
      roundedRect(doc, sx + 12, cursorY, colW - 24, 4, 2, COLORS.borderGrey);
      roundedRect(doc, sx + 12, cursorY, (colW - 24) * (pillar.weightedScore / 100), 4, 2, COLORS.greenBorder);

      const obs = pillar.findings[0]?.observation ?? 'Optimal structure verified.';
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor(COLORS.mutedText)
        .text(obs, sx + 12, cursorY + 8, { width: colW - 24, height: 32, ellipsis: true, lineGap: 1 });

      cursorY += 46;
    }
  }

  // --- COLUMN 2: STRUCTURAL RISKS ---
  const rx = sx + colW + colGap;
  roundedRect(doc, rx, colY, colW, 230, 6, COLORS.lightGrey, COLORS.borderGrey);
  roundedRect(doc, rx, colY, 3, 230, 2, COLORS.redBorder);
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.red)
    .text('STRUCTURAL RISKS', rx + 12, colY + 12, { characterSpacing: 0.5 });

  const risks = result.pillarScores.filter((p) => p.weightedScore <= 40);
  if (risks.length === 0) {
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(COLORS.mutedText)
      .text(
        'No organizational pillars are currently operating below the 40% criticality threshold.',
        rx + 12,
        colY + 35,
        { width: colW - 24, lineGap: 2 }
      );
  } else {
    let cursorY = colY + 32;
    for (const pillar of risks.slice(0, 3)) {
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor(COLORS.primary)
        .text(`${pillar.pillarName}`, rx + 12, cursorY, { width: colW - 24, ellipsis: true });
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(COLORS.red)
        .text(`${Math.round(pillar.weightedScore)}%`, rx + colW - 40, cursorY, { align: 'right', width: 28 });
      
      cursorY += 12;
      roundedRect(doc, rx + 12, cursorY, colW - 24, 4, 2, COLORS.borderGrey);
      roundedRect(doc, rx + 12, cursorY, (colW - 24) * (pillar.weightedScore / 100), 4, 2, COLORS.redBorder);

      const obs = pillar.findings[0]?.observation ?? 'Urgent attention required.';
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor(COLORS.mutedText)
        .text(obs, rx + 12, cursorY + 8, { width: colW - 24, height: 32, ellipsis: true, lineGap: 1 });

      cursorY += 46;
    }
  }

  // --- COLUMN 3: PERFORMANCE COMPARISON ---
  const col3X = rx + colW + colGap;
  roundedRect(doc, col3X, colY, colW, 230, 6, COLORS.white, COLORS.borderGrey);
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('PERFORMANCE COMPARISON', col3X + 10, colY + 12, { characterSpacing: 0.5 });

  const radarCx = col3X + colW / 2;
  const radarCy = colY + 115;
  const benchmarks = [70, 65, 60, 70, 65, 60, 55];
  drawRadarChart(doc, radarCx, radarCy, 45, result.pillarScores, benchmarks);

  // Legend under small radar chart
  doc.save();
  const legendY = colY + 190;
  doc.rect(col3X + 20, legendY, 8, 8).fillColor('#F59E0B').fill();
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.primary).text('YOUR COMPANY', col3X + 32, legendY + 1);
  
  doc.rect(col3X + 20, legendY + 15, 8, 8).fillColor('#EF4444').fill();
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.primary).text('INDUSTRY STANDARD', col3X + 32, legendY + 16);
  doc.restore();

  // --- BOTTOM KNOCKOUT SYSTEM CARD (Y = 660, fitting within the bottom boundary) ---
  if (result.hasAnyKnockout) {
    const koY = 660;
    roundedRect(doc, PAGE_MARGIN, koY, COLORS.pageWidth, 120, 8, COLORS.redBg, COLORS.redBorder);

    drawShieldIcon(doc, PAGE_MARGIN + 16, koY + 12, 16, COLORS.red);
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(COLORS.red)
      .text('High-Priority Knockout Risks', PAGE_MARGIN + 38, koY + 12);
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(COLORS.mutedText)
      .text('Critical vulnerabilities requiring immediate remedial action.', PAGE_MARGIN + 38, koY + 26);

    const knockoutPillars = result.pillarScores.filter((p) => p.hasKnockout);
    const koW = (COLORS.pageWidth - 32 - (knockoutPillars.length - 1) * 12) / Math.max(1, knockoutPillars.length);
    
    let koCx = PAGE_MARGIN + 16;
    for (const pillar of knockoutPillars.slice(0, 3)) {
      roundedRect(doc, koCx, koY + 44, koW, 64, 4, COLORS.white, COLORS.borderGrey);
      roundedRect(doc, koCx, koY + 44, 3, 64, 2, COLORS.redBorder);

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(COLORS.primary)
        .text(`${pillar.pillarName}`, koCx + 10, koY + 50, { width: koW - 20, ellipsis: true });

      const detail = pillar.findings.find((f) => f.riskType === 'KNOCKOUT')?.observation ?? 'Kill-switch risk identified.';
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor(COLORS.mutedText)
        .text(detail, koCx + 10, koY + 62, { width: koW - 20, height: 26, ellipsis: true, lineGap: 1 });

      roundedRect(doc, koCx + 10, koY + 92, 55, 10, 2, COLORS.redBorder);
      doc
        .fontSize(6)
        .font('Helvetica-Bold')
        .fillColor(COLORS.white)
        .text('STATUS: CRITICAL', koCx + 10, koY + 94, { width: 55, align: 'center' });

      koCx += koW + 12;
    }
  }
};

// ============================================================
// PILLAR PAGES (PAGES 3–9)
// ============================================================
const drawPillarPage = (
  doc: PDFKit.PDFDocument,
  pillar: ScoringPillarPayload,
  businessName: string,
  date: string
) => {
  drawHeader(doc, businessName, date);

  const headY = doc.y;

  // Pillar code badge
  roundedRect(doc, PAGE_MARGIN, headY, 36, 24, 4, COLORS.primary);
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(COLORS.white)
    .text(pillar.pillarCode, PAGE_MARGIN, headY + 7, { width: 36, align: 'center' });

  // Pillar Name
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(pillar.pillarName, PAGE_MARGIN + 46, headY + 3);

  // Top Right Donut Gauge for Pillar Score (matching design 3.jpg)
  const scoreCx = PAGE_MARGIN + COLORS.pageWidth - 35;
  const scoreCy = headY + 10;
  const scoreRadius = 32;
  const scoreRingW = 6;
  drawDonutGauge(doc, scoreCx, scoreCy, scoreRadius, pillar.weightedScore, pillar.colorBand, 'Pillar Score', scoreRingW);

  doc.y = headY + 54;
  hr(doc, doc.y);
  doc.moveDown(0.8);

  // Middle section: Full-width Performance Analysis card (No right visual block)
  const midY = doc.y;
  const cardW = COLORS.pageWidth;
  const cardH = 114;
  const colors = bandColors(pillar.colorBand);
  const finalBg = pillar.hasKnockout ? COLORS.redBg : colors.bg;
  const finalBorder = pillar.hasKnockout ? COLORS.redBorder : colors.border;

  roundedRect(doc, PAGE_MARGIN, midY, cardW, cardH, 6, finalBg, finalBorder);
  roundedRect(doc, PAGE_MARGIN, midY, 4, cardH, 2, finalBorder);

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(pillar.hasKnockout ? COLORS.red : colors.text)
    .text('PERFORMANCE ANALYSIS', PAGE_MARGIN + 20, midY + 12, { align: 'center', width: cardW - 40 });

  // Dynamic recommendation based on actual user answer findings (matching 3.jpg request)
  const findingsToRender = pillar.allFindings && pillar.allFindings.length > 0 ? pillar.allFindings : pillar.findings;
  const highestScored = [...findingsToRender].sort((a, b) => b.score - a.score)[0];
  const recText = highestScored ? highestScored.recommendation : 'Leverage existing operational strengths to drive scaling.';
  
  const explanation = `Your ${pillar.pillarName.toLowerCase()} architecture is operating at a ${pillar.colorBand === 'GREEN' ? 'strong' : pillar.colorBand === 'AMBER' ? 'foundational' : 'reactive'} level. Recommendation: ${recText}`;

  // Centralized Text Inside Card
  doc
    .fontSize(9.5)
    .font('Helvetica')
    .fillColor(COLORS.bodyText)
    .text(explanation, PAGE_MARGIN + 20, midY + 28, {
      width: cardW - 40,
      align: 'center',
      lineGap: 2.2,
    });

  // Centered sub-criteria progress bars (side-by-side)
  const ratings = getPillarSubCriteria(pillar.pillarCode);
  const ratingVal1 = Math.round(pillar.weightedScore);
  const ratingVal2 = Math.round(Math.max(20, pillar.weightedScore - 8));

  const barW = 150;
  const barGap = 40;
  const totalW = barW * 2 + barGap;
  const startX = PAGE_MARGIN + (COLORS.pageWidth - totalW) / 2;

  // Rating 1
  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text(ratings[0].toUpperCase(), startX, midY + 70, { width: barW, align: 'center' });
  roundedRect(doc, startX, midY + 80, barW, 4, 2, COLORS.borderGrey);
  roundedRect(doc, startX, midY + 80, barW * (ratingVal1 / 100), 4, 2, finalBorder);

  // Rating 2
  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text(ratings[1].toUpperCase(), startX + barW + barGap, midY + 70, { width: barW, align: 'center' });
  roundedRect(doc, startX + barW + barGap, midY + 80, barW, 4, 2, COLORS.borderGrey);
  roundedRect(doc, startX + barW + barGap, midY + 80, barW * (ratingVal2 / 100), 4, 2, finalBorder);

  doc.y = midY + cardH + 16;

  // Observations Section Title
  drawSectionTitle(doc, 'Observations & Audit Summary');

  // Observations grid (up to 4 findings in 2x2 grid)
  if (findingsToRender.length === 0) {
    const emptyY = doc.y;
    roundedRect(doc, PAGE_MARGIN, emptyY, COLORS.pageWidth, 40, 6, COLORS.greenBg, COLORS.greenBorder);
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(COLORS.green)
      .text('No specific risks were flagged for this pillar.', PAGE_MARGIN + 16, emptyY + 15);
    doc.y = emptyY + 50;
  } else {
    const obsY = doc.y;
    const obsW = 248;
    const obsH = 92;

    for (let i = 0; i < Math.min(4, findingsToRender.length); i++) {
      const finding = findingsToRender[i];
      const row = Math.floor(i / 2);
      const col = i % 2;
      const ox = PAGE_MARGIN + col * (obsW + 19);
      const oy = obsY + row * (obsH + 10);

      const isKo = finding.riskType === 'KNOCKOUT';
      const isRisk = finding.riskType === 'RISK';
      const fColor = isKo ? COLORS.redBorder : isRisk ? COLORS.amberBorder : COLORS.greenBorder;
      const fBg = isKo ? COLORS.redBg : isRisk ? COLORS.amberBg : COLORS.greenBg;

      roundedRect(doc, ox, oy, obsW, obsH, 6, fBg, COLORS.borderGrey);
      roundedRect(doc, ox, oy, 3, obsH, 2, fColor);

      if (isKo || isRisk) {
        drawWarningIcon(doc, ox + 10, oy + 10, 12, fColor);
      } else {
        drawCheckIcon(doc, ox + 10, oy + 10, 12);
      }

      // Title
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor(COLORS.primary)
        .text(finding.questionText, ox + 26, oy + 9, { width: obsW - 36, height: 24, ellipsis: true, lineGap: 1 });

      // Observation text
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor(COLORS.bodyText)
        .text(finding.observation, ox + 10, oy + 38, { width: obsW - 20, height: 46, ellipsis: true, lineGap: 1.2 });
    }
    doc.y = obsY + (Math.ceil(Math.min(4, findingsToRender.length) / 2)) * (obsH + 10) + 10;
  }

  // Strategic Road Map at the bottom
  const mapY = doc.y;
  roundedRect(doc, PAGE_MARGIN, mapY, COLORS.pageWidth, 125, 8, COLORS.lightGrey, COLORS.borderGrey);
  
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Strategic Road Map', PAGE_MARGIN + 16, mapY + 12);
  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text('Tailored action plan designed to mitigate organizational bottlenecks.', PAGE_MARGIN + 16, mapY + 24);

  const rx = PAGE_MARGIN + 16;
  const stepW = 230;
  const stepH = 34;
  const defaultSteps = getPillarDefaultSteps(pillar.pillarCode);

  for (let i = 0; i < 4; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const sx = rx + col * 250;
    const sy = mapY + 44 + row * 38;

    doc.save();
    doc.circle(sx + 8, sy + 12, 8).fillColor(COLORS.primary).fill();
    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor(COLORS.white)
      .text(`0${i + 1}`, sx + 4, sy + 8, { lineBreak: false });
    doc.restore();

    const recText = findingsToRender[i]?.recommendation ?? defaultSteps[i];
    const recTitle = extractFirstWords(recText, 4);

    doc
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .fillColor(COLORS.primary)
      .text(recTitle, sx + 22, sy + 2, { width: stepW - 25, ellipsis: true });

    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor(COLORS.mutedText)
      .text(recText, sx + 22, sy + 13, { width: stepW - 25, height: 18, ellipsis: true, lineGap: 1 });
  }
};

const getPillarSubCriteria = (code: string): string[] => {
  const map: Record<string, string[]> = {
    FL: ['Leadership Alignment', 'Succession Readiness'],
    FR: ['Capital Buffer', 'Cash Flow Velocity'],
    BM: ['Customer Concentration', 'Margin Stability'],
    OP: ['Operational Redundancy', 'Process Maturity'],
    MS: ['Marketing Velocity', 'CAC Efficiency'],
    GC: ['Regulatory Compliance', 'Internal Controls'],
    SS: ['Scale Capability', 'Execution Horizon'],
  };
  return map[code] ?? ['Sub-criteria A', 'Sub-criteria B'];
};

const getPillarDefaultSteps = (code: string): string[] => {
  const map: Record<string, string[]> = {
    FL: [
      "Establish formal advisory board structures",
      "Document founder decision authority matrix",
      "Implement performance review checklists",
      "Design executive key-person insurance"
    ],
    FR: [
      "Optimize corporate tax reserves",
      "Formalize contingency capital buffers",
      "Consolidate vendor credit terms",
      "Implement automated cash forecasting"
    ],
    BM: [
      "Diversify customer contract models",
      "Define key IP licensing terms",
      "Review pricing multipliers per tier",
      "Analyze variable costs margins"
    ],
    OP: [
      "Document standard operating systems",
      "Introduce critical cloud backups",
      "Audit automated migration steps",
      "Perform disaster recovery trial"
    ],
    MS: [
      "Refine onboarding nurturing flows",
      "Audit scripts for enterprise sales",
      "Setup tracking attribution metrics",
      "Formalize customer health scoring"
    ],
    GC: [
      "Conduct annual regulatory compliance review",
      "Document board resolutions flow",
      "Standardize employee NDA policies",
      "Train staff on data privacy guidelines"
    ],
    SS: [
      "Define clean quarterly strategic targets",
      "Audit addressable market segmentation",
      "Map out expansion target deadlines",
      "Align business unit leads on dashboard metrics"
    ]
  };
  return map[code] ?? [
    "Assess immediate mitigation plans",
    "Establish structured milestones",
    "Monitor progress weekly",
    "Engage external advisory specialists"
  ];
};

const extractFirstWords = (text: string, count: number): string => {
  if (!text) return '';
  const words = text.split(/\s+/);
  if (words.length <= count) return text;
  return words.slice(0, count).join(' ') + '...';
};

// ============================================================
// NEXT STEPS & STRATEGIC EVOLUTION PAGE (PAGE 10) - Beautiful Spacing
// ============================================================
const drawNextStepsPageCustom = (
  doc: PDFKit.PDFDocument,
  result: ScoringResultPayload,
  phase: Phase,
  businessName: string,
  date: string
) => {
  drawHeader(doc, businessName, date);
  drawSectionTitle(doc, 'Next Steps & Strategic Evolution');

  // Spaced layout matching 4.jpg
  const topY = 135;
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('You now have structural clarity (2A).', PAGE_MARGIN, topY)
    .text('Execution strength requires deeper testing (2B).', PAGE_MARGIN, topY + 24);

  doc
    .fontSize(9.5)
    .font('Helvetica')
    .fillColor(COLORS.bodyText)
    .text(
      "The initial 2A diagnostic has successfully mapped the architectural skeleton of your operations. While the foundational identification phase is complete, the bridge to sustainable growth is built through stress-testing these structures under high-load business scenarios.",
      PAGE_MARGIN,
      topY + 58,
      { width: 280, lineGap: 2.5 }
    );

  // Right card showing Projected Delta
  const dx = PAGE_MARGIN + 300;
  roundedRect(doc, dx, topY, 215, 100, 8, COLORS.primary);
  drawCheckIcon(doc, dx + 20, topY + 18, 24);
  doc
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text('EFFICIENCY DELTA', dx + 20, topY + 50, { characterSpacing: 1 });
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor(COLORS.white)
    .text('+32.4% Projected', dx + 20, topY + 66);

  // Upgrade Options section
  const opY = 265;
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Upgrade Options', PAGE_MARGIN, opY);

  const upgradeW = 248;
  const upgradeH = 135;

  // Card 1: Pillar-Specific Deep Dives
  const ux1 = PAGE_MARGIN;
  roundedRect(doc, ux1, opY + 16, upgradeW, upgradeH, 8, COLORS.white, COLORS.borderGrey);
  roundedRect(doc, ux1, opY + 16, 4, upgradeH, 2, COLORS.accent);
  drawShieldIcon(doc, ux1 + 16, opY + 30, 14, COLORS.accent);
  doc
    .fontSize(10.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Pillar-Specific Deep Dives', ux1 + 36, opY + 32);
  doc
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text(
      "A comprehensive and vertical audit of your highest-impact pillars to extract actionable operational optimization nodes.",
      ux1 + 16,
      opY + 52,
      { width: upgradeW - 32, lineGap: 1.8 }
    );

  const bulletList1 = ["Vertical Risk Mapping", "Operational Stress-Testing", "Performance Benchmarking"];
  let bulletY1 = opY + 94;
  for (const item of bulletList1) {
    drawCheckIcon(doc, ux1 + 16, bulletY1, 8);
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLORS.primary).text(item, ux1 + 28, bulletY1 + 1);
    bulletY1 += 12;
  }

  // Card 2: Targeted Intelligence
  const ux2 = PAGE_MARGIN + upgradeW + 19;
  roundedRect(doc, ux2, opY + 16, upgradeW, upgradeH, 8, COLORS.white, COLORS.borderGrey);
  roundedRect(doc, ux2, opY + 16, 4, upgradeH, 2, COLORS.accent);
  drawShieldIcon(doc, ux2 + 16, opY + 30, 14, COLORS.accent);
  doc
    .fontSize(10.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Targeted Intelligence', ux2 + 36, opY + 32);
  doc
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text(
      "Precision analysis of specific 'Red Zone' areas identified in 2A diagnostic to isolate variables causing drag.",
      ux2 + 16,
      opY + 52,
      { width: upgradeW - 32, lineGap: 1.8 }
    );

  const bulletList2 = ["Rapid Vulnerability Patching", "Efficiency Simulations", "Resource Allocation Modeling"];
  let bulletY2 = opY + 94;
  for (const item of bulletList2) {
    drawCheckIcon(doc, ux2 + 16, bulletY2, 8);
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(COLORS.primary).text(item, ux2 + 28, bulletY2 + 1);
    bulletY2 += 12;
  }

  // Strategic Support Section
  const ssY = opY + upgradeH + 45;
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Strategic Support', PAGE_MARGIN, ssY);

  const supportW = 158;
  const supportGap = 20;

  const supportData = [
    {
      title: 'Strategy Sessions',
      desc: 'Quarterly executive-level workshops designed to realign leadership with the evolving business landscape.'
    },
    {
      title: 'Advisory',
      desc: 'Continuous oversight and on-demand guidance from our senior analysts to navigate unforeseen market shifts.'
    },
    {
      title: 'Implementation Support',
      desc: 'Hands-on assistance from our project management office to ensure your strategic roadmap is executed flawlessly.'
    }
  ];

  for (let i = 0; i < 3; i++) {
    const sx = PAGE_MARGIN + i * (supportW + supportGap);
    roundedRect(doc, sx, ssY + 16, supportW, 120, 6, COLORS.lightGrey, COLORS.borderGrey);
    roundedRect(doc, sx, ssY + 16, 3, 120, 2, COLORS.primary);
    
    doc
      .fontSize(9.5)
      .font('Helvetica-Bold')
      .fillColor(COLORS.primary)
      .text(supportData[i].title, sx + 12, ssY + 28, { width: supportW - 24 });
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(COLORS.mutedText)
      .text(supportData[i].desc, sx + 12, ssY + 50, { width: supportW - 24, lineGap: 1.8 });
  }
};

// ============================================================
// LEGAL FRAMEWORK & METHODOLOGY PAGE (PAGE 11/12) - Balanced Spacing
// ============================================================
const drawLegalPage = (
  doc: PDFKit.PDFDocument,
  businessName: string,
  date: string
) => {
  drawHeader(doc, businessName, date);
  drawSectionTitle(doc, 'Legal Framework & IP Ownership');

  // Spaced out matching 5.jpg
  const topY = 120;
  doc
    .fontSize(9.5)
    .font('Helvetica')
    .fillColor(COLORS.bodyText)
    .text(
      "This diagnostic report, including all underlying logic, algorithmic structures, and the 'PICA' trademark, is the exclusive intellectual property of Beauvision Associates. Unauthorized reproduction, distribution, or reverse-engineering of the PICA methodology is strictly prohibited under international copyright and trade secret laws.",
      PAGE_MARGIN,
      topY,
      { width: COLORS.pageWidth, lineGap: 2.5 }
    );

  const warnY = 185;
  roundedRect(doc, PAGE_MARGIN, warnY, COLORS.pageWidth, 75, 6, COLORS.amberBg, COLORS.amberBorder);
  roundedRect(doc, PAGE_MARGIN, warnY, 4, 75, 2, COLORS.amberBorder);

  doc
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.amber)
    .text('NOTICE TO STAKEHOLDERS', PAGE_MARGIN + 16, warnY + 12);
  doc
    .fontSize(8.5)
    .font('Helvetica-Oblique')
    .fillColor(COLORS.primary)
    .text(
      "This report is produced based on data and inputs provided directly by the user or client organization. Beauvision Associates does not perform independent third-party verification of the underlying data provided. Consequently, this document does not constitute a formal financial audit, tax advice, or legal opinion.",
      PAGE_MARGIN + 16,
      warnY + 26,
      { width: COLORS.pageWidth - 32, lineGap: 2 }
    );

  doc.y = 285;
  drawSectionTitle(doc, 'PICA Diagnostic Methodology');

  const methY = doc.y + 10;
  // 7 Strategic Pillars list (small boxes)
  const pW = 68;
  const pGap = 6;
  const pNames = ["Operational Integrity", "Capital Efficiency", "Market Velocity", "Risk Resilience", "Product Synergy", "Talent Retention", "Legal Compliance"];
  
  for (let i = 0; i < 7; i++) {
    const px = PAGE_MARGIN + i * (pW + pGap);
    roundedRect(doc, px, methY, pW, 45, 4, COLORS.lightGrey, COLORS.borderGrey);
    doc
      .fontSize(6)
      .font('Helvetica-Bold')
      .fillColor(COLORS.mutedText)
      .text(`PILLAR 0${i + 1}`, px + 6, methY + 6);
    doc
      .fontSize(6.5)
      .font('Helvetica-Bold')
      .fillColor(COLORS.primary)
      .text(pNames[i], px + 6, methY + 16, { width: pW - 12, lineGap: 1 });
  }

  // Weighted Scoring vs Knockout Logic (Spaced)
  const colY = methY + 70;
  const colW = 248;

  // Col 1: Weighted Scoring
  roundedRect(doc, PAGE_MARGIN, colY, colW, 140, 6, COLORS.white, COLORS.borderGrey);
  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Weighted Scoring System', PAGE_MARGIN + 14, colY + 12);
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text(
      "Our algorithm does not treat all data points equally. Each pillar is weighted proportionally based on industry volatility and relative impact on overall company valuations.",
      PAGE_MARGIN + 14,
      colY + 26,
      { width: colW - 28, lineGap: 1.5 }
    );

  const tiers = [
    { name: "Tier 1: STRONG", color: COLORS.greenBorder },
    { name: "Tier 2: EMERGING", color: '#3B82F6' },
    { name: "Tier 3: WEAK", color: COLORS.amberBorder },
    { name: "Tier 4: CRITICAL", color: COLORS.redBorder }
  ];
  let ty = colY + 74;
  for (const t of tiers) {
    doc.save();
    doc.rect(PAGE_MARGIN + 14, ty, 25, 6).fillColor(t.color).fill();
    doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.primary).text(t.name, PAGE_MARGIN + 45, ty - 1);
    doc.restore();
    ty += 14;
  }

  // Col 2: Knockout Logic
  roundedRect(doc, PAGE_MARGIN + colW + 19, colY, colW, 140, 6, COLORS.white, COLORS.borderGrey);
  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Knockout Logic (Risk Priority)', PAGE_MARGIN + colW + 33, colY + 12);
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text(
      "The PICA engine utilizes a Critical Safety Override. If a specific compliance, insolvency, or security risk is identified, the overall pillar and potentially the enterprise score will be marked as 'Knocked Out' regardless of other strengths.",
      PAGE_MARGIN + colW + 33,
      colY + 26,
      { width: colW - 28, lineGap: 1.5 }
    );

  roundedRect(doc, PAGE_MARGIN + colW + 33, colY + 84, colW - 28, 42, 4, COLORS.redBg, COLORS.redBorder);
  drawWarningIcon(doc, PAGE_MARGIN + colW + 43, colY + 92, 12, COLORS.red);
  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.red)
    .text('Safety Mechanism', PAGE_MARGIN + colW + 60, colY + 92);
  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor(COLORS.bodyText)
    .text('Prevents high performance in secondary business units from masking terminal baseline vulnerabilities.', PAGE_MARGIN + colW + 60, colY + 104, { width: colW - 60, lineGap: 1 });
};

// ============================================================
// VISUALIZATION PAGE / ANNEX (PAGE 13) - Premium Spacing & Detail
// ============================================================
const drawVisualizationPage = (
  doc: PDFKit.PDFDocument,
  result: ScoringResultPayload,
  businessName: string,
  date: string
) => {
  drawHeader(doc, businessName, date);
  drawSectionTitle(doc, 'PICA Diagnostic Visualization');

  // Executive Performance Summary
  const topY = 120;
  roundedRect(doc, PAGE_MARGIN, topY, COLORS.pageWidth, 75, 6, COLORS.lightGrey, COLORS.borderGrey);
  roundedRect(doc, PAGE_MARGIN, topY, 4, 75, 2, '#3B82F6');

  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('EXECUTIVE PERFORMANCE SUMMARY', PAGE_MARGIN + 16, topY + 12);
  doc
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor(COLORS.bodyText)
    .text(
      "The spider graph below maps your company profile against global sector benchmarks across the 7 strategic dimensions. The area of divergence represents the structural gap in execution velocity that must be optimized.",
      PAGE_MARGIN + 16,
      topY + 26,
      { width: COLORS.pageWidth - 32, lineGap: 2.2 }
    );

  // Large Spider Graph - Spaced & Bold
  const graphCx = PAGE_MARGIN + COLORS.pageWidth / 2;
  const graphCy = topY + 230;
  const benchmarks = [70, 65, 60, 70, 65, 60, 55];
  drawRadarChart(doc, graphCx, graphCy, 95, result.pillarScores, benchmarks);

  // Big Radar Legend
  doc.save();
  const legX = PAGE_MARGIN + 30;
  const legY = topY + 345;
  doc.rect(legX, legY, 10, 10).fillColor('#F59E0B').fill();
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary).text('YOUR COMPANY PROFILE', legX + 16, legY + 1);
  
  doc.rect(legX + 220, legY, 10, 10).fillColor('#EF4444').fill();
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary).text('INDUSTRY STANDARD BASELINE', legX + 236, legY + 1);
  doc.restore();

  // Gap Analysis Logic Cards
  const gapY = topY + 380;
  const cardW = 158;
  const cardGap = 20;

  const gapData = [
    {
      title: 'Competitive Advantage',
      desc: 'Areas where the yellow company profile extends beyond the red benchmark boundary. Represents market leadership.',
      color: COLORS.greenBorder,
      bg: COLORS.greenBg
    },
    {
      title: 'Market Parity',
      desc: 'Overlapping paths representing operational compliance but lacking unique competitive velocity.',
      color: '#3B82F6',
      bg: '#EFF6FF'
    },
    {
      title: 'Operational Deficit',
      desc: 'Critical gaps where the company profile drops inside the red baseline. Primary friction points requiring focus.',
      color: COLORS.redBorder,
      bg: COLORS.redBg
    }
  ];

  for (let i = 0; i < 3; i++) {
    const gx = PAGE_MARGIN + i * (cardW + cardGap);
    roundedRect(doc, gx, gapY, cardW, 110, 6, gapData[i].bg, COLORS.borderGrey);
    roundedRect(doc, gx, gapY, 3, 110, 2, gapData[i].color);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(COLORS.primary)
      .text(gapData[i].title, gx + 12, gapY + 12, { width: cardW - 24 });
    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor(COLORS.mutedText)
      .text(gapData[i].desc, gx + 12, gapY + 30, { width: cardW - 24, lineGap: 1.5 });
  }

  // Analyst Signature Block at bottom right (matching design 6.jpg)
  const sigX = PAGE_MARGIN + COLORS.pageWidth - 140;
  const sigY = gapY + 125;
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('ANALYST SIGNATURE', sigX, sigY, { characterSpacing: 1 });
  
  doc
    .fontSize(14)
    .font('Helvetica-Oblique')
    .fillColor('#1E3A8A')
    .text('R. Beauvision', sigX, sigY + 10);
};

const drawSectionTitle = (doc: PDFKit.PDFDocument, title: string) => {
  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text(title.toUpperCase(), PAGE_MARGIN, doc.y, { characterSpacing: 1.5 })
    .moveDown(0.3);

  hr(doc, doc.y, COLORS.accent);
  doc.moveDown(0.6);
};

const drawDonutGauge = (
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  radius: number,
  score: number,
  band: string,
  caption: string,
  customRingW?: number
) => {
  const colors = bandColors(band);
  const ringW = customRingW ?? Math.max(8, radius * 0.20);
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const full = Math.PI * 2;

  // Track ring (full circle).
  strokeArc(doc, cx, cy, radius, 0, full - 0.0001, ringW, COLORS.borderGrey);
  // Progress arc
  if (pct > 0) {
    strokeArc(doc, cx, cy, radius, 0, full * pct, ringW, colors.border);
  }

  // Centered score
  doc.font('Helvetica-Bold').fontSize(radius * 0.58).fillColor(colors.text);
  const numText = `${Math.round(score)}`;
  const numW = doc.widthOfString(numText);
  const numH = doc.currentLineHeight();
  doc.text(numText, cx - numW / 2, cy - numH / 2 - radius * 0.06, { lineBreak: false });

  // /100 caption or inner caption
  doc.font('Helvetica').fontSize(radius * 0.2).fillColor(COLORS.mutedText);
  const subText = '/ 100';
  const subW = doc.widthOfString(subText);
  doc.text(subText, cx - subW / 2, cy + radius * 0.22, { lineBreak: false });

  if (caption) {
    doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.mutedText);
    doc.text(caption.toUpperCase(), cx - radius, cy + radius + 8, {
      width: radius * 2,
      align: 'center',
      characterSpacing: 0.5,
      lineBreak: false,
    });
  }
};

const strokeArc = (
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  width: number,
  color: string
) => {
  const total = endAngle - startAngle;
  if (total <= 0) return;
  const segments = Math.ceil(total / (Math.PI / 2));
  const step = total / segments;
  const pt = (a: number) => ({
    x: cx + radius * Math.sin(a),
    y: cy - radius * Math.cos(a),
  });

  doc.save().lineWidth(width).strokeColor(color).lineCap('round');
  let a0 = startAngle;
  const start = pt(a0);
  doc.moveTo(start.x, start.y);
  for (let i = 0; i < segments; i++) {
    const a1 = a0 + step;
    const k = (4 / 3) * Math.tan(step / 4) * radius;
    const p0 = pt(a0);
    const p1 = pt(a1);
    const t0 = { x: Math.cos(a0), y: Math.sin(a0) };
    const t1 = { x: Math.cos(a1), y: Math.sin(a1) };
    doc.bezierCurveTo(
      p0.x + k * t0.x,
      p0.y + k * t0.y,
      p1.x - k * t1.x,
      p1.y - k * t1.y,
      p1.x,
      p1.y
    );
    a0 = a1;
  }
  doc.stroke().restore();
};

// ============================================================
// MAIN EXPORT
// ============================================================
export async function generateReportPDF(
  result: ScoringResultPayload,
  businessName: string,
  phase: Phase = Phase.PHASE1,
  metadata?: {
    businessSize?: string | null;
    sessionId?: string;
    completedAt?: Date | null;
  }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: PAGE_MARGIN,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `PICA Business Health Report — ${businessName}`,
        Author: 'Beauvision Associates Ltd',
        Subject: `PICA ${phaseLabel(phase)}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const targetDate = metadata?.completedAt ? new Date(metadata.completedAt) : new Date();
    const dateStr = targetDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const isSinglePillar = phase === Phase.PHASE2B;

    // --- Page 1: Cover ---
    drawCoverPage(doc, businessName, phase, dateStr, metadata);

    // --- Page 2: Executive Summary (only for full scan) ---
    if (!isSinglePillar) {
      doc.addPage();
      drawExecutiveSummaryPage(doc, result, businessName, dateStr);
    }

    // --- Pages 3-9: The 7 Pillars ---
    // Sorted by worst performing first to prioritize critical areas
    const sortedWorstFirst = [...result.pillarScores].sort((a, b) => {
      const order = { RED: 0, AMBER: 1, GREEN: 2 };
      return (
        (order[a.colorBand as keyof typeof order] ?? 0) -
        (order[b.colorBand as keyof typeof order] ?? 0)
      );
    });

    for (const pillar of sortedWorstFirst) {
      doc.addPage();
      drawPillarPage(doc, pillar, businessName, dateStr);
    }

    // --- Page 10: Next Steps ---
    doc.addPage();
    drawNextStepsPageCustom(doc, result, phase, businessName, dateStr);

    // --- Pages 11-12: Legal & Visualization (only for full scan) ---
    if (!isSinglePillar) {
      doc.addPage();
      drawLegalPage(doc, businessName, dateStr);

      doc.addPage();
      drawVisualizationPage(doc, result, businessName, dateStr);
    }

    // Apply Footers to all pages except Cover Page
    const range = doc.bufferedPageRange();
    for (let i = range.start + 1; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawFooter(doc, businessName, metadata?.sessionId);
    }

    doc.end();
  });
}
