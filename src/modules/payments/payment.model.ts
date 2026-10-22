export type PaymentStatus = 'pending' | 'succeeded' | 'failed';

export interface Payment {
  id: number;
  order_id: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  provider_reference: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePaymentInput {
  order_id: string;
  amount: number;
  currency?: string;
  provider_reference?: string | null;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  provider_reference?: string | null;
}
