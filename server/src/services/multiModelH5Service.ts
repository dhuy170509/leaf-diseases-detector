// Minimal stub for MultiModelH5Service after HARD RESET

const MultiModelH5Service = {
    async initializeModels(): Promise<void> {
        // No-op: models are not loaded
        return;
    },

    async predictWithEnsemble(_imageBuffer: unknown): Promise<null> {
        return null;
    },

    getLoadedModelsCount(): number {
        return 0;
    },

    getModelList(): string[] {
        return [];
    }
};

export default MultiModelH5Service;
