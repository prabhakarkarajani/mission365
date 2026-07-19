import type { CategoryBreakdownEntry } from './categoryBreakdown';
import { CATEGORY_LABELS } from './categoryBreakdown';

/**
 * Deterministic, rule-based insight over real completion data — not a
 * live model call. The app's AI provider is keyword-matched (see
 * src/ai/providers/mock), so it can't meaningfully reason over custom
 * stats yet; this stays honest about what it is rather than dressing a
 * canned reply up as personalized AI analysis.
 */
export function buildWeeklyInsight(breakdown: CategoryBreakdownEntry[]): string | null {
  const withData = breakdown.filter((b) => b.possible > 0);
  if (withData.length === 0) return null;

  const weakest = withData[withData.length - 1];
  const strongest = withData[0];

  if (withData.length === 1) {
    return `Your ${CATEGORY_LABELS[weakest.category]} missions are at ${weakest.completionPercent}% this week.`;
  }

  if (weakest.completionPercent >= 80) {
    return `Strong week across the board — every category is at ${weakest.completionPercent}% or higher.`;
  }

  return `${CATEGORY_LABELS[strongest.category]} is your strongest category at ${strongest.completionPercent}%. ${CATEGORY_LABELS[weakest.category]} is lagging at ${weakest.completionPercent}% — that's the best place to focus next week.`;
}
