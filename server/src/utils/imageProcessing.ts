import { ImageData } from '../types.js';

export async function preprocessImage(data: ImageData): Promise<Buffer> {
    try {
        // placeholder: nếu dùng sharp hoặc jimp, xử lý ảnh ở đây
        if (data.buffer) return data.buffer;
        return Buffer.from('');
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error('Error processing image: ' + msg);
    }
}

export default { preprocessImage };