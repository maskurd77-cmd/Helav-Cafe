import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { 
  Loader2, Save, Store, Printer, AlertTriangle, Database, 
  Download, Upload, RefreshCw, Image, Trash2, Plus, 
  Settings, Monitor, Keyboard, FileText, X, Check, Activity,
  Receipt, Wallet, MenuSquare
} from 'lucide-react';
import { useBranchStore } from '@/store/useBranchStore';
import { motion, AnimatePresence } from 'motion/react';

export function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentBranch } = useBranchStore();
  const [activeModal, setActiveModal] = useState<'general' | 'customer' | 'slides' | 'receipt' | 'backup' | 'delete' | null>(null);
  
  // Custom dialog and notification states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDeleteConfig, setConfirmDeleteConfig] = useState<{ collectionName: string; label: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const [settings, setSettings] = useState({
    storeName: 'MAS MENU',
    address: 'هەولێر - شەقامی ١٠٠ مەتری',
    phone: '٠٧٥٠ ١٢٣ ٤٥٦٧',
    footerMessage: 'سوپاس بۆ سەردانت! تکایە سەردانمان بکەرەوە',
    logoUrl: '',
    greetingMessage: 'بەخێربێیت بۆ کافێکەمان',
    subGreeting: 'ئێمە لێرەین بۆ پێشکەشکردنی باشترین تام و چێژ بۆ ئێوەی ئازیز.',
    enableVirtualKeyboard: false,
    autoPrintReceipt: false,
    customerDisplayTheme: 'dark',
    customerDisplayShowPromo: true,
    customerDisplayShowMenu: false,
    customerDisplayShowClock: true,
    customerDisplayShowSignature: true,
    customerDisplayAccentColor: 'bronze',
    customerDisplaySlideInterval: 7,
    invoicePrefix: '#',
    invoiceStartNumber: 1000,
    invoiceNextNumber: 1001,
    promoSlides: [
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
    ]
  });

  const docName = currentBranch === 'cafe' ? 'general' : 'hospital';

  useEffect(() => {
    loadSettings();
  }, [currentBranch]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'settings', docName);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({ 
          ...prev, 
          ...data,
          promoSlides: data.promoSlides || prev.promoSlides 
        }));
      }
    } catch (e) {
      console.error("Error loading settings:", e);
      handleFirestoreError(e, OperationType.GET, `settings/${docName}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (silent = false) => {
    try {
      setSaving(true);
      await setDoc(doc(db, 'settings', docName), settings);
      if (!silent) {
        showNotification('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوتکران', 'success');
        setActiveModal(null); // auto close modal after successful save
      }
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.UPDATE, `settings/${docName}`);
      showNotification('هەڵەیەک ڕوویدا لە پاشەکەوتکردندا', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAllTrigger = (collectionName: string, label: string) => {
    setConfirmDeleteConfig({ collectionName, label });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDeleteConfig) return;
    const { collectionName, label } = confirmDeleteConfig;
    let resolvedCollection = collectionName;
    if ((currentBranch as string) === 'hospital') {
      resolvedCollection = `${collectionName}_hospital`;
    }

    try {
      setSaving(true);
      const snapshot = await getDocs(collection(db, resolvedCollection));
      for (const document of snapshot.docs) {
        await deleteDoc(doc(db, resolvedCollection, document.id));
      }
      showNotification(`هەموو ${label} سڕانەوە بە سەرکەوتوویی`, 'success');
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.DELETE, resolvedCollection);
      showNotification('هەڵەیەک ڕوویدا لە کاتی سڕینەوەدا', 'error');
    } finally {
      setSaving(false);
      setConfirmDeleteConfig(null);
    }
  };

  const handleExportBackup = async () => {
    try {
      setSaving(true);
      showNotification('ئامادەکردنی داتاکان ده‌ستی پێكرد...', 'success');
      
      const cafeSettings = await getDoc(doc(db, 'settings', 'general'));
      const hospSettings = await getDoc(doc(db, 'settings', 'hospital'));
      
      const cafeProducts = await getDocs(collection(db, 'products'));
      const hospProducts = await getDocs(collection(db, 'products_hospital'));
      
      const cafeExpenses = await getDocs(collection(db, 'expenses'));
      const hospExpenses = await getDocs(collection(db, 'expenses_hospital'));

      const cafeOrders = await getDocs(collection(db, 'orders'));
      const hospOrders = await getDocs(collection(db, 'orders_hospital'));
      
      const backupPayload = {
        appName: 'MAS MENU Cloud POS',
        version: '1.2_premium',
        timestamp: new Date().toISOString(),
        settings: {
          general: cafeSettings.exists() ? cafeSettings.data() : null,
          hospital: hospSettings.exists() ? hospSettings.data() : null,
        },
        products: {
          cafe: cafeProducts.docs.map(d => ({ id: d.id, ...d.data() })),
          hospital: hospProducts.docs.map(d => ({ id: d.id, ...d.data() })),
        },
        expenses: {
          cafe: cafeExpenses.docs.map(d => ({ id: d.id, ...d.data() })),
          hospital: hospExpenses.docs.map(d => ({ id: d.id, ...d.data() })),
        },
        orders: {
          cafe: cafeOrders.docs.map(d => ({ id: d.id, ...d.data() })),
          hospital: hospOrders.docs.map(d => ({ id: d.id, ...d.data() })),
        },
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `Helav_Cloud_POS_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('باکئەپ بە سەرکەوتوویی هەناردە کرا و دابەزی', 'success');
    } catch (err: any) {
      console.error('Failed to export backup', err);
      showNotification('هەڵەیەک ڕوویدا لە دروستکردنی باکئەپدا: ' + (err.message || err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setSaving(true);
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.version || !data.settings || !data.products) {
          throw new Error('فایلی باکئەپەکە ناسراو نییە یان تێکچووە!');
        }
        
        showNotification('تۆمارکردنەوەی داتاکان دەستیپێکرد...', 'success');

        if (data.settings.general) {
          await setDoc(doc(db, 'settings', 'general'), data.settings.general);
        }
        if (data.settings.hospital) {
          await setDoc(doc(db, 'settings', 'hospital'), data.settings.hospital);
        }

        if (data.products.cafe && Array.isArray(data.products.cafe)) {
          for (const prod of data.products.cafe) {
            const { id, ...rest } = prod;
            await setDoc(doc(db, 'products', id), rest);
          }
        }
        if (data.products.hospital && Array.isArray(data.products.hospital)) {
          for (const prod of data.products.hospital) {
            const { id, ...rest } = prod;
            await setDoc(doc(db, 'products_hospital', id), rest);
          }
        }

        if (data.expenses?.cafe && Array.isArray(data.expenses.cafe)) {
          for (const exp of data.expenses.cafe) {
            const { id, ...rest } = exp;
            await setDoc(doc(db, 'expenses', id), rest);
          }
        }
        if (data.expenses?.hospital && Array.isArray(data.expenses.hospital)) {
          for (const exp of data.expenses.hospital) {
            const { id, ...rest } = exp;
            await setDoc(doc(db, 'expenses_hospital', id), rest);
          }
        }

        if (data.orders?.cafe && Array.isArray(data.orders.cafe)) {
          for (const ord of data.orders.cafe) {
            const { id, ...rest } = ord;
            await setDoc(doc(db, 'orders', id), rest);
          }
        }
        if (data.orders?.hospital && Array.isArray(data.orders.hospital)) {
          for (const ord of data.orders.hospital) {
            const { id, ...rest } = ord;
            await setDoc(doc(db, 'orders_hospital', id), rest);
          }
        }

        showNotification('هەموو زانیاری و ڕێکخستنەکان گەڕێنرانەوە!', 'success');
        loadSettings();
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err: any) {
        console.error('Import failed', err);
        showNotification('شکست لة گێڕانەوەی باکئەپدا: ' + (err.message || 'فۆرماتە ڕاست نییە'), 'error');
      } finally {
        setSaving(false);
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
     return (
       <div className="flex h-96 items-center justify-center text-[#8B8378]">
         <div className="text-center space-y-3">
           <Loader2 className="animate-spin mx-auto text-[#8DAA91]" size={42} />
           <p className="text-xs font-black tracking-wide">بارکردنی ڕێکخستنەکان...</p>
         </div>
       </div>
     );
  }

  // Cards definitions for the core Dashboard
  const settingsCards = [
    {
      id: 'general',
      title: 'زانیاری گشتی لقی ' + (currentBranch === 'cafe' ? 'کافێ' : 'نەخۆشخانە'),
      desc: 'ناوی بەش، ناونیشانی فەرمی، ژمارەی نوێی مۆبایل و دامەزراندنی لۆگۆی براند.',
      icon: <Store size={22} />,
      tag: 'سەرەکی 🏢',
      colorClass: 'from-[#8DAA91]/10 to-[#8DAA91]/5 border-[#8DAA91]/20 text-[#8DAA91]',
      hoverClass: 'hover:-translate-y-1 hover:border-[#8DAA91]/50 hover:shadow-lg'
    },
    {
      id: 'customer',
      title: 'ڕێکخستنی شاشەی کڕیار',
      desc: 'کۆنتڕۆڵکردنی تێماکان (تاریک/ڕووناک)، پەیامی پێشوازی، کیبۆردی سەر شاشە و ڕەنگی نیشاندەر.',
      icon: <Monitor size={22} />,
      tag: 'شاشەی دەرەکی 🖥️',
      colorClass: 'from-amber-600/10 to-amber-600/5 border-amber-500/20 text-amber-600',
      hoverClass: 'hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-lg'
    },
    {
      id: 'slides',
      title: 'وینە و بەڕێوەبردنی سلایدەکان',
      desc: 'زیادکردن و لادانی وێنە ڕیکلامییەکانی کڕیار لەگەڵ نرخ، وەسف و تاگی ناوازە.',
      icon: <Image size={22} />,
      tag: 'نوێکاری ✨',
      colorClass: 'from-sky-500/10 to-sky-500/5 border-sky-500/20 text-sky-600',
      hoverClass: 'hover:-translate-y-1 hover:border-sky-500/50 hover:shadow-lg'
    },
    {
      id: 'receipt',
      title: 'دیزاین و ڕێکخستنی وەسڵ',
      desc: 'دەستکاری زنجیرەی ژمارەکان، پەیامی کۆتایی ژێر فاکتۆر و پێشاندانی وێنەی ڕاستەوخۆ.',
      icon: <Printer size={22} />,
      tag: 'پسوولە 🖨️',
      colorClass: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-600',
      hoverClass: 'hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-lg'
    },
    {
      id: 'backup',
      title: 'پاراستنی زانیاری و باکئەپ',
      desc: 'ڕوانین و دابەزاندنی فایلی یەدەگ و گێڕانەوەی تەواوی داتاکان بە یەک چرکە کات.',
      icon: <Database size={22} />,
      tag: 'پارێزراو 🔒',
      colorClass: 'from-emerald-600/10 to-emerald-600/5 border-emerald-600/20 text-emerald-700',
      hoverClass: 'hover:-translate-y-1 hover:border-emerald-600/50 hover:shadow-lg'
    },
    {
      id: 'delete',
      title: 'پاککردنەوە و سڕینەوەی داتا',
      desc: 'سڕینەوەی جۆراوجۆری داواکاری، خەرجی و مێژووە کۆنەکە بۆ بردنەوەی سەرەتا.',
      icon: <Trash2 size={22} />,
      tag: 'بەشی مەترسیدار ⚠️',
      colorClass: 'from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-600',
      hoverClass: 'hover:-translate-y-1 hover:border-rose-500/50 hover:shadow-lg'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 w-full px-4 relative" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-6 right-6 sm:left-auto sm:w-80 z-[110] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 transition-all ${
              toast.type === 'success' 
                ? "bg-[#1E2420] border-[#8DAA91]/40 text-white" 
                : "bg-rose-900 border-rose-800 text-white"
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${toast.type === 'success' ? "bg-[#8DAA91]" : "bg-rose-500 animate-pulse"}`} />
            <span className="font-black text-xs sm:text-xs tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Dialog */}
      {confirmDeleteConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[28px] p-7 max-w-sm w-full shadow-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-205 text-right">
              <div className="text-red-500 mb-3.5">
                 <AlertTriangle size={28} className="animate-bounce" />
              </div>
              <h3 className="text-lg font-black text-[#1E2420]">ئایا دڵنیایت لە سڕینەوەی هەمیشەیی؟‌</h3>
              <p className="text-xs text-[#8B8378] mt-2.5 leading-relaxed">
                 ئایا دڵنیایت لە سڕینەوەی هەموو <strong>{confirmDeleteConfig.label}</strong>؟ ئەم کارە هەموو تۆمارەکان لە بنکەی زانیاری دەسڕێتەوە و هەرگیز ناگەڕێتەوە!
              </p>
              <div className="mt-6 flex gap-3 justify-end">
                 <button 
                   onClick={() => setConfirmDeleteConfig(null)}
                   className="px-4.5 py-2.5 rounded-xl border border-[#E9E5D9] text-[#1E2420] hover:bg-[#F9F7F2] text-xs font-bold transition-all"
                 >
                   پەشیمانبوونەوە
                 </button>
                 <button 
                   onClick={confirmDeleteAction}
                   className="px-4.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all"
                 >
                   دڵنیام، بسڕەوە
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Main Premium Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-white to-[#FDFBF7] p-6 lg:p-8 rounded-[28px] border border-[#E9E5D9] shadow-sm relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#D4A373]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] rounded-2xl shadow-md border border-[#D4A373]/20">
             <Settings size={28} className="stroke-[2] animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#1E2420] tracking-tight">ڕێکخستنە شاهانەکان</h1>
            <p className="text-xs text-[#8B8378] mt-1 font-bold">تەواوی بەشەکان بە شێوازی پەنجەرەی پۆپ-ئەپی ڕێک و پێک دیزاین کراون بۆ بەڕێوەبردنێکی چێژبەخش</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#1E2420] text-white px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-widest border border-white/5">
          <Activity size={12} className="text-[#D4A373] animate-pulse" />
          <span>لقی چالاک: {currentBranch === 'cafe' ? 'کافێ' : 'نەخۆشخانە'}</span>
        </div>
      </div>

      {/* Elegant Bento Grid of Settings Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map((card) => (
          <motion.div
            key={card.id}
            whileHover={{ y: -4, transition: { duration: 0.15 } }}
            onClick={() => setActiveModal(card.id as any)}
            className={`cursor-pointer bg-gradient-to-br p-6 rounded-[24px] border shadow-sm transition-all flex flex-col justify-between h-56 group relative ${card.colorClass} ${card.hoverClass}`}
          >
            {/* Top info and tag */}
            <div className="space-y-3 text-right">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-white shadow-sm border border-black/5">
                  {card.icon}
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white shadow-sm border border-black/5">
                  {card.tag}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1E2420] group-hover:text-black transition-colors">{card.title}</h3>
                <p className="text-[11px] text-[#8B8378] mt-1 leading-relaxed line-clamp-3">
                  {card.desc}
                </p>
              </div>
            </div>

            {/* Bottom launcher area */}
            <div className="flex items-center justify-end border-t border-black/[0.04] pt-2">
              <span className="text-[10px] font-black tracking-wider text-[#1E2420] bg-white group-hover:bg-[#1E2420] group-hover:text-white px-3 py-1.5 rounded-xl shadow-sm border border-black/5 transition-all">
                کراوانەکردنی پەنجەرە ↗
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* POPUP MODAL HOVER FOR EACH TAB (پەنجەرەی پۆپ-ئەپ) */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[80] overflow-y-auto flex items-center justify-center p-4">
            
            {/* Dark blurred Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Animated Modal Frame */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
              className="relative bg-gradient-to-b from-white to-[#FDFBF7] rounded-[30px] md:rounded-[36px] shadow-2xl border border-[#E9E5D9] p-6 lg:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto z-10 space-y-6 text-right"
              dir="rtl"
            >
              
              {/* Absoluted close cross */}
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-5 left-5 p-2 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 hover:text-red-600 transition-colors border border-gray-150"
              >
                <X size={16} />
              </button>

              {/* Modal Headers based on active state */}
              {activeModal === 'general' && (
                <>
                  <div className="flex items-center gap-3.5 border-b border-[#E9E5D9]/50 pb-4">
                    <div className="bg-[#1E2420] p-3 rounded-2xl text-[#D4A373]">
                      <Store size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#1E2420]">زانیارییە گشتییەکان</h2>
                      <p className="text-[10px] text-[#8B8378] mt-0.5">بەڕێوەبردنی زانیارییە سەرەکییەکانی کەیان لەسەر سیستمەکە</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-black text-[#2D3631] mb-1.5">ناوی لق / بازار</label>
                      <input 
                        value={settings.storeName}
                        onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                        className="w-full bg-[#FAF8F5] border border-gray-250 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#2D3631] mb-1.5">ناونیشان</label>
                      <input 
                        value={settings.address}
                        onChange={(e) => setSettings({...settings, address: e.target.value})}
                        className="w-full bg-[#FAF8F5] border border-gray-250 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#2D3631] mb-1.5">ژمارەی مۆبایل</label>
                      <input 
                        value={settings.phone}
                        onChange={(e) => setSettings({...settings, phone: e.target.value})}
                        className="w-full bg-[#FAF8F5] border border-gray-250 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#2D3631] mb-1.5">لینکی وێنەی لۆگۆ</label>
                      <input 
                        value={settings.logoUrl}
                        onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                        placeholder="https://example.com/logo.png"
                        className="w-full bg-[#FAF8F5] border border-gray-250 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'customer' && (
                <>
                  <div className="flex items-center gap-3.5 border-b border-[#E9E5D9]/50 pb-4">
                    <div className="bg-[#1E2420] p-3 rounded-2xl text-[#D4A373]">
                      <Monitor size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#1E2420]">ڕێکخستنی شاشەی کڕیار</h2>
                      <p className="text-[10px] text-[#8B8378] mt-0.5">بەڕێوەبردنی دەقەکان و کیبۆرد لەسەر شاشەی دەرەکی کڕیار</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-black text-[#2D3631] mb-1.5">دەقی سەرەکی پێشوازی</label>
                      <input 
                        value={settings.greetingMessage}
                        onChange={(e) => setSettings({...settings, greetingMessage: e.target.value})}
                        className="w-full bg-[#FAF8F5] border border-gray-250 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#2D3631] mb-1.5">دەقی لاوەکی پیشوازی</label>
                      <textarea 
                        value={settings.subGreeting}
                        rows={2}
                        onChange={(e) => setSettings({...settings, subGreeting: e.target.value})}
                        className="w-full bg-[#FAF8F5] border border-gray-250 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] resize-none"
                      />
                    </div>

                    {/* Accent Color Selector */}
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E9E5D9]/40">
                      <label className="block text-xs font-black text-[#2D3631] mb-2.5">ڕەنگی سەرەکی بەشەکان (Accent Style)</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'bronze', label: 'بڕۆنزی شاهانە', colorClass: 'bg-[#D4A373]' },
                          { id: 'emerald', label: 'سەوزی سروشتی', colorClass: 'bg-[#8DAA91]' },
                          { id: 'azure', label: 'شینی ئاسمانی', colorClass: 'bg-sky-500' },
                          { id: 'rose', label: 'مۆری گوڵی', colorClass: 'bg-rose-500' }
                        ].map((accent) => (
                          <button
                            key={accent.id}
                            type="button"
                            onClick={() => setSettings({ ...settings, customerDisplayAccentColor: accent.id })}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-[10px] font-bold ${
                              settings.customerDisplayAccentColor === accent.id || (!settings.customerDisplayAccentColor && accent.id === 'bronze')
                                ? 'bg-white border-[#1E2420] text-[#1E2420] shadow-sm font-black'
                                : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${accent.colorClass}`} />
                            <span>{accent.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme Selector */}
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E9E5D9]/40">
                      <label className="block text-xs font-black text-[#2D3631] mb-2">ڕەنگ و دیمەنی شاشەکە (Theme Style)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, customerDisplayTheme: 'dark' })}
                          className={`py-2.5 px-3 rounded-xl border font-black text-[11px] transition-all ${
                            settings.customerDisplayTheme === 'dark' || !settings.customerDisplayTheme
                              ? 'bg-[#1E2420] text-[#D4A373] border-[#D4A373]'
                              : 'bg-white text-gray-700 border-gray-205 hover:bg-gray-50'
                          }`}
                        >
                          دارک مۆدی شاهانە (Premium Dark)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, customerDisplayTheme: 'light' })}
                          className={`py-2.5 px-3 rounded-xl border font-black text-[11px] transition-all ${
                            settings.customerDisplayTheme === 'light'
                              ? 'bg-white text-[#1E2420] border-[#1E2420] shadow-sm'
                              : 'bg-white text-gray-700 border-gray-205 hover:bg-gray-50'
                          }`}
                        >
                          ڕووناکی سپی و ساف (Elegant Light)
                        </button>
                      </div>
                    </div>

                    {/* Speed selection */}
                    <div>
                      <label className="block text-xs font-black text-[#2D3631] mb-1.5">ماوەی گۆڕینی وێنەکان (چرکە)</label>
                      <select
                        value={settings.customerDisplaySlideInterval || 7}
                        onChange={(e) => setSettings({ ...settings, customerDisplaySlideInterval: Number(e.target.value) })}
                        className="w-full bg-[#FAF8F5] border border-gray-250 rounded-xl px-4.5 py-3 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                      >
                        <option value={3}>٣ چرکە</option>
                        <option value={5}>٥ چرکە</option>
                        <option value={7}>٧ چرکە (فەرمی)</option>
                        <option value={10}>١٠ چرکە</option>
                        <option value={15}>١٥ چرکە</option>
                      </select>
                    </div>

                    {/* Toggles items list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-xl border border-gray-150">
                        <div>
                          <h4 className="text-xs font-black text-[#1E2420]">کیبۆردی سەر شاشە</h4>
                          <p className="text-[9px] text-[#8B8378]">پیشاندانی دوگمەکانی گەڕان</p>
                        </div>
                        <div 
                          className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${settings.enableVirtualKeyboard ? 'bg-[#8DAA91]' : 'bg-gray-300'}`}
                          onClick={() => setSettings({...settings, enableVirtualKeyboard: !settings.enableVirtualKeyboard})}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enableVirtualKeyboard ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-xl border border-gray-150">
                        <div>
                          <h4 className="text-xs font-black text-[#1E2420]">پیشاندانی مێنووی خۆراک</h4>
                          <p className="text-[9px] text-[#8B8378]">گەڕان پاش بەتاڵبوونی سەبەتە</p>
                        </div>
                        <div 
                          className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${settings.customerDisplayShowMenu ? 'bg-[#8DAA91]' : 'bg-gray-300'}`}
                          onClick={() => setSettings({...settings, customerDisplayShowMenu: !settings.customerDisplayShowMenu})}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.customerDisplayShowMenu ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-xl border border-gray-150">
                        <div>
                          <h4 className="text-xs font-black text-[#1E2420]">نیشاندانی کاتژمێر</h4>
                          <p className="text-[9px] text-[#8B8378]">کات بەپێی نایابی ته‌واو</p>
                        </div>
                        <div 
                          className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${settings.customerDisplayShowClock !== false ? 'bg-[#8DAA91]' : 'bg-gray-300'}`}
                          onClick={() => setSettings({...settings, customerDisplayShowClock: settings.customerDisplayShowClock === false ? true : false})}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.customerDisplayShowClock !== false ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-xl border border-gray-150">
                        <div>
                          <h4 className="text-xs font-black text-[#1E2420]">مۆری ڕەسەنی (بۆن)</h4>
                          <p className="text-[9px] text-[#8B8378]">دەقی ١٠٠٪ بەرهەمی فرێش</p>
                        </div>
                        <div 
                          className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${settings.customerDisplayShowSignature !== false ? 'bg-[#8DAA91]' : 'bg-gray-300'}`}
                          onClick={() => setSettings({...settings, customerDisplayShowSignature: settings.customerDisplayShowSignature === false ? true : false})}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.customerDisplayShowSignature !== false ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'slides' && (
                <>
                  <div className="flex items-center gap-3.5 border-b border-[#E9E5D9]/50 pb-4">
                    <div className="bg-[#1E2420] p-3 rounded-2xl text-[#D4A373]">
                      <Image size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#1E2420]">بەڕێوەبردنی سلایدەکان</h2>
                      <p className="text-[10px] text-[#8B8378] mt-0.5">سلاید و پێشنیارەکان لەسەر شاشەی کڕیار لێرە چاک بکە</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {settings.promoSlides && settings.promoSlides.map((slide, index) => (
                      <div key={index} className="p-4 bg-white rounded-2xl border border-[#E9E5D9] relative space-y-3.5 flex flex-col md:flex-row gap-4 items-center md:items-start text-right">
                        
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shrink-0 relative">
                          <img 
                            src={slide.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=300'} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="flex-1 w-full space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">ناوی ڕیکلام</label>
                              <input 
                                value={slide.title || ''}
                                onChange={(e) => {
                                  const newSlides = [...settings.promoSlides];
                                  newSlides[index].title = e.target.value;
                                  setSettings({ ...settings, promoSlides: newSlides });
                                }}
                                className="w-full bg-[#FAF8F5] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">تاگی ڕیکلام (Tag Badge)</label>
                              <input 
                                value={slide.tag || ''}
                                onChange={(e) => {
                                  const newSlides = [...settings.promoSlides];
                                  newSlides[index].tag = e.target.value;
                                  setSettings({ ...settings, promoSlides: newSlides });
                                }}
                                className="w-full bg-[#FAF8F5] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">دەق (Description)</label>
                              <input 
                                value={slide.desc || ''}
                                onChange={(e) => {
                                  const newSlides = [...settings.promoSlides];
                                  newSlides[index].desc = e.target.value;
                                  setSettings({ ...settings, promoSlides: newSlides });
                                }}
                                className="w-full bg-[#FAF8F5] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">نرخ (Price)</label>
                              <input 
                                value={slide.price || ''}
                                onChange={(e) => {
                                  const newSlides = [...settings.promoSlides];
                                  newSlides[index].price = e.target.value;
                                  setSettings({ ...settings, promoSlides: newSlides });
                                }}
                                className="w-full bg-[#FAF8F5] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">لینکی وێنە</label>
                            <input 
                              value={slide.image || ''}
                              onChange={(e) => {
                                const newSlides = [...settings.promoSlides];
                                newSlides[index].image = e.target.value;
                                setSettings({ ...settings, promoSlides: newSlides });
                              }}
                              className="w-full bg-[#FAF8F5] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#8DAA91] outline-none text-left font-mono dir-ltr"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const newSlides = [...settings.promoSlides];
                            newSlides.splice(index, 1);
                            setSettings({ ...settings, promoSlides: newSlides });
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-rose-50 p-2 rounded-xl border border-red-100 transition-colors self-end shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const currentPromoSlides = settings.promoSlides || [];
                      setSettings({
                        ...settings,
                        promoSlides: [
                          ...currentPromoSlides,
                          { 
                            title: 'شیک شوکولاتی مۆدێرن', 
                            desc: 'بۆن و تامی جیاواز بە شوکولاتی سویسری.', 
                            tag: 'بێوێنە 🌟', 
                            price: '٤,٥٠٠ د.ع',
                            image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400' 
                          }
                        ]
                      });
                    }}
                    className="w-full py-3 border-2 border-dashed border-[#8DAA91]/40 rounded-xl text-[#8DAA91] hover:bg-[#8DAA91]/5 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    زیادکردنی سلایدی نوێی ڕیکلام
                  </button>
                </>
              )}

              {activeModal === 'receipt' && (
                <>
                  <div className="flex items-center gap-3.5 border-b border-[#E9E5D9]/50 pb-4">
                    <div className="bg-[#1E2420] p-3 rounded-2xl text-[#D4A373]">
                      <Printer size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#1E2420]">ڕێکخستنەکانی پسوڵە (وەسڵ)</h2>
                      <p className="text-[10px] text-[#8B8378] mt-0.5">بەڕێوەبردنی نرخ، لۆگۆ، ناوی دوکان، و ناونیشان کە لەسەر وەسڵەکە چاپ دەبن</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 leading-none">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black text-[#2D3631] mb-1">ناوی دوکان لەسەر پسوڵە</label>
                        <input 
                          value={settings.storeName}
                          onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                          className="w-full bg-[#FAF8F5] border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#2D3631] mb-1">پەیوەندی کڕیاران</label>
                        <input 
                          value={settings.phone}
                          onChange={(e) => setSettings({...settings, phone: e.target.value})}
                          className="w-full bg-[#FAF8F5] border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-left font-mono dir-ltr"
                        />
                      </div>

                      {/* Invoice numbers */}
                      <div className="bg-white p-3.5 rounded-xl border border-gray-150 space-y-2.5">
                        <h4 className="text-[10px] font-black text-[#1E2420]">پاشکۆی پێشگری زنجیرەکان</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-[#2D3631] mb-1">پێشگر (Prefix)</label>
                            <input 
                              value={settings.invoicePrefix || ''}
                              onChange={(e) => setSettings({...settings, invoicePrefix: e.target.value})}
                              className="w-full bg-[#FAF8F5] border border-gray-150 rounded-lg p-1.5 text-xs text-center dir-ltr"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[#2D3631] mb-1">فاکتۆری پاشتر</label>
                            <input 
                              type="number"
                              value={settings.invoiceNextNumber || ''}
                              onChange={(e) => setSettings({...settings, invoiceNextNumber: Number(e.target.value) || 0})}
                              className="w-full bg-[#FAF8F5] border border-gray-150 rounded-lg p-1.5 text-xs text-center font-mono font-black"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Auto Print Receipt Switch */}
                      <div className="flex items-center justify-between p-3.5 bg-gradient-to-l from-[#FAF8F5] to-amber-50/20 rounded-xl border border-amber-100/60 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Printer size={16} className="text-[#D4A373]" />
                          <div>
                            <h4 className="text-xs font-black text-[#1E2420]">چاپکردنی ئۆتۆماتیکی پسوڵە</h4>
                            <p className="text-[9px] text-[#8B8378]">ڕاستەوخۆ دەستبەجێ پسوڵەکە لێبدە لە کاتی کۆتایی فرۆشتن</p>
                          </div>
                        </div>
                        <div 
                          className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${settings.autoPrintReceipt ? 'bg-[#D4A373]' : 'bg-gray-300'}`}
                          onClick={() => setSettings({...settings, autoPrintReceipt: !settings.autoPrintReceipt})}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.autoPrintReceipt ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-[#2D3631] mb-1">دەقی کۆتایی پسوڵە (Footer)</label>
                        <textarea 
                          value={settings.footerMessage}
                          rows={2}
                          onChange={(e) => setSettings({...settings, footerMessage: e.target.value})}
                          className="w-full bg-[#FAF8F5] border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none resize-none"
                        />
                      </div>
                    </div>

                    {/* Receipt Preview Paper block */}
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-200 flex flex-col items-center justify-center">
                      <p className="text-[9px] text-[#8B8378] font-bold mb-2">دەستنووسی زیندوی پسوڵە</p>
                      <div className="bg-white p-4 w-full max-w-[200px] shadow-md rounded-lg text-right font-mono text-[9px] leading-tight select-none border border-gray-100">
                        <div className="text-center mb-3">
                          <h4 className="text-[11px] font-black">{settings.storeName}</h4>
                          <p className="text-[8px] text-gray-400">{settings.address}</p>
                          <p className="text-[8px] text-gray-400">{settings.phone}</p>
                        </div>
                        <div className="border-t border-b border-dashed border-gray-300 py-1.5 my-1.5 flex justify-between font-bold">
                          <span>بڕدانی کۆتایی:</span>
                          <span>١٥,٠٠٠ د.ع</span>
                        </div>
                        {settings.footerMessage && (
                          <p className="text-center text-gray-400 text-[8px] leading-relaxed mb-1.5">
                            {settings.footerMessage}
                          </p>
                        )}
                        <div className="border-t border-dashed border-gray-200 pt-1.5 mt-1.5 text-center text-black font-black text-[7px] tracking-widest uppercase">
                          POWERED BY MAS MENU
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'backup' && (
                <>
                  <div className="flex items-center gap-3.5 border-b border-[#E9E5D9]/50 pb-4">
                    <div className="bg-[#1E2420] p-3 rounded-2xl text-[#D4A373]">
                      <Database size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#1E2420]">پاراستنی زانیاری و باکئەپ (Backup)</h2>
                      <p className="text-[10px] text-[#8B8378] mt-0.5">پاشکەوت کردن و گێڕانەوەی تەواوی کۆی داتاکان</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 font-bold flex gap-3 text-amber-900 leading-relaxed text-xs">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      سەلامەتی زانیارییەکانت هەمیشە یەکەمە!
                      <p className="font-normal text-[10px] mt-1 text-amber-800">تکایە هەفتانە فایلێکی باکئەپ بۆ کۆمپیوتەرەکەت دابەزێنە و پارێزگاری لێ بکە.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <button 
                      onClick={handleExportBackup}
                      disabled={saving}
                      className="bg-[#111827] text-[#D4A373] hover:bg-black font-black py-4 text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-[#D4A373]/20 shadow-sm"
                    >
                      <Download size={15} />
                      دابەزاندنی یەدەگی زانیارییەکان
                    </button>

                    <label className="flex items-center justify-center gap-2 bg-white border-2 border-dashed border-[#E9E5D9] hover:border-[#8DAA91] text-[#2D3631] font-black py-4 text-xs rounded-xl transition-all cursor-pointer">
                      <Upload size={15} className="text-[#8DAA91]" />
                      <span>بارکردنەوەی فایل (Import YAML/JSON)</span>
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleImportBackup} 
                        className="hidden" 
                        disabled={saving}
                      />
                    </label>
                  </div>
                </>
              )}

              {activeModal === 'delete' && (
                <>
                  <div className="flex items-center gap-4 border-b border-rose-200/50 pb-5">
                    <div className="bg-gradient-to-br from-rose-500 to-red-600 p-3.5 rounded-2xl text-white shadow-md shadow-red-500/20 ring-4 ring-rose-50 flex-shrink-0">
                      <AlertTriangle size={24} className="animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-rose-600 tracking-tight">سڕینەوەی سەرانسەری داتاکان</h2>
                      <p className="text-xs font-bold text-rose-400 mt-1">پاککردنەوەی ناوچەی مەترسیدار و گەڕاندنەوە بۆ باری بنەڕەت</p>
                    </div>
                  </div>

                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 my-4">
                    <p className="text-xs text-rose-700 font-bold leading-relaxed flex items-start gap-2.5">
                      <span className="text-rose-500 mt-0.5"><AlertTriangle size={15} /></span>
                      <span className="flex-1"><strong>ئاگاداری مەترسی:</strong> کردارەکانی خوارەوە بە شێوەیەکی هەمیشەیی تۆمارەکان لە بنکەی زانیاری دەسڕنەوە. پێویستە پێشتر دڵنیابیت لە هەبوونی باکئەپ چونکە ناگەڕێنرێنەوە!</span>
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button 
                      onClick={() => handleDeleteAllTrigger('orders', 'داواکارییەکان')}
                      className="group w-full bg-white hover:bg-rose-50 flex items-center justify-between border border-[#E9E5D9] hover:border-rose-200 px-5 py-4 rounded-2xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-neutral-100 rounded-xl text-neutral-500 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                           <Receipt size={20} />
                        </div>
                        <div className="text-right">
                          <h4 className="text-sm font-black text-[#1E2420] group-hover:text-rose-700 transition-colors">هەموو پسوڵەکان و فرۆشتنەکان</h4>
                          <p className="text-[10px] text-neutral-500 font-bold mt-0.5">پاککردنەوەی مێژووی فرۆشتنەکانی سیستەم</p>
                        </div>
                      </div>
                      <Trash2 size={18} className="text-neutral-300 group-hover:text-rose-500 transition-colors" />
                    </button>

                    <button 
                      onClick={() => handleDeleteAllTrigger('expenses', 'خەرجییەکان')}
                      className="group w-full bg-white hover:bg-rose-50 flex items-center justify-between border border-[#E9E5D9] hover:border-rose-200 px-5 py-4 rounded-2xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-neutral-100 rounded-xl text-neutral-500 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                           <Wallet size={20} />
                        </div>
                        <div className="text-right">
                          <h4 className="text-sm font-black text-[#1E2420] group-hover:text-rose-700 transition-colors">تەواوی مێژووی خەرجییەکان</h4>
                          <p className="text-[10px] text-neutral-500 font-bold mt-0.5">سڕینەوەی لیستی تۆماری خەرجی ڕۆژانە</p>
                        </div>
                      </div>
                      <Trash2 size={18} className="text-neutral-300 group-hover:text-rose-500 transition-colors" />
                    </button>

                    <button 
                      onClick={() => handleDeleteAllTrigger('products', 'بەرهەمەکان')}
                      className="group w-full bg-white hover:bg-rose-50 flex items-center justify-between border border-[#E9E5D9] hover:border-rose-200 px-5 py-4 rounded-2xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-neutral-100 rounded-xl text-neutral-500 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                           <MenuSquare size={20} />
                        </div>
                        <div className="text-right">
                          <h4 className="text-sm font-black text-[#1E2420] group-hover:text-rose-700 transition-colors">هەموو کاڵا و مێنۆکان</h4>
                          <p className="text-[10px] text-neutral-500 font-bold mt-0.5">بەتاڵکردنی تەواوەتی لیستی بەرهەمەکان</p>
                        </div>
                      </div>
                      <Trash2 size={18} className="text-neutral-300 group-hover:text-rose-500 transition-colors" />
                    </button>
                  </div>
                </>
              )}

              {/* Shared footer of action buttons for inputs */}
              {activeModal !== 'delete' && activeModal !== 'backup' && (
                <div className="flex gap-3 pt-4 border-t border-gray-150 justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-[#1E2420] text-xs font-bold hover:bg-[#FAF8F5] transition-all"
                  >
                    پاشەکشە
                  </button>
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#8DAA91] hover:brightness-105 rounded-xl text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    پاشەکەوتکردن
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
