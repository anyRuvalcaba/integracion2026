import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../helpers/createApp.js";
import { useTestDatabase } from "../helpers/db.js";
import { createCustomer, tokenFor } from "../helpers/fixtures.js";
import Address from "../../models/Address.js";

const app = createApp();
useTestDatabase();

const VALID_ADDRESS = {
  address: "Av. Insurgentes Sur 1234",
  city: "Ciudad de México",
  state: "CDMX",
  postalCode: "06600",
  phone: "5512345678",
};

async function createAddr(userId, overrides = {}) {
  return Address.create({
    user: userId,
    address: "Calle Falsa 123",
    city: "Guadalajara",
    state: "Jalisco",
    postalCode: "44100",
    country: "México",
    phone: "3312345678",
    isDefault: false,
    addressType: "home",
    ...overrides,
  });
}

// ─── GET /api/addresses ───────────────────────────────────────────────────────

describe("GET /api/addresses", () => {
  it("IT-ADDR-001: 401 sin token", async () => {
    const res = await request(app).get("/api/addresses");
    expect(res.status).toBe(401);
  });

  it("IT-ADDR-002: 200 array vacío cuando el usuario no tiene direcciones", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/api/addresses")
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(200);
    expect(res.body.addresses).toEqual([]);
  });

  it("IT-ADDR-003: 200 array con las direcciones del usuario autenticado", async () => {
    const customer = await createCustomer();
    await createAddr(customer._id);
    await createAddr(customer._id, { isDefault: true });

    const res = await request(app)
      .get("/api/addresses")
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(200);
    expect(res.body.addresses).toHaveLength(2);
    // ordenadas isDefault DESC — la default va primero
    expect(res.body.addresses[0].isDefault).toBe(true);
  });

  it("IT-ADDR-004: no devuelve direcciones de otros usuarios", async () => {
    const customerA = await createCustomer();
    const customerB = await createCustomer();
    await createAddr(customerB._id);

    const res = await request(app)
      .get("/api/addresses")
      .set("Authorization", `Bearer ${tokenFor(customerA)}`);

    expect(res.status).toBe(200);
    expect(res.body.addresses).toHaveLength(0);
  });
});

// ─── GET /api/addresses/:addressId ───────────────────────────────────────────

describe("GET /api/addresses/:addressId", () => {
  it("IT-ADDR-005: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).get(`/api/addresses/${fakeId}`);
    expect(res.status).toBe(401);
  });

  it("IT-ADDR-006: 422 si addressId no es un MongoId válido", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .get("/api/addresses/no-es-un-id")
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(422);
  });

  it("IT-ADDR-007: 404 si id no existe en la base de datos", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .get(`/api/addresses/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Address not found");
  });

  it("IT-ADDR-008: 404 si la dirección pertenece a otro usuario", async () => {
    const customerA = await createCustomer();
    const customerB = await createCustomer();
    const addr = await createAddr(customerB._id);

    const res = await request(app)
      .get(`/api/addresses/${addr._id}`)
      .set("Authorization", `Bearer ${tokenFor(customerA)}`);

    expect(res.status).toBe(404);
  });

  it("IT-ADDR-009: 200 con la dirección correcta", async () => {
    const customer = await createCustomer();
    const addr = await createAddr(customer._id, { city: "Monterrey" });

    const res = await request(app)
      .get(`/api/addresses/${addr._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(addr._id.toString());
    expect(res.body.city).toBe("Monterrey");
  });
});

// ─── POST /api/addresses ─────────────────────────────────────────────────────

describe("POST /api/addresses", () => {
  it("IT-ADDR-010: 401 sin token", async () => {
    const res = await request(app).post("/api/addresses").send(VALID_ADDRESS);
    expect(res.status).toBe(401);
  });

  it("IT-ADDR-011: 422 si falta address (campo requerido)", async () => {
    const customer = await createCustomer();
    const { address: _omitted, ...withoutAddress } = VALID_ADDRESS;
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send(withoutAddress);
    expect(res.status).toBe(422);
  });

  it("IT-ADDR-012: 422 si postalCode tiene menos de 4 caracteres", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ ...VALID_ADDRESS, postalCode: "123" });
    expect(res.status).toBe(422);
  });

  it("IT-ADDR-013: 201 con todos los campos requeridos", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send(VALID_ADDRESS);

    expect(res.status).toBe(201);
    expect(res.body.address).toBe(VALID_ADDRESS.address);
    expect(res.body.city).toBe(VALID_ADDRESS.city);
    expect(res.body.user).toBe(customer._id.toString());
  });

  it("IT-ADDR-014: country por defecto es México cuando no se envía", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send(VALID_ADDRESS);

    expect(res.status).toBe(201);
    expect(res.body.country).toBe("México");
  });

  it("IT-ADDR-015: isDefault=true desactiva otras direcciones del mismo usuario", async () => {
    const customer = await createCustomer();
    const existing = await createAddr(customer._id, { isDefault: true });
    expect(existing.isDefault).toBe(true);

    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ ...VALID_ADDRESS, isDefault: true });

    expect(res.status).toBe(201);
    expect(res.body.isDefault).toBe(true);

    const refreshed = await Address.findById(existing._id);
    expect(refreshed.isDefault).toBe(false);
  });
});

// ─── PUT /api/addresses/:addressId ───────────────────────────────────────────

describe("PUT /api/addresses/:addressId", () => {
  it("IT-ADDR-016: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).put(`/api/addresses/${fakeId}`).send({});
    expect(res.status).toBe(401);
  });

  it("IT-ADDR-017: 422 si addressId no es MongoId", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .put("/api/addresses/no-es-un-id")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ city: "Tijuana" });
    expect(res.status).toBe(422);
  });

  it("IT-ADDR-018: 404 si no existe o es de otro usuario", async () => {
    const customerA = await createCustomer();
    const customerB = await createCustomer();
    const addr = await createAddr(customerB._id);

    const res = await request(app)
      .put(`/api/addresses/${addr._id}`)
      .set("Authorization", `Bearer ${tokenFor(customerA)}`)
      .send({ city: "Tijuana" });

    expect(res.status).toBe(404);
  });

  it("IT-ADDR-019: 200 actualiza los campos enviados", async () => {
    const customer = await createCustomer();
    const addr = await createAddr(customer._id);

    const res = await request(app)
      .put(`/api/addresses/${addr._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({
        address: addr.address,
        city: "Querétaro",
        state: addr.state,
        postalCode: addr.postalCode,
        phone: addr.phone,
      });

    expect(res.status).toBe(200);
    expect(res.body.city).toBe("Querétaro");
  });

  it("IT-ADDR-020: isDefault=true desactiva otras direcciones del mismo usuario", async () => {
    const customer = await createCustomer();
    const addr1 = await createAddr(customer._id, { isDefault: true });
    const addr2 = await createAddr(customer._id, { isDefault: false });

    const res = await request(app)
      .put(`/api/addresses/${addr2._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({
        address: addr2.address,
        city: addr2.city,
        state: addr2.state,
        postalCode: addr2.postalCode,
        phone: addr2.phone,
        isDefault: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.isDefault).toBe(true);

    const refreshed = await Address.findById(addr1._id);
    expect(refreshed.isDefault).toBe(false);
  });
});

// ─── DELETE /api/addresses/:addressId ────────────────────────────────────────

describe("DELETE /api/addresses/:addressId", () => {
  it("IT-ADDR-021: 401 sin token", async () => {
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app).delete(`/api/addresses/${fakeId}`);
    expect(res.status).toBe(401);
  });

  it("IT-ADDR-022: 422 si addressId no es MongoId", async () => {
    const customer = await createCustomer();
    const res = await request(app)
      .delete("/api/addresses/no-es-un-id")
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(422);
  });

  it("IT-ADDR-023: 404 si id no existe", async () => {
    const customer = await createCustomer();
    const fakeId = "64a9f2c3e4b0d1234567890a";
    const res = await request(app)
      .delete(`/api/addresses/${fakeId}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Address not found");
  });

  it("IT-ADDR-024: 404 si la dirección pertenece a otro usuario", async () => {
    const customerA = await createCustomer();
    const customerB = await createCustomer();
    const addr = await createAddr(customerB._id);

    const res = await request(app)
      .delete(`/api/addresses/${addr._id}`)
      .set("Authorization", `Bearer ${tokenFor(customerA)}`);

    expect(res.status).toBe(404);
  });

  it("IT-ADDR-025: 204 sin body y registro eliminado de la base de datos", async () => {
    const customer = await createCustomer();
    const addr = await createAddr(customer._id);

    const res = await request(app)
      .delete(`/api/addresses/${addr._id}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const deleted = await Address.findById(addr._id);
    expect(deleted).toBeNull();
  });
});
