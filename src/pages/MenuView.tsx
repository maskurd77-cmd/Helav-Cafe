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
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-5 rounded-[24px] border border-[#E9E5D9] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] rounded-[18px] shadow-md border border-[#D4A373]/20">
             <Coffee size={24} className="stroke-[2]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#1E2420] tracking-tight">مێنۆی بەرهەمەکان</h1>
            <p className="text-xs lg:text-sm text-[#8B8378] mt-1 font-bold">بەڕێوەبردن و زیادکردنی خواردن و خواردنەوەکان</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
                <input 
                    type="text" 
                    placeholder="گەڕان بۆ پەرهەم..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#fdfbf7] border-2 border-[#E9E5D9] outline-none focus:border-[#D4A373] focus:ring-4 focus:ring-[#D4A373]/10 text-[#1E2420] font-bold text-sm py-3 pr-11 pl-4 rounded-xl transition-all"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#8B8378]">
                    <Search size={18} className="stroke-[2.5]" />
                </div>
            </div>
            
            <button 
            onClick={() => setShowCategoryModal(true)}
            className="bg-white hover:bg-[#F9F7F2] text-[#1E2420] border-2 border-[#E9E5D9] hover:border-[#D4A373] font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm w-full sm:w-auto whitespace-nowrap"
            >
            <Pencil size={18} className="stroke-[2.5] text-[#8B8378]" />
            دەستکاری پۆلێنەکان
            </button>
            <button 
            onClick={openAddModal}
            className="bg-gradient-to-b from-[#1E2420] to-[#2D3631] hover:from-[#1E2420] hover:to-[#1E2420] text-[#D4A373] border border-[#D4A373]/30 font-black py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm w-full sm:w-auto whitespace-nowrap stroke-[2.5]"
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
                  ? 'bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] shadow-md border-[#1E2420]'
                  : 'bg-white text-[#8B8378] border-[#E9E5D9] hover:border-[#D4A373] hover:text-[#1E2420] hover:shadow-sm'
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
                     ? 'bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] shadow-md border-[#1E2420]'
                     : 'bg-white text-[#8B8378] border-[#E9E5D9] hover:border-[#D4A373] hover:text-[#1E2420] hover:shadow-sm'
               }`}
            >
               {cat}
            </button>
         ))}
      </div>

      <div className="bg-gradient-to-b from-white to-[#FDFBF7] rounded-[24px] lg:rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#E9E5D9] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="overflow-auto flex-1 max-w-full custom-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-[#8B8378] gap-4 py-20">
                 <div className="w-10 h-10 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
                 <span className="font-bold text-sm tracking-wide">بارکردنی مێنۆ...</span>
             </div>
          ) : (
          <table className="w-full text-right border-collapse min-w-[500px]">
            <thead className="bg-white/50 backdrop-blur-md text-[#8B8378] text-[10px] lg:text-xs uppercase sticky top-0 z-10 border-b-2 border-[#E9E5D9] shadow-sm">
              <tr>
                <th className="px-6 py-5 font-black text-right tracking-wider">ناو</th>
                <th className="px-6 py-5 font-black text-right tracking-wider">پۆلێن</th>
                <th className="px-6 py-5 font-black text-right tracking-wider">نرخ</th>
                <th className="px-6 py-5 font-black text-right hidden lg:table-cell tracking-wider">دۆخ</th>
                <th className="px-6 py-5 font-black w-24 lg:w-32 text-left tracking-wider">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9F7F2]">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-white transition-all duration-300 group hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#FDFBF7] to-[#F9F7F2] rounded-xl flex items-center justify-center text-[#D4A373] flex-shrink-0 group-hover:bg-gradient-to-br group-hover:from-[#1E2420] group-hover:to-[#2D3631] transition-all duration-300 shadow-sm border border-[#E9E5D9]">
                              <Coffee size={20} className="stroke-[2.5]" />
                          </div>
                          <span className="font-black text-[#1E2420] text-base group-hover:text-[#D4A373] transition-colors">{product.name}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-white text-[#8B8378] border border-[#E9E5D9] px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm group-hover:border-[#D4A373]/30 transition-colors">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-[#D4A373] text-base font-mono">{product.price.toLocaleString('en-US')} <span className="font-sans text-xs font-bold text-[#8B8378] ml-1">د.ع</span></td>
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
                     <div className="flex flex-col items-center justify-center gap-4 text-[#8B8378]">
                        <div className="p-6 bg-[#F9F7F2] rounded-full border-2 border-dashed border-[#E9E5D9]">
                           <Coffee size={32} className="text-[#D4A373] opacity-50 stroke-[1.5]" />
                        </div>
                        <p className="font-bold text-base">هیچ بەرهەمێک نەدۆزرایەوە بۆ "{searchQuery || selectedCategory}"</p>
                        <button onClick={openAddModal} className="text-[#D4A373] font-black text-sm hover:underline mt-2">یەکەم بەرهەم زیاد بکە +</button>
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
                    <input required value={price} onChange={e => setPrice(e.target.value)} type="text" inputMode="numeric" className="w-full bg-[#F9F7F2] border border-transparent focus:bg-white focus:border-[#D4A373] rounded-xl px-4 py-3 outline-none text-[#1E2420] transition-colors font-mono" placeholder="2500" />
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
