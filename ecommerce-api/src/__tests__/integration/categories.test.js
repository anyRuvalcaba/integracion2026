import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../helpers/createApp.js";
import { useTestDatabase } from "../helpers/db.js";
import {
  createAdmin,
  createCustomer,
  createCategory,
  createSubCategory,
  createProduct,
  tokenFor,
} from "../helpers/fixtures.js";

const app = createApp();
useTestDatabase();

// ─── GET /api/categories ──────────────────────────────────────────────────────

describe("GET /api/categories", () => {
  it("IT-CAT-001: 200 con array de categorías (ruta pública)", async () => {
    await createCategory({ name: "Celulares" });
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── GET /api/categories/:id ──────────────────────────────────────────────────

describe("GET /api/categories/:id", () => {
  it("IT-CAT-002: 200 con category y parentCategory populada", async () => {
    const main = await createCategory({ name: "Tecnología" });
    const sub = await createSubCategory(main._id, { name: "Audio" });

    const res = await request(app).get(`/api/categories/${sub._id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Audio");
    expect(res.body.parentCategory).toHaveProperty("name", "Tecnología");
  });

  it("IT-CAT-003: 404 si id no existe", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).get(`/api/categories/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Category not found");
  });
});

// ─── GET /api/categories/:id/products ────────────────────────────────────────

describe("GET /api/categories/:id/products", () => {
  it("IT-CAT-004: 200 devuelve productos de la categoría y sus subcategorías", async () => {
    const main = await createCategory({ name: "Gadgets" });
    const sub = await createSubCategory(main._id, { name: "Relojes" });
    await createProduct(main._id);      // producto directo en main
    await createProduct(sub._id);       // producto en subcategoría

    const res = await request(app).get(`/api/categories/${main._id}/products`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("products");
    expect(res.body.products.length).toBe(2);
  });

  it("IT-CAT-005: 404 si la categoría no existe", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).get(`/api/categories/${fakeId}/products`);
    expect(res.status).toBe(404);
  });

  it("IT-CAT-006: response incluye pagination", async () => {
    const cat = await createCategory();
    const res = await request(app).get(`/api/categories/${cat._id}/products`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("pagination");
  });
});

// ─── POST /api/categories ─────────────────────────────────────────────────────

describe("POST /api/categories", () => {
  const ENDPOINT = "/api/categories";
  const VALID_BODY = { name: "Nueva Cat", description: "Descripción válida" };

  it("IT-CAT-007: 401 sin token", async () => {
    const res = await request(app).post(ENDPOINT).send(VALID_BODY);
    expect(res.status).toBe(401);
  });

  it("IT-CAT-008: 403 con token de customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  it("IT-CAT-009: 422 si name está vacío", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ description: "Sin nombre" });
    expect(res.status).toBe(422);
  });

  it("IT-CAT-010: 422 si description está vacía", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "Sin desc" });
    expect(res.status).toBe(422);
  });

  it("IT-CAT-011: 201 categoría principal (sin parentCategory)", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send(VALID_BODY);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Nueva Cat");
    expect(res.body.parentCategory).toBeNull();
  });

  it("IT-CAT-012: 201 subcategoría con parentCategory válido", async () => {
    const admin = await createAdmin();
    const parent = await createCategory({ name: "Parent" });
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ ...VALID_BODY, parentCategory: parent._id });
    expect(res.status).toBe(201);
    expect(res.body.parentCategory).toHaveProperty("_id", parent._id.toString());
  });
});

// ─── PUT /api/categories/:id ──────────────────────────────────────────────────

describe("PUT /api/categories/:id", () => {
  it("IT-CAT-013: 200 actualiza nombre y description", async () => {
    const admin = await createAdmin();
    const cat = await createCategory({ name: "Viejo", description: "Vieja desc" });

    const res = await request(app)
      .put(`/api/categories/${cat._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "Nuevo", description: "Nueva desc" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Nuevo");
  });

  it("IT-CAT-014: 404 si id no existe", async () => {
    const admin = await createAdmin();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .put(`/api/categories/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "X", description: "Y" });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/categories/:id ───────────────────────────────────────────────

describe("DELETE /api/categories/:id", () => {
  it("IT-CAT-015: 204 sin body (delete exitoso)", async () => {
    const admin = await createAdmin();
    const cat = await createCategory();
    const res = await request(app)
      .delete(`/api/categories/${cat._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it("IT-CAT-016: 404 si id no existe", async () => {
    const admin = await createAdmin();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .delete(`/api/categories/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(404);
  });
});
