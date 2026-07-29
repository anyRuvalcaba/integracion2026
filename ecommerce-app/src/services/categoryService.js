import apiClient from "./apiClient";

// Caché en memoria (vive solo mientras la pestaña esté abierta, sin localStorage).
// Ver ADR-2-cache-en-memoria-vs-libreria-data-fetching.md.
const CACHE_TTL_MS = 60 * 1000;

let allCategoriesCache = null; // { data, expiresAt }
const productsByCategoryCache = new Map(); // key -> { data, expiresAt }

function isFresh(entry) {
  return Boolean(entry) && entry.expiresAt > Date.now();
}

function invalidateCategoriesCache() {
  allCategoriesCache = null;
  productsByCategoryCache.clear();
}

const getAllCategories = async () => {
  if (isFresh(allCategoriesCache)) {
    return allCategoriesCache.data;
  }

  const response = await apiClient.get("/categories");
  allCategoriesCache = { data: response.data, expiresAt: Date.now() + CACHE_TTL_MS };
  return response.data;
};

const getCategoryById = async (categoryId) => {
  const response = await apiClient.get("/categories/" + categoryId);
  return response.data;
};

const createCategory = async (data) => {
  const response = await apiClient.post("/categories", data);
  invalidateCategoriesCache();
  return response.data;
};

const updateCategory = async (data, categoryId) => {
  const response = await apiClient.put("/categories/" + categoryId, data);
  invalidateCategoriesCache();
  return response.data;
};

const deleteCategory = async (categoryId) => {
  await apiClient.delete("/categories/" + categoryId);
  invalidateCategoriesCache();
};

const getProductsByCategoryAndChildren = async (categoryId, options = {}) => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const cacheKey = `${categoryId}:${page}:${limit}`;
  const cached = productsByCategoryCache.get(cacheKey);
  if (isFresh(cached)) {
    return cached.data;
  }

  const params = { page, limit };
  const response = await apiClient.get(`/categories/${categoryId}/products`, {
    params,
  });

  productsByCategoryCache.set(cacheKey, {
    data: response.data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return response.data;
};

export {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategoryAndChildren,
};
