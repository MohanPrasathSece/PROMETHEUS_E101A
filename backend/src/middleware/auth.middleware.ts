import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email?: string;
        name?: string;
        picture?: string;
    };
}

/**
 * Middleware to verify Google Access Token or ID Token
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid authorization header'
        });
    }

    const token = authHeader.substring(7);

    try {
        // Verify token with Google's tokeninfo endpoint
        // This works for both Access Tokens and ID Tokens
        const response = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);

        const payload = response.data;

        if (payload.error_description) {
            throw new Error(payload.error_description);
        }

        // Token is valid
        req.user = {
            uid: payload.sub,
            email: payload.email,
            name: payload.name || '',
            picture: payload.picture || ''
        };

        next();
    } catch (error: any) {
        // Fallback: Check if it's an ID token (JWT)
        try {
            const response = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
            const payload = response.data;

            req.user = {
                uid: payload.sub,
                email: payload.email,
                name: payload.name || '',
                picture: payload.picture || ''
            };
            next();
        } catch (innerError: any) {
            console.error('Authentication failed:', error.message);
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }
    }
}
