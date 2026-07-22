import express from "express";
import { body, param } from "express-validator";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const orderIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
];

const createOrderValidation = [
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
  body("products.*.productId")
    .notEmpty()
    .withMessage("Each product item must include productId")
    .isMongoId()
    .withMessage("Each productId must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .notEmpty()
    .withMessage("Each product item must include quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
  body("products.*.price")
    .notEmpty()
    .withMessage("Each product item must include price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isMongoId()
    .withMessage("Address must be a valid MongoDB ObjectId"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isMongoId()
    .withMessage("Payment method must be a valid MongoDB ObjectId"),
  body("totalPrice")
    .notEmpty()
    .withMessage("Total price is required")
    .isFloat({ min: 0 })
    .withMessage("Total price must be a positive number"),
  body("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number"),
];

const updateOrderStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
  body("status")
    .optional()
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),
  body("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Invalid payment status"),
];

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: Listar todas las órdenes (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes (populado con user, products.productId, address, paymentMethod)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: "#/components/schemas/Order" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       403:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ForbiddenError" }
 */
router.get("/orders", authMiddleware, isAdmin, getOrders);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Obtener una orden por id
 *     description: "BUG-008 (backlog): esta ruta solo requiere authMiddleware, sin isAdmin ni chequeo de propiedad — no valida que la orden pertenezca al usuario del JWT, por lo que cualquier usuario autenticado puede leer cualquier orden por id."
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Orden encontrada (populado con user, products.productId, address, paymentMethod)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Order" }
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
router.get(
  "/orders/:id",
  authMiddleware,
  orderIdValidation,
  validate,
  getOrderById,
);

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Crear una orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
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
 *                     productId: { type: string }
 *                     quantity: { type: integer, minimum: 1 }
 *                     price: { type: number, minimum: 0 }
 *                   required: [productId, quantity, price]
 *               address: { type: string }
 *               paymentMethod: { type: string }
 *               totalPrice: { type: number, minimum: 0 }
 *               shippingCost: { type: number, minimum: 0 }
 *             required: [products, address, paymentMethod, totalPrice]
 *     responses:
 *       201:
 *         description: Orden creada, populada solo con user y products.productId (a diferencia del GET, no popula address ni paymentMethod en la creación).
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Order" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.post(
  "/orders",
  authMiddleware,
  createOrderValidation,
  validate,
  createOrder,
);

/**
 * @openapi
 * /orders/{id}:
 *   put:
 *     summary: Actualizar el estado de una orden
 *     description: "BUG-008 (backlog): esta ruta solo requiere authMiddleware, sin isAdmin ni chequeo de propiedad — cualquier usuario autenticado puede cambiar el estado de cualquier orden ajena."
 *     tags: [Orders]
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
 *               status: { type: string, enum: [pending, processing, shipped, delivered, cancelled] }
 *               paymentStatus: { type: string, enum: [pending, paid, failed, refunded] }
 *     responses:
 *       200:
 *         description: Orden actualizada sin populate (devuelve ObjectIds crudos, a diferencia del GET).
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Order" }
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
router.put(
  "/orders/:id",
  authMiddleware,
  updateOrderStatusValidation,
  validate,
  updateOrderStatus,
);

export default router;