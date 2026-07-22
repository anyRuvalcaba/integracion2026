import express from "express";
import { body, param } from "express-validator";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategoryAndChildren,
} from "../controllers/categoryController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const categoryIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Category ID must be a valid MongoDB ObjectId"),
];

const createCategoryValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Parent category must be a valid MongoDB ObjectId"),
];

const updateCategoryValidation = [
  param("id")
    .isMongoId()
    .withMessage("Category ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("Description cannot be empty"),
  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Parent category must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: Listar categorías
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista de categorías (populado con parentCategory)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: "#/components/schemas/Category" }
 */
router.get("/categories", getCategories);

/**
 * @openapi
 * /categories/{id}/products:
 *   get:
 *     summary: Listar productos de una categoría y sus categorías hijas
 *     description: Ruta pública, sin authMiddleware (a diferencia del resto de escrituras del recurso). Si la categoría es raíz (parentCategory === null), incluye también los productos de sus categorías hijas.
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ObjectId de Category
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Categoría y sus productos (paginados)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category: { $ref: "#/components/schemas/Category" }
 *                 products:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Product" }
 *                   description: Sin populate de category.
 *                 pagination: { $ref: "#/components/schemas/PaginationMeta" }
 *       404:
 *         description: Categoría no encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NotFoundError" }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.get(
  "/categories/:id/products",
  categoryIdValidation,
  validate,
  getProductsByCategoryAndChildren
);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     summary: Obtener una categoría por id
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Categoría encontrada (populada con parentCategory)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Category" }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NotFoundError" }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.get("/categories/:id", categoryIdValidation, validate, getCategoryById);

/**
 * @openapi
 * /categories:
 *   post:
 *     summary: Crear una categoría (admin)
 *     tags: [Categories]
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
 *               description: { type: string }
 *               parentCategory: { type: string }
 *               imageURL: { type: string, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *             required: [name, description]
 *     responses:
 *       201:
 *         description: Categoría creada
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Category" }
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
  "/categories",
  authMiddleware,
  isAdmin,
  createCategoryValidation,
  validate,
  createCategory,
);

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     summary: Actualizar una categoría (admin)
 *     tags: [Categories]
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
 *               description: { type: string }
 *               parentCategory:
 *                 type: string
 *                 description: "Si este campo no viene en el body, el controller lo pisa con null en vez de conservar el valor previo."
 *               imageURL: { type: string }
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Category" }
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
  "/categories/:id",
  authMiddleware,
  isAdmin,
  updateCategoryValidation,
  validate,
  updateCategory,
);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     summary: Eliminar una categoría (admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Eliminada sin contenido
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
  "/categories/:id",
  authMiddleware,
  isAdmin,
  categoryIdValidation,
  validate,
  deleteCategory,
);

export default router;