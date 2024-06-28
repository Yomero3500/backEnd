import { Router } from "express";
import {
  login,
  logout,
  register,
  profile,
  verifyToken
} from "../controllers/auth.controller";
import { auth } from "../middlewares/auth.middleware";
import { crearPedido, obtenerPedidos, borrarTodosLosPedidos, obtenerPedidoPorId} from '../controllers/pedidos.controller';
import { crearProducto, obtener, registrarWebhook, borrarProducto } from '../controllers/Product.controller';

const router: Router = Router();

// Rutas relacionadas con la autenticación
router.post("/register", register);
router.post("/login", login);
router.get("/profile", auth, profile);
router.post("/logout", auth, logout);
router.get("/verify/:token", verifyToken);

// Rutas relacionadas con los pedidos
router.post('/crearpedido', crearPedido);
router.get('/obtenerpedidos', obtenerPedidos);
router.post('/crearproducto', crearProducto);

router.delete('/productos/:id', borrarProducto);
router.get('/obtener', obtener);
router.get('/obtenerPedido/:id', obtenerPedidoPorId);
router.delete('/borrarTodos', borrarTodosLosPedidos);

router.post('/webhooks/registrar', registrarWebhook);
export default router;
