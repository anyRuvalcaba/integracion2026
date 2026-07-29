import express from "express";
import { body, param } from "express-validator";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import validate from "../middlewares/validation.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const createUserValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["customer", "admin"])
    .withMessage("Role must be customer or admin"),
];

const updateUserValidation = [
  body("email").optional().isEmail().withMessage("A valid email is required"),
  body("role")
    .optional()
    .isIn(["customer", "admin"])
    .withMessage("Role must be customer or admin"),
];

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Listar usuarios (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios (sin password)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: "#/components/schemas/User" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       403:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ForbiddenError" }
 */
router.get("/users", authMiddleware, isAdmin, getUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Obtener un usuario por id (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Usuario encontrado (sin password)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/User" }
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
  "/users/:id",
  authMiddleware,
  isAdmin,
  userIdValidation,
  validate,
  getUserById,
);

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Crear un usuario (admin)
 *     tags: [Users]
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
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [customer, admin] }
 *             required: [name, email, password]
 *     responses:
 *       201:
 *         description: Usuario creado (sin password)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/User" }
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
  "/users",
  authMiddleware,
  isAdmin,
  createUserValidation,
  validate,
  createUser,
);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Actualizar un usuario (admin)
 *     description: Los campos name y password no tienen validador en esta ruta, pero el controller sí los procesa si vienen en el body (password se re-hashea).
 *     tags: [Users]
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
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string, enum: [customer, admin] }
 *     responses:
 *       200:
 *         description: Usuario actualizado (sin password)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/User" }
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
  "/users/:id",
  authMiddleware,
  isAdmin,
  [...userIdValidation, ...updateUserValidation],
  validate,
  updateUser,
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Eliminar un usuario (admin)
 *     description: Orden real de middlewares en el código — userIdValidation → validate → authMiddleware → isAdmin (al revés que el resto de rutas de este archivo, la validación del param corre antes de autenticar).
 *     tags: [Users]
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
 *       422:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ValidationError" }
 */
router.delete(
  "/users/:id",
  userIdValidation,
  validate,
  authMiddleware,
  isAdmin,
  deleteUser,
);

export default router;