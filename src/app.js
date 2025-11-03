import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import productsRoutes from "./routes/products.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";

const app = express();

// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// ✅ Configuración CORS correcta
app.use(
  cors({
    origin: "http://localhost:5173", // tu frontend
    credentials: true,               // permite el envío de cookies
  })
);

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);

// Middleware de errores
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    message: err.message,
    stack: err.stack,
  });
});

export default app;
