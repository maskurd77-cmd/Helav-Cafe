import React, { useEffect, useState } from 'react';
import { CartItem } from '@/types';
import { Coffee, ShoppingCart, ShoppingBag } from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

export function CustomerDisplay() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState({
    storeName: 'Helav Cafe',
    logoUrl: '',
    greetingMessage: 'بەخێربێیت بۆ کافێکەمان',
    subGreeting: 'ئێمە لێرەین بۆ پێشکەشکردنی باشترین تام و چێژ بۆ ئێوەی ئازیز.'
  });

  useEffect(() => {
    // Load remote settings via snapshot so it updates live
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
       if (doc.exists()) {
           setSettings(prev => ({ ...prev, ...doc.data() }));
       }
    }, (err) => {
       console.error("Failed to fetch settings", err);
    });

    const unsubscribeCart = onSnapshot(doc(db, 'settings', 'customer_display_cart'), (docSnap) => {
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
  }, []);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-[#1E2420] text-white p-6 shadow-md shrink-0 flex items-center justify-between">
         <div className="flex items-center gap-4">
             {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded-xl bg-white/10 p-1" />
             ) : (
                <div className="w-14 h-14 rounded-xl bg-[#D4A373]/20 flex items-center justify-center text-[#D4A373]">
                   <Coffee size={32} />
                </div>
             )}
             <div>
                <h1 className="text-2xl font-bold font-mono tracking-tight text-[#D4A373]">{settings?.storeName || 'Helav Cafe'}</h1>
                <p className="text-sm text-white/60">بەخێربێیت بۆ کافێکەمان</p>
             </div>
         </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
         {/* Left Side: Images or Promos (Placeholder) */}
         <div className="hidden lg:flex flex-[2] bg-white rounded-[32px] overflow-hidden border border-[#E9E5D9] shadow-sm relative flex-col items-center justify-center p-8">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A373]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
             <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1E2420]/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
             
             <div className="relative z-10 text-center flex flex-col items-center gap-6">
                <div className="w-32 h-32 bg-[#F9F7F2] rounded-full flex items-center justify-center text-[#D4A373] shadow-inner mb-4">
                   <Coffee size={64} />
                </div>
                <h2 className="text-4xl font-bold text-[#1E2420] leading-tight">پێشوازییەکی گەرم</h2>
                <p className="text-[#8B8378] text-xl max-w-md">ئێمە لێرەین بۆ پێشکەشکردنی باشترین تام و چێژ بۆ ئێوەی ئازیز.</p>
             </div>
         </div>

         {/* Right Side: Order List */}
         <div className="flex-1 flex flex-col bg-white rounded-[32px] shadow-sm border border-[#E9E5D9] overflow-hidden">
            <div className="p-6 bg-[#F9F7F2] border-b border-[#E9E5D9] flex items-center gap-3">
               <div className="p-3 bg-white rounded-xl shadow-sm border border-[#E9E5D9] text-[#1E2420]">
                  <ShoppingCart size={24} />
               </div>
               <h2 className="text-2xl font-bold text-[#1E2420]">داواکارییەکەت</h2>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#8B8378] gap-4">
                        <div className="p-6 bg-[#F9F7F2] rounded-full text-[#E9E5D9]">
                            <ShoppingBag size={48} />
                        </div>
                        <span className="text-xl font-medium">هیچ داواکارییەک نییە</span>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-[#FDFBF7] rounded-[24px] border border-[#E9E5D9]">
                            <div className="w-16 h-16 bg-white rounded-2xl border border-[#E9E5D9] flex items-center justify-center text-[#D4A373] shadow-sm">
                                <Coffee size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-[#1E2420] mb-1">{item.name}</h3>
                                <div className="text-base text-[#8B8378] font-bold font-mono">
                                    {item.price.toLocaleString('en-US')} <span className="text-sm font-sans font-normal">د.ع</span>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-[#1E2420] text-white rounded-xl font-bold font-mono text-xl shadow-md">
                                {item.quantity}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Total Footer */}
            <div className="p-8 bg-[#1E2420] text-white mt-auto relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
               <div className="flex justify-between items-center relative z-10">
                   <span className="text-2xl font-bold">کۆی گشتی</span>
                   <div className="text-4xl font-bold font-mono tracking-tight text-[#D4A373]">
                       {total.toLocaleString('en-US')} <span className="text-2xl text-white/50 font-sans ml-2">IQD</span>
                   </div>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}
