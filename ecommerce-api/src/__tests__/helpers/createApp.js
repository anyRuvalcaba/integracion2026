import express from "express";
import routes from "../../routes/index.js";
import errorHandler from "../../middlewares/errorHandler.js";

// Crea la app Express sin llamar a connectDB() ni app.listen().
// errorHandler va DESPUÉS de routes (corrección del T-005 del servidor real).
export function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", routes);
  app.use(errorHandler);
  return app;
}
