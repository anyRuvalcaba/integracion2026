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
import WishList from "../../models/WhishList.js";

const app = createApp();
useTestDatabase();

// ─── GET /api/wishlist (admin only) ───────────────────────────────────────────

describe("GET /api/wishlist", () => {
  it("IT-WISH-001: 401 sin token", async () => {
    const res = await request(app).get("/api/wishlist");
    expect(res.status).toBe(401);
  });

  it("IT-WISH-002: 403 con token de customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/api/wishlist")
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  it("IT-WISH-003: 200 con array de wishlists (admin)", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get("/api/wishlist")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── GET /api/wishlist/user/:id ───────────────────────────────────────────────

describe("GET /api/wishlist/user/:id", () => {
  it("IT-WISH-004: 401 sin token", async () => {
    const customer = await createCustomer();
    const res = await request(app).get(`/api/wishlist/user/${customer._id}`);
    expect(res.status).toBe(401);
  });

  it("IT-WISH-005: 404 si el usuario no tiene wishlist", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get(`/api/wishlist/user/${customer._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Wishlist not found");
  });

  it("IT-WISH-006: 200 con wishlist y products populados", async () => {
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    await WishList.create({ user: customer._id, products: [prod._id] });

    const res = await request(app)
      .get(`/api/wishlist/user/${customer._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0]).toHaveProperty("_id", prod._id.toString());
  });
});

// ─── POST /api/wishlist ───────────────────────────────────────────────────────

describe("POST /api/wishlist", () => {
  it("IT-WISH-007: 401 sin token", async () => {
    const res = await request(app).post("/api/wishlist").send({});
    expect(res.status).toBe(401);
  });

  it("IT-WISH-008: crea nueva wishlist si el usuario no tenía una", async () => {
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    const res = await request(app)
      .post("/api/wishlist")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ userId: customer._id, productId: prod._id });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0]).toHaveProperty("_id", prod._id.toString());
  });

  it("IT-WISH-009: agrega producto a wishlist existente", async () => {
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod1 = await createProduct(cat._id);
    const prod2 = await createProduct(cat._id);
    await WishList.create({ user: customer._id, products: [prod1._id] });

    const res = await request(app)
      .post("/api/wishlist")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ userId: customer._id, productId: prod2._id });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
  });

  it("IT-WISH-010: producto duplicado → 200 con mensaje (no crea duplicado)", async () => {
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    await WishList.create({ user: customer._id, products: [prod._id] });

    const res = await request(app)
      .post("/api/wishlist")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ userId: customer._id, productId: prod._id });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Product already in wishlist");
    // Lista no debe tener duplicados
    expect(res.body.wishlist.products).toHaveLength(1);
  });
});

// ─── DELETE /api/wishlist/:id/product ────────────────────────────────────────

describe("DELETE /api/wishlist/:id/product", () => {
  it("IT-WISH-011: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .delete(`/api/wishlist/${fakeId}/product`)
      .send({ productId: fakeId });
    expect(res.status).toBe(401);
  });

  it("IT-WISH-012: 200 elimina el producto de la wishlist", async () => {
    const customer = await createCustomer();
    const cat = await createCategory();
    const prod1 = await createProduct(cat._id);
    const prod2 = await createProduct(cat._id);
    const wishlist = await WishList.create({
      user: customer._id,
      products: [prod1._id, prod2._id],
    });

    const res = await request(app)
      .delete(`/api/wishlist/${wishlist._id}/product`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ productId: prod1._id });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0]._id).toBe(prod2._id.toString());
  });

  it("IT-WISH-013: 404 si wishlist no existe", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .delete(`/api/wishlist/${fakeId}/product`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ productId: fakeId });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/wishlist/:id ─────────────────────────────────────────────────

describe("DELETE /api/wishlist/:id", () => {
  it("IT-WISH-014: 204 borra wishlist completa (admin)", async () => {
    const customer = await createCustomer();
    const admin = await createAdmin();
    const wishlist = await WishList.create({ user: customer._id, products: [] });

    const res = await request(app)
      .delete(`/api/wishlist/${wishlist._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(204);
  });

  it("IT-WISH-015: 404 si wishlist no existe (admin)", async () => {
    const admin = await createAdmin();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .delete(`/api/wishlist/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(404);
  });

  it("IT-WISH-016: 403 si un customer intenta borrar una wishlist", async () => {
    const customer = await createCustomer();
    const wishlist = await WishList.create({ user: customer._id, products: [] });

    const res = await request(app)
      .delete(`/api/wishlist/${wishlist._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(403);
  });
});
