class MobileNetV2PyTorchService {
    async initialize(): Promise<void> {
        throw new Error('Model support disabled (NO_MODEL_INSTALLED)');
    }

    async predict(_: Buffer): Promise<any> {
        throw new Error('Model support disabled (NO_MODEL_INSTALLED)');
    }

    getModelInfo() {
        return {
            name: 'Model support disabled',
            architecture: 'none',
            format: 'none',
            size: '0',
            classes: 0,
            path: ''
        };
    }
}

const mobilenetV2Service = new MobileNetV2PyTorchService();
export default mobilenetV2Service;
