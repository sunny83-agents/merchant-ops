export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: number;
  customer_id: string;
  status: OrderStatus;
  total_amount: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrderInput {
  customer_id: string;
  total_amount: number;
  currency?: string;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  total_amount?: number;
  currency?: string;
}