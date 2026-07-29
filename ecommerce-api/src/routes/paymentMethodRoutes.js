import express from "express";
import { body, param } from "express-validator";
import {
  getPaymentMethods,
  getUserPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../controllers/paymentMethodController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const paymentIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Payment method ID must be a valid MongoDB ObjectId"),
];

const createPaymentValidation = [
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("type")
    .notEmpty()
    .withMessage("Payment type is required")
    .isIn([
      "credit_card",
      "debit_card",
      "paypal",
      "bank_transfer",
      "cash_on_delivery",
    ])
    .withMessage("Invalid payment type"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
];

const updatePaymentValidation = [
  param("id")
    .isMongoId()
    .withMessage("Payment method ID must be a valid MongoDB ObjectId"),
  body("type")
    .optional()
    .isIn([
      "credit_card",
      "debit_card",
      "paypal",
      "bank_transfer",
      "cash_on_delivery",
    ])
    .withMessage("Invalid payment type"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
  body("cardNumber")
    .optional()
    .isLength({ max: 16 })
    .withMessage("Card number must be at most 16 characters"),
];

/**
 * @openapi
 * /payment-methods:
 *   get:
 *     summary: Listar todos los métodos de pago (admin)
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de métodos de pago (populado con user, incluye cvv)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: "#/components/schemas/PaymentMethod" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       403:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ForbiddenError" }
 */
router.get("/payment-methods", authMiddleware, isAdmin, getPaymentMethods);

/**
 * @openapi
 * /payment-methods/me:
 *   get:
 *     summary: Listar los métodos de pago del usuario autenticado
 *     description: Usa req.user.userId del JWT.
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de métodos de pago del usuario (sin populate, incluye cvv)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: "#/components/schemas/PaymentMethod" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 */
router.get("/payment-methods/me", authMiddleware, getUserPaymentMethods);

/**
 * @openapi
 * /payment-methods/{id}:
 *   get:
 *     summary: Obtener un método de pago por id (admin)
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Método de pago encontrado (populado con user, incluye cvv)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/PaymentMethod" }
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
router.get(
  "/payment-methods/:id",
  authMiddleware,
  isAdmin,
  paymentIdValidation,
  validate,
  getPaymentMethodById,
);

/**
 * @openapi
 * /payment-methods:
 *   post:
 *     summary: Crear un método de pago
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user: { type: string }
 *               type: { type: string, enum: [credit_card, debit_card, paypal, bank_transfer, cash_on_delivery] }
 *               isDefault: { type: boolean }
 *               cardNumber: { type: string, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *               cardHolderName: { type: string, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *               expiryDate: { type: string, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *               paypalEmail: { type: string, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *               bankName: { type: string, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *               accountNumber: { type: string, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *               cvv: { type: string, description: "Sin validador en la ruta, pero el controller lo persiste." }
 *             required: [user, type]
 *     responses:
 *       201:
 *         description: Método de pago creado, populado con user. El campo cvv es excluido de la respuesta (el controller hace delete responseData.cvv antes de responder).
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/PaymentMethod" }
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
  "/payment-methods",
  createPaymentValidation,
  authMiddleware,
  validate,
  createPaymentMethod,
);

/**
 * @openapi
 * /payment-methods/{id}:
 *   put:
 *     summary: Actualizar un método de pago
 *     description: "Autorización de este endpoint sujeta a hallazgo de seguridad en remediación — ver docs/backlog.md (BUG-008)."
 *     tags: [PaymentMethods]
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
 *               type: { type: string, enum: [credit_card, debit_card, paypal, bank_transfer, cash_on_delivery] }
 *               isDefault: { type: boolean }
 *               cardNumber: { type: string, maxLength: 16 }
 *     responses:
 *       200:
 *         description: "Manejo de datos sensibles en esta respuesta sujeto a hallazgo de seguridad en remediación — ver docs/backlog.md (BUG-007). Método de pago actualizado, populado con user."
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/PaymentMethod" }
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
  "/payment-methods/:id",
  authMiddleware,
  updatePaymentValidation,
  validate,
  updatePaymentMethod,
);

/**
 * @openapi
 * /payment-methods/{id}:
 *   delete:
 *     summary: Eliminar un método de pago
 *     description: "Autorización de este endpoint sujeta a hallazgo de seguridad en remediación — ver docs/backlog.md (BUG-008)."
 *     tags: [PaymentMethods]
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
  "/payment-methods/:id",
  authMiddleware,
  paymentIdValidation,
  validate,
  deletePaymentMethod,
);

export default router;