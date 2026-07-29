import swaggerJsdoc from "swagger-jsdoc";
import { PORT } from "./env.js";

const renderUrl = process.env.RENDER_EXTERNAL_URL;

const definition = {
  openapi: "3.0.3",
  info: {
    title: "Ecommerce API",
    version: "1.0.0",
    description:
      "API REST para el ecommerce (auth, productos, categorías, carrito, órdenes, métodos de pago, usuarios, wishlist, direcciones). " +
      "Documentación generada a partir del código real — ver `docs/backlog.md` (BUG-004, BUG-007, BUG-008) para inconsistencias conocidas señaladas en las rutas afectadas.",
  },
  servers: [
    { url: `http://localhost:${PORT}/api`, description: "Desarrollo local" },
    {
      url: renderUrl ? `${renderUrl}/api` : "https://<reemplazar-con-tu-servicio>.onrender.com/api",
      description: "Producción (Render)",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Token obtenido en POST /auth/login (campo `token`). Expira en 1h — valor hardcodeado en authController.js, " +
          "no configurable vía JWT_EXPIRES_IN pese a que esa variable existe en .env.",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["customer", "admin"], default: "customer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["name", "email"],
      },
      Category: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          imageURL: { type: "string", default: "https://placehold.co/800x600.png" },
          parentCategory: {
            oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Category" }, { nullable: true }],
            description: "ObjectId de la categoría padre, populado en algunas respuestas, o null si es raíz.",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["name", "description"],
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          stock: { type: "number", default: 0 },
          imageURL: { type: "string", default: "https://placehold.co/600x400" },
          category: {
            oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Category" }],
            description: "ObjectId de Category, populado en la mayoría de las respuestas de lectura.",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["name", "price"],
      },
      PaginationMeta: {
        type: "object",
        properties: {
          currentPage: { type: "integer", example: 1 },
          totalPages: { type: "integer", example: 3 },
          totalResults: { type: "integer", example: 27 },
          hasNext: { type: "boolean" },
          hasPrev: { type: "boolean" },
        },
      },
      Cart: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: {
            oneOf: [{ type: "string" }, { $ref: "#/components/schemas/User" }],
          },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: {
                  oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Product" }],
                },
                quantity: { type: "integer", minimum: 1 },
              },
              required: ["product", "quantity"],
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["user"],
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: {
            oneOf: [{ type: "string" }, { $ref: "#/components/schemas/User" }],
          },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: {
                  oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Product" }],
                },
                quantity: { type: "integer", minimum: 1 },
                price: { type: "number" },
              },
              required: ["productId", "quantity", "price"],
            },
          },
          address: {
            oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Address" }],
          },
          paymentMethod: {
            oneOf: [{ type: "string" }, { $ref: "#/components/schemas/PaymentMethod" }],
          },
          shippingCost: { type: "number", default: 0 },
          totalPrice: { type: "number" },
          status: {
            type: "string",
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
            default: "pending",
          },
          paymentStatus: {
            type: "string",
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["user", "products", "address", "paymentMethod", "totalPrice"],
      },
      Address: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          postalCode: {
            type: "string",
            minLength: 4,
            maxLength: 6,
            description: "Longitud validada por express-validator en la ruta, no por el schema de Mongoose.",
          },
          country: { type: "string", default: "México" },
          phone: {
            type: "string",
            maxLength: 10,
            description: "Longitud validada por express-validator en la ruta, no por el schema de Mongoose.",
          },
          isDefault: { type: "boolean", default: false },
          addressType: { type: "string", enum: ["home", "work", "other"], default: "home" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["address", "city", "state", "postalCode", "phone"],
      },
      PaymentMethod: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          type: {
            type: "string",
            enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"],
          },
          cardNumber: { type: "string", maxLength: 16 },
          cardHolderName: { type: "string" },
          expiryDate: { type: "string" },
          paypalEmail: { type: "string" },
          bankName: { type: "string" },
          accountNumber: { type: "string" },
          isDefault: { type: "boolean", default: false },
          isActive: { type: "boolean", default: true },
          cvv: {
            type: "string",
            description:
              "Manejo de este campo en las respuestas sujeto a hallazgo de seguridad en remediación — ver docs/backlog.md.",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["type"],
      },
      WishList: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: {
            oneOf: [{ type: "string" }, { $ref: "#/components/schemas/User" }],
          },
          products: {
            type: "array",
            items: {
              oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Product" }],
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["user"],
      },
      ValidationError: {
        type: "object",
        description: "422 — respuesta de express-validator (middlewares/validation.js).",
        properties: {
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", example: "field" },
                value: { type: "string" },
                msg: { type: "string" },
                path: { type: "string" },
                location: { type: "string", example: "body" },
              },
            },
          },
        },
      },
      NotFoundError: {
        type: "object",
        properties: {
          message: { type: "string", example: "Resource not found" },
        },
      },
      UnauthorizedError: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Unauthorized",
            description: "\"Unauthorized\" si falta el token, \"Invalid or expired token\" si es inválido/expiró.",
          },
        },
      },
      ForbiddenError: {
        type: "object",
        properties: {
          message: { type: "string", example: "Admin access required" },
        },
      },
      ServerError: {
        type: "object",
        description:
          "Shape intencional de error 500. Su emisión real está sujeta a un hallazgo de configuración en " +
          "remediación — ver docs/backlog.md.",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Internal Server Error" },
        },
      },
    },
  },
};

const options = {
  definition,
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
