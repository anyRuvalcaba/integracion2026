import express from "express";
import { body, param } from "express-validator";
import {
  getWishlists,
  getWishlistByUser,
  addProductToWishlist,
  removeProductFromWishlist,
  deleteWishlist,
} from "../controllers/wishlistController.js";
import validate from "../middlewares/validation.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const wishlistIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Wishlist ID must be a valid MongoDB ObjectId"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const addProductValidation = [
  body("userId")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("productId")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

const removeProductValidation = [
  param("id")
    .isMongoId()
    .withMessage("Wishlist ID must be a valid MongoDB ObjectId"),
  body("productId")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /wishlist:
 *   get:
 *     summary: Listar todas las wishlists (admin)
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de wishlists (populado con user y products)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: "#/components/schemas/WishList" }
 *       401:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UnauthorizedError" }
 *       403:
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ForbiddenError" }
 */
router.get("/wishlist", authMiddleware, isAdmin, getWishlists);

/**
 * @openapi
 * /wishlist/user/{id}:
 *   get:
 *     summary: Obtener la wishlist de un usuario por id
 *     description: "Autorización de este endpoint sujeta a hallazgo de seguridad en remediación — ver docs/backlog.md (BUG-008)."
 *     tags: [Wishlist]
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
 *         description: Wishlist encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/WishList" }
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
  "/wishlist/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getWishlistByUser,
);

/**
 * @openapi
 * /wishlist:
 *   post:
 *     summary: Agregar un producto a la wishlist de un usuario
 *     description: Devuelve 200 (no 201) en ambos casos, aunque potencialmente crea la wishlist. Si el producto ya estaba en la wishlist, responde con { message, wishlist } y wishlist sin populate. Si se agregó, responde con la WishList populada.
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *               productId: { type: string }
 *             required: [userId, productId]
 *     responses:
 *       200:
 *         description: Producto agregado, o ya existente en la wishlist (ver los dos casos posibles)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: "#/components/schemas/WishList"
 *                 - type: object
 *                   properties:
 *                     message: { type: string, example: "Product already in wishlist" }
 *                     wishlist: { $ref: "#/components/schemas/WishList" }
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
  "/wishlist",
  authMiddleware,
  addProductValidation,
  validate,
  addProductToWishlist,
);

/**
 * @openapi
 * /wishlist/{id}/product:
 *   delete:
 *     summary: Quitar un producto de una wishlist
 *     description: "Autorización de este endpoint sujeta a hallazgo de seguridad en remediación — ver docs/backlog.md (BUG-008)."
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ObjectId de WishList
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *             required: [productId]
 *     responses:
 *       200:
 *         description: WishList actualizada, populada
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/WishList" }
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
  "/wishlist/:id/product",
  authMiddleware,
  removeProductValidation,
  validate,
  removeProductFromWishlist,
);

/**
 * @openapi
 * /wishlist/{id}:
 *   delete:
 *     summary: Eliminar una wishlist
 *     description: "Autorización de este endpoint sujeta a hallazgo de seguridad en remediación — ver docs/backlog.md (BUG-008)."
 *     tags: [Wishlist]
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
  "/wishlist/:id",
  authMiddleware,
  wishlistIdValidation,
  validate,
  deleteWishlist,
);

export default router;