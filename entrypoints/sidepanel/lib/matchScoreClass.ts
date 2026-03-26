export function matchScoreClass(score: number): string {
    if (score >= 80) return 'text-score-high';
    if (score >= 60) return 'text-score-medium';
    if (score >= 40) return 'text-score-low';
    return 'text-score-poor';
}
