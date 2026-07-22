import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { PORT, CORS_ALLOWED_ORIGINS, DOCS_ENABLED } from "./src/config/env.js";
import swaggerSpec from "./src/config/swagger.js";
import connectDB from "./src/config/db.conf.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import logger from "./src/middlewares/logger.js";
import routes from "./src/routes/index.js";

const app = express();
const port = PORT;

const corsOptions = {
  origin(origin, callback) {
    if (!origin || CORS_ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(logger);
app.use(errorHandler);

connectDB();

app.get("/", (req, res) => {
  res.send("API Ecommerce con MongoDB");
});

if (DOCS_ENABLED) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (req, res) => {
    res.json(swaggerSpec);
  });
}

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    method: req.method, // GET / POST / PUT ...
    url: req.originalUrl,
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});