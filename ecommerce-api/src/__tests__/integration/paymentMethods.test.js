import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../helpers/createApp.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAdmin, createCustomer, tokenFor } from "../helpers/fixtures.js";
import PaymentMethod from "../../models/PaymentMethod.js";

const app = createApp();
useTestDatabase();

// Helper: crea un PaymentMethod para un usuario dado
async function createPM(userId, overrides = {}) {
  return PaymentMethod.create({
    user: userId,
    type: "cash_on_delivery",
    isDefault: false,
    isActive: true,
    ...overrides,
  });
}

// ─── GET /api/payment-methods (admin only) ────────────────────────────────────

describe("GET /api/payment-methods", () => {
  it("IT-PAY-001: 401 sin token", async () => {
    const res = await request(app).get("/api/payment-methods");
    expect(res.status).toBe(401);
  });

  it("IT-PAY-002: 403 con token de customer", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/api/payment-methods")
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  it("IT-PAY-003: 200 array de métodos de pago (admin)", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    await createPM(customer._id);

    const res = await request(app)
      .get("/api/payment-methods")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty("user");
  });
});

// ─── GET /api/payment-methods/:id (admin only) ───────────────────────────────

describe("GET /api/payment-methods/:id", () => {
  it("IT-PAY-004: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).get(`/api/payment-methods/${fakeId}`);
    expect(res.status).toBe(401);
  });

  it("IT-PAY-005: 403 con customer token (admin only)", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .get(`/api/payment-methods/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  it("IT-PAY-006: 404 si id no existe", async () => {
    const admin = await createAdmin();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .get(`/api/payment-methods/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Payment method not found");
  });

  it("IT-PAY-007: 200 con user populado", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const pm = await createPM(customer._id, { type: "paypal", paypalEmail: "test@paypal.com" });

    const res = await request(app)
      .get(`/api/payment-methods/${pm._id}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(pm._id.toString());
    expect(res.body.user).toHaveProperty("_id", customer._id.toString());
    expect(res.body.type).toBe("paypal");
  });
});

// ─── POST /api/payment-methods (auth) ────────────────────────────────────────

describe("POST /api/payment-methods", () => {
  const ENDPOINT = "/api/payment-methods";

  it("IT-PAY-008: sin token → 401 (authMiddleware detiene la cadena antes que validate)", async () => {
    // paymentMethodRoutes.js línea 80-86 declara: createPaymentValidation → authMiddleware → validate → controller
    // El orden no sigue el patrón del proyecto (auth primero), pero el comportamiento
    // observable es correcto: createPaymentValidation solo colecciona errores (no responde),
    // authMiddleware envía 401 y detiene la cadena antes de que validate pueda enviar 422.
    // Ref: patrón correcto en CLAUDE.md = authMiddleware → validators → validate → controller
    const res = await request(app).post(ENDPOINT).send({});
    expect(res.status).toBe(401);
  });

  it("IT-PAY-009: con token válido pero sin user → 422", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ type: "cash_on_delivery" }); // falta user
    expect(res.status).toBe(422);
  });

  it("IT-PAY-010: type inválido → 422", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ user: customer._id, type: "bitcoin" });
    expect(res.status).toBe(422);
  });

  it("IT-PAY-011: 201 cash_on_delivery con datos válidos", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ user: customer._id, type: "cash_on_delivery" });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe("cash_on_delivery");
    expect(res.body.user).toHaveProperty("_id", customer._id.toString());
  });

  it("IT-PAY-012: 201 credit_card con cardNumber y cardHolderName", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({
        user: customer._id,
        type: "credit_card",
        cardNumber: "4111111111111111",
        cardHolderName: "Alice Customer",
        expiryDate: "12/27",
        cvv: "123",
        isDefault: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe("credit_card");
    expect(res.body.cardNumber).toBe("4111111111111111");
    expect(res.body).not.toHaveProperty("cvv");
  });

  it("IT-PAY-013: isDefault=true desactiva otros métodos del usuario", async () => {
    const customer = await createCustomer();
    // Primer método como default
    const pm1 = await createPM(customer._id, { isDefault: true });
    expect(pm1.isDefault).toBe(true);

    // Crear segundo método con isDefault=true
    const res = await request(app)
      .post(ENDPOINT)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ user: customer._id, type: "paypal", paypalEmail: "t@p.com", isDefault: true });

    expect(res.status).toBe(201);
    expect(res.body.isDefault).toBe(true);

    // El primer método debe quedar en isDefault=false
    const refreshedPm1 = await PaymentMethod.findById(pm1._id);
    expect(refreshedPm1.isDefault).toBe(false);
  });
});

// ─── PUT /api/payment-methods/:id (auth) ─────────────────────────────────────

describe("PUT /api/payment-methods/:id", () => {
  it("IT-PAY-014: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).put(`/api/payment-methods/${fakeId}`).send({});
    expect(res.status).toBe(401);
  });

  it("IT-PAY-015: 404 si id no existe", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .put(`/api/payment-methods/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ type: "paypal" });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Payment method not found");
  });

  it("IT-PAY-016: 200 actualiza type", async () => {
    const customer = await createCustomer();
    const pm = await createPM(customer._id, { type: "cash_on_delivery" });

    const res = await request(app)
      .put(`/api/payment-methods/${pm._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ type: "bank_transfer", bankName: "BBVA" });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe("bank_transfer");
  });

  it("IT-PAY-017: isDefault=true desactiva otros métodos del mismo usuario", async () => {
    const customer = await createCustomer();
    const pm1 = await createPM(customer._id, { isDefault: true });
    const pm2 = await createPM(customer._id, { isDefault: false });

    const res = await request(app)
      .put(`/api/payment-methods/${pm2._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ isDefault: true });

    expect(res.status).toBe(200);
    expect(res.body.isDefault).toBe(true);

    const refreshedPm1 = await PaymentMethod.findById(pm1._id);
    expect(refreshedPm1.isDefault).toBe(false);
  });
});

// ─── DELETE /api/payment-methods/:id (auth) ───────────────────────────────────

describe("DELETE /api/payment-methods/:id", () => {
  it("IT-PAY-018: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).delete(`/api/payment-methods/${fakeId}`);
    expect(res.status).toBe(401);
  });

  it("IT-PAY-019: 404 si id no existe", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .delete(`/api/payment-methods/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Payment method not found");
  });

  it("IT-PAY-020: 204 borra método sin body", async () => {
    const customer = await createCustomer();
    const pm = await createPM(customer._id);

    const res = await request(app)
      .delete(`/api/payment-methods/${pm._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const deleted = await PaymentMethod.findById(pm._id);
    expect(deleted).toBeNull();
  });
});
