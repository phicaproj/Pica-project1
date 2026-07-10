export const phaseLabels = {
  PHASE1: 'Business Snapshot',
  PHASE2A: 'Strategic Scan',
  PHASE2B: 'Deep Dive Module',
} as const;

export type PhaseKey = keyof typeof phaseLabels;

export function getPhaseLabel(phase: string | null | undefined): string {
  if (!phase) return '';
  const clean = phase.toUpperCase();
  if (clean in phaseLabels) {
    return phaseLabels[clean as PhaseKey];
  }
  return phase;
}
