import express from "express";
import { body, param } from "express-validator";
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const addressIdValidation = [
  param("addressId")
    .isMongoId()
    .withMessage("Address ID must be a valid MongoDB ObjectId"),
];

const createAddressValidation = [
  body("address").notEmpty().withMessage("Address is required").trim(),
  body("city").notEmpty().withMessage("City is required").trim(),
  body("state").notEmpty().withMessage("State is required").trim(),
  body("postalCode")
    .notEmpty()
    .withMessage("Postal code is required")
    .isLength({ min: 4, max: 6 })
    .withMessage("Postal code must be between 4 and 6 characters"),
  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .isLength({ max: 10 })
    .withMessage("Phone must be at most 10 characters"),
  body("country").optional().trim(),
  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
  body("addressType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("addressType must be home, work or other"),
];

const updateAddressValidation = [
  param("addressId")
    .isMongoId()
    .withMessage("Address ID must be a valid MongoDB ObjectId"),
  body("address").optional().notEmpty().trim(),
  body("city").optional().notEmpty().trim(),
  body("state").optional().notEmpty().trim(),
  body("postalCode")
    .optional()
    .isLength({ min: 4, max: 6 })
    .withMessage("Postal code must be between 4 and 6 characters"),
  body("phone")
    .optional()
    .isLength({ max: 10 })
    .withMessage("Phone must be at most 10 characters"),
  body("country").optional().trim(),
  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
  body("addressType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("addressType must be home, work or other"),
];

/**
 * @openapi
 * /addresses:
 *   get:
 *     summary: Listar las direcciones del usuario autenticado
 *     description: Único módulo del proyecto donde la propiedad se deriva correctamente de req.user.userId (JWT), no de un campo del body o de los params. Filtrado y ordenado por el usuario autenticado.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de direcciones del usuario, envuelta en la clave addresses (único listado del proyecto que no devuelve el array directo)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addresses:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Address" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 */
router.get("/addresses", authMiddleware, getUserAddresses);

/**
 * @openapi
 * /addresses/{addressId}:
 *   get:
 *     summary: Obtener una dirección por id
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Dirección encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Address" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       404:
 *         description: No encontrada, también cuando la dirección existe pero pertenece a otro usuario (no devuelve 403 en ese caso).
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/NotFoundError" }
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.get(
  "/addresses/:addressId",
  authMiddleware,
  addressIdValidation,
  validate,
  getAddressById,
);

/**
 * @openapi
 * /addresses:
 *   post:
 *     summary: Crear una dirección para el usuario autenticado
 *     description: El campo user se toma de req.user.userId, no del body.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               postalCode: { type: string, minLength: 4, maxLength: 6 }
 *               phone: { type: string, maxLength: 10 }
 *               country: { type: string, default: "México" }
 *               isDefault: { type: boolean, default: false }
 *               addressType: { type: string, enum: [home, work, other], default: home }
 *             required: [address, city, state, postalCode, phone]
 *     responses:
 *       201:
 *         description: Dirección creada
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Address" }
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
  "/addresses",
  authMiddleware,
  createAddressValidation,
  validate,
  createAddress,
);

/**
 * @openapi
 * /addresses/{addressId}:
 *   put:
 *     summary: Actualizar una dirección
 *     description: Aunque los campos son opcionales en la validación, el controller los sobreescribe igual con el valor del body aunque sea undefined para address/city/state/phone — un PUT parcial puede borrar esos campos.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               postalCode: { type: string, minLength: 4, maxLength: 6 }
 *               phone: { type: string, maxLength: 10 }
 *               country: { type: string }
 *               isDefault: { type: boolean }
 *               addressType: { type: string, enum: [home, work, other] }
 *     responses:
 *       200:
 *         description: Dirección actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Address" }
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
  "/addresses/:addressId",
  authMiddleware,
  updateAddressValidation,
  validate,
  updateAddress,
);

/**
 * @openapi
 * /addresses/{addressId}:
 *   delete:
 *     summary: Eliminar una dirección
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Eliminada sin contenido
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
  "/addresses/:addressId",
  authMiddleware,
  addressIdValidation,
  validate,
  deleteAddress,
);

export default router;
