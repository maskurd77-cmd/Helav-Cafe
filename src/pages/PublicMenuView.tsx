import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Coffee, Search, ShoppingBag, Globe, X } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { Product } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '@/store/useSettingsStore';

type Language = 'ku' | 'ar' | 'en';

const dict = {
  ku: {
    all: 'هەمووی',
    search: 'گەڕان بۆ ئایتم...',
    emptySearch: 'هیچ بابەتێک نەدۆزرایەوە بۆ',
    currency: 'د.ع',
    close: 'داخستن',
    price: 'نرخ',
    category: 'جۆر',
    dir: 'rtl'
  },
  ar: {
    all: 'الكل',
    search: 'البحث عن عنصر...',
    emptySearch: 'لم يتم العثور على نتائج لـ',
    currency: 'د.ع',
    close: 'إغلاق',
    price: 'السعر',
    category: 'الفئة',
    dir: 'rtl'
  },
  en: {
    all: 'All',
    search: 'Search items...',
    emptySearch: 'No items found for',
    currency: 'IQD',
    close: 'Close',
    price: 'Price',
    category: 'Category',
    dir: 'ltr'
  }
};

export function PublicMenuView() {
  const { code } = useParams(); // code can represent branch or menu link
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState('');
  
  const [lang, setLang] = useState<Language>('ku');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { settings, initSettings } = useSettingsStore();

  useEffect(() => {
    initSettings();
  }, [initSettings]);

  // Retrieve products in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'بەردەستە')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching menu:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [code]);

  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#8DAA91]">
        <div className="w-12 h-12 border-4 border-[#8DAA91]/30 border-t-[#8DAA91] rounded-full animate-spin"></div>
      </div>
    );
  }

  const title = settings.publicMenuTitle || 'مێنۆی کافێ';
  const subtitle = settings.publicMenuSubtitle || 'تکایە داواکارییەکەت لای ستاف تۆماربکە';
  const bannerUrl = settings.publicMenuBannerUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200';

  const t = dict[lang];

  return (
    <div className={`min-h-screen bg-[#FDFBF7] text-[#2C332F] font-sans overflow-x-hidden ${t.dir === 'rtl' ? 'rtl' : 'ltr'}`} dir={t.dir}>
      {/* Hero Banner Section */}
      <div className="relative w-full h-64 md:h-72 lg:h-80 overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img 
          src={bannerUrl} 
          alt="Menu Banner" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Language selector */}
        <div className="absolute top-4 left-4 right-4 z-30 flex justify-end">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 flex items-center gap-1 border border-white/20 shadow-lg">
            {(['ku', 'ar', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all ${
                  lang === l 
                    ? 'bg-white text-[var(--accent-gold)] shadow-md' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                {l === 'ku' ? 'کوردی' : l === 'ar' ? 'عربي' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center mt-6">
           <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ duration: 0.6 }}
           >
             <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center mx-auto mb-4 shadow-xl">
               <Coffee size={32} className="text-[var(--accent-gold)]" />
             </div>
             <h1 className="font-extrabold text-3xl md:text-4xl text-white tracking-tight drop-shadow-md mb-2">
               {title}
             </h1>
             <p className="text-white/90 font-bold text-sm md:text-base max-w-sm mx-auto drop-shadow-md">
               {subtitle}
             </p>
           </motion.div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto p-4 lg:p-6 -mt-6 relative z-30 mb-20">
        
        {/* Search */}
        <div className="relative mb-6 shadow-xl rounded-[20px]">
          <input 
            type="text" 
            placeholder={t.search} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-white border-2 border-gray-100 outline-none focus:border-[var(--accent-gold)] focus:ring-4 focus:ring-[var(--accent-gold)]/10 text-gray-800 font-bold text-sm py-4 ${t.dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} rounded-[20px] transition-all`}
          />
          <div className={`absolute inset-y-0 ${t.dir === 'rtl' ? 'right-4' : 'left-4'} flex items-center pointer-events-none text-gray-400`}>
            <Search size={18} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar custom-scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-2xl font-extrabold transition-all text-sm whitespace-nowrap shadow-sm border-2 ${
                activeCategory === category
                  ? "bg-[var(--accent-gold)] border-[var(--accent-gold)] text-white"
                  : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-gray-800"
              }`}
            >
              {category === 'all' ? t.all : category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-5 mt-2">
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedProduct(product)}
                className="bg-white p-3 md:p-4 rounded-[24px] border border-gray-100 hover:border-[var(--accent-gold)] hover:shadow-xl transition-all flex flex-col items-center group min-h-[170px] justify-between cursor-pointer shadow-sm relative overflow-hidden"
              >
                <div className="w-full aspect-square bg-[#FDFBF7] rounded-[18px] flex items-center justify-center text-[var(--bg-secondary)] group-hover:text-[var(--accent-gold)] transition-colors duration-300 overflow-hidden shadow-inner border border-gray-50 z-10 relative mb-3">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <Coffee size={30} className="group-hover:rotate-6 transition-transform text-[#A37B4D]" />
                  )}
                </div>
                <div className="text-center flex-1 w-full flex flex-col justify-start">
                  <h3 className="font-extrabold text-[#2C332F] text-[13px] leading-snug line-clamp-2 md:text-sm">
                    {product.name}
                  </h3>
                </div>
                <div className="w-full mt-3 flex items-center justify-between bg-[#FDFBF7] border border-gray-50 p-2 rounded-xl group-hover:bg-[var(--accent-gold)]/5 group-hover:border-[var(--accent-gold)]/20 transition-colors">
                  <span className="font-black text-[13px] md:text-sm text-[var(--bg-secondary)] group-hover:text-[var(--accent-gold)] ml-1 font-mono">
                    {product.price.toLocaleString("en-US")}
                  </span>
                  <span className="text-[9px] md:text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-lg shadow-sm">{t.currency}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredProducts.length === 0 && (
          <div className="py-20 text-center font-bold text-gray-400 bg-white rounded-[32px] border-2 border-dashed border-gray-200 mt-4 text-sm flex flex-col items-center gap-4">
             <ShoppingBag size={40} className="text-gray-300" />
             {t.emptySearch} "{searchQuery || activeCategory}"
          </div>
        )}
      </main>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="relative w-full aspect-square bg-[#FDFBF7] flex items-center justify-center">
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className={`absolute top-4 ${t.dir === 'rtl' ? 'left-4' : 'right-4'} w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-white flex items-center justify-center text-gray-600 hover:bg-white hover:text-black transition-all z-10 shadow-sm`}
                  >
                    <X size={20} />
                  </button>
                  
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Coffee size={80} className="text-[#A37B4D]/40" />
                  )}
                </div>
                
                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h2 className="text-xl md:text-2xl font-black text-[#2C332F] leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <div className="bg-[#FDFBF7] border border-gray-100 px-4 py-2 rounded-2xl shrink-0 text-center">
                       <span className="block font-black text-lg text-[var(--accent-gold)] font-mono">
                         {selectedProduct.price.toLocaleString('en-US')}
                       </span>
                       <span className="block text-[10px] font-bold text-gray-500 mt-0.5">{t.currency}</span>
                    </div>
                  </div>
                  
                  <div className="inline-flex py-1.5 px-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs mb-6">
                    {t.category}: {selectedProduct.category}
                  </div>
                  
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="w-full py-4 bg-[var(--bg-secondary)] hover:bg-[#1E2522] text-white rounded-[20px] font-extrabold text-sm transition-colors shadow-md mt-4"
                  >
                    {t.close}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

