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

router.get("/addresses", authMiddleware, getUserAddresses);

router.get(
  "/addresses/:addressId",
  authMiddleware,
  addressIdValidation,
  validate,
  getAddressById,
);

router.post(
  "/addresses",
  authMiddleware,
  createAddressValidation,
  validate,
  createAddress,
);

router.put(
  "/addresses/:addressId",
  authMiddleware,
  updateAddressValidation,
  validate,
  updateAddress,
);

router.delete(
  "/addresses/:addressId",
  authMiddleware,
  addressIdValidation,
  validate,
  deleteAddress,
);

export default router;
