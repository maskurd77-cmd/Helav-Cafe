import React, { useEffect, useState } from 'react';
import { CartItem } from '@/types';
import { Coffee, ShoppingBag, ArrowRight, Clock, Star, Heart, Volume2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { Link } from 'react-router-dom';
import { useBranchStore } from '@/store/useBranchStore';
import { motion, AnimatePresence } from 'motion/react';

export function CustomerDisplay() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { currentBranch } = useBranchStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [settings, setSettings] = useState({
    storeName: 'MAS MENU',
    logoUrl: '',
    greetingMessage: 'بەخێربێیت بۆ کافێکەمان',
    subGreeting: 'ئێمە لێرەین بۆ پێشکەشکردنی باشترین تام و چێژ بۆ ئێوەی ئازیز.'
  });

  const [activeSlide, setActiveSlide] = useState(0);

  // Settings structure now includes promoSlides, but we should safely default
  const promoSlides = settings?.promoSlides && settings.promoSlides.length > 0 
    ? settings.promoSlides 
    : [
        {
          title: 'قاوەی داخی هێلاڤ',
          desc: 'بۆن و تامی ڕەسەنی قاوەی کوردی و جیهانی لەگەڵ شیری سروشتی گەرم.',
          tag: 'خواستی زۆری لەسەرە 🔥',
          image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400'
        },
        {
          title: 'شیرینی و کێکە تازەکانمان',
          desc: 'هەموو بەیانییەک بە گەرمی و تازەیی بە کوالیتییەکی بەرز و بێوێنە ئامادە دەکرێن.',
          tag: 'هەمیشە تازە 🍰',
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400'
        },
        {
          title: 'ژینگەیەکی ئارام و بێدەنگ',
          desc: 'شوێنێکی گونجاو پێشکەش دەکەین بۆ کۆبوونەوە، خوێندنەوە، و بەسەربردنی کاتی ناوازە.',
          tag: 'ئاسودەیی دڵ ☕',
          image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400'
        }
      ];

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Slide loop timer
  useEffect(() => {
    if (promoSlides.length <= 1) {
      setActiveSlide(0);
      return;
    }
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % promoSlides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, [promoSlides.length]);

  // Clamp activeSlide if slides are deleted and index becomes out of bound
  useEffect(() => {
    if (activeSlide >= promoSlides.length) {
      setActiveSlide(0);
    }
  }, [promoSlides.length, activeSlide]);

  useEffect(() => {
    // Load remote settings via snapshot so it updates live
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
       if (doc.exists()) {
           setSettings(prev => ({ ...prev, ...doc.data() }));
       }
    }, (err) => {
       console.error("Failed to fetch settings", err);
    });

    const unsubscribeCart = onSnapshot(doc(db, 'settings', `customer_display_cart_${currentBranch}`), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.cart) {
                setCart(data.cart);
            } else {
                setCart([]);
            }
        } else {
            setCart([]);
        }
    }, (err) => {
        console.error("Failed to fetch cart", err);
    });

    return () => {
      unsubscribeCart();
      unsubscribeSettings();
    };
  }, [currentBranch]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getKurdishDate = () => {
    const days = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
    const now = new Date();
    return `${days[now.getDay()]} - ${now.toLocaleDateString('ku-IQ', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans select-none overflow-hidden h-screen text-right" dir="rtl">
      
      {/* Header Optimized for 13.3" Screens */}
      <header className="bg-[#1E2420] text-white py-3 px-6 border-b-2 border-[#D4A373]/30 shadow-xl shrink-0 flex items-center justify-between relative z-20">
         <div className="absolute top-0 right-0 w-32 h-20 bg-gradient-to-l from-[#D4A373]/10 to-transparent pointer-events-none"></div>
         <div className="flex items-center gap-4">
             {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-xl bg-white/10 p-1 border border-white/10 shadow-md" />
             ) : (
                <div className="w-12 h-12 rounded-xl bg-[#D4A373]/20 flex items-center justify-center text-[#D4A373] border border-[#D4A373]/40 shadow-inner">
                   <Coffee size={24} className="animate-pulse" />
                </div>
             )}
             <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F5E6CA] to-[#D4A373] tracking-tight">{settings?.storeName}</h1>
                <p className="text-xs text-[#8B8378] font-bold mt-0.5">{settings?.greetingMessage}</p>
             </div>
         </div>

         {/* Right Side Info (Kurdish Date & Live Clock) */}
         <div className="flex items-center gap-5">
             <div className="hidden md:flex flex-col text-right">
                <span className="text-[11px] text-slate-400 font-bold">{getKurdishDate()}</span>
                <span className="text-lg font-bold font-mono text-[#D4A373] tracking-wider mt-0.5 flex items-center gap-1.5 justify-end">
                  <Clock size={14} className="text-[#D4A373]" />
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
             </div>
             <Link to="/pos" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-[#D4A373] hover:text-[#1E2420] text-white transition-all shadow-md group border border-white/10" title="گەڕانەوە بۆ سیستەم">
                 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </Link>
         </div>
      </header>

      {/* Main Content Pane - High Density Layout for 13.3" Screens */}
      <main className="flex-1 flex overflow-hidden p-4 lg:p-5 gap-4 lg:gap-5 h-full max-h-[calc(100vh-76px)]">
         
         {/* Left Side: Premium Live Display Carousel */}
         <div className="hidden lg:flex w-[260px] shrink-0 bg-[#1E2420] text-white rounded-[32px] overflow-hidden border-2 border-[#D4A373]/15 shadow-2xl relative flex-col justify-between p-5 group-promo">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#D4A373_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-[#D4A373]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-[180px] h-[180px] bg-black/30 rounded-full blur-3xl -ml-16 -mb-16"></div>
              
              <div className="relative z-10 w-full h-full flex flex-col justify-between">
                
                {/* Header Welcome Title */}
                <div className="flex items-center justify-between w-full shrink-0">
                  <div className="bg-white/5 border border-white/10 py-1.5 px-3 rounded-full flex items-center gap-1.5">
                    <Star size={10} className="text-[#D4A373] fill-[#D4A373]" />
                    <span className="text-[9px] text-[#D4A373] font-bold">هەمیشە باشترین پێشکەش دەکەین</span>
                  </div>
                  <div className="flex gap-1.5">
                    {promoSlides.map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-5 bg-[#D4A373]' : 'w-1.5 bg-white/20'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Sliding Card Content - Slimmer for 13.3" Screen height restrictions */}
                <div className="my-2 flex-1 flex flex-col items-center gap-3 justify-center">
                  
                  {/* Photo Frame - Formatted for 13.3" Screen ratio */}
                  <div className="w-[140px] h-[140px] shrink-0 rounded-[20px] overflow-hidden border-2 border-[#D4A373]/20 shadow-2xl relative group">
                    <img 
                      src={promoSlides[activeSlide].image} 
                      alt="promo" 
                      className="w-full h-full object-cover transform scale-100 duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e2420] via-transparent to-transparent"></div>
                  </div>

                  <div className="flex-1 space-y-1.5 text-center mt-2">
                    <h2 className="text-xl lg:text-2xl font-extrabold text-white leading-tight min-h-[60px]">
                      {promoSlides[activeSlide].title}
                    </h2>
                    <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                      {promoSlides[activeSlide].desc}
                    </p>
                  </div>
                </div>

                {/* Bottom luxury slogan */}
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 justify-between shrink-0 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A373]/30 to-transparent flex items-center justify-center text-[#D4A373] shrink-0 border border-[#D4A373]/20">
                      <Star size={18} className="fill-[#D4A373]" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-0.5">PREMIUM EXPERIENCE</p>
                      <p className="text-sm font-black text-white tracking-widest">POWERED BY MAS MENU</p>
                    </div>
                  </div>
                </div>

              </div>
         </div>

         {/* Right Side: Dynamic Real-time Order Cart Bill */}
         <div className="flex-1 flex flex-col bg-white rounded-[32px] shadow-2xl border-2 border-[#E9E5D9] overflow-hidden max-h-full">
            
            <div className="p-6 bg-[#FDFBF7] border-b-2 border-[#E9E5D9] flex items-center justify-between shrink-0 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A373]/10 rounded-full blur-3xl pointer-events-none"></div>
               <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-[#1E2420] rounded-2xl shadow-lg border border-[#D4A373]/30 text-[#D4A373]">
                     <ShoppingBag size={24} />
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-black text-[#1E2420] tracking-tight">هەژماری داواکارییەکانتان</h2>
                    <p className="text-[10px] text-[#8B8378] font-bold mt-1 tracking-widest uppercase">POWERED BY MAS MENU</p>
                  </div>
               </div>
               <div className="bg-white border text-[#D4A373] border-[#E9E5D9] font-mono text-xs px-4 py-2 rounded-xl font-bold shadow-sm flex items-center gap-2 relative z-10">
                 <span className="relative flex h-2.5 w-2.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A373] opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4A373]"></span>
                 </span>
                 LIVE CALCULATION
               </div>
            </div>

            {/* List of items - Ultra high density padding, auto-scaling to fit 10 items without scroll */}
            <div className={`flex-1 p-2 lg:p-3 bg-gradient-to-b from-white to-[#FDFBF7] flex flex-col justify-start`}>
                <AnimatePresence initial={false}>
                  {cart.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-[#8B8378] gap-4"
                      >
                          <div className="p-6 bg-gradient-to-br from-[#FDFBF7] to-[#F9F7F2] rounded-full text-[#D4A373] shadow-inner border border-[#E9E5D9] relative">
                              <ShoppingBag size={48} className="stroke-[1.5]" />
                              <div className="absolute top-0 right-0 w-4 h-4 bg-[#E11D48] rounded-full animate-ping opacity-75"></div>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl font-black text-[#1E2420] block mb-2">بەخێربێن بۆ {settings?.storeName}</span>
                            <span className="text-[12px] font-bold text-[#8B8378] px-8 leading-relaxed max-w-sm block">
                              تکایە داواکارییەکەت لای کاشێر تۆمار بکە. هەرکە تۆمارکرا، لێرەدا بە ڕوونی دەیدەبینیت.
                            </span>
                          </div>
                      </motion.div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 h-full content-start items-start auto-rows-max">
                      {cart.map((item, index) => (
                          <motion.div 
                            key={item.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15, delay: index * 0.02 }}
                            className="flex items-stretch bg-white rounded-xl border border-[#E9E5D9] shadow-sm relative overflow-hidden group h-[52px]"
                          >
                              {/* Left decorative color bar */}
                              <div className="absolute top-0 right-0 w-1 bg-gradient-to-b from-[#1E2420] to-[#2D3631] h-full object-cover"></div>
                              
                              <div className="flex-1 text-right min-w-0 px-3 py-1.5 flex flex-col justify-center">
                                  {/* Giant product name */}
                                  <h3 className="text-[13px] font-black text-[#1E2420] truncate leading-tight">{item.name}</h3>
                                  
                                  {/* Massive item unit price */}
                                  <div className="text-[10px] text-[#8B8378] font-bold mt-0.5 flex items-center justify-start gap-1">
                                      <span className="text-[9px] text-[#8B8378]">نرخی دانە:</span>
                                      <span className="font-mono text-[#D4A373] text-[11px] font-black">{item.price.toLocaleString('en-US')}</span>
                                  </div>
                              </div>

                              {/* Quantity Badge Container */}
                              <div className="flex flex-col items-center justify-center shrink-0 border-r border-l border-[#E9E5D9] bg-[#FDFBF7] px-3">
                                  <span className="text-xs text-[#8B8378] font-bold mb-0.5">دانە</span>
                                  <span className="text-[15px] font-black text-[#1E2420] font-mono leading-none">{item.quantity}</span>
                              </div>

                              {/* Subtotal of Item (Giant highly visible price) */}
                              <div className="text-left shrink-0 min-w-[85px] flex flex-col justify-center items-end bg-[#1E2420] text-white px-3 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 pointer-events-none"></div>
                                  <span className="text-[8px] text-[#D4A373] font-bold uppercase tracking-wider relative z-10">کۆی بڕ</span>
                                  <span className="text-[15px] font-black font-mono text-white tracking-tight leading-none mt-0.5 relative z-10">
                                      {(item.price * item.quantity).toLocaleString('en-US')}
                                  </span>
                              </div>
                          </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
            </div>

            {/* Total Footer bill - HUGE DISPLAY for readability */}
            <div className="p-3 lg:p-4 bg-[#1E2420] text-white mt-auto relative overflow-hidden shrink-0 border-t-4 border-[#D4A373] shadow-[0_-10px_30px_rgba(30,36,32,0.1)]">
               <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A373]/10 rounded-full blur-3xl pointer-events-none"></div>
               <div className="absolute bottom-0 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
               <div className="flex justify-between items-center relative z-10">
                   <div className="text-right">
                      <span className="text-[9px] lg:text-[10px] text-[#D4A373] font-bold tracking-[0.2em] uppercase">کۆی سەرجەم داواکارییەکان</span>
                      <p className="text-lg lg:text-xl font-black text-white mt-0.5">بڕی کۆتایی بۆ پارەدان</p>
                   </div>
                   <div className="text-left flex flex-col items-end">
                      <div className="text-4xl lg:text-5xl font-black font-mono tracking-tight text-[#D4A373] flex items-baseline gap-1.5">
                          {total.toLocaleString('en-US')}
                          <span className="text-sm lg:text-base text-white font-sans font-bold ml-1">د.ع</span>
                      </div>
                   </div>
               </div>
            </div>

         </div>
      </main>
    </div>
  );
}
