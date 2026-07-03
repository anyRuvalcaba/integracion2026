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
import Address from "../../models/Address.js";
import PaymentMethod from "../../models/PaymentMethod.js";
import Order from "../../models/Order.js";

const app = createApp();
useTestDatabase();

// Helper: crea los datos necesarios para una orden válida
async function scaffoldOrder(userId) {
  const cat = await createCategory();
  const prod = await createProduct(cat._id, { price: 500, stock: 10 });
  const address = await Address.create({
    user: userId,
    address: "Av. Test 123",
    city: "CDMX",
    state: "CDMX",
    postalCode: "06600",
    country: "México",
    phone: "5512345678",
  });
  const payment = await PaymentMethod.create({
    user: userId,
    type: "cash_on_delivery",
  });
  return { prod, address, payment };
}

// ─── GET /api/orders (admin only) ─────────────────────────────────────────────

describe("GET /api/orders", () => {
  it("IT-ORD-001: 401 sin token", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });

  it("IT-ORD-002: 403 con token de customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  it("IT-ORD-003: 200 con array de órdenes (admin)", async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────

describe("GET /api/orders/:id", () => {
  it("IT-ORD-004: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).get(`/api/orders/${fakeId}`);
    expect(res.status).toBe(401);
  });

  it("IT-ORD-005: 404 si orden no existe", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .get(`/api/orders/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(404);
  });

  it("IT-ORD-006: 200 devuelve orden con relaciones populadas", async () => {
    const customer = await createCustomer();
    const { prod, address, payment } = await scaffoldOrder(customer._id);

    const order = await Order.create({
      user: customer._id,
      products: [{ productId: prod._id, quantity: 2, price: prod.price }],
      address: address._id,
      paymentMethod: payment._id,
      totalPrice: prod.price * 2,
      shippingCost: 0,
    });

    const res = await request(app)
      .get(`/api/orders/${order._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(order._id.toString());
  });
});

// ─── POST /api/orders ─────────────────────────────────────────────────────────

describe("POST /api/orders", () => {
  it("IT-ORD-007: 401 sin token", async () => {
    const res = await request(app).post("/api/orders").send({});
    expect(res.status).toBe(401);
  });

  it("IT-ORD-008: 422 si products está vacío", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ products: [] });
    expect(res.status).toBe(422);
  });

  it("IT-ORD-009: 201 crea orden con datos válidos", async () => {
    const customer = await createCustomer();
    const { prod, address, payment } = await scaffoldOrder(customer._id);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({
        user: customer._id,
        products: [{ productId: prod._id, quantity: 1, price: prod.price }],
        address: address._id,
        paymentMethod: payment._id,
        totalPrice: prod.price,
        shippingCost: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.status).toBe("pending");
    expect(res.body.paymentStatus).toBe("pending");
  });
});

// ─── PUT /api/orders/:id ──────────────────────────────────────────────────────

describe("PUT /api/orders/:id", () => {
  it("IT-ORD-010: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).put(`/api/orders/${fakeId}`).send({ status: "shipped" });
    expect(res.status).toBe(401);
  });

  it("IT-ORD-011: 422 si status es inválido según enum", async () => {
    const customer = await createCustomer();
    const { prod, address, payment } = await scaffoldOrder(customer._id);
    const order = await Order.create({
      user: customer._id,
      products: [{ productId: prod._id, quantity: 1, price: prod.price }],
      address: address._id,
      paymentMethod: payment._id,
      totalPrice: prod.price,
      shippingCost: 0,
    });

    const res = await request(app)
      .put(`/api/orders/${order._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ status: "invalid-status" });

    expect(res.status).toBe(422);
  });

  it("IT-ORD-012: 200 actualiza status y paymentStatus", async () => {
    const customer = await createCustomer();
    const { prod, address, payment } = await scaffoldOrder(customer._id);
    const order = await Order.create({
      user: customer._id,
      products: [{ productId: prod._id, quantity: 1, price: prod.price }],
      address: address._id,
      paymentMethod: payment._id,
      totalPrice: prod.price,
      shippingCost: 0,
    });

    const res = await request(app)
      .put(`/api/orders/${order._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ status: "processing", paymentStatus: "paid" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("processing");
    expect(res.body.paymentStatus).toBe("paid");
  });

  it("IT-ORD-013: 404 cuando orden no existe", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .put(`/api/orders/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ status: "shipped" });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Order not found");
  });
});
