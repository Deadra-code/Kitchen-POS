
import Dexie, { Table } from 'dexie';
import { Order, Product, CategoryItem, OwnerItem } from './types';

class POSDatabase extends Dexie {
  orders!: Table<Order, string>;
  products!: Table<Product, string>;
  categories!: Table<CategoryItem, string>;
  owners!: Table<OwnerItem, string>;

  constructor() {
    super('DebsKitchenDB');
    
    // Define schema versions
    // Version 1: Initial schema with orders
    (this as any).version(1).stores({
      orders: 'id, date, total'
    });

    // Version 2: Add products table
    (this as any).version(2).stores({
      orders: 'id, date, total',
      products: 'id, category'
    });

    // Version 3: Add categories and owners
    (this as any).version(3).stores({
      orders: 'id, date, total',
      products: 'id, category, owner',
      categories: 'id, name',
      owners: 'id, name'
    });
  }
}

export const db = new POSDatabase();

// --- ORDERS ---
export const addOrderToDb = async (order: Order) => {
  try {
    await db.orders.add(order);
  } catch (error) {
    console.error('Failed to save order:', error);
  }
};

export const getOrdersFromDb = async () => {
  return await db.orders.orderBy('date').reverse().toArray();
};

// --- PRODUCTS ---
export const getProductsFromDb = async (): Promise<Product[]> => {
  return await db.products.toArray();
};

export const addProductToDb = async (product: Product) => {
  await db.products.add(product);
};

export const updateProductInDb = async (product: Product) => {
  await db.products.put(product);
};

export const deleteProductFromDb = async (id: string) => {
  await db.products.delete(id);
};

// --- CATEGORIES ---
export const getCategoriesFromDb = async (): Promise<CategoryItem[]> => {
  return await db.categories.toArray();
};

export const addCategoryToDb = async (name: string) => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  await db.categories.put({ id, name });
};

export const deleteCategoryFromDb = async (id: string) => {
  await db.categories.delete(id);
};

// --- OWNERS ---
export const getOwnersFromDb = async (): Promise<OwnerItem[]> => {
  return await db.owners.toArray();
};

export const addOwnerToDb = async (name: string) => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  await db.owners.put({ id, name });
};

export const deleteOwnerFromDb = async (id: string) => {
  await db.owners.delete(id);
};

// --- RESET ---
export const resetDatabase = async () => {
  await (db as any).transaction('rw', db.orders, db.products, db.categories, db.owners, async () => {
    await db.orders.clear();
    await db.products.clear();
    await db.categories.clear();
    await db.owners.clear();
  });
};
