import Router from "express-promise-router";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/products.controller.js";
import { authRequired, adminRequired } from "../middlewares/auth.middleware.js";

const router = Router();

// Rutas públicas - cualquiera puede ver los productos (registrado o no)
// GET /api/products - Obtener todos los productos (filtros opcionales: ?category_id=xxx&is_active=true)
router.get("/", getProducts);

// GET /api/products/:id - Obtener un producto específico
router.get("/:id", getProductById);

// Rutas protegidas - requieren autenticación y ser admin
// Primero verificar autenticación
router.use(authRequired);
// Luego verificar que sea admin
router.use(adminRequired);

// POST /api/products - Crear un nuevo producto (solo admin)
router.post("/", createProduct);

// PUT /api/products/:id - Actualizar un producto (solo admin)
router.put("/:id", updateProduct);

// DELETE /api/products/:id - Eliminar un producto (solo admin)
// Soft delete por defecto, usar ?hard=true para eliminación permanente
router.delete("/:id", deleteProduct);

export default router;

