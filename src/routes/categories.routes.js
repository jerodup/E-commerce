import Router from "express-promise-router";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller.js";
import { authRequired, adminRequired } from "../middlewares/auth.middleware.js";

const router = Router();

// Rutas públicas - cualquiera puede ver las categorías (registrado o no)
// GET /api/categories - Obtener todas las categorías
router.get("/", getCategories);

// GET /api/categories/:id - Obtener una categoría específica
router.get("/:id", getCategoryById);

// Rutas protegidas - requieren autenticación y ser admin
// Primero verificar autenticación
router.use(authRequired);
// Luego verificar que sea admin
router.use(adminRequired);

// POST /api/categories - Crear una nueva categoría (solo admin)
router.post("/", createCategory);

// PUT /api/categories/:id - Actualizar una categoría (solo admin)
router.put("/:id", updateCategory);

// DELETE /api/categories/:id - Eliminar una categoría (solo admin)
router.delete("/:id", deleteCategory);

export default router;

