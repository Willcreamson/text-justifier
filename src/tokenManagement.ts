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

export function addToken(email: string, res : Response) {
    const existing = tokenManager.get(email);

    if (existing) {
        const now = new Date();
        if (now < existing.end_at) {
            console.log(`Un token est déjà actif pour ${email} jusqu'à ${existing.end_at}`);
            return; // On ne remplace pas le token
        }
    }
    const token = crypto.randomBytes(16).toString("hex");

    // Sinon on crée un nouveau token
    tokenManager.set(email, {
        email,
        token,
        word_usage: 0, // 80k caractères
        created_at: new Date(),
        end_at: new Date(Date.now() + 86400 * 1000) // 1 jour
    });

    console.log(`Nouveau token créé pour ${email} : ${token}`);
    res.send(`Token generated: ${token} from email: ${email}`);
}

function incrementTokenUsage(email: string) {
    const tokenData = tokenManager.get(email);
    if (tokenData) {
        tokenData.word_usage += 1;
        console.log(`Token usage for ${email} incremented by 1. New usage: ${tokenData.word_usage}`);
    }
}
export { incrementTokenUsage };