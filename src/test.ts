import request from "supertest";
import express, {type Express } from "express";
import { addToken, tokenManager } from "./tokenManagement.js";
import app from "./index.js"; // si ton app est exportée (voir plus bas)

describe("Justify API", () => {
  let server: Express;
  let token: string;

  beforeAll(async () => {
    // Démarre ton app
    server = app;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("GET /api/ should return status 200 and welcome message", async () => {
    const res = await request(server).get("/api/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Justify API");
  });

  test("POST /api/generatetoken without email should return 400", async () => {
    const res = await request(server).post("/api/generatetoken").send({});
    expect(res.status).toBe(400);
    expect(res.text).toBe("Email is required");
  });

  test("POST /api/generatetoken should generate a valid token", async () => {
    const res = await request(server)
      .post("/api/generatetoken")
      .send({ email: "test@example.com" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Token generated");

    // extrait le token de la réponse
    const match = res.text.match(/Token generated: (\w+)/);
    expect(match).not.toBeNull();
    token = match && match[1] ? match[1] : "";
  });

  test("POST /api/justify without token should return 401", async () => {
    const res = await request(server)
      .post("/api/justify")
      .set("Content-Type", "text/plain")
      .send("Texte simple à justifier.");
    expect(res.status).toBe(401);
    expect(res.text).toBe("Token is required");
  });

  test("POST /api/justify with valid token should return justified text", async () => {
    const text = "Ceci est un texte de test qui doit être justifié sur 80 caractères maximum.";
    const res = await request(server)
      .post("/api/justify")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/plain")
      .send(text);

    expect(res.status).toBe(200);
    expect(res.type).toBe("text/plain");
    expect(res.text.length).toBeGreaterThan(0);
  });

  test("POST /api/justify with empty text should return 400", async () => {
    const res = await request(server)
      .post("/api/justify")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/plain")
      .send("");
    expect(res.status).toBe(400);
    expect(res.text).toBe("Text is required");
  });
});
