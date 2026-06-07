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
    storeName: 'Helav Cafe',
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
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % promoSlides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

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
         <div className="hidden lg:flex flex-[1.3] bg-[#1E2420] text-white rounded-[32px] overflow-hidden border-2 border-[#D4A373]/15 shadow-2xl relative flex-col justify-between p-6 lg:p-8 group-promo">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#D4A373_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#D4A373]/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/30 rounded-full blur-3xl -ml-24 -mb-24"></div>
              
              <div className="relative z-10 w-full h-full flex flex-col justify-between">
                
                {/* Header Welcome Title */}
                <div className="flex items-center justify-between w-full shrink-0">
                  <div className="bg-white/5 border border-white/10 py-1.5 px-3 rounded-full flex items-center gap-1.5">
                    <Star size={14} className="text-[#D4A373] fill-[#D4A373]" />
                    <span className="text-[10px] text-[#D4A373] font-bold">هەمیشە باشترین پێشکەش دەکەین</span>
                  </div>
                  <div className="flex gap-1.5">
                    {promoSlides.map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-6 bg-[#D4A373]' : 'w-1.5 bg-white/20'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Sliding Card Content - Slimmer for 13.3" Screen height restrictions */}
                <div className="my-4 flex-1 flex flex-col lg:flex-row items-center gap-6 justify-center">
                  <div className="flex-1 space-y-3 text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#D4A373]/20 border border-[#D4A373]/40 text-[#D4A373] text-[10px] font-bold">
                      {promoSlides[activeSlide].tag}
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight min-h-[90px]">
                      {promoSlides[activeSlide].title}
                    </h2>
                    <p className="text-slate-300 text-sm lg:text-base leading-relaxed max-w-md min-h-[70px]">
                      {promoSlides[activeSlide].desc}
                    </p>
                  </div>
                  
                  {/* Photo Frame - Formatted for 13.3" Screen ratio */}
                  <div className="w-[220px] h-[260px] shrink-0 rounded-[24px] overflow-hidden border-4 border-[#D4A373]/20 shadow-2xl relative group">
                    <img 
                      src={promoSlides[activeSlide].image} 
                      alt="promo" 
                      className="w-full h-full object-cover transform scale-100 duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e2420] via-transparent to-transparent"></div>
                  </div>
                </div>

                {/* Bottom luxury slogan */}
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#D4A373]/20 flex items-center justify-center text-[#D4A373] shrink-0">
                      <Heart size={16} className="fill-[#D4A373]" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold">تەندروست بن هەمیشە</p>
                      <p className="text-xs font-bold text-white">Helav Cafe - Since 2026</p>
                    </div>
                  </div>
                  <div className="bg-[#D4A373] text-[#1E2420] text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1">
                    <Volume2 size={10} />
                    سیستەمی فەرمی کڕیار
                  </div>
                </div>

              </div>
         </div>

         {/* Right Side: Dynamic Real-time Order Cart Bill */}
         <div className="flex-1 flex flex-col bg-white rounded-[32px] shadow-2xl border-2 border-[#E9E5D9] overflow-hidden max-h-full">
            
            <div className="p-5 bg-[#FDFBF7] border-b-2 border-[#E9E5D9] flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#1E2420] rounded-xl shadow-md border border-[#D4A373]/20 text-[#D4A373]">
                     <ShoppingBag size={22} />
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-black text-[#1E2420] tracking-tight">هەژماری داواکارییەکانتان</h2>
                    <p className="text-xs text-[#8B8378] font-bold mt-0.5">بە فەرمی لە مێزی ژمێریاری هێلاڤ کافێ</p>
                  </div>
               </div>
               <div className="bg-[#1E2420] text-[#D4A373] font-mono text-xs px-3 py-1.5 rounded-full font-bold shadow-md">
                 LIVE CALCULATION
               </div>
            </div>

            {/* List of items - High density padding, larger text, and giant highly visible prices */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#FCFAF5]">
                <AnimatePresence initial={false}>
                  {cart.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 0.7, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-[#8B8378] gap-4 py-12"
                      >
                          <div className="p-8 bg-[#F5F2EA] rounded-full text-[#D4A373] border-2 border-dashed border-[#D4A373]/30">
                              <Coffee size={56} className="stroke-[1.5] animate-bounce" />
                          </div>
                          <span className="text-2xl font-black text-[#1E2420]">بەخێربێن بۆ هێلاڤ کافێ</span>
                          <span className="text-sm font-bold text-center text-[#8B8378] px-8 leading-relaxed max-w-sm">
                            کڕیاری بەڕێز، کاتێک داواکارییەکەت لەلایەن کاشێرەوە تۆمار دەکرێت، لێرەدا بە ڕوونی پیشان دەدرێت.
                          </span>
                      </motion.div>
                  ) : (
                      cart.map((item, index) => (
                          <motion.div 
                            key={item.id} 
                            initial={{ opacity: 0, y: 15, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="flex items-center gap-4 p-4 bg-white rounded-[24px] border-2 border-[#E9E5D9] hover:border-[#D4A373] transition-all shadow-md relative overflow-hidden"
                          >
                              {/* Left decorative color bar */}
                              <div className="absolute top-0 right-0 w-2 bg-[#D4A373] h-full"></div>
                              
                              <div className="w-12 h-12 bg-[#F9F7F2] rounded-2xl border border-[#E9E5D9] flex items-center justify-center text-[#1E2420] shadow-inner shrink-0">
                                  <Coffee size={24} className="text-[#D4A373]" />
                              </div>
                              
                              <div className="flex-1 text-right min-w-0">
                                  {/* Giant product name */}
                                  <h3 className="text-xl font-bold text-[#1E2420] truncate leading-tight">{item.name}</h3>
                                  
                                  {/* Massive item unit price */}
                                  <div className="text-sm text-[#8B8378] font-bold mt-1.5 flex items-center justify-end gap-1.5">
                                      <span className="text-xs text-[#8B8378] font-sans">نرخی دانە:</span>
                                      <span className="font-mono text-[#D4A373] text-base font-black">{item.price.toLocaleString('en-US')} د.ع</span>
                                  </div>
                              </div>

                              {/* Quantity Badge Container */}
                              <div className="flex flex-col items-center gap-1 justify-center shrink-0 ml-2">
                                <span className="text-[10px] text-[#8B8378] font-bold uppercase tracking-wider">دانە</span>
                                <div className="px-4 py-2 bg-[#1E2420] text-[#D4A373] rounded-xl font-mono font-black text-2xl shadow-lg border border-[#D4A373]/20">
                                    {item.quantity}
                                </div>
                              </div>

                              {/* Subtotal of Item (Giant highly visible price) */}
                              <div className="text-left shrink-0 min-w-[110px] flex flex-col justify-center items-end border-r border-[#E9E5D9] pr-4">
                                  <span className="text-[10px] text-[#8B8378] font-bold">کۆی گشتی</span>
                                  <span className="text-2xl font-black font-mono text-[#1E2420] mt-0.5 tracking-tight">
                                      {(item.price * item.quantity).toLocaleString('en-US')}
                                  </span>
                                  <span className="text-[9px] text-[#8B8378] font-bold leading-none">دینار</span>
                              </div>
                          </motion.div>
                      ))
                  )}
                </AnimatePresence>
            </div>

            {/* Total Footer bill - HUGE DISPLAY for 13.3" viewport readability */}
            <div className="p-6 bg-[#1E2420] text-white mt-auto relative overflow-hidden shrink-0 border-t-4 border-[#D4A373]">
               <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A373]/5 rounded-full blur-3xl pointer-events-none"></div>
               <div className="flex justify-between items-center relative z-10">
                   <div className="text-right">
                      <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">کۆی سەرجەم داواکاری کڕیار</span>
                      <p className="text-2xl font-black text-white mt-1.5">بڕی کۆتایی بۆ پارەدان</p>
                      <span className="text-xs text-emerald-400 font-bold mt-2.5 block flex items-center gap-1.5 justify-start">
                         <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                         باج و خزمەتگوزاری تێدایە
                      </span>
                   </div>
                   <div className="text-left flex flex-col items-end">
                      <div className="text-5xl lg:text-6xl font-black font-mono tracking-tight text-[#D4A373] flex items-baseline gap-1.5">
                          {total.toLocaleString('en-US')}
                          <span className="text-lg text-white font-sans font-bold ml-1">د.ع</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold mt-2">TOTAL AMOUNT TO PAY</span>
                   </div>
               </div>
            </div>

         </div>
      </main>
    </div>
  );
}
