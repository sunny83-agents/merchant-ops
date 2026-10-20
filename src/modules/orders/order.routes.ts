import { Router } from 'express';
import {
  createOrderController,
  deleteOrderController,
  getOrderController,
  listOrdersController,
  updateOrderController,
} from './order.controller';

const router = Router();

router.post('/', createOrderController);
router.get('/', listOrdersController);
router.get('/:id', getOrderController);
router.patch('/:id', updateOrderController);
router.delete('/:id', deleteOrderController);

export default router;