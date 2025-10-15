import { describe, test, expect } from 'vitest';
import request from "supertest";
import app from "./index.js";

describe("Justify API - Basic tests", () => {
    let token: string;

    test("GET /api/ should return 200", async () => {
        const res = await request(app).get("/api/");
        expect(res.status).toBe(200);
    });

    test("POST /api/generatetoken should generate a token", async () => {
        const res = await request(app)
            .post("/api/generatetoken")
            .send({ email: "test@example.com" })
            .set("Content-Type", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.msg).toBeDefined();

        // Récupère le token correctement depuis le JSON
        token = res.body.token!;
    });

    test("POST /api/justify without token returns 401", async () => {
        const res = await request(app)
            .post("/api/justify")
            .set("Content-Type", "text/plain")
            .send("Texte simple");
        expect(res.status).toBe(401);
    });

    test("POST /api/justify with token returns 200", async () => {
        const res = await request(app)
            .post("/api/justify")
            .set("Authorization", `Bearer ${token}`)
            .set("Content-Type", "text/plain")
            .send("Ceci est un texte de test pour justification.");

        // Teste que le serveur a bien accepté le token existant
        expect(res.status).toBe(200);
        expect(res.type).toBe("text/plain");
        expect(res.text).toContain("Ceci est un texte"); // Optionnel, vérifie le contenu
    });
});
