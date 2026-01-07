import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email?: string;
    };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid authorization header'
        });
    }

    const token = authHeader.substring(7);

    try {
        // Decode the JWT token manually to extract claims
        // Note: This doesn't validate the signature, just extracts the payload
        // Signature validation would require firebase-admin
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        // Decode the payload (second part)
        const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
        );

        if (!payload.sub && !payload.uid) {
            throw new Error('No user ID found in token');
        }

        req.user = {
            uid: payload.sub || payload.uid,
            email: payload.email
        };

        next();
    } catch (error: any) {
        console.error('Token parsing failed:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
}
