import express from "express";
import { body, param } from "express-validator";
import {
  getCarts,
  getCartById,
  getCartByUser,
  createCart,
  updateCart,
  deleteCart,
} from "../controllers/cartController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const cartIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Cart ID must be a valid MongoDB ObjectId"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const createCartValidation = [
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("products")
    .optional()
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.product")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
];

const putCartValidation = [
  param("id")
    .isMongoId()
    .withMessage("Cart ID must be a valid MongoDB ObjectId"),
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("products")
    .notEmpty()
    .withMessage("Products array is required")
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.product")
    .notEmpty()
    .withMessage("Each product item must include product ID")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .notEmpty()
    .withMessage("Each product item must include quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
];

/**
 * @openapi
 * /cart:
 *   get:
 *     summary: Listar todos los carritos (admin)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de carritos (populado con user y products.product)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: "#/components/schemas/Cart" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       403:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ForbiddenError" }
 */
router.get("/cart", authMiddleware, isAdmin, getCarts);

/**
 * @openapi
 * /cart/{id}:
 *   get:
 *     summary: Obtener un carrito por id (admin)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Carrito encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Cart" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       403:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ForbiddenError" }
 *       404:
 *         description: Cart not found
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NotFoundError" }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.get(
  "/cart/:id",
  authMiddleware,
  isAdmin,
  cartIdValidation,
  validate,
  getCartById,
);

/**
 * @openapi
 * /cart/user/{id}:
 *   get:
 *     summary: Obtener el carrito de un usuario por id
 *     description: "Autorización de este endpoint sujeta a hallazgo de seguridad en remediación — ver docs/backlog.md (BUG-008)."
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ObjectId de User
 *     responses:
 *       200:
 *         description: Carrito encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Cart" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       404:
 *         description: No cart found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { message: { type: string, example: "No cart found for this user" } }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.get(
  "/cart/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getCartByUser,
);

/**
 * @openapi
 * /cart:
 *   post:
 *     summary: Crear un carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: ObjectId de User, tomado del body (no de req.user).
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product: { type: string }
 *                     quantity: { type: integer, minimum: 1 }
 *             required: [user]
 *     responses:
 *       201:
 *         description: Carrito creado
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Cart" }
 *       400:
 *         description: Error de negocio del controller (shape ad-hoc, distinto del 422 estándar)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { error: { type: string } }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       404:
 *         description: Error de negocio del controller (shape ad-hoc, distinto de NotFoundError estándar)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { error: { type: string } }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.post(
  "/cart",
  authMiddleware,
  createCartValidation,
  validate,
  createCart,
);

/**
 * @openapi
 * /cart/{id}:
 *   put:
 *     summary: Actualizar un carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user: { type: string, description: "ObjectId de User, tomado del body." }
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product: { type: string }
 *                     quantity: { type: integer, minimum: 1 }
 *             required: [user, products]
 *     responses:
 *       200:
 *         description: Carrito actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Cart" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       404:
 *         description: Cart not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { message: { type: string, example: "Cart not found" } }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.put(
  "/cart/:id",
  authMiddleware,
  putCartValidation,
  validate,
  updateCart,
);

/**
 * @openapi
 * /cart/{id}:
 *   delete:
 *     summary: Eliminar un carrito
 *     tags: [Cart]
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
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NotFoundError" }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.delete(
  "/cart/:id",
  authMiddleware,
  cartIdValidation,
  validate,
  deleteCart,
);

export default router;