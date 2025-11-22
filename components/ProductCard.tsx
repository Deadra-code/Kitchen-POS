
import React from 'react';
import { Product } from '../types';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../utils';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  return (
    <div 
      className="group bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col h-full cursor-pointer"
      onClick={() => onAdd(product)}
    >
      <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-3">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <Plus className="w-5 h-5 text-brand-600" />
        </div>
      </div>
      
      <div className="flex flex-col flex-grow">
        <h3 className="font-semibold text-gray-800 text-lg leading-tight mb-1">{product.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.description}</p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-xl text-brand-600">{formatCurrency(product.price)}</span>
        </div>
      </div>
    </div>
  );
};
