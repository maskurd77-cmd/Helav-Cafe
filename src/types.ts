export interface Product {
  id: string;
  name: string;
  price: number;
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
}
