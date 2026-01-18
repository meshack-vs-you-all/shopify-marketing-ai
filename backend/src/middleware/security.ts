/**
 * Security Middleware
 * 
 * HTTPS enforcement and security headers (B5 requirement)
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Enforce HTTPS in production
 * Railway terminates TLS, so we check X-Forwarded-Proto header
 */
export function enforceHttps(req: Request, res: Response, next: NextFunction) {
    // Skip in development
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    // Check X-Forwarded-Proto header (set by Railway/proxy)
    const proto = req.get('X-Forwarded-Proto');

    if (proto && proto !== 'https') {
        const httpsUrl = `https://${req.get('host')}${req.originalUrl}`;
        logger.warn('Redirecting HTTP to HTTPS', { from: req.originalUrl, to: httpsUrl });
        return res.redirect(301, httpsUrl);
    }

    next();
}

/**
 * Set secure cookie options for production
 */
export function getSecureCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction, // Only send over HTTPS in production
        sameSite: isProduction ? 'strict' as const : 'lax' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
}

/**
 * Security headers for API responses
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Remove X-Powered-By
    res.removeHeader('X-Powered-By');

    next();
}

export default {
    enforceHttps,
    getSecureCookieOptions,
    securityHeaders,
};
