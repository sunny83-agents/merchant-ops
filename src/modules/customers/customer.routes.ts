import { Router } from 'express';
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
} from './customer.controller';

const router = Router();

router.post('/', createCustomer);
router.get('/', listCustomers);
router.get('/:id', getCustomerById);
router.patch('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
