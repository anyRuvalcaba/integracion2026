// Fallback para tests unitarios que no dependen del globalSetup (MongoMemoryServer).
// En integración, globalSetup ya los setea; el || evita sobreescribir.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-vitest";
process.env.JWT_REFRESH_TOKEN = process.env.JWT_REFRESH_TOKEN || "test-refresh-secret-vitest";
