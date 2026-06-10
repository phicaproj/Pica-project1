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
// Mirrors the user-facing app: dark navy surfaces (#111827) with an orange
// accent (#f97316). Keep these in step with the frontend brand colors.

const COLORS = {
  primary: '#111827', // PICA dark navy — header band, headings, strong text
  primaryLight: '#1F2937', // lighter navy — secondary surfaces
  accent: '#F97316', // PICA orange — brand accent, bars, CTAs
  accentDark: '#EA6C0A', // darker orange — pressed/edge states
  bodyText: '#1F2937', // near-navy — body copy
  mutedText: '#6B7280', // muted grey — labels, captions
  // Band colors mirror the app's result page: emerald / amber / rose, tuned
  // for legibility on white paper (text a shade deeper than the on-screen
  // border so it reads against a light card).
  green: '#047857', // emerald-700 — strong-band text
  greenBg: '#ECFDF5', // emerald-50 — strong-band card
  greenBorder: '#10B981', // emerald-500 — strong-band accent (site emerald)
  amber: '#B45309', // amber-700 — moderate-band text
  amberBg: '#FFFBEB', // amber-50 — moderate-band card
  amberBorder: '#F59E0B', // amber-500 — moderate-band accent (site amber)
  red: '#E11D48', // rose-600 — critical-band text
  redBg: '#FFF1F2', // rose-50 — critical-band card
  redBorder: '#F43F5E', // rose-500 — critical-band accent (site rose)
  white: '#FFFFFF',
  lightGrey: '#F9FAFB',
  borderGrey: '#E5E7EB',
  pageWidth: 515, // usable width with 50pt margins on each side
} as const;

const PAGE_MARGIN = 50;

// Logo lives in the backend assets folder; resolved from cwd so it works both
// in dev (ts-node from /backend) and prod (node dist from /backend). Loaded
// once and reused; a missing file degrades to a text wordmark.
const LOGO_PATH = path.join(process.cwd(), 'assets', 'logo.png');
const LOGO_BUFFER: Buffer | null = (() => {
  try {
    return fs.readFileSync(LOGO_PATH);
  } catch {
    return null;
  }
})();

// Optional dedicated cover image. If assets/cover.png exists it's used on the
// front page; otherwise the cover falls back to the logo. Missing file = null,
// never throws.
const COVER_PATH = path.join(process.cwd(), 'assets', 'cover.png');
const COVER_BUFFER: Buffer | null = (() => {
  try {
    return fs.readFileSync(COVER_PATH);
  } catch {
    return null;
  }
})();

// Phase → human label shown on the cover + summary header.
const phaseLabel = (phase: Phase): string => {
  if (phase === Phase.PHASE2A) return 'Phase 2A · Strategic Scan';
  if (phase === Phase.PHASE2B) return 'Phase 2B · Deep Dive';
  return 'Phase 1 · Snapshot Assessment';
};

// Static, band-keyed interpretation line for a pillar page. Descriptive copy
// keyed to the band only — not fabricated per-business data.
const bandInterpretation = (band: string): string => {
  if (band === 'GREEN') return 'This pillar is performing well with no critical risks flagged.';
  if (band === 'AMBER') return 'This pillar is functional but has moderate risks worth addressing.';
  return 'This pillar shows critical gaps that need immediate attention.';
};

// ============================================================
// BAND HELPERS
// ============================================================

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

// ============================================================
// LAYOUT HELPERS
// ============================================================

/**
 * Draws a filled rounded rectangle.
 * PDFKit doesn't have native rounded rects so we approximate
 * using bezier curves.
 */
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

/** Draws a horizontal rule across the full page width. */
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
// SECTION BUILDERS
// ============================================================

const drawHeader = (doc: PDFKit.PDFDocument, businessName: string, date: string) => {
  // PICA navy header band
  doc.rect(0, 0, doc.page.width, 96).fill(COLORS.primary);
  // Orange accent rule along the bottom of the band
  doc.rect(0, 96, doc.page.width, 3).fill(COLORS.accent);

  // Logo (or text wordmark fallback) top-left
  let textX = PAGE_MARGIN;
  if (LOGO_BUFFER) {
    try {
      doc.image(LOGO_BUFFER, PAGE_MARGIN, 22, { height: 30 });
      textX = PAGE_MARGIN + 42;
    } catch {
      textX = PAGE_MARGIN;
    }
  }

  // PICA wordmark + tagline next to the logo
  doc
    .fontSize(20)
    .fillColor(COLORS.white)
    .text('Beauvision Associates', textX, 24, { characterSpacing: 3, lineBreak: false });
  doc
    .fontSize(8)
    .fillColor(COLORS.accent)
    .text('LEAD CONSULTANT ENTITY', textX, 50, { characterSpacing: 2, lineBreak: false });

  // Report title + business + date, right-aligned
  doc.fontSize(13).fillColor('#f8bd0d').text('PICA SEAL', PAGE_MARGIN, 26, {
    align: 'right',
    width: COLORS.pageWidth,
  });

  doc
    .fontSize(10)
    .fillColor('#D1D5DB')
    .text('Verified Diagnostic', PAGE_MARGIN, 46, { align: 'right', width: COLORS.pageWidth });

  doc
    .fontSize(8)
    .fillColor('#9CA3AF')
    .text(date, PAGE_MARGIN, 62, { align: 'right', width: COLORS.pageWidth });

  doc.moveDown(0);
  doc.y = 120;
};

const drawOverallScore = (
  doc: PDFKit.PDFDocument,
  totalScore: number,
  colorBand: string,
  hasAnyKnockout: boolean,
  pillarCount: number
) => {
  const colors = bandColors(colorBand);
  const boxY = doc.y;
  const cardH = 150;

  // Score card background.
  roundedRect(doc, PAGE_MARGIN, boxY, COLORS.pageWidth, cardH, 8, colors.bg, colors.border);

  // ── Donut gauge on the left ────────────────────────────
  const radius = 50;
  const cx = PAGE_MARGIN + 30 + radius;
  const cy = boxY + cardH / 2 - 6;
  drawDonutGauge(doc, cx, cy, radius, totalScore, colorBand, 'Overall Score');

  // ── Details on the right ───────────────────────────────
  const rx = PAGE_MARGIN + 30 + radius * 2 + 36;
  const rw = PAGE_MARGIN + COLORS.pageWidth - rx - 24;

  doc
    .fontSize(13)
    .fillColor(colors.text)
    .text('Overall Assessment Score', rx, boxY + 30, { width: rw, lineBreak: false });

  // Band pill.
  roundedRect(doc, rx, boxY + 54, 96, 24, 4, colors.border);
  doc
    .fontSize(10)
    .fillColor(COLORS.white)
    .text(colors.label, rx, boxY + 60, { width: 96, align: 'center', lineBreak: false });

  doc
    .fontSize(9)
    .fillColor(COLORS.mutedText)
    .text(`Based on ${pillarCount} business pillar${pillarCount === 1 ? '' : 's'}`, rx, boxY + 92, {
      width: rw,
    });

  doc.y = boxY + cardH + 14;

  // Knockout warning banner.
  if (hasAnyKnockout) {
    const warnY = doc.y;
    roundedRect(doc, PAGE_MARGIN, warnY, COLORS.pageWidth, 28, 4, '#FFF5F5', COLORS.redBorder);
    doc
      .fontSize(9)
      .fillColor(COLORS.red)
      .text(
        'CRITICAL ALERT  —  One or more critical risk factors were detected. Review the highlighted pillars immediately.',
        PAGE_MARGIN + 12,
        warnY + 9,
        { width: COLORS.pageWidth - 24, lineBreak: false }
      );
    doc.y = warnY + 38;
  }

  doc.moveDown(0.8);
};

const drawSectionTitle = (doc: PDFKit.PDFDocument, title: string) => {
  doc
    .fontSize(7)
    .fillColor(COLORS.accent)
    .text(title.toUpperCase(), PAGE_MARGIN, doc.y, { characterSpacing: 1.5 })
    .moveDown(0.3);

  hr(doc, doc.y, COLORS.accent);
  doc.moveDown(0.6);
};

const drawPillarRow = (
  doc: PDFKit.PDFDocument,
  pillarCode: string,
  pillarName: string,
  weightedScore: number,
  colorBand: string
) => {
  const colors = bandColors(colorBand);
  const rowY = doc.y;
  const barMaxW = 160;
  const barW = Math.round((weightedScore / 100) * barMaxW);

  // Left side — code badge
  roundedRect(doc, PAGE_MARGIN, rowY + 2, 30, 18, 3, COLORS.primary);
  doc
    .fontSize(7)
    .fillColor(COLORS.white)
    .text(pillarCode, PAGE_MARGIN, rowY + 7, { width: 30, align: 'center', lineBreak: false });

  // Pillar name
  doc
    .fontSize(10)
    .fillColor(COLORS.bodyText)
    .text(pillarName, PAGE_MARGIN + 38, rowY + 5, { lineBreak: false });

  // Score bar background
  roundedRect(doc, PAGE_MARGIN + 240, rowY + 7, barMaxW, 8, 4, COLORS.borderGrey);
  // Score bar fill
  if (barW > 0) {
    roundedRect(doc, PAGE_MARGIN + 240, rowY + 7, barW, 8, 4, colors.border);
  }

  // Score text
  doc
    .fontSize(10)
    .fillColor(colors.text)
    .text(`${weightedScore}`, PAGE_MARGIN + 412, rowY + 4, { lineBreak: false });

  doc
    .fontSize(7)
    .fillColor(COLORS.mutedText)
    .text('/100', PAGE_MARGIN + 432, rowY + 7, { lineBreak: false });

  // Band label
  doc
    .fontSize(7)
    .fillColor(colors.text)
    .text(bandEmoji(colorBand) + ' ' + colors.label, PAGE_MARGIN + 460, rowY + 6, {
      width: 55,
      align: 'right',
      lineBreak: false,
    });

  doc.y = rowY + 28;
};

/**
 * A single finding rendered as two boxes side by side — Insight (the
 * observation) on the left, Recommendation on the right. No question/answer is
 * shown. The card height is driven by the taller of the two text columns so
 * both boxes share a clean, equal-height row (matching the app's card grid).
 */
const drawFinding = (
  doc: PDFKit.PDFDocument,
  finding: {
    observation: string;
    recommendation: string;
    riskType: string;
  },
  isKnockout: boolean
) => {
  const accent = isKnockout ? COLORS.redBorder : COLORS.amberBorder;

  // Two equal columns with a gutter between them.
  const gutter = 14;
  const colW = (COLORS.pageWidth - gutter) / 2;
  const padX = 14;
  const padTop = 12;
  const padBottom = 14;
  const labelGap = 6; // space under the column label before the body text
  const labelH = 9; // height reserved for the small uppercase label
  const innerW = colW - padX * 2;

  // Measure both columns at the body font size so the card fits the longer one.
  doc.fontSize(9.5);
  const obsH = doc.heightOfString(finding.observation || '—', { width: innerW });
  const recH = doc.heightOfString(finding.recommendation || '—', { width: innerW });
  const bodyH = Math.max(obsH, recH);
  const cardH = padTop + labelH + labelGap + bodyH + padBottom;

  const cardY = doc.y;
  const leftX = PAGE_MARGIN;
  const rightX = PAGE_MARGIN + colW + gutter;

  // ── Left box — INSIGHT ─────────────────────────────────
  roundedRect(doc, leftX, cardY, colW, cardH, 6, COLORS.lightGrey, COLORS.borderGrey);
  doc.rect(leftX, cardY, 3, cardH).fill(accent);
  doc
    .fontSize(7.5)
    .fillColor(COLORS.mutedText)
    .text('INSIGHT', leftX + padX, cardY + padTop, { characterSpacing: 1.2, lineBreak: false });
  doc
    .fontSize(9.5)
    .fillColor(COLORS.bodyText)
    .text(finding.observation || '—', leftX + padX, cardY + padTop + labelH + labelGap, {
      width: innerW,
    });

  // ── Right box — RECOMMENDATION ─────────────────────────
  roundedRect(doc, rightX, cardY, colW, cardH, 6, COLORS.white, COLORS.borderGrey);
  doc.rect(rightX, cardY, 3, cardH).fill(COLORS.accent);
  doc
    .fontSize(7.5)
    .fillColor(COLORS.accentDark)
    .text('RECOMMENDATION', rightX + padX, cardY + padTop, {
      characterSpacing: 1.2,
      lineBreak: false,
    });
  doc
    .fontSize(9.5)
    .fillColor(COLORS.primary)
    .text(finding.recommendation || '—', rightX + padX, cardY + padTop + labelH + labelGap, {
      width: innerW,
    });

  doc.y = cardY + cardH + 12;
};

// ============================================================
// FULL-PAGE BUILDERS (cover, per-pillar, next steps)
// ============================================================

/**
 * Front cover. Full A4 page, no navy header band — a centered, vertically
 * balanced title block with a thin orange rule top and bottom. Caller is
 * responsible for adding the following page.
 */
const drawCoverPage = (
  doc: PDFKit.PDFDocument,
  businessName: string,
  phaseText: string,
  date: string
) => {
  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Thin orange rules framing the page top + bottom.
  doc.rect(0, 60, pageW, 3).fill(COLORS.accent);
  doc.rect(0, pageH - 63, pageW, 3).fill(COLORS.accent);

  // CONFIDENTIAL — small, letter-spaced, muted, centered near the top.
  doc
    .fontSize(10)
    .fillColor(COLORS.mutedText)
    .text('────── CONFIDENTIAL ──────', PAGE_MARGIN, 120, {
      width: COLORS.pageWidth,
      align: 'center',
      characterSpacing: 4,
    });

  // Title — large navy, centered.
  doc
    .fontSize(30)
    .fillColor(COLORS.primary)
    .text('PICA Business Health Assessment', PAGE_MARGIN, 170, {
      width: COLORS.pageWidth,
      align: 'center',
    });

  // Centered image (cover image, else logo). Horizontally centered, scaled to
  // a fixed display height and placed in the vertical middle of the page.
  const coverImg = COVER_BUFFER ?? LOGO_BUFFER;
  if (coverImg) {
    try {
      const imgH = COVER_BUFFER ? 230 : 90;
      const imgW = COVER_BUFFER ? 300 : 120;
      const imgX = (pageW - imgW) / 2;
      const imgY = (pageH - imgH) / 2 - 10;
      doc.image(coverImg, imgX, imgY, { fit: [imgW, imgH], align: 'center' });
    } catch {
      // Image failed to render — leave the space blank rather than throw.
    }
  }

  // Prepared-by line, lower third.
  doc
    .fontSize(12)
    .fillColor(COLORS.bodyText)
    .text('Prepared by Beauvision Associates Ltd', PAGE_MARGIN, pageH - 200, {
      width: COLORS.pageWidth,
      align: 'center',
    });

  // Business name + phase + date, centered above the bottom rule.
  doc
    .fontSize(15)
    .fillColor(COLORS.primary)
    .text(businessName, PAGE_MARGIN, pageH - 160, {
      width: COLORS.pageWidth,
      align: 'center',
    });
  doc
    .fontSize(10)
    .fillColor(COLORS.mutedText)
    .text(`${phaseText}   ·   ${date}`, PAGE_MARGIN, pageH - 135, {
      width: COLORS.pageWidth,
      align: 'center',
    });
};

/**
 * Horizontal bar chart of every pillar's weighted score. Same visual vocabulary
 * as drawPillarRow, grouped under a chart heading on the summary page.
 */
const drawScoreChart = (doc: PDFKit.PDFDocument, pillars: ScoringPillarPayload[]) => {
  if (pillars.length === 0) return;

  drawSectionTitle(doc, 'Pillar Scores');

  const labelW = 150;
  const barMaxW = 260;
  const barX = PAGE_MARGIN + labelW;
  const rowH = 22;

  for (const pillar of pillars) {
    const colors = bandColors(pillar.colorBand);
    const rowY = doc.y;
    const barW = Math.round((pillar.weightedScore / 100) * barMaxW);

    // Pillar label (code · name), truncated to its column.
    doc
      .fontSize(9)
      .fillColor(COLORS.bodyText)
      .text(`${pillar.pillarCode} · ${pillar.pillarName}`, PAGE_MARGIN, rowY + 2, {
        width: labelW - 8,
        lineBreak: false,
        ellipsis: true,
      });

    // Track + fill.
    roundedRect(doc, barX, rowY, barMaxW, 12, 6, COLORS.borderGrey);
    if (barW > 0) {
      roundedRect(doc, barX, rowY, barW, 12, 6, colors.border);
    }

    // Score number at the far right.
    doc
      .fontSize(9)
      .fillColor(colors.text)
      .text(`${pillar.weightedScore}`, barX + barMaxW + 12, rowY + 1, {
        width: 40,
        align: 'left',
        lineBreak: false,
      });

    doc.y = rowY + rowH;
  }

  doc.moveDown(0.5);
};

/**
 * Strokes a circular arc by approximating it with cubic bezier segments
 * (PDFKit has no native arc). Angles are in radians, measured clockwise from
 * 12 o'clock. Splits into ≤90° segments for a smooth curve.
 */
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
  // Convert "clockwise from top" into standard math coords for point calc.
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
    // Bezier control-point distance for a circular arc of angle `step`.
    const k = (4 / 3) * Math.tan(step / 4) * radius;
    const p0 = pt(a0);
    const p1 = pt(a1);
    // Tangent directions (derivative of pt wrt angle).
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

/**
 * Donut gauge: a grey full-circle track with a band-colored progress arc
 * (proportional to score/100), the big score number and a small label centered
 * inside. Used for the overall score (summary) and the single 2B pillar.
 */
const drawDonutGauge = (
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  radius: number,
  score: number,
  band: string,
  caption: string
) => {
  const colors = bandColors(band);
  const ringW = Math.max(10, radius * 0.22);
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const full = Math.PI * 2;

  // Track ring (full circle).
  strokeArc(doc, cx, cy, radius, 0, full - 0.0001, ringW, COLORS.borderGrey);
  // Progress arc from 12 o'clock clockwise.
  if (pct > 0) {
    strokeArc(doc, cx, cy, radius, 0, full * pct, ringW, colors.border);
  }

  // Centered score number.
  doc.fontSize(radius * 0.62).fillColor(colors.text);
  const numText = `${Math.round(score)}`;
  const numW = doc.widthOfString(numText);
  const numH = doc.currentLineHeight();
  doc.text(numText, cx - numW / 2, cy - numH / 2 - radius * 0.06, { lineBreak: false });

  // "/100" + caption beneath the number.
  doc.fontSize(radius * 0.2).fillColor(COLORS.mutedText);
  const subText = '/ 100';
  const subW = doc.widthOfString(subText);
  doc.text(subText, cx - subW / 2, cy + radius * 0.2, { lineBreak: false });

  if (caption) {
    doc.fontSize(8.5).fillColor(COLORS.mutedText);
    doc.text(caption.toUpperCase(), cx - radius, cy + radius + 10, {
      width: radius * 2,
      align: 'center',
      characterSpacing: 1,
      lineBreak: false,
    });
  }
};

/**
 * One full page for a single pillar: header, large score visual, a band-keyed
 * interpretation line, then findings cards (or a "no risks flagged" note).
 * Caller adds the page before calling this.
 */
const drawPillarPage = (
  doc: PDFKit.PDFDocument,
  pillar: ScoringPillarPayload,
  businessName: string,
  date: string
) => {
  const colors = bandColors(pillar.colorBand);

  // Consistent navy header band on every page.
  drawHeader(doc, businessName, date);

  // ── Pillar header ──────────────────────────────────────
  const headY = doc.y;
  // Code badge
  roundedRect(doc, PAGE_MARGIN, headY, 44, 24, 4, COLORS.primary);
  doc
    .fontSize(11)
    .fillColor(COLORS.white)
    .text(pillar.pillarCode, PAGE_MARGIN, headY + 6, {
      width: 44,
      align: 'center',
      lineBreak: false,
    });

  // Pillar name
  doc
    .fontSize(18)
    .fillColor(COLORS.primary)
    .text(pillar.pillarName, PAGE_MARGIN + 56, headY + 2, {
      width: COLORS.pageWidth - 56 - 90,
      lineBreak: false,
      ellipsis: true,
    });

  // Band pill, right-aligned in the header row
  roundedRect(doc, PAGE_MARGIN + COLORS.pageWidth - 84, headY, 84, 24, 4, colors.border);
  doc
    .fontSize(9)
    .fillColor(COLORS.white)
    .text(
      `${bandEmoji(pillar.colorBand)} ${colors.label}`,
      PAGE_MARGIN + COLORS.pageWidth - 84,
      headY + 7,
      {
        width: 84,
        align: 'center',
        lineBreak: false,
      }
    );

  doc.y = headY + 40;
  hr(doc, doc.y, COLORS.borderGrey);
  doc.moveDown(1);

  // ── Score visual: donut gauge + interpretation ─────────
  const scoreY = doc.y;
  const cardH = 124;
  roundedRect(doc, PAGE_MARGIN, scoreY, COLORS.pageWidth, cardH, 8, colors.bg, colors.border);

  const radius = 44;
  const cx = PAGE_MARGIN + 28 + radius;
  const cy = scoreY + cardH / 2 - 4;
  drawDonutGauge(doc, cx, cy, radius, pillar.weightedScore, pillar.colorBand, '');

  // Interpretation copy to the right of the gauge.
  const tx = PAGE_MARGIN + 28 + radius * 2 + 32;
  const tw = PAGE_MARGIN + COLORS.pageWidth - tx - 24;
  roundedRect(doc, tx, scoreY + 30, 96, 22, 4, colors.border);
  doc
    .fontSize(9)
    .fillColor(COLORS.white)
    .text(`${bandEmoji(pillar.colorBand)} ${colors.label}`, tx, scoreY + 36, {
      width: 96,
      align: 'center',
      lineBreak: false,
    });
  doc
    .fontSize(11)
    .fillColor(COLORS.bodyText)
    .text(bandInterpretation(pillar.colorBand), tx, scoreY + 62, { width: tw, lineGap: 1 });

  doc.y = scoreY + cardH + 16;

  // ── Findings ───────────────────────────────────────────
  drawSectionTitle(doc, 'Findings & Recommendations');

  // The report shows the full set of answered findings (critical-first), not
  // just the trimmed 1–2 surfaced on the result page view. Fall back to
  // `findings` if an older payload predates `allFindings`.
  const findingsToRender =
    pillar.allFindings && pillar.allFindings.length > 0 ? pillar.allFindings : pillar.findings;

  if (findingsToRender.length === 0) {
    const noteY = doc.y;
    roundedRect(
      doc,
      PAGE_MARGIN,
      noteY,
      COLORS.pageWidth,
      44,
      6,
      COLORS.greenBg,
      COLORS.greenBorder
    );
    doc
      .fontSize(10)
      .fillColor(COLORS.green)
      .text(
        'No specific risks were flagged for this pillar. Keep maintaining the practices that are working here.',
        PAGE_MARGIN + 16,
        noteY + 15,
        { width: COLORS.pageWidth - 32 }
      );
    doc.y = noteY + 54;
    return;
  }

  for (const finding of findingsToRender) {
    // Page-break guard for pillars with many/long findings — keep the navy
    // header consistent on the continuation page too.
    if (doc.y > doc.page.height - 160) {
      doc.addPage();
      drawHeader(doc, businessName, date);
    }
    drawFinding(doc, finding, finding.riskType === 'KNOCKOUT');
  }
};

/**
 * Prominent navy CTA card with an orange edge, a large eyebrow/heading and a
 * body paragraph. Self-sizing to its copy so the card never clips long text,
 * and never feels cramped. Returns nothing — advances doc.y past the card.
 */
const drawCtaCard = (
  doc: PDFKit.PDFDocument,
  eyebrow: string,
  heading: string,
  body: string,
  businessName: string,
  date: string
) => {
  const padX = 26;
  const padTop = 24;
  const padBottom = 26;
  const innerW = COLORS.pageWidth - padX * 2;

  // Measure heading + body at their target sizes to size the card.
  doc.fontSize(20);
  const headH = doc.heightOfString(heading, { width: innerW });
  doc.fontSize(11.5);
  const bodyH = doc.heightOfString(body, { width: innerW, lineGap: 2 });
  const eyebrowH = 14;
  const gapAfterEyebrow = 6;
  const gapAfterHeading = 12;
  const cardH = padTop + eyebrowH + gapAfterEyebrow + headH + gapAfterHeading + bodyH + padBottom;

  // Keep the whole card on one page.
  if (doc.y + cardH > doc.page.height - 70) {
    doc.addPage();
    drawHeader(doc, businessName, date);
  }

  const cardY = doc.y;
  roundedRect(doc, PAGE_MARGIN, cardY, COLORS.pageWidth, cardH, 10, COLORS.primary);
  // Thick orange edge bar.
  roundedRect(doc, PAGE_MARGIN, cardY, 6, cardH, 3, COLORS.accent);

  let cursor = cardY + padTop;
  doc
    .fontSize(8.5)
    .fillColor(COLORS.accent)
    .text(eyebrow.toUpperCase(), PAGE_MARGIN + padX, cursor, {
      characterSpacing: 2,
      width: innerW,
    });
  cursor += eyebrowH + gapAfterEyebrow;

  doc
    .fontSize(20)
    .fillColor(COLORS.white)
    .text(heading, PAGE_MARGIN + padX, cursor, { width: innerW });
  cursor += headH + gapAfterHeading;

  doc
    .fontSize(11.5)
    .fillColor('#D1D5DB')
    .text(body, PAGE_MARGIN + padX, cursor, { width: innerW, lineGap: 2 });

  doc.y = cardY + cardH + 16;
};

/**
 * Closing "Recommended Next Steps" page. Phase 2B routes the user to support
 * for a business consultant; Phase 1 / 2A recommend the Phase 2 Deep Dive on
 * their low-scoring (non-GREEN) pillars.
 */
const drawNextStepsPage = (
  doc: PDFKit.PDFDocument,
  result: ScoringResultPayload,
  phase: Phase,
  businessName: string,
  date: string
) => {
  drawHeader(doc, businessName, date);
  drawSectionTitle(doc, 'Recommended Next Steps');

  if (phase === Phase.PHASE2B) {
    const pillarName = result.pillarScores[0]?.pillarName ?? 'this pillar';
    doc
      .fontSize(11.5)
      .fillColor(COLORS.bodyText)
      .text(
        `You've completed a full Deep Dive into ${pillarName} — and that's a genuinely valuable step most businesses never take. The insights in this report aren't generic best-practice; they're a precise read of where this part of your business stands today and exactly what's holding it back.`,
        PAGE_MARGIN,
        doc.y,
        { width: COLORS.pageWidth, lineGap: 2 }
      );
    doc.moveDown(0.6);
    doc
      .fontSize(11.5)
      .fillColor(COLORS.bodyText)
      .text(
        'But a diagnosis is only as good as what you do with it. The fastest, surest way to turn these findings into real, measurable change is to put an experienced specialist alongside you — someone who has solved exactly these problems before and can help you prioritise, plan, and execute without the trial and error.',
        PAGE_MARGIN,
        doc.y,
        { width: COLORS.pageWidth, lineGap: 2 }
      );
    doc.moveDown(1);

    drawCtaCard(
      doc,
      'Your Next Move',
      'Get matched with a dedicated business consultant',
      "Reach out to our support team and we'll personally assign you a consultant who specialises in this area. They'll sit down with these exact findings, translate them into a clear, prioritised action plan, and stay with you as you put it to work — so the momentum you've built here doesn't go to waste. This is where insight becomes impact.",
      businessName,
      date
    );
    return;
  }

  // Phase 1 / Phase 2A — recommend the Deep Dive on low pillars.
  const lowPillars = [...result.pillarScores]
    .filter((p) => p.colorBand !== 'GREEN')
    .sort((a, b) => {
      const order = { RED: 0, AMBER: 1, GREEN: 2 };
      return (
        (order[a.colorBand as keyof typeof order] ?? 0) -
        (order[b.colorBand as keyof typeof order] ?? 0)
      );
    });

  if (lowPillars.length === 0) {
    doc
      .fontSize(11.5)
      .fillColor(COLORS.bodyText)
      .text(
        'Every pillar landed in the strong range — a result very few businesses achieve, and a real credit to how you run things. The goal now is to protect that position. Markets shift, teams change, and small cracks can form quietly, so a periodic re-assessment is the simplest way to catch any drift early and keep every pillar performing at its best.',
        PAGE_MARGIN,
        doc.y,
        { width: COLORS.pageWidth, lineGap: 2 }
      );
    doc.moveDown(1);

    drawCtaCard(
      doc,
      'Stay Ahead',
      'Go deeper while you have the momentum',
      "Even strong businesses uncover hidden opportunities in a Deep Dive. Pick any pillar you'd like to push from good to exceptional, and we'll give you a focused, expert-level diagnostic and a tailored plan to get there. Start any time from your dashboard.",
      businessName,
      date
    );
    return;
  }

  doc
    .fontSize(11.5)
    .fillColor(COLORS.bodyText)
    .text(
      "Here's where to focus next. The pillars below scored in the needs-work or attention range — and each one represents a concrete opportunity to strengthen your business. A Phase 2 Deep Dive goes far beyond this snapshot: it digs into the root causes behind each score and hands you a tailored, step-by-step action plan you can actually execute against.",
      PAGE_MARGIN,
      doc.y,
      { width: COLORS.pageWidth, lineGap: 2 }
    );
  doc.moveDown(0.9);

  for (const pillar of lowPillars) {
    if (doc.y > doc.page.height - 130) {
      doc.addPage();
      drawHeader(doc, businessName, date);
    }
    const colors = bandColors(pillar.colorBand);
    const rowY = doc.y;
    roundedRect(
      doc,
      PAGE_MARGIN,
      rowY,
      COLORS.pageWidth,
      40,
      6,
      COLORS.lightGrey,
      COLORS.borderGrey
    );
    roundedRect(doc, PAGE_MARGIN, rowY, 4, 40, 2, colors.border);

    doc
      .fontSize(11.5)
      .fillColor(COLORS.primary)
      .text(`${pillar.pillarCode} · ${pillar.pillarName}`, PAGE_MARGIN + 18, rowY + 14, {
        width: COLORS.pageWidth - 150,
        lineBreak: false,
        ellipsis: true,
      });
    doc
      .fontSize(11)
      .fillColor(colors.text)
      .text(
        `${pillar.weightedScore}/100  ·  ${colors.label}`,
        PAGE_MARGIN + COLORS.pageWidth - 130,
        rowY + 14,
        { width: 120, align: 'right', lineBreak: false }
      );

    doc.y = rowY + 50;
  }

  doc.moveDown(0.6);

  drawCtaCard(
    doc,
    'Your Next Move',
    'Unlock the Phase 2 Deep Dive',
    'Turn this snapshot into a roadmap. Choose the pillars above that matter most to you and unlock a detailed diagnostic that pinpoints what to fix first, why it matters, and exactly how to do it — complete with a prioritised, business-specific action plan. You can start any time, right from your dashboard.',
    businessName,
    date
  );
};

const drawFooter = (doc: PDFKit.PDFDocument) => {
  const footerY = doc.page.height - 40;

  // The footer sits below the bottom margin. Without this, each .text() call
  // would overflow the printable area and make PDFKit spawn a blank page.
  // Zero the bottom margin while drawing, then restore it.
  const prevBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  hr(doc, footerY - 8);

  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text(
      'PICA Assessment  ·  Beauvision Associates Ltd  ·  beauvisiongroup.com',
      PAGE_MARGIN,
      footerY,
      { align: 'left', width: COLORS.pageWidth / 2, lineBreak: false }
    );

  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text(
      'This report is confidential and intended solely for the named business.',
      PAGE_MARGIN,
      footerY,
      { align: 'right', width: COLORS.pageWidth, lineBreak: false }
    );

  doc.page.margins.bottom = prevBottom;
};

// ============================================================
// MAIN EXPORT
// ============================================================

export async function generateReportPDF(
  result: ScoringResultPayload,
  businessName: string,
  phase: Phase = Phase.PHASE1
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

    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Sort: RED first, then AMBER, then GREEN — most critical first. Drives
    // both the summary chart/rows and the per-pillar page order.
    const sortedWorstFirst = [...result.pillarScores].sort((a, b) => {
      const order = { RED: 0, AMBER: 1, GREEN: 2 };
      return (
        (order[a.colorBand as keyof typeof order] ?? 0) -
        (order[b.colorBand as keyof typeof order] ?? 0)
      );
    });

    // Phase 2B is a single-pillar deep dive: the report covers ONE pillar, so
    // the multi-pillar summary (overall score card + bar chart + summary rows)
    // doesn't apply. The pillar's own page already carries its score visual.
    const isSinglePillar = phase === Phase.PHASE2B;

    // ── Page 1 — Cover ─────────────────────────────────────
    drawCoverPage(doc, businessName, phaseLabel(phase), dateStr);

    // ── Page 2 — Summary / total score (multi-pillar only) ─
    if (!isSinglePillar) {
      doc.addPage();
      drawHeader(doc, businessName, dateStr);
      drawOverallScore(
        doc,
        result.totalScore,
        result.colorBand,
        result.hasAnyKnockout,
        result.pillarScores.length
      );
      drawScoreChart(doc, sortedWorstFirst);
      drawSectionTitle(doc, 'Pillar Summary');
      for (const pillar of sortedWorstFirst) {
        drawPillarRow(
          doc,
          pillar.pillarCode,
          pillar.pillarName,
          pillar.weightedScore,
          pillar.colorBand
        );
      }
    }

    // ── Per-pillar pages ───────────────────────────────────
    for (const pillar of sortedWorstFirst) {
      doc.addPage();
      drawPillarPage(doc, pillar, businessName, dateStr);
    }

    // ── Next steps page ────────────────────────────────────
    doc.addPage();
    drawNextStepsPage(doc, result, phase, businessName, dateStr);

    // ── Footer on every page EXCEPT the cover ──────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start + 1; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawFooter(doc);
    }

    doc.end();
  });
}
