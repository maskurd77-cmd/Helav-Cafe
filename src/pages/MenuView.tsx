import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, X, Coffee } from 'lucide-react';
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
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setStatus(product.status || 'بەردەستە');
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
          status
        });
      } else {
        await addProduct({
          name,
          price: Number(price),
          category,
          status
        });
      }
      setShowModal(false);
      setName('');
      setPrice('');
      setCategory('');
      setStatus('بەردەستە');
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
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1E2420]">مێنۆ</h1>
          <p className="text-xs lg:text-sm text-[#8B8378] mt-1">بەڕێوەبردنی خواردن و خواردنەوەکان</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
                <input 
                    type="text" 
                    placeholder="گەڕان..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#E9E5D9] outline-none focus:ring-2 focus:ring-[#D4A373] text-[#1E2420] text-sm py-2.5 pr-10 pl-4 rounded-xl transition-all shadow-sm shadow-[#E9E5D9]/20"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#8B8378]">
                    <Search size={16} />
                </div>
            </div>
            
            <button 
            onClick={() => setShowCategoryModal(true)}
            className="bg-white hover:bg-[#F9F7F2] text-[#1E2420] border border-[#E9E5D9] font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm w-full sm:w-auto whitespace-nowrap"
            >
            <Pencil size={18} />
            پۆلێنەکان
            </button>
            <button 
            onClick={openAddModal}
            className="bg-[#1E2420] hover:bg-[#2D3631] text-[#E9E5D9] font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm w-full sm:w-auto whitespace-nowrap"
            >
            <Plus size={18} />
            زیادکردنی بابەت
            </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar shrink-0">
         <button
            onClick={() => setSelectedCategory('هەمووی')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
               selectedCategory === 'هەمووی'
                  ? 'bg-[#1E2420] text-white shadow-md'
                  : 'bg-white text-[#8B8378] border border-[#E9E5D9] hover:bg-[#F9F7F2]'
            }`}
         >
            هەمووی
         </button>
         {categories.map(cat => (
            <button
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                     ? 'bg-[#1E2420] text-white shadow-md'
                     : 'bg-white text-[#8B8378] border border-[#E9E5D9] hover:bg-[#F9F7F2]'
               }`}
            >
               {cat}
            </button>
         ))}
      </div>

      <div className="bg-white rounded-[24px] lg:rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#E9E5D9] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="overflow-auto flex-1 max-w-full">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-[#8B8378] gap-4">
                 <div className="w-8 h-8 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
                 <span className="font-medium text-sm">بارکردنی مێنۆ...</span>
             </div>
          ) : (
          <table className="w-full text-right border-collapse min-w-[500px]">
            <thead className="bg-[#FDFBF7] text-[#8B8378] text-[10px] lg:text-xs uppercase sticky top-0 z-10 border-b border-[#E9E5D9]">
              <tr>
                <th className="px-6 py-4 font-semibold text-right">ناو</th>
                <th className="px-6 py-4 font-semibold text-right">پۆلێن</th>
                <th className="px-6 py-4 font-semibold text-right">نرخ</th>
                <th className="px-6 py-4 font-semibold text-right hidden lg:table-cell">دۆخ</th>
                <th className="px-6 py-4 font-semibold w-24 lg:w-32 text-left">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9F7F2]">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#FDFBF7] transition-colors group">
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#D4A373] flex-shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-[#E9E5D9]">
                              <Coffee size={18} />
                          </div>
                          <span className="font-bold text-[#1E2420] text-sm">{product.name}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[#F9F7F2] text-[#8B8378] border border-[#E9E5D9] px-3 py-1 rounded-lg text-xs font-medium">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#D4A373] text-sm font-mono">{product.price.toLocaleString('en-US')} <span className="font-sans text-xs font-normal text-[#8B8378]">د.ع</span></td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center w-max gap-1.5 ${
                      product.status === 'بەردەستە' ? 'bg-[#4ADE80]/10 text-[#22C55E] border border-[#4ADE80]/20' : 'bg-[#F87171]/10 text-[#EF4444] border border-[#F87171]/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${product.status === 'بەردەستە' ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}></div>  
                      {product.status || 'بەردەستە'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-2 text-[#8DAA91] hover:bg-[#8DAA91]/10 rounded-xl transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-[#E11D48] hover:bg-[#E11D48]/10 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                   <td colSpan={5} className="text-center py-16 text-[#8B8378] text-sm font-medium">هیچ بابەتێک نەدۆزرایەوە</td>
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
            <div className="p-6 bg-[#FDFBF7] border-b border-[#E9E5D9] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1E2420]">{editId ? 'دەستکاریکردنی بابەت' : 'زیادکردنی بابەت'}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-[#8B8378] hover:bg-white hover:shadow-sm rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
                <form id="menuForm" onSubmit={handleAddProduct} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-[#1E2420] mb-2">ناوی بابەت</label>
                    <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-[#F9F7F2] border border-transparent focus:bg-white focus:border-[#D4A373] rounded-xl px-4 py-3 outline-none text-[#1E2420] transition-colors" placeholder="کاپاتشینۆ" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-bold text-[#1E2420] mb-2">نرخ <span className="text-[#8B8378] text-xs font-normal">(د.ع)</span></label>
                    <input required value={price} onChange={e => setPrice(e.target.value)} type="number" className="w-full bg-[#F9F7F2] border border-transparent focus:bg-white focus:border-[#D4A373] rounded-xl px-4 py-3 outline-none text-[#1E2420] transition-colors font-mono" placeholder="2500" />
                    </div>
                    <div>
                    <label className="block text-sm font-bold text-[#1E2420] mb-2">دیاریکردنی دۆخ</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#F9F7F2] border border-transparent focus:bg-white focus:border-[#D4A373] rounded-xl px-4 py-3 outline-none text-[#1E2420] transition-colors">
                        <option>بەردەستە</option>
                        <option>تەواو بووە</option>
                    </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#1E2420] mb-2">پۆلێن</label>
                    <input required list="categories" value={category} onChange={e => setCategory(e.target.value)} type="text" placeholder="بۆ نموونە: قاوەی گەرم" className="w-full bg-[#F9F7F2] border border-transparent focus:bg-white focus:border-[#D4A373] rounded-xl px-4 py-3 outline-none text-[#1E2420] transition-colors" />
                    <datalist id="categories">
                    {categories.map(c => <option key={c} value={c} />)}
                    </datalist>
                </div>
                </form>
            </div>
            
            <div className="p-6 bg-[#FDFBF7] border-t border-[#E9E5D9] flex gap-4">
                <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-white border border-[#E9E5D9] hover:bg-[#F9F7F2] text-[#1E2420] font-bold py-3.5 rounded-xl transition-all"
                >
                    پاشگەزبوونەوە
                </button>
                <button 
                    type="submit"
                    form="menuForm"
                    className="flex-[2] bg-[#1E2420] hover:bg-[#2D3631] text-[#E9E5D9] font-bold py-3.5 rounded-xl transition-all shadow-lg"
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
            <div className="p-6 bg-[#FDFBF7] border-b border-[#E9E5D9] flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-[#1E2420]">بەڕێوەبردنی پۆلێنەکان</h2>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="p-2 text-[#8B8378] hover:bg-white hover:shadow-sm rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-3">
                    {categories.length === 0 ? (
                        <p className="text-center text-[#8B8378] py-8 text-sm">هیچ پۆلێنێک نییە</p>
                    ) : (
                        categories.map(cat => (
                            <div key={cat} className="flex items-center justify-between bg-[#F9F7F2] p-3 rounded-xl border border-transparent hover:border-[#E9E5D9] transition-all">
                                {editingCategory === cat ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={newCategoryName} 
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            className="flex-1 bg-white border border-[#D4A373] outline-none rounded-lg px-3 py-1.5 text-sm text-[#1E2420]"
                                        />
                                        <button onClick={() => handleUpdateCategory(cat)} className="text-xs bg-[#1E2420] text-white px-3 py-1.5 rounded-lg font-bold">پاشەکەوت</button>
                                        <button onClick={() => setEditingCategory(null)} className="text-xs bg-white text-[#1E2420] border border-[#E9E5D9] px-3 py-1.5 rounded-lg font-bold">لابردن</button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-bold text-[#1E2420] text-sm">{cat}</span>
                                        <button 
                                            onClick={() => {
                                                setEditingCategory(cat);
                                                setNewCategoryName(cat);
                                            }}
                                            className="p-1.5 text-[#8B8378] hover:text-[#1E2420] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#E9E5D9]"
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
