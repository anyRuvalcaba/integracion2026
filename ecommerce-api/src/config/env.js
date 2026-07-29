import dotenv from "dotenv";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

const requiredInAllEnvs = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_TOKEN"];

const requiredInProduction = ["FRONTEND_URL", "CORS_ALLOWED_ORIGINS"];

const missing = requiredInAllEnvs.filter((key) => !process.env[key]);
if (isProduction) {
  missing.push(...requiredInProduction.filter((key) => !process.env[key]));
}

if (missing.length > 0) {
  throw new Error(
    `Faltan variables de entorno obligatorias: ${missing.join(", ")}`,
  );
}

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const CORS_ALLOWED_ORIGINS = (
  process.env.CORS_ALLOWED_ORIGINS || FRONTEND_URL
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export { NODE_ENV, isProduction, PORT, MONGODB_URI, FRONTEND_URL, CORS_ALLOWED_ORIGINS };
