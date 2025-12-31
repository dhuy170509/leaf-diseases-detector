import { Request, Response } from 'express';

/**
 * Minimal predict controller — HARD RESET mode
 * - Validates image upload
 * - DOES NOT run any model or return predictions
 * - Always returns a standardized NO_MODEL_INSTALLED response
 */
export const predictController = async (req: Request, res: Response) => {
    try {
        const image = req.file?.buffer;
        if (!image) {
            return res.status(400).json({
                error: 'No image provided',
                message: 'Please upload an image file using the "image" field'
            });
        }

        return res.status(200).json({
            status: 'NO_MODEL_INSTALLED',
            message: 'No AI model is currently installed. Please add a model.'
        });
    } catch (err) {
        return res.status(500).json({
            status: 'ERROR',
            message: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};