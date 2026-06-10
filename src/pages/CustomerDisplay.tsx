import React, { useEffect, useState } from 'react';
import { CartItem, Product } from '@/types';
import { Coffee, Clock, ArrowRight, ArrowLeft, Maximize, Minimize } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { Link } from 'react-router-dom';
import { useBranchStore } from '@/store/useBranchStore';
import { useProductStore } from '@/store/useProductStore';
import { motion, AnimatePresence } from 'motion/react';

export function CustomerDisplay() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { currentBranch } = useBranchStore();
  const { products, initProducts } = useProductStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreenOn, setIsFullscreenOn] = useState(false);

  // Toggle fullscreen mode manually
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreenOn(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreenOn(false);
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  // Sync state when native fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenOn(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    // Auto-request fullscreen on first mount
    const tryAutoFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreenOn(true);
        }
      } catch (e) {
        console.log("Auto-fullscreen blocked by browser security. Manual button is shown.");
      }
    };
    // Delay slightly to ensure user interaction registers if opened from popup focus
    const timer = setTimeout(tryAutoFullscreen, 500);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      clearTimeout(timer);
    };
  }, []);

  // Settings read dynamically in real-time
  const [settings, setSettings] = useState<any>({
    storeName: 'MAS MENU',
    logoUrl: '',
    greetingMessage: 'بەخێربێیت بۆ جیهانی تام و چێژ',
    subGreeting: 'ئێمە لێرەین بۆ پێشکەشکردنی باشترین تام بە بەرزترین کوالیتی بۆ ئێوەی بەڕێز.',
    customerDisplayTheme: 'dark',
    customerDisplayShowPromo: true,
    customerDisplayShowMenu: true,
    customerDisplayAccentColor: 'bronze',
    promoSlides: []
  });

  const [activeSlide, setActiveSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState('هەمووی');

  // Load products store
  useEffect(() => {
    initProducts();
  }, [currentBranch]);

  // Premium fallback slides if none are defined
  const defaultPromoSlides = [
    {
      title: 'قاوەی داخی MAS MENU',
      desc: 'بۆن و تامی ڕەسەنی قاوەی کوردی و جیهانی لەگەڵ شیری سروشتی گەرم.',
      tag: 'کارامەی گەرم...',
      price: '٣,٥٠٠ د.ع',
      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'کێکی شوکولاتەی گەرمی لۆڤەر',
      desc: 'پارچەیەکی بێوێنە لە شەربەتی شوکولاتەی سویسری گەرم لەگەڵ کێکی فڕنی دەستی.',
      tag: 'شیرینی ڕۆژ...',
      price: '٤,٥٠٠ د.ع',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800'
    }
  ];

  const hasSlides = settings.promoSlides && settings.promoSlides.length > 0;

  const activeSlides = hasSlides ? settings.promoSlides : [];

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Slide transition timer
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const intervalSec = settings.customerDisplaySlideInterval || 7;
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activeSlides.length);
    }, intervalSec * 1000);
    return () => clearInterval(slideTimer);
  }, [activeSlides.length, settings.customerDisplaySlideInterval]);

  useEffect(() => {
    const docName = currentBranch === 'cafe' ? 'general' : 'hospital';
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', docName), (docSnap) => {
       if (docSnap.exists()) {
           setSettings(prev => ({ ...prev, ...docSnap.data() }));
       }
    }, (err) => {
       console.error("Failed to fetch settings", err);
    });

    // 1. Initialise BroadcastChannel for instantaneous (0ms latency local transfer matching SambaPOS)
    let localChannel: BroadcastChannel | null = null;
    try {
      localChannel = new BroadcastChannel("pos_customer_display_channel");
      localChannel.onmessage = (event) => {
        const { type, cart: updatedCart, branch } = event.data || {};
        if (type === "CART_UPDATE" && branch === currentBranch) {
          setCart(updatedCart || []);
        }
      };
    } catch (err) {
      console.warn("Could not setup local BroadcastChannel:", err);
    }

    // 2. Load active branch cart live via Firestore (Background fallback/durable persistence)
    const unsubscribeCart = onSnapshot(doc(db, 'settings', `customer_display_cart_${currentBranch}`), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.cart) {
                // Only update if not already instantly updated or as robust master source of truth
                setCart(data.cart);
            } else {
                setCart([]);
            }
        } else {
            setCart([]);
        }
    }, (err) => {
        console.error("Failed to fetch cart from Firestore", err);
    });

    return () => {
      unsubscribeCart();
      unsubscribeSettings();
      if (localChannel) {
        localChannel.close();
      }
    };
  }, [currentBranch]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getKurdishDate = () => {
    const days = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
    const now = new Date();
    return `${days[now.getDay()]} - ${now.toLocaleDateString('ku-IQ', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  const isLightMode = settings.customerDisplayTheme === 'light';
  const accent = settings.customerDisplayAccentColor || 'bronze';

  // Map accents to values seamlessly
  const accentText = 
    accent === 'emerald' ? 'text-[#8DAA91]' :
    accent === 'azure' ? 'text-sky-500' :
    accent === 'rose' ? 'text-rose-500' :
    'text-[var(--accent-gold)]';

  const accentBg = 
    accent === 'emerald' ? 'bg-[#8DAA91]' :
    accent === 'azure' ? 'bg-sky-500' :
    accent === 'rose' ? 'bg-rose-500' :
    'bg-[var(--accent-gold)]';

  const accentBorder = 
    accent === 'emerald' ? 'border-[#8DAA91]' :
    accent === 'azure' ? 'border-sky-500' :
    accent === 'rose' ? 'border-rose-500' :
    'border-[var(--accent-gold)]';

  const accentRing = 
    accent === 'emerald' ? 'focus:ring-[#8DAA91]' :
    accent === 'azure' ? 'focus:ring-sky-500' :
    accent === 'rose' ? 'focus:ring-rose-500' :
    'focus:ring-[var(--accent-gold)]';

  const availableCategories = ['هەمووی', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = activeCategory === 'هەمووی'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div 
      className={`min-h-screen flex flex-col font-sans select-none overflow-hidden h-screen text-right transition-colors duration-500 ${
        isLightMode 
          ? 'bg-[var(--bg-primary)] text-[var(--text-dark)]' 
          : 'bg-[#0A0F0D] text-[var(--border-color)]'
      }`} 
      dir="rtl"
    >
      {/* 1. TOP PREMIUM HEADER */}
      <header className={`py-4 px-8 border-b flex items-center justify-between shrink-0 z-20 ${
        isLightMode 
          ? 'bg-white/80 backdrop-blur border-[var(--border-color)]' 
          : 'bg-[#111613]/90 backdrop-blur border-[var(--border-color)]/10'
      }`}>
        <div className="flex items-center gap-4">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentBg} text-white`}>
              <Coffee size={20} />
            </div>
          )}
          <div>
            <h1 className="text-xl font-black tracking-wide font-mono leading-none">
              {settings?.storeName}
            </h1>
            <p className={`text-[10px] mt-1 font-bold ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {settings?.greetingMessage}
            </p>
          </div>
        </div>

        {/* Live Clock / System Status */}
        <div className="flex items-center gap-6">
          {settings.customerDisplayShowClock !== false && (
            <div className="text-right">
              <span className={`text-[10px] font-bold block ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {getKurdishDate()}
              </span>
              <span className="text-sm font-black font-mono tracking-widest mt-0.5 inline-block">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )}

          {/* Minimal Live Status Tag */}
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ڕاستەوخۆ</span>
          </div>

          {/* Fullscreen Toggle Button */}
          <button 
            onClick={toggleFullscreen}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${
              isLightMode 
                ? 'bg-white hover:bg-gray-150 text-gray-700 border-gray-200' 
                : 'bg-white/5 hover:bg-white/10 text-white/90 border-[var(--border-color)]/10'
            }`}
            title={isFullscreenOn ? "بچووککردنەوەی شاشە" : "گەورەکردنی شاشە بۆ تەواو"}
          >
            {isFullscreenOn ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          <Link 
            to="/pos" 
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${
              isLightMode 
                ? 'bg-white hover:bg-gray-150 text-gray-700 border-gray-200' 
                : 'bg-white/5 hover:bg-white/10 text-white/90 border-[var(--border-color)]/10'
            }`}
          >
            <ArrowLeft size={16} />
          </Link>
        </div>
      </header>

      {/* 2. MAIN SPLIT GRID (Sleek side-by-side design) */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6 h-full max-h-[calc(100vh-73px)]">
        
        {/* Left Hand: Promotion Slider / Big Brand Card */}
        {settings.customerDisplayShowPromo !== false && hasSlides && (
          <div className={`hidden lg:flex w-[400px] shrink-0 rounded-[28px] overflow-hidden border p-6 flex-col justify-between transition-all ${
            isLightMode 
              ? 'bg-white border-[var(--border-color)]' 
              : 'bg-[#111613] border-[var(--border-color)]/10'
          }`}>
            {/* Top Indicator */}
            <div className="flex justify-between items-center">
              <span className={`text-[10px] font-black uppercase tracking-wider ${accentText}`}>
                تایبەت پێشنیار کراوە
              </span>
              {/* Pagination indicators */}
              <div className="flex gap-1.5">
                {activeSlides.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeSlide === i 
                        ? `w-4 ${accentBg}` 
                        : (isLightMode ? 'w-1.5 bg-gray-200' : 'w-1.5 bg-white/10')
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Slider Content */}
            <div className="my-auto flex flex-col items-center text-center">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeSlide}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col items-center"
                >
                  <div className="w-[280px] h-[200px] rounded-2xl overflow-hidden mb-5 shadow-sm border border-black/5">
                    <img 
                      src={activeSlides[activeSlide]?.image} 
                      alt="" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-xl font-black mb-1.5">
                    {activeSlides[activeSlide]?.title}
                  </h3>
                  <p className={`text-[11px] leading-relaxed max-w-xs mb-3.5 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {activeSlides[activeSlide]?.desc}
                  </p>
                  {activeSlides[activeSlide]?.price && (
                    <span className={`text-sm font-black font-mono px-3.5 py-1 rounded-xl bg-black/5`}>
                      {activeSlides[activeSlide].price}
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Signature Area (Optional) */}
            {settings.customerDisplayShowSignature !== false && (
              <div className={`p-3.5 rounded-2xl border text-center text-xs font-bold ${
                isLightMode ? 'bg-[var(--bg-primary)] border-gray-100 text-gray-500' : 'bg-white/5 border-white/5 text-gray-400'
              }`}>
                تام و چێژێکی ناوازە هەمیشە ١٠٠٪ سروشتی 🌾
              </div>
            )}
          </div>
        )}

        {/* Right Hand: Order Details List or Menu Catalog */}
        <div className={`flex-1 flex flex-col rounded-[28px] border overflow-hidden h-full ${
          isLightMode 
            ? 'bg-white border-[var(--border-color)]' 
            : 'bg-[#111613] border-[var(--border-color)]/10'
        }`}>
          
          {/* Section banner */}
          <div className="p-6 border-b flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-black">
                {cart.length > 0 ? 'لیستی داواکارییەکانتان' : 'بەخێربێن بۆ لقەکەمان'}
              </h2>
              <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-gray-405 text-gray-500' : 'text-gray-400'}`}>
                {cart.length > 0 ? 'لێرەوە تەواوی داواکارییەکەت بە دروستی و ڕاستەوخۆ دەبینیت' : settings.subGreeting}
              </p>
            </div>
            {cart.length > 0 && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${accentBg} text-white`}>
                {cart.length} بابەت
              </span>
            )}
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {cart.length === 0 ? (
                /* Dynamic Display: Showcase available items in a modern, uncluttered grid if cart empty and showMenu settings is true */
                settings.customerDisplayShowMenu !== false ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col"
                  >
                    {/* Category tabs */}
                    <div className="flex gap-2 pb-3 mb-4 overflow-x-auto shrink-0 scrollbar-none">
                      {availableCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all border shrink-0 ${
                            activeCategory === cat
                              ? `${accentBg} text-white border-transparent shadow`
                              : (isLightMode 
                                  ? 'bg-[var(--bg-primary)] text-gray-600 border-gray-150 hover:bg-[var(--bg-primary)]/80' 
                                  : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10')
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Products minimalist list */}
                    <div className="flex-1 overflow-y-auto pr-1 font-sans">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                        {filteredProducts.map((prod) => (
                          <div 
                            key={prod.id}
                            className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                              isLightMode 
                                ? 'bg-[var(--bg-primary)] border-gray-150 hover:bg-[var(--bg-primary)]/80' 
                                : 'bg-white/5 border-transparent hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {prod.image ? (
                                <img src={prod.image} alt={prod.name} className="w-10 h-10 object-cover rounded-xl border border-gray-200/55" referrerPolicy="no-referrer" />
                              ) : (
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shrink-0`}>
                                  <Coffee size={18} />
                                </div>
                              )}
                              <div className="text-right">
                                <span className={`text-[9px] font-bold block mb-0.5 opacity-60 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {prod.category}
                                </span>
                                <span className={`text-sm font-black ${isLightMode ? 'text-neutral-900 font-extrabold' : 'text-white/95'}`}>{prod.name}</span>
                              </div>
                            </div>
                            <span className={`text-xs font-black font-mono ${accentText}`}>
                              {prod.price.toLocaleString('en-US')} <span className="text-[9px] font-sans">د.ع</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Elegant empty screen fallback */
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center p-6"
                  >
                    <div className={`p-6 rounded-full ${accentBg} text-white mb-4`}>
                      <Coffee size={36} />
                    </div>
                    <h3 className="text-xl font-black mb-1">{settings?.greetingMessage}</h3>
                    <p className={`text-xs max-w-md ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {settings?.subGreeting || 'تکایە کاروبار و داواکەت لای کارمەندی لقەکەمان تۆمار بکە.'}
                    </p>
                  </motion.div>
                )
              ) : (
                /* Sleek Active order list style (typography focused, simple, spacing-rich) */
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {cart.map((item, index) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex items-center justify-between pb-3.5 border-b ${
                        isLightMode ? 'border-gray-100' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Elegant quantity circle */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black font-mono text-xs ${accentBg} text-white`}>
                          {item.quantity}x
                        </div>
                        <div className="text-right">
                          <h4 className="text-[15px] font-black">{item.name}</h4>
                          <span className={`text-[10px] font-mono opacity-50`}>
                            {item.price.toLocaleString('en-US')} د.ع
                          </span>
                        </div>
                      </div>

                      {/* Line subtotal */}
                      <span className="text-base font-black font-mono tracking-wider">
                        {(item.price * item.quantity).toLocaleString('en-US')} <span className="text-[10px] font-sans font-bold">د.ع</span>
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. GRAND TOTAL FOOTER (Massive clean numbers) */}
          <div className={`p-6 border-t ${
            isLightMode 
              ? 'bg-[var(--bg-primary)] border-[var(--border-color)]' 
              : 'bg-[#151D19] border-[var(--border-color)]/10'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider block opacity-50 mb-0.5">
                  کۆی گشتی داواکاری (Total)
                </span>
                <span className={`text-xs font-bold leading-none ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {cart.length > 0 ? 'تکایە دڵنیابەرەوە لە بڕی دیاریکراو پێش پارەدان' : 'بەخێربێن هەمیشە'}
                </span>
              </div>

              <div className="text-left flex flex-col items-end">
                <div className="flex items-baseline gap-1 bg-black/5 dark:bg-white/5 px-5 py-2.5 rounded-2xl border border-black/10 dark:border-white/5">
                  <span className={`text-3xl lg:text-4xl font-black font-mono tracking-wider ${accentText}`}>
                    {total.toLocaleString('en-US')}
                  </span>
                  <span className="text-xs font-bold opacity-60">د.ع</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
