
import React from 'react';
import { CartItem } from '../types';
import { Trash2, Plus, Minus, ShoppingBag, X } from 'lucide-react';
import { formatCurrency } from '../utils';

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onClose?: () => void;
  taxRate?: number; // Optional prop, decimal (e.g., 0.08 for 8%)
}

export const Cart: React.FC<CartProps> = ({ cartItems, onUpdateQuantity, onRemove, onCheckout, onClose, taxRate = 0.08 }) => {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  if (cartItems.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 border-l border-gray-200 bg-white relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition lg:hidden"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div className="bg-gray-100 p-6 rounded-full mb-4">
            <ShoppingBag className="w-12 h-12 text-gray-300" />
        </div>
        <p className="text-lg font-medium">Keranjang Kosong</p>
        <p className="text-sm">Pilih menu untuk memulai pesanan</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 shadow-xl z-20">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pesanan Saat Ini</h2>
          <p className="text-sm text-gray-500">Order #{Math.floor(Math.random() * 10000)}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl animate-fadeIn">
            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-800 leading-tight truncate">{item.name}</h4>
              <p className="text-brand-600 font-bold">{formatCurrency(item.price * item.quantity)}</p>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="p-1 bg-white rounded border border-gray-200 hover:border-brand-500 hover:text-brand-600 transition"
              >
                <Plus className="w-3 h-3" />
              </button>
              <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
              <button 
                onClick={() => onUpdateQuantity(item.id, -1)}
                className={`p-1 bg-white rounded border border-gray-200 transition ${item.quantity === 1 ? 'text-red-400 hover:border-red-400' : 'hover:border-brand-500 hover:text-brand-600'}`}
              >
                {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Totals */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-gray-500 text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-500 text-sm">
            <span>Pajak ({(taxRate * 100).toFixed(0)}%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-gray-900 font-bold text-xl pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <button 
          onClick={onCheckout}
          className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Bayar
        </button>
      </div>
    </div>
  );
};
