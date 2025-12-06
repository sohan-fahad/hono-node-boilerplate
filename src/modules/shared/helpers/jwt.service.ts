import * as jose from 'jose';
import { Injectable } from '@wilt';
import { ENV } from '@src/env.js';

interface TokenPayload {
    [key: string]: any;
    iat?: number;
    exp?: number;
    nbf?: number;
    sub?: string;
    jti?: string;
}

@Injectable()
export class JwtService {
    private secret: Uint8Array;

    constructor() {
        this.secret = new TextEncoder().encode(ENV.JWT.secret);
    }

    /**
     * Sign a JWT token
     */
    async sign(payload: any, options: { expiresIn: string }): Promise<string> {
        const jwt = new jose.SignJWT(payload)
            .setProtectedHeader({
                alg: 'HS256',
                typ: 'JWT'
            })
            .setIssuedAt()
            .setExpirationTime(options.expiresIn);

        // Add subject if payload has id
        if (payload.id) {
            jwt.setSubject(String(payload.id));
        }

        return await jwt.sign(this.secret);
    }

    /**
     * Verify a JWT token
     */
    async verify(token: string): Promise<TokenPayload | null> {
        try {
            const { payload } = await jose.jwtVerify(token, this.secret);
            return payload as TokenPayload;
        } catch (error) {
            return null;
        }
    }

    /**
     * Decode token without verification (use with caution)
     */
    decode(token: string): TokenPayload | null {
        try {
            const decoded = jose.decodeJwt(token);
            return decoded as TokenPayload;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if JWT token is expired
     */
    isJwtExpired(exp?: number): boolean {
        if (!exp) return true;

        const expirationDate = new Date(exp * 1000);
        const now = new Date();

        return now >= expirationDate;
    }

    /**
     * Extract token from Bearer header
     */
    extractToken(bearerToken: string): string {
        if (!bearerToken) return '';
        return bearerToken.replace(/Bearer\s+/i, '').trim();
    }

    /**
     * Verify if token is expired
     */
    async isExpiredToken(token: string): Promise<boolean> {
        const payload = await this.verify(token);

        if (!payload) return true;

        return this.isJwtExpired(payload.exp);
    }
}
