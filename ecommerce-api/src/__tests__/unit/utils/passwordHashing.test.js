import { describe, it, expect } from "vitest";
import bcrypt from "bcrypt";

// Verifica el contrato de hashing que authController.js y userController.js asumen.
// La función generatePassword no está exportada, por lo que se prueba
// el comportamiento observable de bcrypt con los mismos parámetros que el código usa:
//   saltRounds = 10
//   bcrypt.hash(password, saltRounds)

const SALT_ROUNDS = 10;

async function hash(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

describe("Password hashing — contrato de bcrypt en authController y userController", () => {
  it("UT-HASH-001: el hash de un password es verificable con bcrypt.compare", async () => {
    const password = "Password123!";
    const hashed = await hash(password);

    const isMatch = await bcrypt.compare(password, hashed);

    expect(isMatch).toBe(true);
  });

  it("UT-HASH-002: dos llamadas con el mismo password producen hashes distintos (salt aleatorio)", async () => {
    const password = "MismoPassword";
    const hash1 = await hash(password);
    const hash2 = await hash(password);

    expect(hash1).not.toBe(hash2);
  });

  it("UT-HASH-003: el hash no es igual al texto plano", async () => {
    const password = "Password123!";
    const hashed = await hash(password);

    expect(hashed).not.toBe(password);
  });

  it("UT-HASH-004: el hash empieza con $2b$10$ (bcrypt v2b, 10 rounds)", async () => {
    const hashed = await hash("cualquier-password");

    expect(hashed.startsWith("$2b$10$")).toBe(true);
  });

  it("UT-HASH-005: password incorrecto no pasa la verificación", async () => {
    const hashed = await hash("passwordCorrecto");

    const isMatch = await bcrypt.compare("passwordIncorrecto", hashed);

    expect(isMatch).toBe(false);
  });
});
