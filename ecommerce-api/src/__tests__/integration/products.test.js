import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../helpers/createApp.js";
import { useTestDatabase } from "../helpers/db.js";
import {
  createAdmin,
  createCustomer,
  createCategory,
  createProduct,
  tokenFor,
} from "../helpers/fixtures.js";

const app = createApp();
useTestDatabase();

// ─── GET /api/products ────────────────────────────────────────────────────────

describe("GET /api/products", () => {
  it("IT-PROD-001: 200 con pagination en response", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("products");
    expect(res.body).toHaveProperty("pagination");
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it("IT-PROD-002: solo devuelve productos con stock > 0", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { stock: 0 });
    await createProduct(cat._id, { stock: 5 });

    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products.every((p) => p.stock > 0)).toBe(true);
  });

  it("IT-PROD-003: paginación — page y limit desde query params", async () => {
    const cat = await createCategory();
    for (let i = 0; i < 6; i++) {
      await createProduct(cat._id, { stock: 10 });
    }

    const res = await request(app).get("/api/products?page=1&limit=3");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(3);
    expect(res.body.pagination.currentPage).toBe(1);
  });
});

// ─── GET /api/products/search ─────────────────────────────────────────────────

describe("GET /api/products/search", () => {
  it("IT-PROD-004: filtra por q (nombre) case-insensitive", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { name: "iPhone 15 Pro", stock: 5 });
    await createProduct(cat._id, { name: "Samsung Galaxy", stock: 5 });

    const res = await request(app).get("/api/products/search?q=iphone");
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThanOrEqual(1);
    expect(res.body.products.every((p) => /iphone/i.test(p.name))).toBe(true);
  });

  it("IT-PROD-005: filtra por minPrice y maxPrice", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { price: 500, stock: 5 });
    await createProduct(cat._id, { price: 2000, stock: 5 });

    const res = await request(app).get("/api/products/search?minPrice=400&maxPrice=600");
    expect(res.status).toBe(200);
    expect(res.body.products.every((p) => p.price >= 400 && p.price <= 600)).toBe(true);
  });

  it("IT-PROD-006: inStock=true solo devuelve productos con stock > 0", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { stock: 0 });
    await createProduct(cat._id, { stock: 10 });

    const res = await request(app).get("/api/products/search?inStock=true");
    expect(res.status).toBe(200);
    expect(res.body.products.every((p) => p.stock > 0)).toBe(true);
  });
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────

describe("GET /api/products/:id", () => {
  it("IT-PROD-007: 200 con product y category populada", async () => {
    const cat = await createCategory({ name: "Gadgets" });
    const prod = await createProduct(cat._id);

    const res = await request(app).get(`/api/products/${prod._id}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(prod._id.toString());
    expect(res.body.category).toHaveProperty("name", "Gadgets");
  });

  it("IT-PROD-008: 404 si el id no existe", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Product not found");
  });
});

// ─── POST /api/products ───────────────────────────────────────────────────────

describe("POST /api/products", () => {
  const ENDPOINT = "/api/products";

  it("IT-PROD-009: 401 sin token", async () => {
    const res = await request(app).post(ENDPOINT).send({ name: "X", price: 1 });
    expect(res.status).toBe(401);
  });

  it("IT-PROD-010: 401 con token inválido", async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", "Bearer not.a.valid.jwt")
      .send({ name: "X", price: 1 });
    expect(res.status).toBe(401);
  });

  it("IT-PROD-011: 403 con token de customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ name: "X", price: 1 });
    expect(res.status).toBe(403);
  });

  it("IT-PROD-012: 422 si name está vacío", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ price: 100 });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("errors");
  });

  it("IT-PROD-013: 422 si price es negativo", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "Producto", price: -1 });
    expect(res.status).toBe(422);
  });

  it("IT-PROD-014: 201 con datos válidos y admin token", async () => {
    const admin = await createAdmin();
    const cat = await createCategory();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "Nuevo Producto", price: 299, stock: 5, category: cat._id });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Nuevo Producto");
    expect(res.body.price).toBe(299);
    expect(res.body.category).toHaveProperty("_id", cat._id.toString());
  });
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────

describe("PUT /api/products/:id", () => {
  it("IT-PROD-015: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).put(`/api/products/${fakeId}`).send({ name: "X" });
    expect(res.status).toBe(401);
  });

  it("IT-PROD-016: 403 con token de customer", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .put(`/api/products/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ name: "X" });
    expect(res.status).toBe(403);
  });

  it("IT-PROD-017: 200 actualiza nombre y precio", async () => {
    const admin = await createAdmin();
    const cat = await createCategory();
    const prod = await createProduct(cat._id, { name: "Original", price: 100 });

    const res = await request(app)
      .put(`/api/products/${prod._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "Actualizado", price: 250 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Actualizado");
    expect(res.body.price).toBe(250);
  });

  it("IT-PROD-018: 404 si id no existe", async () => {
    const admin = await createAdmin();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .put(`/api/products/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ name: "X", price: 10 });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────

describe("DELETE /api/products/:id", () => {
  it("IT-PROD-019: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).delete(`/api/products/${fakeId}`);
    expect(res.status).toBe(401);
  });

  it("IT-PROD-020: 403 con token de customer", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .delete(`/api/products/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  it("IT-PROD-021: 204 sin body (delete exitoso)", async () => {
    const admin = await createAdmin();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    const res = await request(app)
      .delete(`/api/products/${prod._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it("IT-PROD-022: 404 si id no existe", async () => {
    const admin = await createAdmin();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .delete(`/api/products/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(404);
  });
});
