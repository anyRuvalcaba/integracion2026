import apiClient from "./apiClient";
import { invalidateProductsByCategoryCache } from "./categoryService";

// Caché en memoria (vive solo mientras la pestaña esté abierta, sin localStorage).
// Ver ADR-2-cache-en-memoria-vs-libreria-data-fetching.md.
const CACHE_TTL_MS = 60 * 1000;

let allProductsCache = null; // { data, expiresAt }
const productByIdCache = new Map(); // id -> { data, expiresAt }

function isFresh(entry) {
  return Boolean(entry) && entry.expiresAt > Date.now();
}

function invalidateProductsCache() {
  allProductsCache = null;
  productByIdCache.clear();
  invalidateProductsByCategoryCache();
}

export async function getAllProducts() {
  if (isFresh(allProductsCache)) {
    return allProductsCache.data;
  }

  const response = await apiClient.get("/products");
  allProductsCache = { data: response.data, expiresAt: Date.now() + CACHE_TTL_MS };
  return response.data;
}

export async function getProductById(id) {
  const cached = productByIdCache.get(id);
  if (isFresh(cached)) {
    return cached.data;
  }

  const response = await apiClient.get("/products/" + id);
  productByIdCache.set(id, { data: response.data, expiresAt: Date.now() + CACHE_TTL_MS });
  return response.data;
}

export async function searchProducts(filters = {}) {
  const params = {};
  if (filters.q) params.q = filters.q;
  if (filters.category) params.category = filters.category;
  if (filters.minPrice != null && !Number.isNaN(filters.minPrice)) {
    params.minPrice = filters.minPrice;
  }
  if (filters.maxPrice != null && !Number.isNaN(filters.maxPrice)) {
    params.maxPrice = filters.maxPrice;
  }
  if (typeof filters.inStock === "boolean") params.inStock = filters.inStock;
  if (filters.sort) params.sort = filters.sort;
  if (filters.order) params.order = filters.order;

  const response = await apiClient.get(`/products/search`, { params });
  return response.data;
}

export async function createProduct(data) {
  const response = await apiClient.post("/products", data);
  invalidateProductsCache();
  return response.data;
}

export async function updateProduct(id, data) {
  const response = await apiClient.put(`/products/${id}`, data);
  invalidateProductsCache();
  return response.data;
}

export async function deleteProduct(id) {
  await apiClient.delete(`/products/${id}`);
  invalidateProductsCache();
}
