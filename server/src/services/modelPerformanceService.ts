/**
 * modelPerformanceService.ts — HARD RESET stub
 * Removed all performance and voting logic. Provides minimal no-op methods
 * so feedback and performance APIs remain callable but return empty data.
 */

export default {
    recordFeedback: async (_feedback: any) => {
        // no-op
    },
    getModelPerformance: (_modelName: string) => null,
    getModelPerformances: () => [],
    getLeaderboard: () => [],
    getPerformanceSummary: () => ({ totalModels: 0, feedbackCount: 0 }),
    getVotingWeights: () => ({})
};
