import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/components/AuthProvider';
import { useProductStore } from '@/store/useProductStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { CartItem, Product, HospitalRequest } from '@/types';
import { 
  ShoppingBag, 
  Layers, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Minus, 
  Trash2, 
  ClipboardList,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function HospitalRequesterPortal() {
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProductStore();
  const { settings } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [activeCategory, setActiveCategory] = useState('هەمووی');
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Requester Cart State
  const [requestCart, setRequestCart] = useState<CartItem[]>([]);
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // History State
  const [history, setHistory] = useState<HospitalRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const categories = ['هەمووی', ...Array.from(new Set(products.map(p => p.category)))];

  // Load history in real-time
  useEffect(() => {
    if (!user?.email) return;

    setHistoryLoading(true);
    const q = query(
      collection(db, 'hospital_requests'),
      where('requesterEmail', '==', user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HospitalRequest[];
      // Sort client-side by date descending to bypass composite index requirement
      docsData.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const dbVal = b.date ? new Date(b.date).getTime() : 0;
        return dbVal - da;
      });
      setHistory(docsData);
      setHistoryLoading(false);
    }, (err) => {
      console.error("Error loading request history:", err);
      setHistoryLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addToCart = (product: Product) => {
    const existing = requestCart.find(item => item.id === product.id);
    if (existing) {
      setRequestCart(requestCart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setRequestCart([...requestCart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setRequestCart(requestCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setRequestCart(requestCart.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const getCartTotal = () => {
    return requestCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestCart.length === 0) return;
    if (!department.trim()) {
      showNotification('تکایە ناوی بەشەکە دیاریبکە', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, 'hospital_requests'), {
        department: department.trim(),
        items: requestCart,
        status: 'pending',
        date: new Date().toISOString(),
        notes: notes.trim(),
        requesterEmail: user?.email || '',
        total: getCartTotal()
      });

      setRequestCart([]);
      setDepartment('');
      setNotes('');
      setActiveTab('history');
      showNotification('داواکارییەکە بە سەرکەوتوویی ڕەوانەکرا', 'success');
    } catch (error) {
      console.error("Error submitting request:", error);
      showNotification('شکست لە ناردنی داواکارییەکەدا کێشەیەک ڕوویدا', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products based on active category
  const filteredProducts = activeCategory === 'هەمووی' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 relative">
      {/* Absolute Toast View */}
      {toast && (
        <div className={cn(
          "fixed top-6 left-6 right-6 sm:left-auto sm:w-80 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 transition-all duration-300 transform translate-y-0 scale-100",
          toast.type === 'success' 
            ? "bg-[#1E2420] border-[#8DAA91]/40 text-white" 
            : "bg-red-50 border-red-200 text-red-900"
        )}>
          <div className={cn("w-2 h-2 rounded-full shrink-0", toast.type === 'success' ? "bg-[#8DAA91]" : "bg-red-600")} />
          <span className="font-bold text-xs sm:text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#1E2420] text-white p-6 lg:p-8 rounded-[32px] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shrink-0">
         <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A373]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
         <div className="relative z-10">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#D4A373] flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              {settings.storeName || 'پۆرتاڵی داواکاری نەخۆشخانە'}
            </h1>
            <p className="text-white/60 text-xs lg:text-sm mt-2">
              سیستەمی تۆمارکردن و ڕەوانەکردنی داواکارییەکانی بەشەکانی نەخۆشخانە
            </p>
         </div>

         {/* Navigation Tabs */}
         <div className="flex bg-[#2D3631] border border-white/10 rounded-2xl p-1 shadow-inner relative z-10 w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('new')}
              className={cn(
                "flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2",
                activeTab === 'new' 
                  ? "bg-[#D4A373] text-[#1E2420] shadow-sm" 
                  : "text-white/70 hover:text-white"
              )}
            >
              <ShoppingBag size={16} /> داواکاری نوێ
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2",
                activeTab === 'history' 
                  ? "bg-[#D4A373] text-[#1E2420] shadow-sm" 
                  : "text-white/70 hover:text-white"
              )}
            >
              <ClipboardList size={16} /> مێژووی داواکارییەکان
            </button>
         </div>
      </div>

      {activeTab === 'new' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
          {/* Right Section: Products Category & List (Grid 8) */}
          <div className="lg:col-span-8 flex flex-col space-y-6 min-h-0">
             {/* Category Scrolling Bar */}
             <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar shrink-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 border whitespace-nowrap shadow-sm",
                      activeCategory === cat
                        ? "bg-[#1E2420] border-[#1E2420] text-white shadow-lg shadow-[#1E2420]/10"
                        : "bg-white border-[#E9E5D9] text-[#2D3631] hover:border-[#1E2420]/30"
                    )}
                  >
                    {cat}
                  </button>
                ))}
             </div>

             {/* Products Grid */}
             <div className="flex-1 overflow-y-auto pr-1">
                {productsLoading ? (
                   <div className="flex h-64 items-center justify-center text-[#8B8378]">
                      <div className="w-8 h-8 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
                   </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                     {filteredProducts.map((p) => (
                        <div 
                          key={p.id}
                          onClick={() => addToCart(p)}
                          className="bg-white rounded-[20px] p-4 border border-[#E9E5D9] hover:border-[#8DAA91] hover:shadow-xl hover:shadow-[#8DAA91]/5 transition-all duration-300 cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                        >
                           <div className="aspect-square w-full rounded-2xl bg-[#FDFBF7] mb-3 overflow-hidden border border-[#F9F7F2] relative flex items-center justify-center text-[#D4A373]">
                             {p.image ? (
                               <img src={p.image} referrerPolicy="no-referrer" alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                             ) : (
                               <Layers size={32} />
                             )}
                           </div>
                           <div>
                              <span className="text-[10px] font-bold text-[#8B8378] tracking-wide uppercase">{p.category}</span>
                              <h3 className="font-bold text-[#1E2420] text-sm sm:text-base mt-0.5 line-clamp-1 group-hover:text-[#8DAA91] transition-colors">{p.name}</h3>
                              <p className="text-xs sm:text-sm font-bold text-[#1E2420] font-mono mt-1">{p.price.toLocaleString()} <span className="text-[10px] font-sans text-gray-400 font-normal">د.ع</span></p>
                           </div>
                        </div>
                     ))}
                  </div>
                ) : (
                  <div className="flex flex-col h-64 items-center justify-center text-[#8B8378] bg-white rounded-3xl border border-[#E9E5D9]">
                     <Layers className="opacity-30 mb-2" size={32} />
                     <p className="font-medium text-sm">هیچ بەرهەمێک لەم بەشەدا نییە</p>
                  </div>
                )}
             </div>
          </div>

          {/* Left Section: Department Info & Request Cart (Grid 4) */}
          <div className="lg:col-span-4 bg-white border border-[#E9E5D9] rounded-[32px] p-6 shadow-sm flex flex-col overflow-hidden min-h-0">
             <div className="flex items-center justify-between border-b border-[#F9F7F2] pb-4 mb-4 shrink-0">
                <h2 className="text-lg font-bold text-[#1E2420] flex items-center gap-2">
                   <ShoppingBag size={18} className="text-[#D4A373]" /> سەبەتەی داواکاری
                </h2>
                {requestCart.length > 0 && (
                   <button 
                     onClick={() => setRequestCart([])} 
                     className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                   >
                     <Trash2 size={12} /> پاککردنەوە
                   </button>
                )}
             </div>

             {/* Cart Items List */}
             <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-1">
                {requestCart.length > 0 ? (
                  requestCart.map((item) => (
                    <div key={item.id} className="flex gap-3 justify-between items-center py-2 border-b border-[#F9F7F2]">
                       <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#1E2420] text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-[#8B8378] font-mono mt-0.5">{item.price.toLocaleString()} د.ع</p>
                       </div>
                       
                       {/* Qty Controls */}
                       <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 bg-[#F9F7F2] hover:bg-[#E9E5D9] text-[#1E2420] rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-bold text-[#1E2420] text-sm w-5 text-center font-mono">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 bg-[#F9F7F2] hover:bg-[#E9E5D9] text-[#1E2420] rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#8B8378] py-12">
                     <ShoppingBag size={40} className="stroke-[1.5] opacity-20 mb-3" />
                     <p className="text-sm font-medium">هیچ بابەتێک زیاد نەکراوە</p>
                  </div>
                )}
             </div>

             {/* Requester Metadata Forms */}
             {requestCart.length > 0 && (
               <form onSubmit={handleSubmitRequest} className="border-t border-[#F9F7F2] pt-4 space-y-4 shrink-0">
                  <div>
                     <label className="block text-xs font-bold text-[#1E2420] mb-2">ناوی بەش یان نهۆم</label>
                     <input 
                       required 
                       type="text" 
                       value={department}
                       onChange={(e) => setDepartment(e.target.value)}
                       placeholder="بۆ نموونە: فریاکەوتن، نهۆمی یەکەم"
                       className="w-full bg-[#F9F7F2] border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4A373] outline-none text-[#1E2420]" 
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-[#1E2420] mb-2">تێبینی یان ڕوونکردنەوەی زیاتر (ئارەزوومەندانە)</label>
                     <textarea 
                       rows={2}
                       value={notes}
                       onChange={(e) => setNotes(e.target.value)}
                       placeholder="بۆ کێیە، یاخود کەی پێویستە..."
                       className="w-full bg-[#F9F7F2] border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4A373] outline-none text-[#1E2420] resize-none" 
                     />
                  </div>

                  <div className="flex justify-between items-center py-2 border-t border-[#F9F7F2] font-bold text-[#1E2420]">
                     <span>کۆی گشتی:</span>
                     <span className="font-mono text-base">{getCartTotal().toLocaleString()} د.ع</span>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1E2420] hover:bg-[#2D3631] text-white font-bold py-3.5 rounded-full transition-all shadow-lg shadow-[#1E2420]/15 flex items-center justify-center gap-2 text-sm"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send size={15} />
                        رەوانەکردنی داواکاری
                      </>
                    )}
                  </button>
               </form>
             )}
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="flex-1 bg-white border border-[#E9E5D9] rounded-[32px] p-6 shadow-sm overflow-hidden flex flex-col min-h-0">
           <h2 className="text-lg font-bold text-[#1E2420] border-b border-[#F9F7F2] pb-4 mb-4 shrink-0 flex items-center gap-2">
              <ClipboardList className="text-[#D4A373]" /> داواکاری تەمەنکراوەکان و ڕابردوو
           </h2>

           <div className="flex-1 overflow-y-auto pr-1">
              {historyLoading ? (
                 <div className="flex h-48 items-center justify-center text-[#8B8378]">
                    <div className="w-8 h-8 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
                 </div>
              ) : history.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                    {history.map((req) => (
                       <div key={req.id} className="border border-[#E9E5D9] p-5 rounded-2xl flex flex-col justify-between space-y-3 bg-[#FDFBF7]">
                          <div className="flex justify-between items-start border-b border-[#F9F7F2] pb-3">
                             <div>
                                <h3 className="font-bold text-[#2D3631] text-base">{req.department}</h3>
                                <p className="text-[10px] text-[#8B8378] font-mono mt-0.5">{new Date(req.date).toLocaleString('ku-IQ')}</p>
                             </div>
                             
                             {/* Status badges */}
                             <span>
                                {req.status === 'pending' && (
                                   <span className="bg-amber-50 text-amber-600 border border-amber-100 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                      <Clock size={12} /> چاوەڕێیە
                                   </span>
                                )}
                                {req.status === 'approved' && (
                                   <span className="bg-green-50 text-green-600 border border-green-100 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                      <CheckCircle size={12} /> پەسەندکراو
                                   </span>
                                )}
                                {req.status === 'rejected' && (
                                   <span className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                      <XCircle size={12} /> ڕەتکراوە
                                   </span>
                                )}
                             </span>
                          </div>

                          {/* Items summary */}
                          <div className="space-y-1">
                             {req.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-[#2D3631]">
                                   <span>{item.name} <span className="text-[#8B8378] font-bold">x{item.quantity}</span></span>
                                   <span className="font-mono">{(item.price * item.quantity).toLocaleString()} د.ع</span>
                                </div>
                             ))}
                          </div>

                          {req.notes && (
                            <div className="text-xs bg-white border border-[#E9E5D9] p-2 rounded-xl text-gray-500 whitespace-pre-wrap">
                               <strong>تێبینی:</strong> {req.notes}
                            </div>
                          )}

                          <div className="border-t border-[#F9F7F2] pt-3 flex justify-between font-bold text-sm text-[#1E2420]">
                             <span>کۆی گشتی:</span>
                             <span className="font-mono text-[#8DAA91]">{req.total.toLocaleString()} د.ع</span>
                          </div>
                       </div>
                    ))}
                 </div>
              ) : (
                <div className="flex flex-col h-48 items-center justify-center text-[#8B8378] py-12 bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E9E5D9]">
                   <ClipboardList size={32} className="stroke-[1.5] opacity-20 mb-2" />
                   <p className="text-sm font-medium">تا ئێستا هیچ داواکارییەکت پێشکەش نەکردووە</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
