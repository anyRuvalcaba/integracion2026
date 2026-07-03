import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../helpers/createApp.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAdmin, createCustomer, tokenFor } from "../helpers/fixtures.js";

const app = createApp();
useTestDatabase();

// ─── GET /api/users (admin only) ──────────────────────────────────────────────

describe("GET /api/users", () => {
  it("IT-USR-001: 401 sin token", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("IT-USR-002: 403 con token de customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  it("IT-USR-003: 200 admin — array de usuarios sin campo password", async () => {
    const admin = await createAdmin();
    await createCustomer();
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((u) => expect(u).not.toHaveProperty("password"));
  });
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

describe("GET /api/users/:id", () => {
  it("IT-USR-004: 404 si id no existe", async () => {
    const admin = await createAdmin();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  it("IT-USR-005: 200 — response sin campo password", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const res = await request(app)
      .get(`/api/users/${customer._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("password");
  });
});

// ─── POST /api/users ──────────────────────────────────────────────────────────

describe("POST /api/users", () => {
  const ENDPOINT = "/api/users";

  it("IT-USR-006: 401 sin token", async () => {
    const res = await request(app).post(ENDPOINT).send({});
    expect(res.status).toBe(401);
  });

  it("IT-USR-007: 422 si email es inválido", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "Test", email: "not-an-email", password: "Pass123!", role: "customer" });
    expect(res.status).toBe(422);
  });

  it("IT-USR-008: 422 si password tiene menos de 6 caracteres", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "Test", email: "valid@test.com", password: "123", role: "customer" });
    expect(res.status).toBe(422);
  });

  it("IT-USR-009: 201 con datos válidos — response sin password", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "Nuevo", email: "nuevo@test.com", password: "Pass123!", role: "customer" });
    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty("password");
    expect(res.body.email).toBe("nuevo@test.com");
  });
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────

describe("PUT /api/users/:id", () => {
  it("IT-USR-010: PUT /users/:id → 200 actualiza sin requerir password", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const res = await request(app)
      .put(`/api/users/${customer._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "Nombre Nuevo", email: "nuevo@test.com", role: "customer" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Nombre Nuevo");
    expect(res.body).not.toHaveProperty("password");
  });
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────

describe("DELETE /api/users/:id", () => {
  it("IT-USR-011: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).delete(`/api/users/${fakeId}`);
    expect(res.status).toBe(401);
  });

  it("IT-USR-012: 204 borra usuario (admin)", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const res = await request(app)
      .delete(`/api/users/${customer._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(204);
  });

  it("IT-USR-013: 404 si id no existe", async () => {
    const admin = await createAdmin();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .delete(`/api/users/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(404);
  });
});
