export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number; // Cost Price (تێچوو) for profit calculations
  category: string;
  image?: string;
  status?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: Date;
  status: 'completed' | 'pending' | 'cancelled';
  invoiceNo?: string;
}

export interface HospitalRequest {
  id: string;
  department: string;
  items: CartItem[];
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  notes?: string;
  requesterEmail: string;
  total: number;
}
