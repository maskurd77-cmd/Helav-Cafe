import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, Coffee, ReceiptText, X, Tag, Banknote, ShoppingBag, MonitorSmartphone } from 'lucide-react';
import { usePosStore } from '@/store/usePosStore';
import { useProductStore } from '@/store/useProductStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { addOrder } from '@/services/orderService';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';

export function PosView() {
  const [activeCategory, setActiveCategory] = useState('هەمووی');
  
  const { products, loading } = useProductStore();
  const { settings } = useSettingsStore();

  const categories = ['هەمووی', ...Array.from(new Set(products.map(p => p.category)))];

  const [checkingOut, setCheckingOut] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number | string>('');
  const [receivedAmount, setReceivedAmount] = useState<number | string>('');

  const receiptRef = useRef<HTMLDivElement>(null);

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal } = usePosStore();

  // Sync cart for customer display
  useEffect(() => {
    setDoc(doc(db, 'settings', 'customer_display_cart'), { 
        cart, 
        updatedAt: new Date().toISOString() 
    }).catch(console.error);
  }, [cart]);

  const getFinalTotal = () => {
      const total = getCartTotal();
      const discount = Number(discountAmount) || 0;
      return Math.max(0, total - discount);
  };

  const openCheckoutModal = () => {
    if (cart.length === 0) return;
    setDiscountAmount('');
    setReceivedAmount('');
    setShowCheckoutModal(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setCheckingOut(true);
    try {
      const finalTotal = getFinalTotal();
      await addOrder({
        items: cart,
        total: finalTotal,
        date: new Date(),
        status: 'completed'
      });
      
      // Beautiful Print logic
      if (receiptRef.current) {
         const iframe = document.createElement('iframe');
         iframe.style.display = 'none';
         document.body.appendChild(iframe);
         
         const iframeDoc = iframe.contentWindow?.document;
         if (iframeDoc) {
           iframeDoc.write(`
             <html dir="rtl" lang="ku">
               <head>
                 <title>Receipt</title>
                 <style>
                    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600;700&display=swap');
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                    body { font-family: 'Cairo', 'Inter', sans-serif; padding: 0; font-size: 13px; color: #000; margin: 0; background: #fff; max-width: 300px; margin: 0 auto; line-height: 1.4; }
                    .center { text-align: center; }
                    .bold { font-weight: 700; }
                    .logo-img { max-width: 100px; max-height: 100px; margin: 0 auto 12px; display: block; object-fit: contain; }
                    .header { font-size: 20px; margin-bottom: 4px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Space Grotesk', 'Cairo', sans-serif; }
                    .sub { font-size: 11px; color: #333; margin-bottom: 3px; white-space: pre-wrap; line-height: 1.4; font-family: 'Inter', sans-serif; }
                    .dashed-line { border-bottom: 1.5px dashed #111; margin: 12px 0; }
                    .dotted-line { border-bottom: 1.5px dotted #999; margin: 10px 0; }
                    .solid-line { border-bottom: 2px solid #000; margin: 12px 0; }
                    .item-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; align-items: flex-start; }
                    .item-name-group { flex: 1; padding-right: 12px; line-height: 1.3; font-weight: 600; }
                    .item-qty { font-weight: 700; color: #111; font-size: 12px; margin-top: 1px; width: 24px; text-align: right; }
                    .item-price { min-width: 70px; text-align: left; font-weight: 700; font-family: 'Space Grotesk', monospace; font-size: 14px; }
                    .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; margin-top: 8px; align-items: center; }
                    .total-label { font-size: 16px; font-weight: 700; }
                    .total-amount { font-family: 'Space Grotesk', monospace; font-size: 22px; letter-spacing: -0.5px; }
                    .footer { text-align: center; margin-top: 25px; font-size: 12px; color: #000; white-space: pre-wrap; line-height: 1.6; font-weight: 700; border-top: 1px solid #eee; padding-top: 15px; }
                    .date-row { display: flex; justify-content: space-between; font-size: 11px; color: #333; margin-top: 15px; margin-bottom: 12px; font-family: 'Inter', monospace; font-weight: 600; text-transform: uppercase; border-top: 1.5px dotted #999; border-bottom: 1.5px dotted #999; padding: 6px 0; }
                    .powered-by { text-align: center; margin-top: 20px; font-size: 9px; color: #888; font-weight: 700; letter-spacing: 2px; font-family: 'Inter', sans-serif; }
                    @media print {
                       @page { margin: 0; padding: 0; }
                       body { margin: 10px; width: 100%; }
                    }
                 </style>
               </head>
               <body>
                 ${receiptRef.current.innerHTML}
                 <div class="powered-by">POWERED BY HELAV CAFE</div>
               </body>
             </html>
           `);
           iframeDoc.close();
           
           setTimeout(() => {
             iframe.contentWindow?.focus();
             iframe.contentWindow?.print();
             setTimeout(() => {
               document.body.removeChild(iframe);
             }, 1000);
           }, 500);
         }
      }
      
      clearCart();
      setIsCartOpen(false);
      setShowCheckoutModal(false);
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setCheckingOut(false);
    }
  };

  const filteredProducts = activeCategory === 'هەمووی' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US') + ' د.ع';
  };

  return (
    <div className="flex bg-[#F9F7F2] overflow-hidden h-full gap-4 lg:gap-8 relative min-w-0 pb-6 lg:pb-0">
      
      {/* Products Grid */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-[32px] lg:rounded-[40px] border border-[#E9E5D9] shadow-sm overflow-hidden min-w-0">
        <div className="p-4 lg:p-6 border-b border-[#F9F7F2] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h4 className="font-bold text-[#1E2420] text-lg lg:text-xl flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#D4A373]" />
            بڕگەکان
          </h4>
          <div className="flex gap-2 min-w-0 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 lg:px-5 py-2 lg:py-2.5 rounded-full font-bold transition-all text-xs lg:text-sm whitespace-nowrap ${
                  activeCategory === category 
                    ? 'bg-[#1E2420] text-[#E9E5D9] shadow-md' 
                    : 'bg-[#F9F7F2] text-[#8B8378] hover:bg-[#E9E5D9] hover:text-[#2D3631]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 lg:p-6 overflow-y-auto flex-1">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-[#8B8378] gap-4">
                 <div className="w-8 h-8 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
                 <span className="font-medium text-sm">بارکردنی بابەتەکان...</span>
             </div>
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.status === 'تەواو بووە'}
                className={`bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[24px] border border-[#E9E5D9] hover:border-[#D4A373] hover:shadow-[0_8px_30px_rgba(212,163,115,0.12)] transition-all text-right flex flex-col items-center group relative overflow-hidden min-h-[160px] justify-between gap-3 lg:gap-4 ${product.status === 'تەواو بووە' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-14 h-14 bg-[#F9F7F2] rounded-2xl flex items-center justify-center text-[#1E2420] group-hover:-translate-y-1 group-hover:bg-[#1E2420] group-hover:text-[#D4A373] transition-all shrink-0 duration-300">
                  <Coffee size={26} />
                </div>
                <div className="text-center w-full flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-[#1E2420] text-sm lg:text-base leading-snug line-clamp-2">{product.name}</h3>
                </div>
                <div className="text-center w-full mt-auto">
                  <span className="inline-block bg-[#F9F7F2] group-hover:bg-[#D4A373]/10 px-3 py-1.5 rounded-lg text-[#8B8378] font-bold text-xs lg:text-sm font-mono group-hover:text-[#D4A373] transition-colors">{product.price.toLocaleString('en-US')} <span className="font-sans text-[10px] font-normal">د.ع</span></span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#8B8378] bg-[#F9F7F2] rounded-3xl mt-4">
                    هیچ بابەتێک نەدۆزرایەوە بۆ فرۆشتن. تکایە لە بەشی مێنۆ بەروبووم زیاد بکە.
                </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Toggle Button */}
      <button 
        className="lg:hidden fixed bottom-6 left-6 z-40 bg-[#1E2420] text-[#E9E5D9] p-4 rounded-full shadow-2xl flex items-center justify-center w-14 h-14 border border-[#2D3631]"
        onClick={() => setIsCartOpen(true)}
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <div className="absolute -top-2 -right-3 bg-[#E11D48] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          )}
        </div>
      </button>

      {/* Cart Sidebar Overlay (Mobile) */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsCartOpen(false)} />
      )}

      {/* Cart Sidebar */}
      <div className={`fixed inset-y-0 left-0 lg:static w-[320px] lg:w-[380px] bg-white border-l lg:border border-[#E9E5D9] lg:rounded-[40px] flex flex-col shadow-2xl lg:shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden shrink-0 z-50 transform transition-transform duration-300 lg:transform-none ${isCartOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 lg:p-6 border-b border-[#E9E5D9] flex items-center justify-between shrink-0 bg-[#FDFBF7]">
          <h2 className="font-bold text-[#1E2420] text-base lg:text-lg flex items-center gap-2">
            داواکارییەکان
            <span className="bg-[#1E2420] text-white text-xs px-2 py-0.5 rounded-full">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </h2>
          <div className="flex items-center gap-2">
            <Link 
              to="/customer"
              target="_blank"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 lg:p-2 text-[#8B8378] hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#E9E5D9] hover:text-[#1E2420]"
              title="کردنەوەی شاشەی کڕیار"
            >
              <MonitorSmartphone size={18} />
            </Link>
            {cart.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-xs lg:text-sm text-[#E11D48] hover:text-white flex items-center gap-1 font-bold px-3 py-1.5 rounded-full hover:bg-[#E11D48] transition-colors"
                title="سڕینەوەی سەلەی کاڵاکان"
               >
                <Trash2 size={16} />
                <span className="hidden lg:inline">پاککردنەوە</span>
              </button>
            )}
            <button className="lg:hidden p-2 text-[#8B8378] hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#E9E5D9]" onClick={() => setIsCartOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8B8378] space-y-4 opacity-70">
              <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center">
                  <ShoppingCart size={32} className="text-[#D4A373]" />
              </div>
              <p className="font-medium text-sm lg:text-base">سەبەتەی کاڵاکان بەتاڵە</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-[#E9E5D9] hover:border-[#D4A373] transition-colors shadow-sm group">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1E2420] text-[#D4A373] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {index + 1}
                      </div>
                      <h4 className="font-bold text-[#1E2420] text-sm leading-snug pt-1">{item.name}</h4>
                  </div>
                  <span className="font-bold text-[#1E2420] text-sm whitespace-nowrap font-mono bg-[#F9F7F2] px-2 py-1 rounded-md">{formatPrice(item.price * item.quantity)}</span>
                </div>
                <div className="flex justify-between items-center pl-11">
                  <span className="text-[#8B8378] text-xs font-mono">{formatPrice(item.price)} دانەیەک</span>
                  <div className="flex items-center gap-1 lg:gap-3 bg-[#F9F7F2] rounded-full p-1 border border-[#E9E5D9]">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-full text-[#1E2420] transition-colors shadow-sm"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="w-5 lg:w-6 text-center font-bold text-[#1E2420] text-xs lg:text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-full text-[#1E2420] transition-colors shadow-sm"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 lg:p-6 bg-[#1E2420] text-white shrink-0 relative overflow-hidden flex flex-col justify-end">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="relative z-10 flex justify-between items-end mb-4 lg:mb-6">
            <span className="text-white/70 font-medium text-sm">کۆی گشتی:</span>
            <div className="text-right">
                <span className="text-2xl lg:text-3xl font-bold font-mono text-[#D4A373] tracking-tight">{getCartTotal().toLocaleString('en-US')}</span>
                <span className="text-sm text-white/70 mr-1">د.ع</span>
            </div>
          </div>
          <button 
            disabled={cart.length === 0 || checkingOut}
            onClick={openCheckoutModal}
            className="w-full relative z-10 bg-[#D4A373] hover:brightness-110 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed text-[#1E2420] font-bold py-3.5 lg:py-4 rounded-xl transition-all shadow-lg shadow-[#D4A373]/20 disabled:shadow-none flex justify-center items-center gap-2 text-sm lg:text-base border border-transparent disabled:border-white/10"
          >
            {checkingOut ? 'چاوەڕێبە...' : 'پارەدان و وەسل'}
          </button>
        </div>
      </div>

      {/* Hidden Beautiful Receipt Template */}
      <div className="hidden">
        <div ref={receiptRef}>
           <div className="center">
             {settings.logoUrl && <img src={settings.logoUrl} className="logo-img" alt="Logo" />}
             <div className="header" style={{ marginBottom: settings.address ? '4px' : '10px' }}>{settings.storeName || 'Helav Cafe'}</div>
             {settings.address && <div className="sub">{settings.address}</div>}
             {settings.phone && <div className="sub">{settings.phone}</div>}
           </div>
           
           <div className="date-row">
             <span>{new Date().toLocaleDateString('en-GB')}</span>
             <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
           </div>

           <div className="solid-line"></div>
           
           <div style={{ minHeight: '100px' }}>
              {cart.map(item => (
                <div key={item.id} className="item-row">
                  <div className="item-qty">{item.quantity}x</div>
                  <div className="item-name-group">{item.name}</div>
                  <div className="item-price">{(item.price * item.quantity).toLocaleString('en-US')}</div>
                </div>
              ))}
           </div>

           {Number(discountAmount) > 0 && (
             <div className="item-row" style={{ marginTop: '10px', color: '#555' }}>
               <div className="item-name-group">داشکان (Discount)</div>
               <div className="item-price" style={{ color: '#000' }}>- {Number(discountAmount).toLocaleString('en-US')}</div>
             </div>
           )}

           <div className="dashed-line"></div>
           
           <div className="total-row">
             <div className="total-label">کۆی گشتی:</div>
             <div className="total-amount">{getFinalTotal().toLocaleString('en-US')} <span style={{fontSize: '12px', fontWeight: 'bold'}}>.IQD</span></div>
           </div>

           {Number(receivedAmount) > 0 && (
             <>
               <div className="dotted-line"></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '8px' }}>
                 <div style={{ color: '#444' }}>پارەی وەرگیراو (Cash):</div>
                 <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{Number(receivedAmount).toLocaleString('en-US')} IQD</div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                 <div style={{ color: '#444' }}>باقییەکەی (Change):</div>
                 <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{Math.max(0, Number(receivedAmount) - getFinalTotal()).toLocaleString('en-US')} IQD</div>
               </div>
             </>
           )}

           <div className="footer">
             {settings.footerMessage || 'سوپاس بۆ سەردانت!'}
           </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-[#E9E5D9]">
            <div className="p-6 bg-[#FDFBF7] border-b border-[#E9E5D9] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1E2420] flex items-center gap-2">
                  <Banknote size={24} className="text-[#D4A373]" />
                  پارەدان و دەرکردنی وەسل
              </h2>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="p-2 text-[#8B8378] hover:bg-white hover:shadow-sm flex items-center justify-center border border-transparent hover:border-[#E9E5D9] rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-[#1E2420] p-6 rounded-2xl flex items-center justify-between shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -ml-8 -mt-8"></div>
                <span className="text-white/80 font-medium relative z-10 text-sm">کۆی گشتی داواکاری</span>
                <span className="text-2xl font-bold text-white font-mono tracking-tight relative z-10">{getCartTotal().toLocaleString('en-US')} <span className="font-sans text-xs text-white/60 font-normal">د.ع</span></span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#1E2420] mb-2">
                    <Tag size={16} className="text-[#D4A373]" />
                    بڕی داشکان (بە دینار)
                  </label>
                  <input 
                    type="number" 
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="نموونە: 1000"
                    className="w-full bg-[#F9F7F2] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-[#D4A373] focus:border-transparent outline-none text-[#1E2420] text-left dir-ltr transition-all font-mono font-bold text-lg placeholder:text-sm placeholder:font-sans"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#1E2420] mb-2">
                    <Banknote size={16} className="text-[#D4A373]" />
                    پارەی وەرگیراو (کاش)
                  </label>
                  <input 
                    type="number" 
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="بڕی پارەی پێدراو بۆ حیسابی باقی"
                    className="w-full bg-[#F9F7F2] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-[#D4A373] focus:border-transparent outline-none text-[#1E2420] text-left dir-ltr transition-all font-mono font-bold text-lg placeholder:text-sm placeholder:font-sans"
                  />
                </div>
              </div>

              <div className="border-t border-dashed border-[#E9E5D9] pt-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#8B8378] font-bold text-sm">بەهای کۆتایی <span className="font-normal text-xs">(پاش داشکان)</span></span>
                  <span className="text-2xl font-bold text-[#1E2420] font-mono tracking-tight">{getFinalTotal().toLocaleString('en-US')} <span className="font-sans text-sm text-[#8B8378] font-normal">د.ع</span></span>
                </div>
                
                {Number(receivedAmount) > 0 && (
                  <div className="flex justify-between items-center bg-[#4ADE80]/10 p-4 rounded-xl mt-4 border border-[#4ADE80]/20">
                    <span className="text-[#22C55E] font-bold text-sm">باقییەکەی (گێڕانەوە)</span>
                    <span className="text-xl font-bold text-[#22C55E] dir-ltr font-mono">
                      {Math.max(0, Number(receivedAmount) - getFinalTotal()).toLocaleString('en-US')} <span className="font-sans text-sm font-normal">د.ع</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-[#FDFBF7] border-t border-[#E9E5D9] flex gap-4">
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 bg-white border border-[#E9E5D9] hover:bg-[#F9F7F2] text-[#1E2420] font-bold py-4 rounded-xl transition-all text-sm"
              >
                پاشگەزبوونەوە
              </button>
              <button 
                onClick={handleCheckout}
                disabled={checkingOut}
                className="flex-[2] bg-[#1E2420] hover:bg-[#2D3631] disabled:opacity-70 text-[#E9E5D9] font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#1E2420]/10 flex items-center justify-center gap-2 text-sm"
              >
                {checkingOut ? 'چاوەڕێبە...' : 'چاپکردنی وەسل و تەواوکردن'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
