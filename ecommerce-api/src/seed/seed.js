import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "../config/db.conf.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import PaymentMethod from "../models/PaymentMethod.js";

// saltRounds = 10 — igual que authController.js::generatePassword
const SALT_ROUNDS = 10;
const ALLOW_RESET = process.env.SEED_ALLOW_RESET === "true";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const USERS = [
  {
    name: "Admin Ecommerce",
    email: "admin@ecommerce.com",
    password: "Admin1234!",
    role: "admin",
  },
  {
    name: "Alice Customer",
    email: "alice@ecommerce.com",
    password: "Customer1234!",
    role: "customer",
  },
  {
    name: "Bob Customer",
    email: "bob@ecommerce.com",
    password: "Customer1234!",
    role: "customer",
  },
];

const MAIN_CATEGORIES = [
  { name: "Celulares", description: "Smartphones y accesorios" },
  { name: "Macs", description: "Laptops y computadoras Apple" },
  { name: "PCs", description: "Laptops y computadoras Windows" },
  { name: "Gadgets", description: "Tecnología y accesorios" },
];

const SUB_CATEGORIES = [
  { name: "iPhone", description: "Modelos de iPhone", parentName: "Celulares" },
  { name: "Android", description: "Modelos Android", parentName: "Celulares" },
  { name: "MacBook", description: "Laptops MacBook", parentName: "Macs" },
  { name: "Smartwatch", description: "Relojes inteligentes", parentName: "Gadgets" },
  { name: "Auriculares", description: "Audífonos y accesorios", parentName: "Gadgets" },
  { name: "Gaming", description: "PCs para gaming", parentName: "PCs" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[seed] ${msg}`);
}

async function upsertUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    log(`SKIP  user "${email}"`);
    return existing;
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password: hash, role });
  log(`CREATE user "${email}" role=${role}`);
  return user;
}

async function upsertCategory({ name, description, parentCategory = null }) {
  const existing = await Category.findOne({ name, parentCategory });
  if (existing) {
    log(`SKIP  category "${name}"`);
    return existing;
  }
  const category = await Category.create({ name, description, parentCategory });
  log(`CREATE category "${name}"`);
  return category;
}

async function upsertProduct({ name, description, price, stock, imageURL, categoryId }) {
  const existing = await Product.findOne({ name });
  if (existing) {
    log(`SKIP  product "${name}"`);
    return existing;
  }
  const product = await Product.create({
    name,
    description,
    price,
    stock,
    imageURL,
    category: categoryId,
  });
  log(`CREATE product "${name}"`);
  return product;
}

async function upsertAddress(userId, data) {
  const existing = await Address.findOne({
    user: userId,
    address: data.address,
    city: data.city,
  });
  if (existing) {
    log(`SKIP  address for user ${userId}`);
    return existing;
  }
  const doc = await Address.create({ user: userId, ...data });
  log(`CREATE address for user ${userId}`);
  return doc;
}

async function upsertPaymentMethod(userId, data) {
  const query = { user: userId, type: data.type };
  if (data.cardNumber) query.cardNumber = data.cardNumber;
  if (data.paypalEmail) query.paypalEmail = data.paypalEmail;
  const existing = await PaymentMethod.findOne(query);
  if (existing) {
    log(`SKIP  payment method "${data.type}" for user ${userId}`);
    return existing;
  }
  const doc = await PaymentMethod.create({ user: userId, ...data });
  log(`CREATE payment method "${data.type}" for user ${userId}`);
  return doc;
}

// ─── RESET (solo con SEED_ALLOW_RESET=true) ───────────────────────────────────

async function resetCollections() {
  log("RESET activo — eliminando colecciones sembradas...");
  await PaymentMethod.deleteMany({});
  await Address.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});
  log("Colecciones eliminadas.");
}

// ─── SEED PRINCIPAL ───────────────────────────────────────────────────────────

async function seed() {
  await connectDB();

  if (ALLOW_RESET) {
    await resetCollections();
  }

  // 1. Usuarios
  log("── Usuarios ────────────────────────────────────────");
  const users = {};
  for (const u of USERS) {
    users[u.email] = await upsertUser(u);
  }

  // 2. Categorías principales
  log("── Categorías principales ──────────────────────────");
  const mainCats = {};
  for (const c of MAIN_CATEGORIES) {
    mainCats[c.name] = await upsertCategory(c);
  }

  // 3. Subcategorías (dependen de los _id de las principales)
  log("── Subcategorías ───────────────────────────────────");
  const subCats = {};
  for (const s of SUB_CATEGORIES) {
    subCats[s.name] = await upsertCategory({
      name: s.name,
      description: s.description,
      parentCategory: mainCats[s.parentName]._id,
    });
  }

  // 4. Productos
  // Campo correcto del schema Product: imageURL: String (no imagesUrl[])
  log("── Productos ───────────────────────────────────────");
  const PRODUCTS = [
    {
      name: "iPhone 15 Pro",
      description: "El último smartphone de Apple con chip A17 Pro.",
      price: 1299,
      stock: 10,
      imageURL: "https://placehold.co/600x400",
      categoryId: subCats["iPhone"]._id,
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      description: "Smartphone premium con cámara de 200MP.",
      price: 1199,
      stock: 15,
      imageURL: "https://placehold.co/600x400",
      categoryId: subCats["Android"]._id,
    },
    {
      name: "MacBook Pro M3",
      description: "Laptop profesional con chip Apple M3.",
      price: 2499,
      stock: 8,
      imageURL: "https://placehold.co/600x400",
      categoryId: subCats["MacBook"]._id,
    },
    {
      name: "Dell XPS 15",
      description: "Laptop potente para trabajo y gaming.",
      price: 1899,
      stock: 12,
      imageURL: "https://placehold.co/600x400",
      categoryId: subCats["Gaming"]._id,
    },
    {
      name: "Apple Watch Series 9",
      description: "Smartwatch avanzado con sensores de salud.",
      price: 499,
      stock: 25,
      imageURL: "https://placehold.co/600x400",
      categoryId: subCats["Smartwatch"]._id,
    },
    {
      name: "Sony WH-1000XM5",
      description: "Audífonos inalámbricos con cancelación de ruido.",
      price: 399,
      stock: 30,
      imageURL: "https://placehold.co/600x400",
      categoryId: subCats["Auriculares"]._id,
    },
    {
      name: "Lenovo Legion 7",
      description: "Laptop gamer con RTX 4080.",
      price: 2599,
      stock: 7,
      imageURL: "https://placehold.co/600x400",
      categoryId: subCats["Gaming"]._id,
    },
    {
      name: "Google Pixel 8",
      description: "Smartphone con Android puro y excelente cámara.",
      price: 899,
      stock: 18,
      imageURL: "https://placehold.co/600x400",
      categoryId: subCats["Android"]._id,
    },
    {
      name: "AirPods Pro 2",
      description: "Auriculares inalámbricos con audio espacial.",
      price: 299,
      stock: 40,
      imageURL: "https://placehold.co/600x400",
      categoryId: subCats["Auriculares"]._id,
    },
  ];

  for (const p of PRODUCTS) {
    await upsertProduct(p);
  }

  // 5. Direcciones para los customers (necesarias para probar el checkout)
  log("── Direcciones ─────────────────────────────────────");
  await upsertAddress(users["alice@ecommerce.com"]._id, {
    address: "Av. Insurgentes Sur 1234",
    city: "Ciudad de México",
    state: "CDMX",
    postalCode: "06600",
    country: "México",
    phone: "5512345678",
    isDefault: true,
    addressType: "home",
  });
  await upsertAddress(users["bob@ecommerce.com"]._id, {
    address: "Calle Monterrey 567",
    city: "Monterrey",
    state: "Nuevo León",
    postalCode: "64000",
    country: "México",
    phone: "8112345678",
    isDefault: true,
    addressType: "home",
  });

  // 6. Métodos de pago para los customers
  log("── Métodos de pago ─────────────────────────────────");
  await upsertPaymentMethod(users["alice@ecommerce.com"]._id, {
    type: "credit_card",
    cardNumber: "4111111111111111",
    cardHolderName: "Alice Customer",
    expiryDate: "12/27",
    cvv: "123",
    isDefault: true,
    isActive: true,
  });
  await upsertPaymentMethod(users["bob@ecommerce.com"]._id, {
    type: "cash_on_delivery",
    isDefault: true,
    isActive: true,
  });

  log("── Seed completado exitosamente ────────────────────");
}

seed()
  .catch((err) => {
    console.error("[seed] Error fatal:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
    log("Conexión cerrada.");
  });
