import { Router } from 'express';
import * as paymentController from './payment.controller';

const router = Router();

router.post('/', paymentController.createPayment);
router.get('/', paymentController.listPayments);
router.get('/:id', paymentController.getPaymentById);
router.patch('/:id', paymentController.updatePayment);

export default router;
