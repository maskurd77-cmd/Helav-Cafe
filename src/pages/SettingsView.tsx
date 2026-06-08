import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Loader2, Save, Store, Printer, AlertTriangle, Database, Download, Upload, RefreshCw, Image, Trash2, Plus, Settings, Monitor, Keyboard, FileText } from 'lucide-react';
import { useBranchStore } from '@/store/useBranchStore';

export function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentBranch } = useBranchStore();
  const [activeTab, setActiveTab] = useState<'general' | 'customer' | 'slides' | 'receipt' | 'backup' | 'delete'>('general');
  
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
    invoicePrefix: '#',
    invoiceStartNumber: 1000,
    invoiceNextNumber: 1001,
    promoSlides: [
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

  const handleSave = async () => {
    try {
      setSaving(true);
      await setDoc(doc(db, 'settings', docName), settings);
      showNotification('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوتکران', 'success');
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
      
      // Fetch Settings
      const cafeSettings = await getDoc(doc(db, 'settings', 'general'));
      const hospSettings = await getDoc(doc(db, 'settings', 'hospital'));
      
      // Fetch Products
      const cafeProducts = await getDocs(collection(db, 'products'));
      const hospProducts = await getDocs(collection(db, 'products_hospital'));
      
      // Fetch Expenses
      const cafeExpenses = await getDocs(collection(db, 'expenses'));
      const hospExpenses = await getDocs(collection(db, 'expenses_hospital'));

      // Fetch Orders
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

        // 1. Restoring Settings
        if (data.settings.general) {
          await setDoc(doc(db, 'settings', 'general'), data.settings.general);
        }
        if (data.settings.hospital) {
          await setDoc(doc(db, 'settings', 'hospital'), data.settings.hospital);
        }

        // 2. Restoring Products (Cafe)
        if (data.products.cafe && Array.isArray(data.products.cafe)) {
          for (const prod of data.products.cafe) {
            const { id, ...rest } = prod;
            await setDoc(doc(db, 'products', id), rest);
          }
        }
        // Restoring Products (Hospital)
        if (data.products.hospital && Array.isArray(data.products.hospital)) {
          for (const prod of data.products.hospital) {
            const { id, ...rest } = prod;
            await setDoc(doc(db, 'products_hospital', id), rest);
          }
        }

        // 3. Restoring Expenses
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

        // 4. Restoring Orders
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
        
        // Reload Settings and reset state
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
     return <div className="flex h-full items-center justify-center text-[#8B8378]"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-12 w-full relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-6 right-6 sm:left-auto sm:w-80 z-[110] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 transition-opacity duration-300 animate-in fade-in ${toast.type === 'success' ? "bg-[#1E2420] border-[#8DAA91]/40 text-white" : "bg-red-50 border-red-200 text-red-950"}`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'success' ? "bg-[#8DAA91]" : "bg-red-600"}`} />
          <span className="font-bold text-xs sm:text-sm">{toast.message}</span>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {confirmDeleteConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-200 text-right" dir="rtl">
              <div className="text-red-500 mb-2 flex justify-start">
                 <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#1E2420]">ئایا دڵنیایت لە سڕینەوە؟‌</h3>
              <p className="text-xs sm:text-sm text-[#8B8378] mt-2 leading-relaxed">
                 ئایا دڵنیایت لە سڕینەوەی هەموو <strong>{confirmDeleteConfig.label}</strong>؟ ئەم کارە هەموو تۆمارەکان لە بنکەی زانیاری دەسڕێتەوە و هەرگیز ناگەڕێتەوە!
              </p>
              <div className="mt-6 flex gap-3 justify-end">
                 <button 
                   onClick={() => setConfirmDeleteConfig(null)}
                   className="px-5 py-2.5 rounded-xl border border-[#E9E5D9] text-[#1E2420] hover:bg-[#F9F7F2] text-xs font-bold transition-all"
                 >
                   پەشیمانبوونەوە
                 </button>
                 <button 
                   onClick={confirmDeleteAction}
                   className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all"
                 >
                   دڵنیام، بسڕەوە
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-5 rounded-[24px] border border-[#E9E5D9] shadow-[0_4px_20px_rgba(0,0,0,0.03)] mx-1">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] rounded-[18px] shadow-md border border-[#D4A373]/20">
             <Settings size={24} className="stroke-[2]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#1E2420] tracking-tight">ڕێکخستنەکان</h1>
            <p className="text-xs lg:text-sm text-[#8B8378] mt-1 font-bold">بەڕێوەبردنی زانیارییەکان، پسوولە و سیستەم</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 px-1">
        {/* Sidebar Tabs Selectors */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 bg-white/70 backdrop-blur-md p-3 rounded-[24px] border border-[#E9E5D9] shadow-sm shrink-0 scrollbar-none" dir="rtl">
          {[
            { id: 'general', label: 'زانیاری گشتی', desc: 'ناونیشان و لۆگۆ', icon: <Store size={18} /> },
            { id: 'customer', label: 'شاشەی کڕیار', desc: 'پێشوازی و کیبۆرد', icon: <Monitor size={18} /> },
            { id: 'slides', label: 'سلایدەکانی شاشە', desc: 'وێنە ڕێکلامییەکان', icon: <Image size={18} /> },
            { id: 'receipt', label: 'ڕێکخستنی وەسڵ', desc: 'نامە و دیمەنی پسوڵە', icon: <Printer size={18} /> },
            { id: 'backup', label: 'هێنانەوە و باکئەپ', desc: 'پاراستنی زانیارییەکان', icon: <Database size={18} /> },
            { id: 'delete', label: 'سڕینەوەی داتاکان', desc: 'بەشی مەترسیدار ⚠️', icon: <Trash2 size={18} className="text-red-500" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-[18px] text-right shrink-0 lg:w-full transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#1E2420] text-white shadow-md shadow-[#1e2420]/15 border-l-4 border-l-[#D4A373]'
                  : 'bg-transparent text-[#2D3631] hover:bg-[#F9F7F2]'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${activeTab === tab.id ? 'bg-white/10 text-[#D4A373]' : 'bg-[#F9F7F2] text-[#8B8378]'}`}>
                {tab.icon}
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-[13px] font-black leading-none">{tab.label}</p>
                <p className={`text-[10px] mt-1 hidden sm:block ${activeTab === tab.id ? 'text-white/70' : 'text-[#8B8378]'}`}>{tab.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Dynamic Tab Pane Content */}
        <div className="lg:col-span-3 transition-all duration-300">
          {activeTab === 'general' && (
            <div className="bg-gradient-to-b from-white to-[#FDFBF7] rounded-[24px] lg:rounded-[32px] shadow-sm border border-[#E9E5D9] p-6 lg:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b-2 border-[#E9E5D9]/55 pb-4">
                <div className="bg-[#1E2420] p-3 rounded-2xl text-[#D4A373] shadow-md">
                  <Store size={22} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-[#1E2420]">زانیارییە گشتییەکان</h2>
                  <p className="text-xs text-[#8B8378] mt-0.5">بەڕێوەبردنی زانیارییە سەرەکییەکانی پڕۆژەکە</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">ناوی کافێ / بازار</label>
                  <input 
                    value={settings.storeName}
                    onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                    className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">ناونیشان</label>
                  <input 
                    value={settings.address}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">ژمارەی مۆبایل</label>
                  <input 
                    value={settings.phone}
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">لینکی لۆگۆ</label>
                  <input 
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#8DAA91] hover:brightness-110 disabled:opacity-50 text-white font-bold py-3.5 rounded-full transition-all shadow-lg shadow-[#8DAA9133] flex items-center justify-center gap-2 text-sm"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                سەیڤکردنی زانیارییە گشتییەکان
              </button>
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="bg-gradient-to-b from-white to-[#FDFBF7] rounded-[24px] lg:rounded-[32px] shadow-sm border border-[#E9E5D9] p-6 lg:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b-2 border-[#E9E5D9]/55 pb-4">
                <div className="bg-[#1E2420] p-3 rounded-2xl text-[#D4A373] shadow-md">
                  <Monitor size={22} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-[#1E2420]">ڕێکخستنی شاشەی کڕیار</h2>
                  <p className="text-xs text-[#8B8378] mt-0.5">بەڕێوەبردنی دەقەکان و کیبۆرد لەسەر شاشەی دەرەکی کڕیار</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">دەقی سەرەکی پێشوازی (Greeting Title)</label>
                  <input 
                    value={settings.greetingMessage}
                    onChange={(e) => setSettings({...settings, greetingMessage: e.target.value})}
                    className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                  />
                </div>
                <div>
                  <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">دەقی لاوەکی پیشوازی (Sub-greeting)</label>
                  <textarea 
                    value={settings.subGreeting}
                    rows={3}
                    onChange={(e) => setSettings({...settings, subGreeting: e.target.value})}
                    className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F9F7F2] rounded-[18px] border border-[#E9E5D9]/50 mt-4">
                  <div>
                    <h4 className="text-[13px] font-black text-[#1E2420]">چالاککردنی کیبۆردی سەر شاشە</h4>
                    <p className="text-[10px] text-[#8B8378] mt-0.5">بۆ بەکارهێنان لەسەر شاشەی دەستی یان پێداگری بەبێ کیبۆردی ئاسایی</p>
                  </div>
                  <div 
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.enableVirtualKeyboard ? 'bg-[#8DAA91]' : 'bg-gray-300'}`}
                    onClick={() => setSettings({...settings, enableVirtualKeyboard: !settings.enableVirtualKeyboard})}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enableVirtualKeyboard ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#8DAA91] hover:brightness-110 disabled:opacity-50 text-white font-bold py-3.5 rounded-full transition-all shadow-lg shadow-[#8DAA9133] flex items-center justify-center gap-2 text-sm"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                پاشەکەوتکردنی ڕێکخستنەکان
              </button>
            </div>
          )}

          {activeTab === 'slides' && (
            <div className="bg-gradient-to-b from-white to-[#FDFBF7] rounded-[24px] lg:rounded-[32px] shadow-sm border border-[#E9E5D9] p-6 lg:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b-2 border-[#E9E5D9]/55 pb-4">
                <div className="bg-[#1E2420] p-3 rounded-2xl text-[#D4A373] shadow-md">
                  <Image size={22} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-[#1E2420]">وینە و بەڕێوەبردنی سلایدەکان</h2>
                  <p className="text-xs text-[#8B8378] mt-0.5">سلاید و ڕیکلامە جوڵاوەکان لە کاتی کڕین بسڕەوە یان زیاد بکە</p>
                </div>
              </div>

              <div className="space-y-4">
                {settings.promoSlides.map((slide, index) => (
                  <div key={index} className="p-4 bg-white rounded-2xl border border-[#E9E5D9] shadow-sm relative space-y-3 flex flex-col md:flex-row gap-4 items-center md:items-start" dir="rtl">
                    
                    {/* Image Preview Frame */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-[#E9E5D9] shrink-0 relative group">
                      <img 
                        src={slide.image || 'https://images.unsplash.com/photo-1541118811-1e0d58224f24?auto=format&fit=crop&q=80&w=150'} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">بڕوانە 👀</div>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 w-full space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-[#8B8378] mb-1">ناونیشان</label>
                          <input 
                            value={slide.title}
                            onChange={(e) => {
                              const newSlides = [...settings.promoSlides];
                              newSlides[index].title = e.target.value;
                              setSettings({ ...settings, promoSlides: newSlides });
                            }}
                            className="w-full bg-[#FDFBF7] border border-[#E9E5D9] rounded-lg px-3 py-1.5 text-xs focus:border-[#8DAA91] outline-none text-[#2D3631]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#8B8378] mb-1">تاگ (نموونە: نوێ 🔥)</label>
                          <input 
                            value={slide.tag}
                            onChange={(e) => {
                              const newSlides = [...settings.promoSlides];
                              newSlides[index].tag = e.target.value;
                              setSettings({ ...settings, promoSlides: newSlides });
                            }}
                            className="w-full bg-[#FDFBF7] border border-[#E9E5D9] rounded-lg px-3 py-1.5 text-xs focus:border-[#8DAA91] outline-none text-[#2D3631]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#8B8378] mb-1">وەسف</label>
                        <textarea 
                          value={slide.desc}
                          onChange={(e) => {
                            const newSlides = [...settings.promoSlides];
                            newSlides[index].desc = e.target.value;
                            setSettings({ ...settings, promoSlides: newSlides });
                          }}
                          rows={2}
                          className="w-full bg-[#FDFBF7] border border-[#E9E5D9] rounded-lg px-3 py-1.5 text-xs focus:border-[#8DAA91] outline-none text-[#2D3631] resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#8B8378] mb-1">لینکی وێنە (URL)</label>
                        <input 
                          value={slide.image}
                          onChange={(e) => {
                            const newSlides = [...settings.promoSlides];
                            newSlides[index].image = e.target.value;
                            setSettings({ ...settings, promoSlides: newSlides });
                          }}
                          dir="ltr"
                          className="w-full bg-[#FDFBF7] border border-[#E9E5D9] rounded-lg px-3 py-1.5 text-xs focus:border-[#8DAA91] outline-none text-[#2D3631] text-left"
                        />
                      </div>
                    </div>

                    {/* Trash Button */}
                    <button
                      onClick={() => {
                        const newSlides = [...settings.promoSlides];
                        newSlides.splice(index, 1);
                        setSettings({ ...settings, promoSlides: newSlides });
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl border border-red-50 md:self-start transition-colors"
                      title="سڕینەوەی ئەم سلایدە"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setSettings({
                      ...settings,
                      promoSlides: [
                        ...settings.promoSlides,
                        { 
                          title: 'سلایدی نوێی سەرەکی', 
                          desc: 'لێرە وەسفێکی فرۆشتن بە کورتی دەنووسیت تا لەسەر شاشەکە بنەمێنێت.', 
                          tag: 'بۆنەکان 🌟', 
                          image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400' 
                        }
                      ]
                    });
                  }}
                  className="w-full py-3.5 border-2 border-dashed border-[#8DAA91]/40 rounded-2xl text-[#8DAA91] hover:bg-[#8DAA91]/5 font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  زیادکردنی یەک وێنەی تر (سلایدەر)
                </button>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#8DAA91] hover:brightness-110 disabled:opacity-50 text-white font-bold py-3.5 rounded-full transition-all shadow-lg shadow-[#8DAA9133] flex items-center justify-center gap-2 text-sm"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                سەیڤ و هاوکاتکردنی شاشەی کڕیار
              </button>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-b from-white to-[#FDFBF7] rounded-[24px] lg:rounded-[32px] shadow-sm border border-[#E9E5D9] p-6 lg:p-8 space-y-6">
                <div className="flex items-center gap-4 border-b-2 border-[#E9E5D9]/55 pb-4">
                  <div className="bg-[#1E2420] p-3 rounded-2xl text-[#D4A373] shadow-md">
                    <Printer size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-black text-[#1E2420]">ڕێکخستنەکانی پسوڵە (وەسڵ)</h2>
                    <p className="text-xs text-[#8B8378] mt-0.5">بەڕێوەبردنی لۆگۆ، ناوی دوکان، ژمارەی مۆبایل، و ناونیشان کە لەسەر وەسڵەکە چاپ دەبن</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">ناوی دوکان / کافێ لەسەر پسوڵە</label>
                    <input 
                      value={settings.storeName}
                      onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                      className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">ژمارەی مۆبایل بۆ پەیوەندی کڕیاران</label>
                    <input 
                      value={settings.phone}
                      onChange={(e) => setSettings({...settings, phone: e.target.value})}
                      className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
                    />
                  </div>
                </div>

                {/* Invoice Custom sequence options */}
                <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E9E5D9] space-y-4">
                  <h4 className="text-sm font-black text-[#1E2420] border-b border-[#E9E5D9]/40 pb-2">دیاریکردنی زنجیرە و ژمارەکردنی پسوڵەکان (Invoice Sequence Settings)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] lg:text-xs font-bold text-[#2D3631] mb-1.5">پێشگری زنجیرە (Invoice Prefix)</label>
                      <input 
                        value={settings.invoicePrefix || ''}
                        onChange={(e) => setSettings({...settings, invoicePrefix: e.target.value})}
                        placeholder="نموونە: INV-"
                        className="w-full bg-white border border-[#E9E5D9] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] lg:text-xs font-bold text-[#2D3631] mb-1.5">ژمارەی دەستپێکردن (Start Number)</label>
                      <input 
                        type="number"
                        value={settings.invoiceStartNumber || ''}
                        onChange={(e) => setSettings({...settings, invoiceStartNumber: Number(e.target.value) || 0})}
                        className="w-full bg-white border border-[#E9E5D9] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] lg:text-xs font-bold text-[#2D3631] mb-1.5">ژمارەی فاکتۆری داهاتوو (Next Number)</label>
                      <input 
                        type="number"
                        value={settings.invoiceNextNumber || ''}
                        onChange={(e) => setSettings({...settings, invoiceNextNumber: Number(e.target.value) || 0})}
                        className="w-full bg-white border border-[#E9E5D9] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] font-mono text-red-600 font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#8B8378]">لێرەوە دەتوانیت سەرەتای ژمارەکردنی پسوڵەکان یان ژمارەی وەسڵی داهاتوو پێناسە بکەیت بۆ ئەوەی ڕێکبخرێتەوە.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">ناونیشانی فەرمی شوێن</label>
                    <input 
                      value={settings.address}
                      onChange={(e) => setSettings({...settings, address: e.target.value})}
                      className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">لینکی وێنەی لۆگۆی وەسڵ (URL)</label>
                    <input 
                      value={settings.logoUrl}
                      onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">نامەی کۆتایی ژێر پسوڵە (Footer Message)</label>
                    <textarea 
                      value={settings.footerMessage}
                      rows={3}
                      onChange={(e) => setSettings({...settings, footerMessage: e.target.value})}
                      className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] resize-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-[#8DAA91] hover:brightness-110 disabled:opacity-50 text-white font-bold py-3.5 rounded-full transition-all shadow-lg shadow-[#8DAA9133] flex items-center justify-center gap-2 text-sm"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  پاشەکەوتکردنی سەرجەم ڕێکخستنەکانی وەسڵ
                </button>
              </div>

              {/* Receipt Preview Live Card */}
              <div className="bg-[#E9E5D9]/50 p-6 rounded-[24px] lg:rounded-[32px] border border-[#E9E5D9] flex flex-col items-center justify-center gap-2">
                <p className="text-[10px] text-[#8B8378] font-bold tracking-tight mb-2">پێشبینی زیندوی شێوازی پسوڵەی چاپکراو (Receipt Layout Preview)</p>
                <div className="bg-white p-6 w-full max-w-[300px] shadow-xl rounded-xl flex flex-col font-mono text-xs relative before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCwwIDQsOCA4LDAiIGZpbGw9IiNlOWU1ZDkiLz48L3N2Zz4=')] before:-mt-2 pb-8 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-2 after:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCw4IDQsMCA4LDgiIGZpbGw9IiNlOWU1ZDkiLz48L3N2Zz4=')] after:-mb-2">
                  <div className="text-center mb-6">
                    {settings.logoUrl && (
                      <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2" />
                    )}
                    <h3 className="text-base font-bold mb-1">{settings.storeName}</h3>
                    <p className="text-[10px] w-full text-gray-400 whitespace-pre-wrap">{settings.address}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{settings.phone}</p>
                  </div>
                  
                  <div className="border-t border-b border-dashed border-gray-300 py-3 mb-3">
                    <div className="flex justify-between font-bold text-xs">
                      <span>کۆ بڕدانی گشتی:</span>
                      <span>٢٥,٠٠٠ د.ع</span>
                    </div>
                  </div>
                  
                  <div className="text-center text-[10px] text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {settings.footerMessage}
                  </div>
                  
                  <div className="mt-6 border-t border-gray-100 pt-3 text-center">
                    <p className="text-[9px] text-gray-300 font-bold tracking-widest">POWERED BY MAS MENU</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="bg-gradient-to-b from-white to-[#FDFBF7] rounded-[24px] lg:rounded-[32px] shadow-sm border border-[#E9E5D9] p-6 lg:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b-2 border-[#E9E5D9]/55 pb-4">
                <div className="bg-[#1E2420] p-3 rounded-2xl text-[#D4A373] shadow-md">
                  <Database size={22} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-[#1E2420]">پاراستنی زانیاری و باکئەپ (Backup)</h2>
                  <p className="text-xs text-[#8B8378] mt-0.5">پاشکەوت کردن و گێڕانەوەی کۆی گشتی بنکەی دراو</p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 font-bold flex gap-3 text-amber-900 leading-relaxed text-xs">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div>
                  سەلامەتی زانیارییەکانت گرنگە!
                  <p className="font-normal text-[11px] mt-1 text-amber-800">تکایە هەفتانە یان لە کاتی گۆڕینی بنەڕەتی ستاف فایل چاپی کۆپی یەدەگ بۆ کۆمپیوتەرەکەت دابەزێنە.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={handleExportBackup}
                  disabled={saving}
                  className="bg-[#111827] text-[#D4A373] hover:brightness-110 font-bold py-4 text-xs rounded-2xl transition-all flex items-center justify-center gap-2 border border-[#D4A373]/20 shadow-md disabled:opacity-50"
                >
                  <Download size={16} />
                  دابەزاندنی فایلی باکئەپ (Export JSON)
                </button>

                <label className="flex items-center justify-center gap-2 bg-white border-2 border-dashed border-[#E9E5D9] hover:border-[#8DAA91] text-[#2D3631] font-bold py-4 text-xs rounded-2xl transition-all cursor-pointer">
                  <Upload size={16} className="text-[#8DAA91]" />
                  <span>بارکردن و گێڕانەوە (Import JSON)</span>
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportBackup} 
                    className="hidden" 
                    disabled={saving}
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'delete' && (
            <div className="bg-gradient-to-b from-white to-[#FDFBF7] rounded-[24px] lg:rounded-[32px] border border-red-200 p-6 lg:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b-2 border-red-200 pb-4">
                <div className="bg-red-50 p-3 rounded-2xl text-red-600 shadow-sm border border-red-100">
                  <AlertTriangle size={22} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-red-600">سڕینەوەی سەرانسەری داتاکان</h2>
                  <p className="text-xs text-red-500/80 mt-0.5">ڕشتبوون لە پاککردنەوەی سیستم و دەسپێکردنی سەرەتاوە.</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#8B8378] leading-relaxed">
                ئاگاداری مەترسیدار: کردارەکانی خوارەوە بە تەواوی و هەمیشەیی تۆمارەکان لە کۆگای داتابەس دەسڕێنەوە. دڵنیابە لە هەبوونی نوێترین باکئەپ پێش بەکارهێنانی ئەمانە!
              </p>

              <div className="space-y-3 pt-2">
                <button 
                  onClick={() => handleDeleteAllTrigger('orders', 'داواکارییەکان')}
                  className="w-full bg-white hover:bg-red-50 flex items-center justify-between border border-red-100 text-red-600 font-bold p-4 text-xs rounded-[18px] transition-all"
                >
                  <span>بسڕەوە پسووڵەی داواکارییەکان</span>
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteAllTrigger('expenses', 'خەرجییەکان')}
                  className="w-full bg-white hover:bg-red-50 flex items-center justify-between border border-red-100 text-red-600 font-bold p-4 text-xs rounded-[18px] transition-all"
                >
                  <span>بسڕەوە سەرجەم خەرجییە نا پێویستەکان</span>
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteAllTrigger('products', 'بەرهەمەکان')}
                  className="w-full bg-white hover:bg-red-50 flex items-center justify-between border border-red-100 text-red-600 font-bold p-4 text-xs rounded-[18px] transition-all"
                >
                  <span>بسڕەوە سەرجەم بەرهەمەکانی مێنۆ</span>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
