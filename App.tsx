
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Coffee, History, Search, Settings, ShoppingBag, Save, Store, Percent, Smartphone, Calendar, ChevronRight, Globe, TrendingUp, DollarSign, Receipt, Plus, Utensils, Edit, Trash2, X, Database, User, AlertTriangle } from 'lucide-react';
import { Product, CartItem, Order, View, ReportPeriod, CategoryItem, OwnerItem } from './types';
import { ProductCard } from './components/ProductCard';
import { Cart } from './components/Cart';
import { ReceiptModal } from './components/ReceiptModal';
import { addOrderToDb, getOrdersFromDb, getProductsFromDb, addProductToDb, updateProductInDb, deleteProductFromDb, getCategoriesFromDb, addCategoryToDb, deleteCategoryFromDb, getOwnersFromDb, addOwnerToDb, deleteOwnerFromDb, resetDatabase } from './db';
import { translations } from './translations';
import { formatCurrency } from './utils';

// Recharts imports
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const App: React.FC = () => {
  const [view, setView] = useState<View>('pos');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [owners, setOwners] = useState<OwnerItem[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Dashboard Reporting State
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('daily');

  // Settings State (Persisted in LocalStorage)
  const [storeName, setStoreName] = useState(() => localStorage.getItem('storeName') || "Toko Saya");
  const [taxRate, setTaxRate] = useState(() => {
    const saved = localStorage.getItem('taxRate');
    return saved ? parseFloat(saved) : 11;
  });

  // Product Management State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductOwner, setNewProductOwner] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImage, setNewProductImage] = useState('');

  // Master Data Management State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');

  // Translation Helper - Fixed to Indonesian
  const t = (key: keyof typeof translations['id']) => translations['id'][key];

  // Format Date Helper - Fixed to Indonesian
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // Load all data from DB on mount
  useEffect(() => {
    const loadData = async () => {
      const savedOrders = await getOrdersFromDb();
      setOrders(savedOrders);
      const savedProducts = await getProductsFromDb();
      setProducts(savedProducts);
      const savedCategories = await getCategoriesFromDb();
      setCategories(savedCategories);
      const savedOwners = await getOwnersFromDb();
      setOwners(savedOwners);

      // Set defaults for forms if available
      if (savedCategories.length > 0) setNewProductCategory(savedCategories[0].name);
      if (savedOwners.length > 0) setNewProductOwner(savedOwners[0].name);
    };
    loadData();
  }, []);

  // Filter products
  const filteredProducts = products.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal * (1 + taxRate / 100);
    
    const newOrder: Order = {
      id: Math.floor(Math.random() * 100000).toString(),
      items: [...cart],
      total: total,
      date: new Date(),
      paymentMethod: 'card'
    };

    // Optimistic UI update
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    setSelectedOrder(newOrder); 
    setCart([]); 
    setIsMobileCartOpen(false);

    // Save to Database
    await addOrderToDb(newOrder);
  };

  // CRUD Operations
  const handleSaveProduct = async () => {
    if (!newProductName || !newProductPrice) {
      alert('Mohon isi Nama Produk dan Harga');
      return;
    }

    // Fallback if category/owner is deleted but product still points to it, or init
    const finalCategory = newProductCategory || (categories.length > 0 ? categories[0].name : 'Uncategorized');
    const finalOwner = newProductOwner || (owners.length > 0 ? owners[0].name : 'Unknown');

    const productData: Product = {
      id: editingProductId || Math.random().toString(36).substring(2, 9),
      name: newProductName,
      price: parseFloat(newProductPrice),
      category: finalCategory,
      owner: finalOwner,
      description: newProductDesc || 'No description',
      image: newProductImage || `https://picsum.photos/400/300?random=${Math.random()}`
    };

    if (editingProductId) {
      await updateProductInDb(productData);
      setProducts(products.map(p => p.id === editingProductId ? productData : p));
      alert(t('productUpdated'));
    } else {
      await addProductToDb(productData);
      setProducts([...products, productData]);
      alert(t('productAdded'));
    }
    
    resetForm();
  };

  const handleEditProduct = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProductId(product.id);
    setNewProductName(product.name);
    setNewProductPrice(product.price.toString());
    setNewProductCategory(product.category);
    setNewProductOwner(product.owner || (owners[0]?.name));
    setNewProductDesc(product.description);
    setNewProductImage(product.image);
    
    // Scroll to form
    const formElement = document.getElementById('product-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteProduct = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteProductFromDb(id);
        setProducts(products.filter(p => p.id !== id));
        if (editingProductId === id) resetForm();
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus produk");
      }
    }
  };

  const resetForm = () => {
    setEditingProductId(null);
    setNewProductName('');
    setNewProductPrice('');
    setNewProductCategory(categories[0]?.name || '');
    setNewProductOwner(owners[0]?.name || '');
    setNewProductDesc('');
    setNewProductImage('');
  };

  // --- MASTER DATA OPERATIONS ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Nama Kategori tidak boleh kosong');
      return;
    }
    await addCategoryToDb(newCategoryName);
    const updated = await getCategoriesFromDb();
    setCategories(updated);
    setNewCategoryName('');
  };

  const handleDeleteCategory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (!id) return;

    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteCategoryFromDb(id);
        const updated = await getCategoriesFromDb();
        setCategories(updated);
        if (selectedCategory !== 'All' && !updated.find(c => c.name === selectedCategory)) {
          setSelectedCategory('All');
        }
      } catch (error) {
        console.error("Failed to delete category", error);
        alert("Gagal menghapus kategori");
      }
    }
  };

  const handleAddOwner = async () => {
    if (!newOwnerName.trim()) {
      alert('Nama Pemilik tidak boleh kosong');
      return;
    }
    await addOwnerToDb(newOwnerName);
    const updated = await getOwnersFromDb();
    setOwners(updated);
    setNewOwnerName('');
  };

  const handleDeleteOwner = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (!id) return;

    if (window.confirm(t('confirmDelete'))) {
        try {
            await deleteOwnerFromDb(id);
            const updated = await getOwnersFromDb();
            setOwners(updated);
        } catch (error) {
            console.error("Failed to delete owner", error);
            alert("Gagal menghapus pemilik");
        }
    }
  };

  const handleResetData = async () => {
    if (window.confirm(t('resetDataConfirm'))) {
      await resetDatabase();
      window.location.reload();
    }
  }

  // --- SETTINGS PERSISTENCE ---
  const handleSaveSettings = () => {
    localStorage.setItem('storeName', storeName);
    localStorage.setItem('taxRate', taxRate.toString());
    alert('Pengaturan Toko berhasil disimpan!');
  };

  // --- Dashboard Logic ---
  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();

    orders.forEach(order => {
      const d = new Date(order.date);
      let key = '';
      
      if (reportPeriod === 'daily') {
        key = `${d.getHours()}:00`;
      } else if (reportPeriod === 'monthly') {
         key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      } else {
         key = d.toLocaleDateString('id-ID', { month: 'short' });
      }

      const current = dataMap.get(key) || 0;
      dataMap.set(key, current + order.total);
    });

    if (dataMap.size === 0) return [];

    return Array.from(dataMap.entries()).map(([name, sales]) => ({ name, sales })).reverse(); 
  }, [orders, reportPeriod]);

  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans relative">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-20 lg:w-24 bg-gray-900 flex-col items-center py-8 gap-8 z-30 shadow-xl flex-shrink-0">
        <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
          <span className="text-white font-bold text-2xl">D</span>
        </div>
        
        <nav className="flex-1 flex flex-col gap-6 w-full items-center">
          <NavIcon 
            icon={<Coffee />} 
            label={t('pos')} 
            active={view === 'pos'} 
            onClick={() => setView('pos')} 
          />
          <NavIcon 
            icon={<LayoutDashboard />} 
            label={t('dashboard')} 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <NavIcon 
            icon={<History />} 
            label={t('history')} 
            active={view === 'history'} 
            onClick={() => setView('history')} 
          />
        </nav>

        <div className="mt-auto mb-4">
          <NavIcon 
            icon={<Settings />} 
            label={t('settings')} 
            active={view === 'settings'} 
            onClick={() => setView('settings')} 
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header Bar */}
        <header className="h-16 md:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              D
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
                {view === 'pos' ? t('pos') : view === 'dashboard' ? t('dashboard') : view === 'history' ? t('history') : t('settings')}
              </h1>
              <p className="text-gray-500 text-xs md:text-sm hidden sm:block">
                {storeName} • {formatDate(new Date())}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {view === 'pos' && (
              <>
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-brand-500 focus:bg-white w-48 md:w-64 transition-all text-sm md:text-base"
                  />
                </div>

                <button 
                  className="lg:hidden relative p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-700 transition-colors"
                  onClick={() => setIsMobileCartOpen(true)}
                >
                  <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-sm">
                      {totalItems}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Mobile Search */}
        {view === 'pos' && (
          <div className="sm:hidden px-4 py-3 bg-white border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder={t('searchPlaceholderMobile')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* View Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 pb-24 md:pb-8 no-scrollbar">
          
          {/* POS VIEW */}
          {view === 'pos' && (
            <>
              {/* Categories */}
              <div className="flex gap-2 md:gap-3 mb-6 md:mb-8 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                      selectedCategory === 'All' 
                        ? 'bg-gray-900 text-white shadow-lg' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                      selectedCategory === cat.name 
                        ? 'bg-gray-900 text-white shadow-lg' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
              </div>
            </>
          )}

          {/* DASHBOARD VIEW (Unchanged) */}
          {view === 'dashboard' && (
            <div className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                   <span className="p-2 bg-green-50 text-green-600 rounded-lg mb-2"><DollarSign className="w-5 h-5" /></span>
                   <span className="text-gray-500 text-xs uppercase">{t('totalRevenue')}</span>
                   <span className="text-lg md:text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                   <span className="p-2 bg-blue-50 text-blue-600 rounded-lg mb-2"><Receipt className="w-5 h-5" /></span>
                   <span className="text-gray-500 text-xs uppercase">{t('totalOrders')}</span>
                   <span className="text-lg md:text-xl font-bold text-gray-900">{orders.length}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                   <span className="p-2 bg-purple-50 text-purple-600 rounded-lg mb-2"><TrendingUp className="w-5 h-5" /></span>
                   <span className="text-gray-500 text-xs uppercase">{t('avgOrderValue')}</span>
                   <span className="text-lg md:text-xl font-bold text-gray-900">{formatCurrency(avgOrderValue)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-gray-700">{t('hourlySales')}</h3>
                     <div className="flex bg-gray-100 rounded-lg p-1">
                        {(['daily', 'monthly', 'yearly'] as ReportPeriod[]).map(period => (
                           <button
                              key={period}
                              onClick={() => setReportPeriod(period)}
                              className={`px-3 py-1 text-xs rounded-md transition ${reportPeriod === period ? 'bg-white shadow text-gray-800 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                           >
                              {t(period as any)}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="h-64 w-full text-xs md:text-sm">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} width={80} tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(value)} />
                          <Tooltip 
                            cursor={{fill: '#f9fafb'}} 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: number) => [formatCurrency(value), 'Penjualan']}
                          />
                          <Bar dataKey="sales" fill="#ea580c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                       <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                          Tidak ada data untuk periode ini
                       </div>
                    )}
                  </div>
                </div>
                
                 <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-700 mb-4">{t('recentActivity')}</h3>
                  <div className="space-y-4">
                    {orders.length === 0 && <p className="text-gray-400 text-sm">Belum ada order terbaru.</p>}
                    {orders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition">
                        <div>
                          <p className="font-medium text-gray-800 text-sm md:text-base">Order #{o.id}</p>
                          <p className="text-xs text-gray-500">{o.items.length} items • {o.paymentMethod}</p>
                        </div>
                        <span className="font-bold text-brand-600 text-sm md:text-base">{formatCurrency(o.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HISTORY VIEW (Unchanged) */}
           {view === 'history' && (
             <div className="animate-fadeIn">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="p-6 bg-white rounded-full mb-4 shadow-sm">
                      <History className="w-12 h-12 text-gray-300" />
                    </div>
                    <p className="text-lg font-medium">{t('noOrders')}</p>
                  </div>
                ) : (
                  <div className="md:hidden space-y-4">
                    {orders.map(o => (
                      <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                        <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                          <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800">Order #{o.id}</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">{t('paid')}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(o.date)} • {new Date(o.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="block font-bold text-lg text-brand-600">{formatCurrency(o.total)}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p className="line-clamp-2">
                              <span className="font-medium text-gray-900">{o.items.length} Items: </span> 
                              {o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </p>
                        </div>
                        <button 
                          onClick={() => setSelectedOrder(o)}
                          className="w-full py-2 mt-1 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-1"
                        >
                          {t('viewReceipt')} <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="p-4 font-medium text-gray-600 text-xs md:text-sm uppercase tracking-wider">{t('orderId')}</th>
                            <th className="p-4 font-medium text-gray-600 text-xs md:text-sm uppercase tracking-wider">{t('date')}</th>
                            <th className="p-4 font-medium text-gray-600 text-xs md:text-sm uppercase tracking-wider">{t('items')}</th>
                            <th className="p-4 font-medium text-gray-600 text-xs md:text-sm uppercase tracking-wider">{t('total')}</th>
                            <th className="p-4 font-medium text-gray-600 text-xs md:text-sm uppercase tracking-wider">{t('status')}</th>
                            <th className="p-4 font-medium text-gray-600 text-xs md:text-sm uppercase tracking-wider"></th>
                          </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                              <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="p-4 font-mono text-sm">#{o.id}</td>
                                <td className="p-4 text-sm text-gray-600">{new Date(o.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</td>
                                <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{o.items.map(i => i.name).join(', ')}</td>
                                <td className="p-4 font-bold text-brand-600">{formatCurrency(o.total)}</td>
                                <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{t('paid')}</span></td>
                                <td className="p-4 text-right">
                                    <button onClick={() => setSelectedOrder(o)} className="text-gray-400 hover:text-brand-600 transition"><ChevronRight className="w-5 h-5" /></button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
             </div>
           )}

          {/* SETTINGS VIEW */}
          {view === 'settings' && (
             <div className="max-w-3xl mx-auto animate-fadeIn pb-10">
                
                {/* Data Master (Categories & Owners) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                  <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                     <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                        <Database className="w-5 h-5" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-gray-900">{t('dataMaster')}</h2>
                        <p className="text-sm text-gray-500">{t('dataMasterDesc')}</p>
                     </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Category Management */}
                      <div>
                          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            {t('categoryList')}
                          </h3>
                          <div className="flex gap-2 mb-3">
                            <input 
                                type="text" 
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder={t('inputPlaceholder')}
                                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                            <button 
                              type="button"
                              onClick={handleAddCategory} 
                              className="px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
                            >
                                {t('add')}
                            </button>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                             {categories.map(cat => (
                                 <div key={cat.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100 text-sm hover:bg-white transition-colors">
                                     <span className="font-medium text-gray-700 pl-1">{cat.name}</span>
                                     <button 
                                        type="button"
                                        onClick={(e) => handleDeleteCategory(e, cat.id)} 
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors border border-red-100 flex-shrink-0 cursor-pointer"
                                        title={t('delete')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                 </div>
                             ))}
                          </div>
                      </div>

                      {/* Owner Management */}
                      <div>
                          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                             {t('ownerList')}
                          </h3>
                          <div className="flex gap-2 mb-3">
                            <input 
                                type="text" 
                                value={newOwnerName}
                                onChange={(e) => setNewOwnerName(e.target.value)}
                                placeholder={t('inputPlaceholder')}
                                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                            <button 
                              type="button"
                              onClick={handleAddOwner} 
                              className="px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
                            >
                                {t('add')}
                            </button>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                             {owners.map(owner => (
                                 <div key={owner.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100 text-sm hover:bg-white transition-colors">
                                     <span className="font-medium text-gray-700 pl-1">{owner.name}</span>
                                     <button 
                                        type="button"
                                        onClick={(e) => handleDeleteOwner(e, owner.id)} 
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors border border-red-100 flex-shrink-0 cursor-pointer"
                                        title={t('delete')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                 </div>
                             ))}
                          </div>
                      </div>
                  </div>
                </div>

                {/* Menu Management */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                  <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                     <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                        <Utensils className="w-5 h-5" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-gray-900">{t('menuManagement')}</h2>
                        <p className="text-sm text-gray-500">{t('menuManagementDesc')}</p>
                     </div>
                  </div>
                  <div className="p-6 space-y-6">
                     {/* Form */}
                     <div id="product-form" className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-semibold text-gray-800">{editingProductId ? t('edit') : t('addToCart')} Menu</h3>
                           {editingProductId && (
                              <button type="button" onClick={resetForm} className="text-xs text-red-600 hover:underline">{t('cancel')}</button>
                           )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('productName')}</label>
                              <input 
                                type="text" 
                                value={newProductName}
                                onChange={(e) => setNewProductName(e.target.value)}
                                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('price')}</label>
                              <input 
                                type="number" 
                                value={newProductPrice}
                                onChange={(e) => setNewProductPrice(e.target.value)}
                                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                              />
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
                              <select 
                                value={newProductCategory}
                                onChange={(e) => setNewProductCategory(e.target.value)}
                                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                              >
                                {categories.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner')}</label>
                              <select 
                                value={newProductOwner}
                                onChange={(e) => setNewProductOwner(e.target.value)}
                                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                              >
                                {owners.map(o => (
                                  <option key={o.id} value={o.name}>{o.name}</option>
                                ))}
                              </select>
                           </div>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('imageUrl')}</label>
                            <input 
                            type="text" 
                            value={newProductImage}
                            placeholder="Optional (https://...)"
                            onChange={(e) => setNewProductImage(e.target.value)}
                            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                            />
                        </div>

                        <div className="mb-4">
                           <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                           <textarea 
                             value={newProductDesc}
                             onChange={(e) => setNewProductDesc(e.target.value)}
                             className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition h-20"
                           />
                        </div>

                        <button 
                           type="button"
                           onClick={handleSaveProduct}
                           className="w-full py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition flex items-center justify-center gap-2 shadow-sm"
                        >
                           {editingProductId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                           {t('addProduct')}
                        </button>
                     </div>

                     {/* Product List */}
                     <div>
                        <h3 className="font-semibold text-gray-800 mb-3">{t('menuList')}</h3>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                           <table className="w-full text-left">
                              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                 <tr>
                                    <th className="px-4 py-3">{t('items')}</th>
                                    <th className="px-4 py-3">{t('owner')}</th>
                                    <th className="px-4 py-3">{t('price')}</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                 {products.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50 bg-white">
                                       <td className="px-4 py-3">
                                          <div className="font-medium text-gray-900">{product.name}</div>
                                          <div className="text-xs text-gray-500">{product.category}</div>
                                       </td>
                                       <td className="px-4 py-3 text-sm text-gray-600">{product.owner}</td>
                                       <td className="px-4 py-3 text-sm">{formatCurrency(product.price)}</td>
                                       <td className="px-4 py-3 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                             <button 
                                                type="button"
                                                onClick={(e) => handleEditProduct(e, product)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                             >
                                                <Edit className="w-4 h-4 pointer-events-none" />
                                             </button>
                                             <button 
                                                type="button"
                                                onClick={(e) => handleDeleteProduct(e, product.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors border border-red-100 flex-shrink-0 cursor-pointer"
                                             >
                                                <Trash2 className="w-4 h-4" />
                                             </button>
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>

                  </div>
                </div>

                {/* Store Configuration */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                  <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                     <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                        <Store className="w-5 h-5" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-gray-900">{t('storeConfig')}</h2>
                        <p className="text-sm text-gray-500">{t('storeConfigDesc')}</p>
                     </div>
                  </div>
                  <div className="p-6 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('storeName')}</label>
                            <input 
                            type="text" 
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('salesTax')}</label>
                            <div className="relative">
                                <input 
                                type="number" 
                                value={taxRate}
                                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                className="w-full pl-4 pr-8 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                                />
                                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                     </div>
                     <button 
                        type="button"
                        onClick={handleSaveSettings}
                        className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-sm"
                     >
                        <Save className="w-4 h-4" />
                        {t('saveChanges')}
                     </button>
                  </div>
                </div>

                {/* DANGER ZONE - RESET DATA */}
                <div className="bg-red-50 rounded-2xl shadow-sm border border-red-100 overflow-hidden mb-6">
                  <div className="p-6 border-b border-red-100 flex items-center gap-3">
                     <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-red-900">{t('dangerZone')}</h2>
                        <p className="text-sm text-red-600">{t('dangerZoneDesc')}</p>
                     </div>
                  </div>
                  <div className="p-6">
                     <button 
                        type="button"
                        onClick={handleResetData}
                        className="w-full px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-sm"
                     >
                        <Trash2 className="w-4 h-4" />
                        {t('resetData')}
                     </button>
                  </div>
                </div>

             </div>
          )}

        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden absolute bottom-0 w-full bg-white border-t border-gray-200 h-20 pb-4 flex justify-around items-center px-2 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
           <NavIconMobile icon={<Coffee />} label={t('pos')} active={view === 'pos'} onClick={() => setView('pos')} />
           <NavIconMobile icon={<LayoutDashboard />} label={t('dashboard')} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
           <NavIconMobile icon={<History />} label={t('history')} active={view === 'history'} onClick={() => setView('history')} />
           <NavIconMobile icon={<Settings />} label={t('settings')} active={view === 'settings'} onClick={() => setView('settings')} />
        </nav>
      </main>

      {/* Desktop Right Panel (Cart) */}
      {view === 'pos' && (
        <div className="hidden lg:block w-96 h-full border-l border-gray-200 bg-white shadow-xl z-20 relative">
          <Cart 
            cartItems={cart} 
            onUpdateQuantity={updateQuantity} 
            onRemove={removeFromCart}
            onCheckout={handleCheckout}
            taxRate={taxRate / 100}
          />
        </div>
      )}

      {/* Mobile/Tablet Cart Drawer */}
      {view === 'pos' && (
        <>
           <div 
             className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isMobileCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
             onClick={() => setIsMobileCartOpen(false)}
           />
           <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-50 shadow-2xl transform transition-transform duration-300 lg:hidden ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <Cart 
                cartItems={cart} 
                onUpdateQuantity={updateQuantity} 
                onRemove={removeFromCart}
                onCheckout={handleCheckout}
                onClose={() => setIsMobileCartOpen(false)}
                taxRate={taxRate / 100}
              />
           </div>
        </>
      )}

      <ReceiptModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
};

// Helper Components
const NavIcon: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button 
    onClick={onClick}
    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 group ${active ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const NavIconMobile: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors ${active ? 'text-brand-600' : 'text-gray-400'}`}
  >
    <div className={`p-1.5 rounded-xl ${active ? 'bg-brand-50' : 'bg-transparent'}`}>
       {React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: active ? 2.5 : 2 })}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;
