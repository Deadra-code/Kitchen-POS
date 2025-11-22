
export interface CategoryItem {
  id: string;
  name: string;
}

export interface OwnerItem {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  owner: string;
  image: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: Date;
  paymentMethod: 'cash' | 'card';
  aiMessage?: string;
}

export type View = 'pos' | 'dashboard' | 'history' | 'settings';

export type ReportPeriod = 'daily' | 'monthly' | 'yearly';
