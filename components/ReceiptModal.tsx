
import React from 'react';
import { Order } from '../types';
import { CheckCircle, Printer, X } from 'lucide-react';
import { formatCurrency } from '../utils';
import { jsPDF } from 'jspdf';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text("Deb's Kitchen", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Order #${order.id}`, 105, 28, { align: "center" });
    doc.text(new Date(order.date).toLocaleString('id-ID'), 105, 34, { align: "center" });

    // Divider
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    // Items
    let y = 50;
    doc.setFontSize(12);
    
    order.items.forEach(item => {
      const name = `${item.quantity}x ${item.name}`;
      const price = formatCurrency(item.price * item.quantity);
      
      // Simple text wrapping workaround or truncation
      const splitName = doc.splitTextToSize(name, 120);
      doc.text(splitName, 20, y);
      doc.text(price, 190, y, { align: "right" });
      
      y += (splitName.length * 7) + 3; // Adjust spacing based on lines
    });

    // Divider
    y += 5;
    doc.line(20, y, 190, y);
    y += 10;

    // Totals
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Total", 20, y);
    doc.text(formatCurrency(order.total), 190, y, { align: "right" });
    
    // Footer
    y += 20;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text("Terima kasih atas kunjungan Anda!", 105, y, { align: "center" });

    doc.save(`Receipt-${order.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fadeInUp">
        <div className="bg-brand-600 p-6 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-10 h-10 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-white">Pesanan Terkonfirmasi!</h2>
          <p className="text-brand-100">Order #{order.id}</p>
        </div>

        <div className="p-8">
          <div className="space-y-4 mb-8 border-b border-dashed border-gray-300 pb-6">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.quantity}x {item.name}</span>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg pt-2">
              <span>Total Bayar</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <button 
            onClick={handlePrint}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4" /> Unduh PDF Struk
          </button>
        </div>
      </div>
    </div>
  );
};