import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, X, Coffee, LayoutGrid, TrendingUp } from 'lucide-react';
import { Product } from '@/types';
import { addProduct, deleteProduct, updateProduct, updateCategoryName } from '@/services/productService';
import { handleFirestoreError, OperationType } from '@/firebase';
import { useProductStore } from '@/store/useProductStore';

export function MenuView() {
  const { products, loading } = useProductStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('هەمووی');

  // New product form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('بەردەستە');
  const [image, setImage] = useState('');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Unique categories for datalist
  const categories = Array.from(new Set(products.map(p => p.category))) as string[];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.includes(searchQuery) || p.category.includes(searchQuery);
    const matchesCategory = selectedCategory === 'هەمووی' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUpdateCategory = async (oldName: string) => {
    if (!newCategoryName || newCategoryName === oldName) {
        setEditingCategory(null);
        return;
    }
    try {
      setIsSubmitting(true);
      await updateCategoryName(oldName, newCategoryName);
      setEditingCategory(null);
      setNewCategoryName('');
      if (selectedCategory === oldName) setSelectedCategory(newCategoryName);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setName('');
    setPrice('');
    setCategory('');
    setStatus('بەردەستە');
    setImage('');
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setStatus(product.status || 'بەردەستە');
    setImage(product.image || '');
    setShowModal(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category) return;
    
    try {
      setIsSubmitting(true);
      if (editId) {
        await updateProduct(editId, {
          name,
          price: Number(price),
          category,
          status,
          image
        });
      } else {
        await addProduct({
          name,
          price: Number(price),
          category,
          status,
          image
        });
      }
      setShowModal(false);
      setName('');
      setPrice('');
      setCategory('');
      setStatus('بەردەستە');
      setImage('');
      setEditId(null);
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, editId ? OperationType.UPDATE : OperationType.CREATE, 'products');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('تۆ دڵنیایت لە سڕینەوەی ئەم بابەتە؟')) {
      try {
        setIsSubmitting(true);
        await deleteProduct(id);
      } catch (error) {
        console.error(error);
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col min-w-0 animate-in fade-in duration-300">
      
      {/* Dynamic Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0 px-1">
        <div className="bg-white p-5 rounded-[24px] border border-[var(--border-color)] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[var(--text-muted)] block">تەواوی بەرهەمە زیندوەکان</span>
            <span className="text-2xl font-black text-[var(--bg-secondary)] mt-1 font-mono inline-block">{products.length}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">بە فەرمی لە مێنوو</span>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <Coffee size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[var(--border-color)] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[var(--text-muted)] block">کۆی گشتی پۆلێنەکان</span>
            <span className="text-2xl font-black text-[var(--bg-secondary)] mt-1 font-mono inline-block">{categories.length}</span>
            <span className="text-[10px] text-[#A37B4D] font-bold block mt-0.5">پۆلێنە چالاکەکان</span>
          </div>
          <div className="p-3.5 bg-[var(--bg-primary)] rounded-2xl text-[#A37B4D] border border-gray-100">
            <LayoutGrid size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[var(--border-color)] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[var(--text-muted)] block">موادە تەواوبووەکان</span>
            <span className="text-2xl font-black text-rose-600 mt-1 font-mono inline-block">
              {products.filter(p => p.status !== 'بەردەستە').length}
            </span>
            <span className="text-[10px] text-rose-500 font-bold block mt-0.5">پێویستی بە کڕین و نوێکرنەوەیە</span>
          </div>
          <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100">
            <TrendingUp size={22} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-5 rounded-[24px] border border-[var(--border-color)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] m-1">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--text-dark)] text-[var(--accent-gold)] rounded-[18px] shadow-md border border-[var(--accent-gold)]/20">
             <Coffee size={24} className="stroke-[2]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[var(--bg-secondary)] tracking-tight">مێنۆی بەرهەمەکان</h1>
            <p className="text-xs lg:text-sm text-[var(--text-muted)] mt-1 font-bold">بەڕێوەبردن و زیادکردنی خواردن و خواردنەوەکان</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
                <input 
                    type="text" 
                    placeholder="گەڕان بۆ پەرهەم..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#fdfbf7] border-2 border-[var(--border-color)] outline-none focus:border-[var(--accent-gold)] focus:ring-4 focus:ring-[var(--accent-gold)]/10 text-[var(--bg-secondary)] font-bold text-sm py-3 pr-11 pl-4 rounded-xl transition-all"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <Search size={18} className="stroke-[2.5]" />
                </div>
            </div>
            
            <button 
            onClick={() => setShowCategoryModal(true)}
            className="bg-white hover:bg-[var(--bg-lighter)] text-[var(--bg-secondary)] border-2 border-[var(--border-color)] hover:border-[var(--accent-gold)] font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm w-full sm:w-auto whitespace-nowrap"
            >
            <Pencil size={18} className="stroke-[2.5] text-[var(--text-muted)]" />
            دەستکاری پۆلێنەکان
            </button>
            <button 
            onClick={openAddModal}
            className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--text-dark)] hover:from-[var(--bg-secondary)] hover:to-[var(--bg-secondary)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 font-black py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm w-full sm:w-auto whitespace-nowrap stroke-[2.5]"
            >
            <Plus size={20} className="stroke-[2.5]" />
            زیادکردنی بابەت
            </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 lg:gap-3 overflow-x-auto pb-2 no-scrollbar shrink-0 custom-scrollbar-hide px-1">
         <button
            onClick={() => setSelectedCategory('هەمووی')}
            className={`px-6 py-2.5 rounded-[14px] text-sm font-black whitespace-nowrap transition-all duration-300 border-2 ${
               selectedCategory === 'هەمووی'
                  ? 'bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--text-dark)] text-[var(--accent-gold)] shadow-md border-[var(--bg-secondary)]'
                  : 'bg-white text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--accent-gold)] hover:text-[var(--bg-secondary)] hover:shadow-sm'
            }`}
         >
            هەمووی
         </button>
         {categories.map(cat => (
            <button
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`px-6 py-2.5 rounded-[14px] text-sm font-black whitespace-nowrap transition-all duration-300 border-2 ${
                  selectedCategory === cat
                     ? 'bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--text-dark)] text-[var(--accent-gold)] shadow-md border-[var(--bg-secondary)]'
                     : 'bg-white text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--accent-gold)] hover:text-[var(--bg-secondary)] hover:shadow-sm'
               }`}
            >
               {cat}
            </button>
         ))}
      </div>

      <div className="bg-gradient-to-b from-white to-[#FDFBF7] rounded-[24px] lg:rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[var(--border-color)] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="overflow-auto flex-1 max-w-full custom-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-4 py-20">
                 <div className="w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--accent-gold)] rounded-full animate-spin"></div>
                 <span className="font-bold text-sm tracking-wide">بارکردنی مێنۆ...</span>
             </div>
          ) : (
          <table className="w-full text-right border-collapse min-w-[500px]">
            <thead className="bg-white/50 backdrop-blur-md text-[var(--text-muted)] text-[10px] lg:text-xs uppercase sticky top-0 z-10 border-b-2 border-[var(--border-color)] shadow-sm">
              <tr>
                <th className="px-6 py-5 font-black text-right tracking-wider">ناو</th>
                <th className="px-6 py-5 font-black text-right tracking-wider">پۆلێن</th>
                <th className="px-6 py-5 font-black text-right tracking-wider">نرخ</th>
                <th className="px-6 py-5 font-black text-right hidden lg:table-cell tracking-wider">دۆخ</th>
                <th className="px-6 py-5 font-black w-24 lg:w-32 text-left tracking-wider">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg-lighter)]">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-white transition-all duration-300 group hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#FDFBF7] to-[var(--bg-lighter)] rounded-xl flex items-center justify-center text-[var(--accent-gold)] flex-shrink-0 group-hover:bg-gradient-to-br group-hover:from-[var(--bg-secondary)] group-hover:to-[var(--text-dark)] transition-all duration-300 shadow-sm border border-[var(--border-color)] overflow-hidden">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Coffee size={20} className="stroke-[2.5]" />
                              )}
                          </div>
                          <span className="font-black text-[var(--bg-secondary)] text-base group-hover:text-[var(--accent-gold)] transition-colors">{product.name}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-white text-[var(--text-muted)] border border-[var(--border-color)] px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm group-hover:border-[var(--accent-gold)]/30 transition-colors">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-[var(--accent-gold)] text-base font-mono">{product.price.toLocaleString('en-US')} <span className="font-sans text-xs font-bold text-[var(--text-muted)] ml-1">د.ع</span></td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center w-max gap-2 shadow-sm ${
                      product.status === 'بەردەستە' ? 'bg-[#4ADE80]/10 text-green-700 border border-[#4ADE80]/30' : 'bg-[#EF4444]/10 text-red-700 border border-[#EF4444]/30'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${product.status === 'بەردەستە' ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EF4444]'}`}></div>  
                      {product.status || 'بەردەستە'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform lg:translate-x-4 lg:group-hover:translate-x-0">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-2.5 text-[#8DAA91] bg-green-50 hover:bg-[#8DAA91] hover:text-white rounded-xl transition-all shadow-sm border border-green-100"
                        title="دەستکاری"
                      >
                        <Pencil size={18} className="stroke-[2.5]" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2.5 text-[#E11D48] bg-red-50 hover:bg-[#E11D48] hover:text-white rounded-xl transition-all shadow-sm border border-red-100"
                        title="سڕینەوە"
                      >
                        <Trash2 size={18} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-20 text-center">
                     <div className="flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]">
                        <div className="p-6 bg-[var(--bg-lighter)] rounded-full border-2 border-dashed border-[var(--border-color)]">
                           <Coffee size={32} className="text-[var(--accent-gold)] opacity-50 stroke-[1.5]" />
                        </div>
                        <p className="font-bold text-base">هیچ بەرهەمێک نەدۆزرایەوە بۆ "{searchQuery || selectedCategory}"</p>
                        <button onClick={openAddModal} className="text-[var(--accent-gold)] font-black text-sm hover:underline mt-2">یەکەم بەرهەم زیاد بکە +</button>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 bg-[#FDFBF7] border-b border-[var(--border-color)] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--bg-secondary)]">{editId ? 'دەستکاریکردنی بابەت' : 'زیادکردنی بابەت'}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-[var(--text-muted)] hover:bg-white hover:shadow-sm rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
                <form id="menuForm" onSubmit={handleAddProduct} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-[var(--bg-secondary)] mb-2">ناوی بابەت</label>
                    <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-[var(--bg-lighter)] border border-transparent focus:bg-white focus:border-[var(--accent-gold)] rounded-xl px-4 py-3 outline-none text-[var(--bg-secondary)] transition-colors" placeholder="کاپاتشینۆ" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-bold text-[var(--bg-secondary)] mb-2">نرخ <span className="text-[var(--text-muted)] text-xs font-normal">(د.ع)</span></label>
                    <input required value={price} onChange={e => setPrice(e.target.value)} type="text" inputMode="numeric" className="w-full bg-[var(--bg-lighter)] border border-transparent focus:bg-white focus:border-[var(--accent-gold)] rounded-xl px-4 py-3 outline-none text-[var(--bg-secondary)] transition-colors font-mono" placeholder="2500" />
                    </div>
                    <div>
                    <label className="block text-sm font-bold text-[var(--bg-secondary)] mb-2">دیاریکردنی دۆخ</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[var(--bg-lighter)] border border-transparent focus:bg-white focus:border-[var(--accent-gold)] rounded-xl px-4 py-3 outline-none text-[var(--bg-secondary)] transition-colors">
                        <option>بەردەستە</option>
                        <option>تەواو بووە</option>
                    </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-[var(--bg-secondary)] mb-2">وێنەی بابەت <span className="text-gray-400 font-normal text-xs">(لینکی وێنە یان نموونەکان لە خوارەوە هەڵبژێرە)</span></label>
                    <input value={image} onChange={e => setImage(e.target.value)} type="url" className="w-full bg-[var(--bg-lighter)] border border-transparent focus:bg-white focus:border-[var(--accent-gold)] rounded-xl px-4 py-2.5 outline-none text-[var(--bg-secondary)] text-sm transition-colors" placeholder="https://example.com/item.jpg" />
                    
                    {/* Premium Preset Image selection */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button type="button" onClick={() => setImage('https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=300')} className="px-2 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-[var(--accent-gold)]/10 hover:text-[#A37B4D] rounded-lg transition-colors border border-transparent hover:border-[var(--accent-gold)]/30">☕️ قاوە</button>
                      <button type="button" onClick={() => setImage('https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=300')} className="px-2 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-[var(--accent-gold)]/10 hover:text-[#A37B4D] rounded-lg transition-colors border border-transparent hover:border-[var(--accent-gold)]/30">🍵 چا</button>
                      <button type="button" onClick={() => setImage('https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=300')} className="px-2 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-[var(--accent-gold)]/10 hover:text-[#A37B4D] rounded-lg transition-colors border border-transparent hover:border-[var(--accent-gold)]/30">🍰 کێک</button>
                      <button type="button" onClick={() => setImage('https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=300')} className="px-2 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-[var(--accent-gold)]/10 hover:text-[#A37B4D] rounded-lg transition-colors border border-transparent hover:border-[var(--accent-gold)]/30">🍹 شەربەت</button>
                      <button type="button" onClick={() => setImage('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300')} className="px-2 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-[var(--accent-gold)]/10 hover:text-[#A37B4D] rounded-lg transition-colors border border-transparent hover:border-[var(--accent-gold)]/30">🍔 بەرگر/خواردن</button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-[var(--bg-secondary)] mb-2">پۆلێن</label>
                    <input required list="categories" value={category} onChange={e => setCategory(e.target.value)} type="text" placeholder="بۆ نموونە: قاوەی گەرم" className="w-full bg-[var(--bg-lighter)] border border-transparent focus:bg-white focus:border-[var(--accent-gold)] rounded-xl px-4 py-3 outline-none text-[var(--bg-secondary)] transition-colors" />
                    <datalist id="categories">
                    {categories.map(c => <option key={c} value={c} />)}
                    </datalist>
                </div>
                </form>
            </div>
            
            <div className="p-6 bg-[#FDFBF7] border-t border-[var(--border-color)] flex gap-4">
                <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-white border border-[var(--border-color)] hover:bg-[var(--bg-lighter)] text-[var(--bg-secondary)] font-bold py-3.5 rounded-xl transition-all"
                >
                    پاشگەزبوونەوە
                </button>
                <button 
                    type="submit"
                    form="menuForm"
                    className="flex-[2] bg-[var(--bg-secondary)] hover:bg-[var(--text-dark)] text-[var(--border-color)] font-bold py-3.5 rounded-xl transition-all shadow-lg"
                >
                    {editId ? 'پاشەکەوتکردن' : 'دروستکردن'}
                </button>
            </div>

          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 bg-[#FDFBF7] border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-[var(--bg-secondary)]">بەڕێوەبردنی پۆلێنەکان</h2>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="p-2 text-[var(--text-muted)] hover:bg-white hover:shadow-sm rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-3">
                    {categories.length === 0 ? (
                        <p className="text-center text-[var(--text-muted)] py-8 text-sm">هیچ پۆلێنێک نییە</p>
                    ) : (
                        categories.map(cat => (
                            <div key={cat} className="flex items-center justify-between bg-[var(--bg-lighter)] p-3 rounded-xl border border-transparent hover:border-[var(--border-color)] transition-all">
                                {editingCategory === cat ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={newCategoryName} 
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            className="flex-1 bg-white border border-[var(--accent-gold)] outline-none rounded-lg px-3 py-1.5 text-sm text-[var(--bg-secondary)]"
                                        />
                                        <button onClick={() => handleUpdateCategory(cat)} className="text-xs bg-[var(--bg-secondary)] text-white px-3 py-1.5 rounded-lg font-bold">پاشەکەوت</button>
                                        <button onClick={() => setEditingCategory(null)} className="text-xs bg-white text-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg font-bold">لابردن</button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-bold text-[var(--bg-secondary)] text-sm">{cat}</span>
                                        <button 
                                            onClick={() => {
                                                setEditingCategory(cat);
                                                setNewCategoryName(cat);
                                            }}
                                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--bg-secondary)] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[var(--border-color)]"
                                            title="گۆڕینی ناو"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
