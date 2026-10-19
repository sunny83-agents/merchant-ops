export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string | null;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string | null;
}
