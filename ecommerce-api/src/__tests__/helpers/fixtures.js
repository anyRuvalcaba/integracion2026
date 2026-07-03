import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import Category from "../../models/Category.js";
import Product from "../../models/Product.js";

const SALT_ROUNDS = 10;

// ── Usuarios ──────────────────────────────────────────────────────────────────

export async function createCustomer(overrides = {}) {
  const email = overrides.email ?? `customer_${Date.now()}@test.com`;
  return User.create({
    name: "Customer Test",
    email,
    password: await bcrypt.hash("Password123!", SALT_ROUNDS),
    role: "customer",
    ...overrides,
  });
}

export async function createAdmin(overrides = {}) {
  const email = overrides.email ?? `admin_${Date.now()}@test.com`;
  return User.create({
    name: "Admin Test",
    email,
    password: await bcrypt.hash("Admin123!", SALT_ROUNDS),
    role: "admin",
    ...overrides,
  });
}

// Genera un JWT firmado con el secret de test a partir de un documento User.
export function tokenFor(user) {
  return jwt.sign(
    { userId: user._id.toString(), name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

export function expiredTokenFor(user) {
  return jwt.sign(
    { userId: user._id.toString(), name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "-1s" },
  );
}

// ── Categorías y productos ────────────────────────────────────────────────────

export async function createCategory(overrides = {}) {
  return Category.create({
    name: `Cat_${Date.now()}`,
    description: "Descripción de prueba",
    ...overrides,
  });
}

export async function createSubCategory(parentId, overrides = {}) {
  return Category.create({
    name: `Sub_${Date.now()}`,
    description: "Subcategoría de prueba",
    parentCategory: parentId,
    ...overrides,
  });
}

export async function createProduct(categoryId, overrides = {}) {
  return Product.create({
    name: `Product_${Date.now()}`,
    description: "Producto de prueba",
    price: 100,
    stock: 10,
    category: categoryId ?? undefined,
    ...overrides,
  });
}
