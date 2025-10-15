import crypto from "crypto";
import {  type Response } from "express";

export default interface TokenData {
    email: string;
    token: string;
    word_usage: number;
    created_at: Date;
    end_at: Date;
}

// La map qui stocke les tokens en mémoire
export const tokenManager = new Map<string, TokenData>();

export function addToken(email: string): { msg: string; token: string | null } {
    const existing = tokenManager.get(email);
    const now = new Date();

    if (existing && now < existing.end_at) {
        return {
            msg: `Un token est déjà actif pour ${email} jusqu'à ${existing.end_at.toISOString()}`,
            token: existing.token
        };
    } else {
        const token = crypto.randomBytes(16).toString("hex");

        tokenManager.set(email, {
            email,
            token,
            word_usage: 0,
            created_at: now,
            end_at: new Date(now.getTime() + 86400 * 1000)
        });

        return {
            msg: `Token generated for ${email}`,
            token
        };
    }
}
function incrementTokenUsage(email: string) {
    const tokenData = tokenManager.get(email);
    if (tokenData) {
        tokenData.word_usage += 1;
        console.log(`Token usage for ${email} incremented by 1. New usage: ${tokenData.word_usage}`);
    }
}
export { incrementTokenUsage };