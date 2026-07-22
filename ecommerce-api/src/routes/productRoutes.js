import express from "express";
import { body, param } from "express-validator";
import {
  searchProducts,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const productIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

const createProductValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Category must be a valid MongoDB ObjectId"),
];

const updateProductValidation = [
  param("id")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Category must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /products/search:
 *   get:
 *     summary: Buscar productos con filtros y paginación
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: ObjectId de Category (no se valida con isMongoId en esta ruta)
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: inStock
 *         schema: { type: string, enum: ["true", "false"] }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Lista paginada de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products: { type: array, items: { $ref: "#/components/schemas/Product" } }
 *                 pagination: { $ref: "#/components/schemas/PaginationMeta" }
 */
router.get("/products/search", searchProducts);

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Listar productos con stock disponible (paginado)
 *     description: Filtra siempre stock > 0, sin excepción.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Lista paginada de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products: { type: array, items: { $ref: "#/components/schemas/Product" } }
 *                 pagination: { $ref: "#/components/schemas/PaginationMeta" }
 */
router.get("/products", getProducts);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Obtener un producto por id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Producto encontrado (populado con category)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Product" }
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NotFoundError" }
 *       422:
 *         description: id no es un ObjectId válido
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.get("/products/:id", productIdValidation, validate, getProductById);

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Crear un producto (admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number, minimum: 0 }
 *               description: { type: string, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *               stock: { type: number, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *               imageURL: { type: string, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *               category: { type: string }
 *             required: [name, price]
 *     responses:
 *       201:
 *         description: Producto creado (populado con category)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Product" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       403:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ForbiddenError" }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.post(
  "/products",
  authMiddleware,
  isAdmin,
  createProductValidation,
  validate,
  createProduct,
);

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     summary: Actualizar un producto (admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number, minimum: 0 }
 *               stock: { type: integer, minimum: 0 }
 *               description: { type: string }
 *               imageURL: { type: string }
 *               category: { type: string }
 *     responses:
 *       200:
 *         description: Producto actualizado (populado con category)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Product" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       403:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ForbiddenError" }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NotFoundError" }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.put(
  "/products/:id",
  authMiddleware,
  isAdmin,
  updateProductValidation,
  validate,
  updateProduct,
);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Eliminar un producto (admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Eliminado sin contenido
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       403:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ForbiddenError" }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NotFoundError" }
 */
router.delete(
  "/products/:id",
  authMiddleware,
  isAdmin,
  productIdValidation,
  validate,
  deleteProduct,
);

export default router;