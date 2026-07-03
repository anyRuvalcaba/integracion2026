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
import Cart from "../../models/Cart.js";

const app = createApp();
useTestDatabase();

// ─── GET /api/cart (admin only) ───────────────────────────────────────────────

describe("GET /api/cart", () => {
  it("IT-CART-001: 401 sin token", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("IT-CART-002: 403 con token de customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  it("IT-CART-003: 200 con token de admin devuelve array", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── GET /api/cart/:id (admin only) ──────────────────────────────────────────

describe("GET /api/cart/:id", () => {
  it("IT-CART-013: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).get(`/api/cart/${fakeId}`);
    expect(res.status).toBe(401);
  });

  it("IT-CART-014: 403 con token de customer", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .get(`/api/cart/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  it("IT-CART-015: 404 si cart no existe", async () => {
    const admin = await createAdmin();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .get(`/api/cart/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Cart not found");
  });

  it("IT-CART-016: 200 devuelve cart con user y products populados", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    const cart = await Cart.create({
      user: customer._id,
      products: [{ product: prod._id, quantity: 3 }],
    });

    const res = await request(app)
      .get(`/api/cart/${cart._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(cart._id.toString());
    expect(res.body.user).toHaveProperty("_id", customer._id.toString());
    expect(res.body.products[0].product).toHaveProperty("_id", prod._id.toString());
    expect(res.body.products[0].quantity).toBe(3);
  });
});

// ─── GET /api/cart/user/:id ───────────────────────────────────────────────────

describe("GET /api/cart/user/:id", () => {
  it("IT-CART-004: 401 sin token", async () => {
    const customer = await createCustomer();
    const res = await request(app).get(`/api/cart/user/${customer._id}`);
    expect(res.status).toBe(401);
  });

  it("IT-CART-005: 404 si el usuario no tiene carrito", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get(`/api/cart/user/${customer._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No cart found for this user");
  });

  it("IT-CART-006: 200 con user y products populados si existe carrito", async () => {
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    await Cart.create({
      user: customer._id,
      products: [{ product: prod._id, quantity: 2 }],
    });

    const res = await request(app)
      .get(`/api/cart/user/${customer._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("_id", customer._id.toString());
    expect(res.body.products[0].product).toHaveProperty("_id", prod._id.toString());
    expect(res.body.products[0].quantity).toBe(2);
  });
});

// ─── POST /api/cart ───────────────────────────────────────────────────────────

describe("POST /api/cart", () => {
  it("IT-CART-007: 401 sin token", async () => {
    const res = await request(app).post("/api/cart").send({});
    expect(res.status).toBe(401);
  });

  it("IT-CART-017: 422 si user no es MongoId válido", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ user: "not-a-mongo-id", products: [] });
    expect(res.status).toBe(422);
  });

  it("IT-CART-018: 422 si quantity es 0", async () => {
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({
        user: customer._id,
        products: [{ product: prod._id, quantity: 0 }],
      });
    expect(res.status).toBe(422);
  });

  it("IT-CART-008: 201 crea carrito con user y products", async () => {
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({
        user: customer._id,
        products: [{ product: prod._id, quantity: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.products).toHaveLength(1);
  });
});

// ─── PUT /api/cart/:id ────────────────────────────────────────────────────────

describe("PUT /api/cart/:id", () => {
  it("IT-CART-009: 200 actualiza productos del carrito", async () => {
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod1 = await createProduct(cat._id);
    const prod2 = await createProduct(cat._id);
    const cart = await Cart.create({
      user: customer._id,
      products: [{ product: prod1._id, quantity: 1 }],
    });

    const res = await request(app)
      .put(`/api/cart/${cart._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({
        user: customer._id,
        products: [
          { product: prod1._id, quantity: 3 },
          { product: prod2._id, quantity: 1 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
  });

  it("IT-CART-010: 404 si id de carrito no existe", async () => {
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    const fakeId = "64a9f2c3e4b0d1234567890a";

    const res = await request(app)
      .put(`/api/cart/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({
        user: customer._id,
        products: [{ product: prod._id, quantity: 1 }],
      });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/cart/:id ─────────────────────────────────────────────────────

describe("DELETE /api/cart/:id", () => {
  it("IT-CART-011: 204 borra el carrito", async () => {
    const customer = await createCustomer();
    const cart = await Cart.create({ user: customer._id, products: [] });

    const res = await request(app)
      .delete(`/api/cart/${cart._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(204);
  });

  it("IT-CART-012: 404 si cart no existe", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";

    const res = await request(app)
      .delete(`/api/cart/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Cart not found");
  });
});
