import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               phone: { type: string }
 *             required: [name, email, password]
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name: { type: string }
 *                 email: { type: string }
 *                 phone: { type: string, description: "undefined si no se envió en el body — no viene del usuario guardado." }
 *       409:
 *         description: El email ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { message: { type: string, example: "User already exist" } }
 */
router.post("/register", register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión y obtener tokens JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *             required: [email, password]
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string, description: "JWT de acceso, expira en 1h (hardcodeado)." }
 *                 refreshToken: { type: string, description: "JWT de refresco, expira en 7d (hardcodeado). No existe endpoint que lo consuma todavía." }
 *       400:
 *         description: Usuario inexistente o credenciales inválidas (ambos casos usan 400, no 401)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { message: { type: string, example: "Invalid Credentials" } }
 */
router.post("/login", login);

export default router;