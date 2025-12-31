// NewModelService: model-free stub for NO_MODEL_INSTALLED state

const NewModelService = {
    async initialize(): Promise<void> {
        // Intentionally no-op; model functionality disabled
        return;
    },

    async predictWithBestModel(_imageData: Buffer): Promise<null> {
        return null;
    },

    async predictWithFallback(_imageData: Buffer): Promise<null> {
        return null;
    },

    getAvailableModels(): any[] {
        return [];
    }
};

export default NewModelService;
