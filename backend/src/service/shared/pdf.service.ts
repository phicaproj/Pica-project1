import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Phase } from '@prisma/client';
import type {
  ScoringResultPayload,
  ScoringPillarPayload,
  ScoringFinding,
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
const COVER_PATH = path.join(process.cwd(), 'assets', 'cover.png');
const COVER_BUFFER: Buffer | null = (() => {
  try {
    return fs.readFileSync(COVER_PATH);
  } catch {
    try {
      return fs.readFileSync(path.join(process.cwd(), '..', 'PDF report design', 'Cover page image.png'));
    } catch {
      return null;
    }
  }
})();

// Pillar page image for right visual block
const PILLAR_IMG_PATH = path.join(process.cwd(), 'assets', 'pillarPage-image.png');
const PILLAR_IMG_BUFFER: Buffer | null = (() => {
  try {
    return fs.readFileSync(PILLAR_IMG_PATH);
  } catch {
    return null;
  }
})();

// Next Steps building image
const BUILDING_IMG_PATH = path.join(process.cwd(), 'assets', 'building-image.png');
const BUILDING_IMG_BUFFER: Buffer | null = (() => {
  try {
    return fs.readFileSync(BUILDING_IMG_PATH);
  } catch {
    return null;
  }
})();

// Phase → human label shown on the cover + summary header.
const phaseLabel = (phase: Phase): string => {
  if (phase === Phase.PHASE2A) return 'PICA Level 2A – Structured Diagnosis';
  if (phase === Phase.PHASE2B) return 'PICA Level 2B – Deep Dive';
  return 'PICA Level 1 – Snapshot Assessment';
};

const getPdfBandDetails = (score: number, hasKnockout: boolean) => {
  if (hasKnockout) {
    return {
      text: COLORS.red,
      bg: COLORS.redBg,
      border: COLORS.redBorder,
      label: 'REACTIVE (OVERRIDDEN)',
      interpretation: 'This pillar has failed critical compliance or safety criteria.',
      emoji: '✕'
    };
  }
  if (score >= 91) {
    return {
      text: COLORS.green,
      bg: COLORS.greenBg,
      border: COLORS.greenBorder,
      label: 'FUTURE-PROOFED',
      interpretation: 'This pillar is performing at a leading level with standard-setting resilience.',
      emoji: '✓'
    };
  }
  if (score >= 71) {
    return {
      text: '#15803D', // green-700
      bg: '#F0FDF4', // green-50
      border: '#22C55E', // green-500
      label: 'STRUCTURALLY SOUND',
      interpretation: 'This pillar is performing well with no critical risks flagged.',
      emoji: '✓'
    };
  }
  if (score >= 51) {
    return {
      text: '#854D0E', // yellow-800
      bg: '#FEF9C3', // yellow-50
      border: '#EAB308', // yellow-500
      label: 'OPERATIONALLY SOUND',
      interpretation: 'This pillar is functional but has minor bottlenecks worth addressing.',
      emoji: '!'
    };
  }
  if (score >= 31) {
    return {
      text: '#B45309', // amber-700
      bg: '#FFFBEB', // amber-50
      border: '#F59E0B', // amber-500
      label: 'FOUNDATIONAL',
      interpretation: 'This pillar is functional but has moderate risks worth addressing.',
      emoji: '!'
    };
  }
  return {
    text: COLORS.red,
    bg: COLORS.redBg,
    border: COLORS.redBorder,
    label: 'REACTIVE',
    interpretation: 'This pillar shows critical gaps that need immediate attention.',
    emoji: '✕'
  };
};

const getExecutiveNarrativeDetails = (score: number, hasKnockout: boolean) => {
  if (hasKnockout) {
    return {
      title: 'Reactive State',
      desc: "Your organization is currently operating in a Reactive state. Gaps in critical compliance, financial controls, or structural redundancy represent high-risk exposure. Immediate remediation of highlighted risk factors is required to prevent operational disruption."
    };
  }
  if (score >= 91) {
    return {
      title: 'Future-Proofed',
      desc: "Your business is Future-Proofed and scale-ready. You have built a highly adaptive operational architecture that matches global benchmarks, minimizing friction and enabling aggressive market expansion with high resilience."
    };
  }
  if (score >= 71) {
    return {
      title: 'Structurally Sound',
      desc: "You have built a solid and defensible business architecture. The core 'skeleton' of the organization is strong, with established systems and clear governance. While there are minor operational refinements needed to reach peak efficiency, your business demonstrates the stability required to support sustainable growth and handle increased institutional scrutiny."
    };
  }
  if (score >= 51) {
    return {
      title: 'Operationally Sound / Stabilizing',
      desc: "Your business is Operationally Sound and stabilizing. While key systems are functional, minor bottlenecks in efficiency and operational process maturity require stabilization to ensure consistent growth and scalability."
    };
  }
  if (score >= 31) {
    return {
      title: 'Foundational / Vulnerable',
      desc: "Your business is Foundational but structurally vulnerable in key areas. While core transaction processing is functional, key operational bottlenecks and governance gaps limit scalability and increase dependency on key individuals."
    };
  }
  return {
    title: 'Reactive State',
    desc: "Your organization is currently operating in a Reactive state. Gaps in critical compliance, financial controls, or structural redundancy represent high-risk exposure. Immediate remediation of highlighted risk factors is required to prevent operational disruption."
  };
};

// Vector icons used in design matching mockups
const drawBuildingIcon = (doc: PDFKit.PDFDocument, x: number, y: number, size: number, color = '#9CA3AF') => {
  doc.save();
  doc.translate(x, y);
  doc.scale(size / 16);
  doc.fillColor(color).rect(2, 2, 12, 12).fill();
  doc.fillColor('#FFFFFF');
  doc.rect(4, 4, 2, 2).fill();
  doc.rect(10, 4, 2, 2).fill();
  doc.rect(4, 8, 2, 2).fill();
  doc.rect(10, 8, 2, 2).fill();
  doc.restore();
};

const drawDraftingCompassIcon = (doc: PDFKit.PDFDocument, x: number, y: number, size: number) => {
  doc.save();
  doc.translate(x, y);
  doc.scale(size / 16);
  doc.lineWidth(1.2).strokeColor('#1D4ED8');
  doc.circle(8, 3, 1.5).stroke();
  doc.moveTo(8, 4.5).lineTo(4, 13).stroke();
  doc.moveTo(8, 4.5).lineTo(12, 13).stroke();
  doc.moveTo(6, 9).lineTo(10, 9).stroke();
  doc.restore();
};

const drawRobotArmIcon = (doc: PDFKit.PDFDocument, x: number, y: number, size: number) => {
  doc.save();
  doc.translate(x, y);
  doc.scale(size / 16);
  doc.lineWidth(1.2).strokeColor('#EA6C0A');
  doc.moveTo(2, 14).lineTo(14, 14).stroke();
  doc.moveTo(4, 14).lineTo(6, 6).lineTo(11, 4).lineTo(14, 6).stroke();
  doc.circle(11, 4, 1).fill();
  doc.restore();
};

const drawTargetIcon = (doc: PDFKit.PDFDocument, x: number, y: number, size: number) => {
  doc.save();
  doc.translate(x, y);
  doc.scale(size / 16);
  doc.lineWidth(1.2).strokeColor('#EA6C0A');
  doc.circle(8, 8, 5).stroke();
  doc.circle(8, 8, 1.5).fill();
  doc.restore();
};

const drawPeopleIcon = (doc: PDFKit.PDFDocument, x: number, y: number, size: number) => {
  doc.save();
  doc.translate(x, y);
  doc.scale(size / 16);
  doc.fillColor('#059669');
  doc.circle(8, 5, 2.5).fill();
  doc.moveTo(4, 13).quadraticCurveTo(8, 9, 12, 13).closePath().fill();
  doc.restore();
};

const drawToolsIcon = (doc: PDFKit.PDFDocument, x: number, y: number, size: number) => {
  doc.save();
  doc.translate(x, y);
  doc.scale(size / 16);
  doc.lineWidth(1.2).strokeColor('#059669');
  doc.moveTo(3, 13).lineTo(13, 3).stroke();
  doc.moveTo(11, 3).lineTo(13, 3).lineTo(13, 5).stroke();
  doc.moveTo(3, 11).lineTo(3, 13).lineTo(5, 13).stroke();
  doc.restore();
};

const drawCheckboxListWatermark = (doc: PDFKit.PDFDocument, x: number, y: number, size: number) => {
  doc.save();
  doc.translate(x, y);
  doc.scale(size / 32);
  doc.lineWidth(1.5).strokeColor('#E5E7EB');
  doc.rect(2, 2, 8, 8).stroke();
  doc.moveTo(4, 6).lineTo(6, 8).lineTo(8, 4).stroke();
  doc.moveTo(14, 6).lineTo(28, 6).stroke();
  doc.rect(2, 14, 8, 8).stroke();
  doc.moveTo(4, 18).lineTo(6, 20).lineTo(8, 16).stroke();
  doc.moveTo(14, 18).lineTo(28, 18).stroke();
  doc.rect(2, 26, 8, 8).stroke();
  doc.moveTo(4, 30).lineTo(6, 32).lineTo(8, 28).stroke();
  doc.moveTo(14, 30).lineTo(28, 30).stroke();
  doc.restore();
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
  fillColor?: string,
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

  if (fillColor && strokeColor) {
    doc.fillAndStroke(fillColor, strokeColor);
  } else if (fillColor) {
    doc.fill(fillColor);
  } else if (strokeColor) {
    doc.strokeColor(strokeColor).stroke();
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
const drawHeader = (doc: PDFKit.PDFDocument, businessName: string, date: string, options?: { isKnockout?: boolean }) => {
  // Mini Header band
  const headerLineY = 50;

  if (options?.isKnockout) {
    // Fill the header background in Signal Red (Red Alert)
    doc.rect(0, 0, doc.page.width, headerLineY).fill('#DC2626'); // red-600
    
    // Draw white text inside it: "CRITICAL SURVIVAL ALERT"
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(COLORS.white)
      .text('CRITICAL SURVIVAL ALERT — ACTION REQUIRED IMMEDIATELY', 0, 19, { align: 'center', width: doc.page.width });
      
    // Divider line is white
    doc
      .save()
      .moveTo(PAGE_MARGIN, headerLineY)
      .lineTo(PAGE_MARGIN + COLORS.pageWidth, headerLineY)
      .lineWidth(0.5)
      .strokeColor(COLORS.white)
      .stroke()
      .restore();
      
    doc.y = headerLineY + 15;
    return;
  }

  // Draw clean minimalist white header
  let logoX = PAGE_MARGIN;
  let textX = logoX;
  if (LOGO_BUFFER) {
    try {
      doc.image(LOGO_BUFFER, logoX, 15, { height: 20 });
      textX = logoX + 28;
    } catch {}
  }

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('BEAUVISION ASSOCIATES', textX, 16, { lineBreak: false });
  doc
    .fontSize(6)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('PROPRIETARY BUSINESS INTELLIGENCE', textX, 28, { lineBreak: false });

  // Right: PICA Seal / Mark
  const rightX = PAGE_MARGIN + COLORS.pageWidth;
  const sealW = 120;
  const sealX = rightX - sealW;
  
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('PICA PRODUCT SEAL', sealX, 20, { align: 'right', width: sealW - 16, lineBreak: false });

  drawCheckIcon(doc, rightX - 12, 17, 12);
  
  // Draw thin divider line
  doc
    .save()
    .moveTo(PAGE_MARGIN, headerLineY)
    .lineTo(PAGE_MARGIN + COLORS.pageWidth, headerLineY)
    .lineWidth(0.5)
    .strokeColor(COLORS.borderGrey)
    .stroke()
    .restore();

  doc.y = headerLineY + 15;
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
    .text('Assessment', PAGE_MARGIN, 165, {
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
  const cardH = 390; // Fills space below it but not nearing partner details

  if (COVER_BUFFER) {
    try {
      // No border card behind it, stretch cover.png to fill card dimensions exactly
      doc.image(COVER_BUFFER, PAGE_MARGIN, cardY, {
        width: COLORS.pageWidth,
        height: cardH
      });
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

  // Col 1: Strategic Partner (With icon box matching design 1.jpg)
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('STRATEGIC PARTNER', PAGE_MARGIN, gridY, { characterSpacing: 1 });
  
  const iconBoxSize = 28;
  roundedRect(doc, PAGE_MARGIN, gridY + 10, iconBoxSize, iconBoxSize, 4, '#F3F4F6', COLORS.borderGrey);
  drawBuildingIcon(doc, PAGE_MARGIN + 6, gridY + 16, 16);
  
  const textStartX = PAGE_MARGIN + iconBoxSize + 12;
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(businessName, textStartX, gridY + 10, { width: 145 });

  const pillY = Math.max(gridY + 28, doc.y + 4);
  const sizeText = metadata?.businessSize === 'SMALL' ? '● Small Business' : '● Medium Business';
  const pillW = 85;
  roundedRect(doc, textStartX, pillY, pillW, 14, 3, '#EEF2F6', '#E2E8F0');
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text(sizeText.toUpperCase(), textStartX + 4, pillY + 4, { width: pillW, align: 'center' });

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
  
  drawShieldIcon(doc, PAGE_MARGIN + 380, gridY + 52, 12, '#D97706'); // Gold color shield
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#D97706')
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
      const labelDist = r + 20; // Increased to avoid overlapping the chart lines
      const lx = cx + labelDist * Math.cos(angle);
      const ly = cy + labelDist * Math.sin(angle);

      doc.font('Helvetica-Bold').fontSize(6).fillColor(COLORS.primary);
      const codeText = pillar.pillarName.toUpperCase(); // Display full pillar names in uppercase

      let align: PDFKit.Mixins.TextOptions['align'] = 'center';
      let offsetX = -40;
      let offsetY = -4;

      if (Math.cos(angle) > 0.3) {
        align = 'left';
        offsetX = 8;
      } else if (Math.cos(angle) < -0.3) {
        align = 'right';
        offsetX = -88;
      }

      doc.text(codeText, lx + offsetX, ly + offsetY, { width: 80, align });
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

  // 5. Company Data Polygon (Yellow/Orange Translucent)
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
  // If there are knockouts, draw normal header, the page itself shows red messages
  drawHeader(doc, businessName, date);

  // Centered Dial Gauge - Bold, Big and spaced away from header
  const dialY = 120;
  const centerScoreX = PAGE_MARGIN + COLORS.pageWidth / 2;
  const radius = 70; // Larger radius for a bold circular design
  const ringW = 16;  // Wider ring width for a thick gauge
  
  const details = getPdfBandDetails(result.totalScore, result.hasAnyKnockout);
  const narDetails = getExecutiveNarrativeDetails(result.totalScore, result.hasAnyKnockout);

  drawDonutGauge(doc, centerScoreX, dialY + 75, radius, result.totalScore, details, '', ringW);

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('COMPOSITE HEALTH SCORE', PAGE_MARGIN, dialY + 160, {
      width: COLORS.pageWidth,
      align: 'center',
      characterSpacing: 1.5,
    });

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor(details.text)
    .text(narDetails.title, PAGE_MARGIN, dialY + 176, {
      width: COLORS.pageWidth,
      align: 'center',
    });

  // Narrative Paragraph / Knockout Message Override under the dial
  if (result.hasAnyKnockout) {
    doc
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .fillColor(COLORS.red)
      .text(
        "Critical risk has been identified and that is why your dial is in red. Your business has failed one or more Knockout Criteria. Regardless of your performance scores, these gaps represent 'Kill-Switch' risks that must be remediated immediately to ensure business continuity.",
        PAGE_MARGIN + 30,
        dialY + 200,
        {
          width: COLORS.pageWidth - 60,
          align: 'center',
          lineGap: 2.2,
        }
      );
  } else {
    doc
      .fontSize(9.5)
      .font('Helvetica')
      .fillColor(COLORS.bodyText)
      .text(
        `"${narDetails.desc}"`,
        PAGE_MARGIN + 30,
        dialY + 200,
        {
          width: COLORS.pageWidth - 60,
          align: 'center',
          lineGap: 2.5,
        }
      );
  }

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
        'Note: No observed structural strength. Current data indicates that all organizational pillars are operating below the 70% efficiency threshold, requiring immediate foundational intervention.',
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
        'Note: No observed structural risk. Current data indicates that all organizational pillars are operating above the 40% criticality threshold, suggesting a stable baseline for further optimization.',
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
  doc.rect(col3X + 10, legendY, 6, 6).fillColor('#F59E0B').fill();
  doc.fontSize(6).font('Helvetica-Bold').fillColor(COLORS.primary).text('YOUR COMPANY PROFILE', col3X + 20, legendY + 1);
  
  doc.rect(col3X + 10, legendY + 12, 6, 6).fillColor('#EF4444').fill();
  doc.fontSize(6).font('Helvetica-Bold').fillColor(COLORS.primary).text('INDUSTRY STANDARD BASELINE', col3X + 20, legendY + 13);
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
}

// ============================================================
const drawPillarPage = (
  doc: PDFKit.PDFDocument,
  pillar: ScoringPillarPayload,
  businessName: string,
  date: string,
  metadata?: { sessionId?: string }
) => {
  // If knockout is triggered, draw Red header and alert
  drawHeader(doc, businessName, date, { isKnockout: pillar.hasKnockout });

  const badgeY = 80;

  // Draw status pill based on score/knockout
  const isGreen = pillar.weightedScore >= 71 && !pillar.hasKnockout;
  const isAmber = pillar.weightedScore >= 41 && pillar.weightedScore < 71 && !pillar.hasKnockout;
  
  const badgeText = isGreen ? 'TOP STRENGTH' : isAmber ? 'STABILIZING' : 'CRITICAL UNDERPERFORMANCE';
  const badgeColor = isGreen ? COLORS.greenBorder : isAmber ? COLORS.amberBorder : COLORS.redBorder; // Solid color for fill
  const badgeW = doc.font('Helvetica-Bold').fontSize(6.5).widthOfString(badgeText) + 12; // Dynamic width with 6pt padding on left/right

  // Draw left check/warning square box with radius 3
  const statusBoxColor = isGreen ? COLORS.green : isAmber ? COLORS.amber : COLORS.red;
  roundedRect(doc, PAGE_MARGIN, badgeY - 1, 14, 14, 3, isGreen ? COLORS.greenBg : isAmber ? COLORS.amberBg : COLORS.redBg, statusBoxColor);
  drawShieldIcon(doc, PAGE_MARGIN + 2, badgeY + 2, 10, statusBoxColor);

  // Draw status pill (fill and stroke with the same badgeColor, radius = 6)
  roundedRect(doc, PAGE_MARGIN + 22, badgeY - 1, badgeW, 14, 6, badgeColor, badgeColor);
  
  // Draw white text, centered vertically and horizontally inside the status pill
  doc
    .fillColor(COLORS.white)
    .text(badgeText, PAGE_MARGIN + 22, badgeY + 3.5, { width: badgeW, align: 'center', lineBreak: false });

  // Draw Short Code badge to the right of the status pill
  const codeX = PAGE_MARGIN + 22 + badgeW + 8;
  roundedRect(doc, codeX, badgeY - 1, 24, 14, 3, COLORS.primary);
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(COLORS.white)
    .text(pillar.pillarCode, codeX, badgeY + 3.5, { width: 24, align: 'center', lineBreak: false });

  // Pillar Name (Under the badges and Bigger/High-Catching!)
  const nameY = badgeY + 20;
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(pillar.pillarName, PAGE_MARGIN, nameY);

  // Description text under the title
  const pillarDescriptions: Record<string, string> = {
    FL: "An evaluation of leadership continuity, key-person risk, and strategic management frameworks.",
    FR: "An institutional-grade evaluation of capital efficiency, reserve resilience, and fiscal governance models.",
    BM: "An analysis of revenue streams, customer concentration, pricing structures, and product market fit.",
    OP: "An audit of operational redundancy, system maturity, disaster recovery readiness, and process scaling.",
    MS: "An assessment of marketing execution, customer acquisition cost efficiency, and brand growth velocity.",
    GC: "An evaluation of regulatory compliance, board oversight, employee NDA policies, and data privacy frameworks.",
    SS: "An audit of scaling capability, quarterly strategic targets, addressable market mapping, and milestone execution."
  };
  const descText = pillarDescriptions[pillar.pillarCode] ?? "An in-depth diagnostic analysis of this operational architecture.";
  
  doc
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text(descText, PAGE_MARGIN, nameY + 25, { width: 360 });

  // Top Right Donut Gauge for Pillar Score (matching design 3.jpg)
  const scoreCx = PAGE_MARGIN + COLORS.pageWidth - 35;
  const scoreCy = badgeY + 22; // Centered vertically relative to header height
  const scoreRadius = 32;
  const scoreRingW = 6;
  
  const pDetails = getPdfBandDetails(pillar.weightedScore, pillar.hasKnockout);
  drawDonutGauge(doc, scoreCx, scoreCy, scoreRadius, pillar.weightedScore, pDetails, 'Pillar Score', scoreRingW);

  // SHIFTED DOWN: Divider line shifted to 152 to avoid touching score text/gauge
  doc.y = 152;
  hr(doc, doc.y);
  doc.moveDown(0.8);

  // Middle section: Performance Analysis card (left) + Data Source photo block (right)
  const midY = doc.y;
  const cardW = 315;
  const cardH = 140; // Increased card height to 140 to fit larger font size elegantly
  const gap = 15;
  const blockW = COLORS.pageWidth - cardW - gap; // 515 - 315 - 15 = 185
  const blockX = PAGE_MARGIN + cardW + gap; // 40 + 315 + 15 = 370

  // Performance Analysis card: clean light grey background with grey border, NO left colored stripe
  roundedRect(doc, PAGE_MARGIN, midY, cardW, cardH, 6, COLORS.lightGrey, COLORS.borderGrey);

  // Redesigned Performance Analysis text weight and character spacing
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(pillar.hasKnockout ? COLORS.red : pDetails.text)
    .text('PERFORMANCE ANALYSIS', PAGE_MARGIN + 16, midY + 12, { width: cardW - 32, characterSpacing: 1.2 });

  const findingsToRender = pillar.allFindings && pillar.allFindings.length > 0 ? pillar.allFindings : pillar.findings;
  
  // Sort findings to find the highest score and lowest score
  const highestScored = [...findingsToRender].sort((a, b) => b.score - a.score)[0];
  const recText = highestScored ? highestScored.recommendation : 'Leverage existing operational strengths to drive scaling.';
  
  // Shifted recommendation to the next line using a single newline (\n) without paragraphing
  const explanation = `Your ${pillar.pillarName.toLowerCase()} architecture is operating at a ${pillar.weightedScore >= 71 ? 'strong' : pillar.weightedScore >= 51 ? 'stable' : 'reactive'} level.\nRecommendation: ${recText}`;

  doc
    .fontSize(12) // Increased explanation text size to 12pt
    .font('Helvetica-Bold') // Bold font style
    .fillColor(COLORS.primary) // Elegant dark navy color matching the design
    .text(explanation, PAGE_MARGIN + 16, midY + 25, {
      width: cardW - 32,
      lineGap: 3.5,
    });

  // Sub-criteria progress bars inside the card (shifted down to prevent overlaps)
  const ratings = getPillarSubCriteria(pillar.pillarCode);
  const ratingVal1 = Math.round(pillar.weightedScore);
  const ratingVal2 = Math.round(Math.max(20, pillar.weightedScore - 8));

  const barW = 120;
  const barGap = 15;
  const startX = PAGE_MARGIN + 16;

  // Rating 1
  doc
    .fontSize(6)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text(ratings[0].toUpperCase(), startX, midY + 95, { width: barW });
  
  const rateText1 = isGreen ? 'SUPERIOR (TIER 1)' : isAmber ? 'STABILIZING' : 'REACTIVE';
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(rateText1, startX, midY + 103, { width: barW });
  
  // Segmented progress blocks
  const drawSegmentedProgress = (doc: PDFKit.PDFDocument, x: number, y: number, w: number, filledCount: number, color: string) => {
    const segW = (w - 6) / 3;
    for (let i = 0; i < 3; i++) {
      const segX = x + i * (segW + 3);
      const isFilled = i < filledCount;
      roundedRect(doc, segX, y, segW, 4, 1.5, isFilled ? color : COLORS.borderGrey);
    }
  };

  const getFilledSegments = (score: number) => {
    if (score >= 71) return 3;
    if (score >= 41) return 2;
    return 1;
  };

  drawSegmentedProgress(doc, startX, midY + 114, barW, getFilledSegments(ratingVal1), pDetails.border);

  // Rating 2
  doc
    .fontSize(6)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text(ratings[1].toUpperCase(), startX + barW + barGap, midY + 95, { width: barW });
  
  const rateText2 = isGreen ? 'OPTIMAL (UNLEVERAGED)' : isAmber ? 'STANDARD' : 'VULNERABLE';
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(rateText2, startX + barW + barGap, midY + 103, { width: barW });
  
  drawSegmentedProgress(doc, startX + barW + barGap, midY + 114, barW, getFilledSegments(ratingVal2), pDetails.border);

  // Draw Data Source block on the right (matching height 140)
  roundedRect(doc, blockX, midY, blockW, cardH, 6, COLORS.lightGrey, COLORS.borderGrey);
  
  const imgMargin = 6;
  const imgW = blockW - imgMargin * 2;
  const imgH = cardH - imgMargin * 2 - 20;
  
  if (PILLAR_IMG_BUFFER) {
    try {
      const imgX = blockX + imgMargin;
      const imgY = midY + imgMargin;
      doc.image(PILLAR_IMG_BUFFER, imgX, imgY, {
        width: imgW,
        height: imgH
      });
      // Add gradient overlay
      doc.save();
      const grad = doc.linearGradient(imgX, imgY, imgX, imgY + imgH);
      grad.stop(0, '#FFFFFF');
      grad.stop(1, COLORS.primary);
      doc.fillOpacity(0.3);
      doc.rect(imgX, imgY, imgW, imgH).fill(grad);
      doc.restore();

      // Draw border around image
      doc.save().lineWidth(0.5).strokeColor(COLORS.borderGrey);
      roundedRect(doc, imgX, imgY, imgW, imgH, 2, undefined, COLORS.borderGrey);
      doc.restore();
    } catch {}
  }
  
  // Data Source Caption below the image
  doc
    .fontSize(6)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text('DATA SOURCE', blockX + imgMargin, midY + cardH - 18, { lineBreak: false });

  const displayId = metadata?.sessionId ? `BV-${metadata.sessionId.substring(0, 8).toUpperCase()}` : 'BV-DIAG-TEMP';
  doc
    .fontSize(6)
    .font('Helvetica')
    .fillColor(COLORS.primary)
    .text(`Aggregated Audit Data ${displayId}`, blockX + imgMargin, midY + cardH - 10, { width: imgW, ellipsis: true });

  doc.y = midY + cardH + 16;

  // Observations Section Title
  drawSectionTitle(doc, 'Observations & Audit Summary');

  // Static backfill map of default observations/recommendations to avoid empty boxes
  const defaultFindingsMap: Record<string, { observation: string; recommendation: string }[]> = {
    FL: [
      { observation: "Founder roles and operational authorities are informal.", recommendation: "Document founder decision authority matrix." },
      { observation: "No formal succession plan exists for key management.", recommendation: "Establish formal advisory board structures." },
      { observation: "Advisory board oversight is absent or irregular.", recommendation: "Implement performance review checklists." },
      { observation: "Key-person risk is concentrated in the founding team.", recommendation: "Design executive key-person insurance." }
    ],
    FR: [
      { observation: "Capital buffers are thin with under 60 days of runway.", recommendation: "Optimize corporate tax reserves." },
      { observation: "Cash flow velocity is variable and undocumented.", recommendation: "Formalize contingency capital buffers." },
      { observation: "Vendor payment terms are not optimized for cash cycles.", recommendation: "Consolidate vendor credit terms." },
      { observation: "Cash forecasting is performed ad-hoc without tooling.", recommendation: "Implement automated cash forecasting." }
    ],
    BM: [
      { observation: "Customer concentration in a single account exceeds 30%.", recommendation: "Diversify customer contract models." },
      { observation: "Intellectual property licensing models are unstructured.", recommendation: "Define key IP licensing terms." },
      { observation: "Pricing structures lack volume-tier differentiation.", recommendation: "Review pricing multipliers per tier." },
      { observation: "Margin leakages exist in variable delivery costs.", recommendation: "Analyze variable costs margins." }
    ],
    OP: [
      { observation: "Operational processes are key-person dependent.", recommendation: "Document standard operating systems." },
      { observation: "Critical business backups are not automated.", recommendation: "Introduce critical cloud backups." },
      { observation: "Data migrations are performed manually without verification.", recommendation: "Audit automated migration steps." },
      { observation: "No formal disaster recovery plan is documented.", recommendation: "Perform disaster recovery trial." }
    ],
    MS: [
      { observation: "Customer onboarding churn occurs in the first 30 days.", recommendation: "Refine onboarding nurturing flows." },
      { observation: "Sales scripts and pitches are undocumented.", recommendation: "Audit scripts for enterprise sales." },
      { observation: "Marketing channel attribution is unmeasured.", recommendation: "Setup tracking attribution metrics." },
      { observation: "Customer health scoring is not utilized by CS.", recommendation: "Formalize customer health scoring." }
    ],
    GC: [
      { observation: "Regulatory compliance audits are not conducted annually.", recommendation: "Conduct annual regulatory compliance review." },
      { observation: "Board resolutions are not formally archived.", recommendation: "Document board resolutions flow." },
      { observation: "Employee NDAs are outdated or missing.", recommendation: "Standardize employee NDA policies." },
      { observation: "Staff data privacy training is not formalized.", recommendation: "Train staff on data privacy guidelines." }
    ],
    SS: [
      { observation: "Quarterly growth targets are undefined at team levels.", recommendation: "Define clean quarterly strategic targets." },
      { observation: "Total addressable market segmentation is unmapped.", recommendation: "Audit addressable market segmentation." },
      { observation: "Expansion deadlines are not tracked in a PM tool.", recommendation: "Map out expansion target deadlines." },
      { observation: "Business units lack dashboard metric alignment.", recommendation: "Align business unit leads on dashboard metrics." }
    ]
  };

  // Select 4 findings. If we have fewer than 4, fill remaining with defaults so boxes are NEVER empty
  const selectedFindings: ScoringFinding[] = [];
  const sortedFindings = [...findingsToRender].sort((a, b) => b.score - a.score);
  
  if (sortedFindings.length >= 4) {
    selectedFindings.push(sortedFindings[0], sortedFindings[1]); // 2 highest
    selectedFindings.push(sortedFindings[sortedFindings.length - 2], sortedFindings[sortedFindings.length - 1]); // 2 lowest
  } else {
    selectedFindings.push(...sortedFindings);
    const defaults = defaultFindingsMap[pillar.pillarCode] || [];
    let defIdx = 0;
    while (selectedFindings.length < 4 && defIdx < defaults.length) {
      const def = defaults[defIdx++];
      selectedFindings.push({
        optionId: 'default-opt',
        questionText: 'Default Question',
        selectedLabel: 'Standard Practice',
        observation: def.observation,
        recommendation: def.recommendation,
        riskType: 'NORMAL' as any,
        score: 100
      });
    }
  }

  // Draw 4 grid boxes (Clean grey background, colored left accent stripe, answer as title, observation as description)
  const obsY = doc.y;
  const obsW = 248;
  const obsH = 92;

  for (let i = 0; i < 4; i++) {
    const finding = selectedFindings[i];
    const row = Math.floor(i / 2);
    const col = i % 2;
    const ox = PAGE_MARGIN + col * (obsW + 19);
    const oy = obsY + row * (obsH + 10);

    const isKo = finding.riskType === 'KNOCKOUT';
    const isRisk = finding.riskType === 'RISK';
    const fColor = isKo ? COLORS.redBorder : isRisk ? COLORS.amberBorder : COLORS.greenBorder;

    // Clean grey background box with grey border
    roundedRect(doc, ox, oy, obsW, obsH, 6, COLORS.lightGrey, COLORS.borderGrey);
    // Colored left accent stripe representing status
    roundedRect(doc, ox, oy, 3, obsH, 2, fColor);

    const iconY = oy + 10.5;
    const textY = oy + 12;

    if (isKo || isRisk) {
      drawWarningIcon(doc, ox + 10, iconY, 11, fColor);
    } else {
      drawCheckIcon(doc, ox + 10, iconY, 11);
    }

    // Title: Selected Answer label
    doc
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .fillColor(COLORS.primary)
      .text(finding.selectedLabel.toUpperCase(), ox + 25, textY, { width: obsW - 32, height: 12, ellipsis: true, lineBreak: false });

    // Description: Observation only
    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor(COLORS.bodyText)
      .text(finding.observation, ox + 10, oy + 32, { width: obsW - 20, height: 50, ellipsis: true, lineGap: 1.5 });
  }

  // Strategic Road Map at the bottom (anchored at Y = 635 to stay close to the bottom consistently)
  const mapY = 635;
  roundedRect(doc, PAGE_MARGIN, mapY, COLORS.pageWidth, 125, 8, COLORS.lightGrey, COLORS.borderGrey);
  
  // Draw checkbox list watermark icon in background
  drawCheckboxListWatermark(doc, PAGE_MARGIN + COLORS.pageWidth - 60, mapY + 20, 48);

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

  // Strategic Road Map: Shows the Observation (as title) and Recommendation (as description) for the 4 selected findings
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

    const finding = selectedFindings[i];
    const recTitle = finding.observation;
    const recText = finding.recommendation;

    doc
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .fillColor(COLORS.primary)
      .text(recTitle, sx + 22, sy + 1, { width: stepW - 25, height: 10, ellipsis: true });

    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor(COLORS.mutedText)
      .text(recText, sx + 22, sy + 12, { width: stepW - 25, height: 20, ellipsis: true, lineGap: 1 });
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
  
  // Custom header title with left margin accent vertical line (matching 4.jpg)
  const headY = doc.y;
  doc.save();
  doc.lineWidth(4).strokeColor('#3B82F6');
  doc.moveTo(PAGE_MARGIN + 2, headY + 3).lineTo(PAGE_MARGIN + 2, headY + 38).stroke();
  doc.restore();

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Next Steps & Strategic Evolution', PAGE_MARGIN + 12, headY + 3);
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text('DIAGNOSTIC POST-ANALYSIS ROADMAP', PAGE_MARGIN + 12, headY + 22, { characterSpacing: 1.2 });

  doc.y = headY + 45;
  hr(doc, doc.y, COLORS.accent);
  doc.moveDown(0.6);

  // Spaced layout matching 4.jpg
  const topY = doc.y;
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('You now have structural clarity (2A).', PAGE_MARGIN, topY, { width: 280 });
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text('Execution strength requires deeper testing (2B).', PAGE_MARGIN, topY + 16, { width: 280 });

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor(COLORS.bodyText)
    .text(
      "The initial 2A diagnostic has successfully mapped the architectural skeleton of your operations. While the foundational identification phase is complete, the bridge to sustainable growth is built through stress-testing these structures under high-load business scenarios.\n\n" +
      "Moving from identification to implementation is a non-linear process. It requires a pivot from broad observation to surgical precision. The following intelligence upgrades are designed to convert strategic theory into operational dominance, ensuring that every identified weakness is transformed into a competitive moat.",
      PAGE_MARGIN,
      topY + 45,
      { width: 280, lineGap: 2.2 }
    );

  // Right card showing Grayscale building photo + white overlay Projected Delta
  const imgX = PAGE_MARGIN + 300;
  const imgY = topY;
  const imgW = 215;
  const imgH = 150; // Match the length of the text filled at the left side
  
  if (BUILDING_IMG_BUFFER) {
    try {
      // Make it fill the box exactly
      doc.image(BUILDING_IMG_BUFFER, imgX, imgY, {
        width: imgW,
        height: imgH
      });
      
      // Add gradient overlay
      doc.save();
      const grad = doc.linearGradient(imgX, imgY, imgX, imgY + imgH);
      grad.stop(0, '#FFFFFF');
      grad.stop(1, COLORS.primary);
      doc.fillOpacity(0.3);
      doc.rect(imgX, imgY, imgW, imgH).fill(grad);
      doc.restore();

      // subtle border around building image
      doc.save().lineWidth(0.5).strokeColor(COLORS.borderGrey);
      roundedRect(doc, imgX, imgY, imgW, imgH, 6, undefined, COLORS.borderGrey);
      doc.restore();
    } catch {}
  } else {
    roundedRect(doc, imgX, imgY, imgW, imgH, 6, COLORS.primary);
  }
  
  // White overlay card in the bottom-right corner of the image
  const overlayW = 125;
  const overlayH = 45;
  const overlayX = imgX + imgW - overlayW + 10;
  const overlayY = imgY + imgH - overlayH + 10;
  
  roundedRect(doc, overlayX, overlayY, overlayW, overlayH, 6, COLORS.white, COLORS.borderGrey);
  
  // Draw blue circle with rising arrow
  doc.save();
  doc.circle(overlayX + 18, overlayY + 22, 10).fillColor('#1D4ED8').fill();
  doc.lineWidth(1.5).strokeColor(COLORS.white);
  doc.moveTo(overlayX + 14, overlayY + 24).lineTo(overlayX + 22, overlayY + 18).stroke();
  doc.moveTo(overlayX + 18, overlayY + 18).lineTo(overlayX + 22, overlayY + 18).lineTo(overlayX + 22, overlayY + 22).stroke();
  doc.restore();
  
  doc
    .fontSize(6)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('EFFICIENCY DELTA', overlayX + 34, overlayY + 12);
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('+32.4% Projected', overlayX + 34, overlayY + 22);

  // Upgrade Options section (dynamically calculated to push it down and add space)
  const maxBottomY = Math.max(doc.y, imgY + imgH);
  const opY = maxBottomY + 30;
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
  roundedRect(doc, ux1, opY + 16, 4, upgradeH, 2, '#3B82F6'); // Blue accent line
  
  // compass icon
  drawDraftingCompassIcon(doc, ux1 + 16, opY + 30, 14);
  doc
    .fontSize(10.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Pillar-Specific Deep Dives', ux1 + 36, opY + 32);
  doc
    .fontSize(8)
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
  roundedRect(doc, ux2, opY + 16, 4, upgradeH, 2, COLORS.accent); // Orange accent line
  
  // robot arm icon
  drawRobotArmIcon(doc, ux2 + 16, opY + 30, 14);
  doc
    .fontSize(10.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Targeted Intelligence', ux2 + 36, opY + 32);
  doc
    .fontSize(8)
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
    drawTargetIcon(doc, ux2 + 16, bulletY2, 8);
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
    roundedRect(doc, sx, ssY + 16, 3, 120, 2, '#059669'); // Green/Teal accent line
    
    // Draw green icons
    if (i === 0) drawPeopleIcon(doc, sx + 12, ssY + 28, 14);
    else if (i === 1) drawBuildingIcon(doc, sx + 12, ssY + 28, 14, '#059669');
    else drawToolsIcon(doc, sx + 12, ssY + 28, 14);

    doc
      .fontSize(9.5)
      .font('Helvetica-Bold')
      .fillColor(COLORS.primary)
      .text(supportData[i].title, sx + 12, ssY + 48, { width: supportW - 24 });
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(COLORS.mutedText)
      .text(supportData[i].desc, sx + 12, ssY + 68, { width: supportW - 24, lineGap: 1.8 });
  }
}

// ============================================================
// LEGAL FRAMEWORK & METHODOLOGY PAGE (PAGE 11/12) - Balanced Spacing
// ============================================================
const drawLegalPage = (
  doc: PDFKit.PDFDocument,
  businessName: string,
  date: string,
  pillars: ScoringPillarPayload[]
) => {
  drawHeader(doc, businessName, date);
  
  // Section 01 Tag
  const headY = doc.y;
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text('SECTION 01', PAGE_MARGIN, headY, { characterSpacing: 1.2 });

  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Legal Framework & IP Ownership', PAGE_MARGIN, headY + 10);

  // Proprietary Asset Card (Top Right)
  const displayId = pillars[0]?.pillarCode ? `BV-PICA-PROD` : 'BV-DIAG-TEMP';
  const assetCardX = PAGE_MARGIN + COLORS.pageWidth - 140;
  roundedRect(doc, assetCardX, headY, 140, 52, 6, COLORS.lightGrey, COLORS.borderGrey);
  drawShieldIcon(doc, assetCardX + 16, headY + 12, 12, '#B45309');
  doc
    .fontSize(6)
    .font('Helvetica-Bold')
    .fillColor('#B45309')
    .text('PROPRIETARY ASSET', assetCardX + 32, headY + 13);
  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(`REF: ${displayId}`, assetCardX + 32, headY + 23);

  // Spaced out matching 5.jpg
  const topY = headY + 60;
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor(COLORS.bodyText)
    .text(
      "This diagnostic report, including all underlying logic, algorithmic structures, and the 'PICA' trademark, is the exclusive intellectual property of Beauvision Associates. Unauthorized reproduction, distribution, or reverse-engineering of the PICA methodology is strictly prohibited under international copyright and trade secret laws.\n\n" +
      "The methodologies contained herein, specifically the Seven Pillars Framework and Weighted Aggregate Scoring, are proprietary business intelligence assets developed through recursive diagnostic data modeling.",
      PAGE_MARGIN,
      topY,
      { width: COLORS.pageWidth, lineGap: 2.2 }
    );

  // Shift notice to stakeholders box down dynamically to prevent it from touching the text above it
  const warnY = doc.y + 25;
  roundedRect(doc, PAGE_MARGIN, warnY, COLORS.pageWidth, 75, 6, COLORS.amberBg, COLORS.amberBorder);
  roundedRect(doc, PAGE_MARGIN, warnY, 4, 75, 2, COLORS.amberBorder);

  doc
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.amber)
    .text('NOTICE TO STAKEHOLDERS', PAGE_MARGIN + 16, warnY + 12);
  doc
    .fontSize(8)
    .font('Helvetica-Oblique')
    .fillColor(COLORS.primary)
    .text(
      "This report is produced based on data and inputs provided directly by the user or client organization. Beauvision Associates does not perform independent third-party verification of the underlying data provided. Consequently, this document does not constitute a formal financial audit, tax advice, or legal opinion.",
      PAGE_MARGIN + 16,
      warnY + 26,
      { width: COLORS.pageWidth - 32, lineGap: 2 }
    );

  const disclaimerText = "Beauvision Associates offers no guarantees, express or implied, regarding specific business outcomes or ROI resulting from the implementation of recommendations within this report. Business conditions are dynamic; the insights provided are a \"snapshot in time\" and should be used as a supplementary tool in executive decision-making. Liability is limited to the cost of the diagnostic service provided.";
  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text(disclaimerText, PAGE_MARGIN, warnY + 95, { width: COLORS.pageWidth, lineGap: 1.8 });

  // Shift subsequent section down dynamically
  const sec2Y = doc.y + 25;
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text('SECTION 02', PAGE_MARGIN, sec2Y, { characterSpacing: 1.2 });
  
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('PICA Diagnostic Methodology', PAGE_MARGIN, sec2Y + 10);
  
  doc.y = sec2Y + 30;

  const methY = doc.y + 10;
  const pW = 68;
  const pGap = 6;
  const stablePillars = getCanonicalPillars(pillars);
  
  for (let i = 0; i < 7; i++) {
    const pillar = stablePillars[i];
    const pName = pillar ? pillar.pillarName : `Pillar 0${i + 1}`;
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
      .text(pName, px + 6, methY + 16, { width: pW - 12, lineGap: 1 });
  }

  // Weighted Scoring vs Knockout Logic (Spaced)
  const colY = methY + 65;
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
      "Our algorithm does not treat all data points equally. Each pillar is weighted proportionally based on industry volatility and relative impact on overall company valuations. A proprietary Kinetic Coefficient is applied to normalize data against current market benchmarks.",
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
  let ty = colY + 84;
  for (const t of tiers) {
    doc.save();
    doc.rect(PAGE_MARGIN + 14, ty, 25, 4).fillColor(t.color).fill();
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor(COLORS.primary).text(t.name, PAGE_MARGIN + 45, ty - 1);
    doc.restore();
    ty += 12;
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
    .text('Prevents high performance in secondary business units from masking terminal baseline vulnerabilities.', PAGE_MARGIN + colW + 60, colY + 103, { width: colW - 60, lineGap: 1 });

  // Add the version details and validation block at the bottom
  const botY = colY + 160;
  
  // Bottom left Version Card
  roundedRect(doc, PAGE_MARGIN, botY, 160, 32, 4, COLORS.lightGrey, COLORS.borderGrey);
  drawDraftingCompassIcon(doc, PAGE_MARGIN + 8, botY + 8, 16);
  doc
    .fontSize(6)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('DIAGNOSTIC VERSION', PAGE_MARGIN + 32, botY + 6);
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('PICA-V4.2 (Institutional)', PAGE_MARGIN + 32, botY + 16);

  // Bottom right validation card
  const valX = PAGE_MARGIN + COLORS.pageWidth - 140;
  doc.save();
  doc.lineWidth(1).strokeColor('#1D4ED8');
  doc.circle(valX + 10, botY + 16, 8).stroke();
  doc.circle(valX + 10, botY + 16, 4).stroke();
  doc.restore();
  
  doc
    .fontSize(6)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('DIGITALLY SIGNED & VALIDATED', valX + 24, botY + 8);
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#1D4ED8')
    .text('BEAUVISION ASSOCIATES', valX + 24, botY + 18);
};

const drawClosingAttestationPage = (
  doc: PDFKit.PDFDocument,
  businessName: string,
  date: string
) => {
  drawHeader(doc, businessName, date);
  
  // Tag
  const headY = doc.y;
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text('SECTION 03', PAGE_MARGIN, headY, { characterSpacing: 1.2 });
  
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Closing Attestation', PAGE_MARGIN, headY + 10);
  
  doc.y = headY + 45;
  hr(doc, doc.y, COLORS.accent);
  doc.moveDown(0.6);

  // Large elegant text block
  const topY = doc.y;
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Validation and Advisory Closeout.', PAGE_MARGIN, topY);

  const closingText = 
    "This report completes the PICA Level 2A operational assessment. The conclusions presented here are designed to guide the client organization's leadership in prioritizing operational upgrades and mitigating systemic risks. Beauvision Associates remains committed to supporting your strategic path forward. We appreciate the opportunity to partner with you in strengthening your business foundations.";

  doc
    .fontSize(9.5)
    .font('Helvetica')
    .fillColor(COLORS.bodyText)
    .text(closingText, PAGE_MARGIN, topY + 30, { width: COLORS.pageWidth, lineGap: 2.2 });

  // Signature Block with double columns
  const sigY = topY + 140;
  const colW = 230;
  const colGap = 40;

  // Left column: Lead Consultant
  doc
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('LEAD ADVISORY REPRESENTATIVE', PAGE_MARGIN, sigY);
  
  doc
    .fontSize(12)
    .font('Helvetica-Oblique')
    .fillColor(COLORS.primary)
    .text('Ronald Beauvision', PAGE_MARGIN, sigY + 16);
  
  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text('Senior Managing Partner\nBeauvision Associates Ltd', PAGE_MARGIN, sigY + 32, { lineGap: 1.5 });

  // Right column: Client Representative
  const clientX = PAGE_MARGIN + colW + colGap;
  doc
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('CLIENT ACKNOWLEDGEMENT', clientX, sigY);
  
  doc
    .fontSize(12)
    .font('Helvetica-Oblique')
    .fillColor(COLORS.primary)
    .text(businessName, clientX, sigY + 16);
  
  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text('Executive Officer / Representative\nAuthorized Stakeholder Signatory', clientX, sigY + 32, { lineGap: 1.5 });

  // Bottom stamp design box
  const stampY = sigY + 90;
  roundedRect(doc, PAGE_MARGIN, stampY, COLORS.pageWidth, 54, 6, COLORS.lightGrey, COLORS.borderGrey);
  drawShieldIcon(doc, PAGE_MARGIN + 16, stampY + 12, 16, '#059669'); // Green shield for approval
  
  doc
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor('#059669')
    .text('DIAGNOSTIC STATUS: COMPLETED & VALIDATED', PAGE_MARGIN + 38, stampY + 14);
  
  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor(COLORS.mutedText)
    .text('This attestation page formally seals the diagnostic session results for reference in future audits.', PAGE_MARGIN + 38, stampY + 28);
};

// ============================================================
// VISUALIZATION PAGE / ANNEX (PAGE 13) - Premium Spacing & Detail
// ============================================================
const drawVisualizationPage = (
  doc: PDFKit.PDFDocument,
  result: ScoringResultPayload,
  businessName: string,
  date: string,
  metadata?: { sessionId?: string }
) => {
  drawHeader(doc, businessName, date);
  
  // Top title section
  const headY = doc.y;
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor('#1D4ED8')
    .text('ANALYTICAL ANNEX', PAGE_MARGIN, headY, { characterSpacing: 1.2 });
  
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('PICA Diagnostic Visualization', PAGE_MARGIN, headY + 10);

  // Confidential document tag (top right)
  const displayId = metadata?.sessionId ? `BV-${metadata.sessionId.substring(0, 8).toUpperCase()}` : 'BV-DIAG-TEMP';
  const tagX = PAGE_MARGIN + COLORS.pageWidth - 120;
  doc
    .fontSize(6)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('CONFIDENTIAL DOCUMENT', tagX, headY, { align: 'right', width: 120 });
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.green)
    .text(displayId, tagX, headY + 8, { align: 'right', width: 120 });

  // Executive Performance Summary Card
  const topY = headY + 45;
  roundedRect(doc, PAGE_MARGIN, topY, COLORS.pageWidth, 75, 6, COLORS.lightGrey, COLORS.borderGrey);
  roundedRect(doc, PAGE_MARGIN, topY, 4, 75, 2, '#3B82F6');

  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('EXECUTIVE PERFORMANCE SUMMARY', PAGE_MARGIN + 16, topY + 12);
  doc
    .fontSize(8)
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
  const graphCy = topY + 225;
  const benchmarks = [70, 65, 60, 70, 65, 60, 55];
  drawRadarChart(doc, graphCx, graphCy, 90, result.pillarScores, benchmarks);

  // Big Radar Legend
  doc.save();
  const legX = PAGE_MARGIN + 30;
  const legY = topY + 335;
  doc.rect(legX, legY, 8, 8).fillColor('#F59E0B').fill();
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.primary).text('YOUR COMPANY PROFILE', legX + 14, legY + 1);
  
  doc.rect(legX + 200, legY, 8, 8).fillColor('#EF4444').fill();
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.primary).text('INDUSTRY STANDARD BASELINE', legX + 214, legY + 1);
  doc.restore();

  // Gap Analysis Logic Cards
  const gapY = topY + 365;
  const cardW = 158;
  const cardGap = 20;

  const gapData = [
    {
      title: 'Competitive Advantage',
      desc: 'Identified where the Amber Plot expands beyond the Red Boundary. These zones represent operational superiority and high-yield efficiency.',
      color: COLORS.greenBorder,
      bg: COLORS.greenBg
    },
    {
      title: 'Market Parity',
      desc: 'Occurs where the plots overlap. Indicates standard performance alignment with industry peers, representing a stabilized but non-differentiated position.',
      color: '#3B82F6',
      bg: '#EFF6FF'
    },
    {
      title: 'Operational Deficit',
      desc: 'Noted where the Amber Plot resides inside the Red Boundary. These are priority remediation zones requiring immediate strategic intervention.',
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
      .text(gapData[i].desc, gx + 12, gapY + 28, { width: cardW - 24, lineGap: 1.5 });
  }

  // Bottom block: Authenticity (Left) and Signature (Right)
  const botY = gapY + 125;
  
  // Diagnostic Authenticity Card
  roundedRect(doc, PAGE_MARGIN, botY, 160, 32, 4, COLORS.lightGrey, COLORS.borderGrey);
  doc.save();
  doc.lineWidth(1.2).strokeColor('#1D4ED8');
  doc.rect(PAGE_MARGIN + 8, botY + 8, 16, 16).stroke();
  doc.rect(PAGE_MARGIN + 12, botY + 12, 8, 8).fill();
  doc.restore();
  
  doc
    .fontSize(6)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('DIAGNOSTIC AUTHENTICITY', PAGE_MARGIN + 30, botY + 6);
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('Verified by PICA-v4 Engine', PAGE_MARGIN + 30, botY + 16);

  // Analyst Signature Block at bottom right
  const sigX = PAGE_MARGIN + COLORS.pageWidth - 140;
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(COLORS.mutedText)
    .text('ANALYST SIGNATURE', sigX, botY, { characterSpacing: 1 });
  
  doc
    .fontSize(14)
    .font('Helvetica-Oblique')
    .fillColor('#1D4ED8')
    .text('R. Beauvision', sigX, botY + 10);
};

const drawSectionTitle = (doc: PDFKit.PDFDocument, title: string) => {
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text(title.toUpperCase(), PAGE_MARGIN, doc.y, { characterSpacing: 1.2 })
    .moveDown(0.3);

  hr(doc, doc.y, COLORS.borderGrey);
  doc.moveDown(0.6);
};

const drawDonutGauge = (
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  radius: number,
  score: number,
  colorDetails: { text: string; border: string; bg?: string },
  caption: string,
  customRingW?: number
) => {
  const ringW = customRingW ?? Math.max(8, radius * 0.20);
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const full = Math.PI * 2;

  // Track ring (full circle).
  strokeArc(doc, cx, cy, radius, 0, full - 0.0001, ringW, COLORS.borderGrey);

  // Faded background circle inside the track
  if (colorDetails.bg) {
    doc.save();
    doc.circle(cx, cy, radius - ringW / 2).fillColor(colorDetails.bg).fill();
    doc.restore();
  }

  // Progress arc
  if (pct > 0) {
    strokeArc(doc, cx, cy, radius, 0, full * pct, ringW, colorDetails.border);
  }

  // Centered score
  doc.font('Helvetica-Bold').fontSize(radius * 0.58).fillColor(colorDetails.text);
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
      drawPillarPage(doc, pillar, businessName, dateStr, metadata);
    }

    // --- Page 10: Next Steps ---
    doc.addPage();
    drawNextStepsPageCustom(doc, result, phase, businessName, dateStr);

    // --- Pages 11-13: Legal, Closing Attestation & Visualization (only for full scan) ---
    if (!isSinglePillar) {
      doc.addPage();
      drawLegalPage(doc, businessName, dateStr, result.pillarScores);

      doc.addPage();
      drawClosingAttestationPage(doc, businessName, dateStr);

      doc.addPage();
      drawVisualizationPage(doc, result, businessName, dateStr, metadata);
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
