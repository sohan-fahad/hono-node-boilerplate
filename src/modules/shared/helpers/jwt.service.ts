import * as jwt from 'jsonwebtoken';
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
        return await jwt.sign({
            exp: options.expiresIn,
            data: payload
        }, ENV.JWT.secret);
    }

    /**
     * Verify a JWT token
     */
    async verify(token: string): Promise<TokenPayload | null> {
        try {
            return await jwt.verify(token, ENV.JWT.secret) as TokenPayload;
        } catch (error) {
            return null;
        }
    }
    /**
     * Decode JWT token
     */
    decode(token: string): TokenPayload | null {
        try {
            return jwt.decode(token) as TokenPayload;
        } catch (error) {
            return null;
        }
    }

    /**
    * Check if JWT token is expired
    */
    isExpired(token: string): boolean {
        const decoded = this.decode(token);
        if (!decoded) return true;
        return (decoded.exp && decoded.exp < Date.now() / 1000) as boolean;
    }
}
