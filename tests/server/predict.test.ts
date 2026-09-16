import request from 'supertest';
import { Jimp } from 'jimp';
import app from '../../server/src/index';

async function solidPng(color: number, w = 224, h = 224): Promise<Buffer> {
    const image = new Jimp({ width: w, height: h, color });
    return image.getBuffer('image/png');
}

describe('POST /api/predict (single real pipeline: pixel-analysis-v1)', () => {
    let healthyPng: Buffer;
    let diseasedPng: Buffer;

    beforeAll(async () => {
        // Màu xanh lá ~ lá khỏe; màu nâu ~ lá bệnh đốm nâu
        healthyPng = await solidPng(0x228b22ff);
        diseasedPng = await solidPng(0x8b4513ff);
    });

    it('400 khi không gửi ảnh', async () => {
        const res = await request(app).post('/api/predict');
        expect(res.status).toBe(400);
    });

    it('400 khi gửi file không phải ảnh', async () => {
        const res = await request(app)
            .post('/api/predict')
            .attach('image', Buffer.from('not-an-image'), 'note.txt');
        expect([400, 500]).toContain(res.status);
    });

    it('lá khỏe và lá bệnh cho prediction khác nhau, không phải NO_MODEL_INSTALLED', async () => {
        const healthy = await request(app)
            .post('/api/predict')
            .attach('image', healthyPng, 'healthy.png');
        const diseased = await request(app)
            .post('/api/predict')
            .attach('image', diseasedPng, 'diseased.png');

        for (const res of [healthy, diseased]) {
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.status).not.toBe('NO_MODEL_INSTALLED');
            expect(typeof res.body.prediction).toBe('string');
            expect(typeof res.body.confidence).toBe('number');
            expect(typeof res.body.processing_time_ms).toBe('number');
            expect(typeof res.body.timestamp).toBe('string');
        }

        expect(healthy.body.prediction).not.toBe(diseased.body.prediction);
    });

    it('GET /api/models liệt kê đúng 1 model thật', async () => {
        const res = await request(app).get('/api/models');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.models)).toBe(true);
        expect(res.body.models.length).toBe(1);
        expect(res.body.models[0].status).toBe('OK');
    });
});
