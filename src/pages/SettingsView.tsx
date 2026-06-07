import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Loader2, Save, Store, Printer, AlertTriangle, Database, Download, Upload, RefreshCw } from 'lucide-react';
import { useBranchStore } from '@/store/useBranchStore';

export function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentBranch } = useBranchStore();
  
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
    storeName: 'Helav Cafe',
    address: 'هەولێر - شەقامی ١٠٠ مەتری',
    phone: '٠٧٥٠ ١٢٣ ٤٥٦٧',
    footerMessage: 'سوپاس بۆ سەردانت! تکایە سەردانمان بکەرەوە',
    logoUrl: '',
    greetingMessage: 'بەخێربێیت بۆ کافێکەمان',
    subGreeting: 'ئێمە لێرەین بۆ پێشکەشکردنی باشترین تام و چێژ بۆ ئێوەی ئازیز.',
    enableVirtualKeyboard: false
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
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
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
    if (currentBranch === 'hospital') {
      if (collectionName === 'orders') resolvedCollection = 'orders_hospital';
      else if (collectionName === 'expenses') resolvedCollection = 'expenses_hospital';
      else if (collectionName === 'products') resolvedCollection = 'products_hospital';
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
        appName: 'Helav Cafe Cloud POS',
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

      <div className="px-1">
        <h1 className="text-xl lg:text-2xl font-bold text-[#2D3631]">ڕێکخستنەکان</h1>
        <p className="text-xs lg:text-sm text-[#8B8378] mt-1">بەڕێوەبردنی زانیارییەکانی کافێ و پرینت</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-6 lg:space-y-8">
            <div className="bg-white rounded-[24px] lg:rounded-[32px] shadow-sm border border-[#E9E5D9] p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4 lg:mb-6 border-b border-[#F9F7F2] pb-4 lg:pb-6">
                    <div className="bg-[#E9E5D9] p-2 lg:p-3 rounded-xl lg:rounded-2xl text-[#2D3631]">
                        <Store size={20} className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <h2 className="text-lg lg:text-xl font-bold text-[#2D3631]">زانیارییە گشتییەکان</h2>
                </div>

                <div className="space-y-4 lg:space-y-5">
                    <div>
                        <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">ناوی کافێ</label>
                        <input 
                            value={settings.storeName}
                            onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                            className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">ناونیشان</label>
                        <input 
                            value={settings.address}
                            onChange={(e) => setSettings({...settings, address: e.target.value})}
                            className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">ژمارەی مۆبایل</label>
                        <input 
                            value={settings.phone}
                            onChange={(e) => setSettings({...settings, phone: e.target.value})}
                            className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
                        />
                    </div>
                    <div>
                        <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">لینکی لۆگۆ</label>
                        <input 
                            value={settings.logoUrl}
                            onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                            placeholder="https://example.com/logo.png"
                            className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[24px] lg:rounded-[32px] shadow-sm border border-[#E9E5D9] p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4 lg:mb-6 border-b border-[#F9F7F2] pb-4 lg:pb-6">
                    <div className="bg-[#E9E5D9] p-2 lg:p-3 rounded-xl lg:rounded-2xl text-[#2D3631]">
                        <Printer size={20} className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <h2 className="text-lg lg:text-xl font-bold text-[#2D3631]">ڕێکخستنەکانی وەسل (پەسیتر)</h2>
                </div>

                <div className="space-y-4 lg:space-y-5">
                    <div>
                        <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">نامەی کۆتایی وەسل (Footer)</label>
                        <textarea 
                            value={settings.footerMessage}
                            rows={3}
                            onChange={(e) => setSettings({...settings, footerMessage: e.target.value})}
                            className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] resize-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 lg:mb-6 border-b border-[#F9F7F2] pb-4 lg:pb-6 mt-8">
                    <div className="bg-[#E9E5D9] p-2 lg:p-3 rounded-xl lg:rounded-2xl text-[#2D3631]">
                        <Store size={20} className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <h2 className="text-lg lg:text-xl font-bold text-[#2D3631]">شاشەی کڕیار</h2>
                </div>

                <div className="space-y-4 lg:space-y-5">
                    <div>
                        <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">نامەی پێشوازی (سەرەکی)</label>
                        <input 
                            value={settings.greetingMessage}
                            onChange={(e) => setSettings({...settings, greetingMessage: e.target.value})}
                            placeholder="بەخێربێیت بۆ کافێکەمان"
                            className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs lg:text-sm font-bold text-[#2D3631] mb-2">نامەی ژێرەکی (وەسف)</label>
                        <textarea 
                            value={settings.subGreeting}
                            rows={2}
                            onChange={(e) => setSettings({...settings, subGreeting: e.target.value})}
                            className="w-full bg-[#F9F7F2] border-0 rounded-xl lg:rounded-2xl px-4 py-3 text-sm lg:text-base focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] resize-none"
                        />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <label className="block text-xs lg:text-sm font-bold text-[#2D3631]">چالاککردنی کیبۆردی سەر شاشە</label>
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
                  className="mt-6 w-full bg-[#8DAA91] hover:brightness-110 disabled:opacity-50 text-white font-bold py-3 lg:py-4 rounded-full transition-all shadow-lg shadow-[#8DAA9133] flex items-center justify-center gap-2 text-sm lg:text-base"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  پاشەکەوتکردنی ڕێکخستنەکان
                </button>
            </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
            {/* Database Backup & Restore Card */}
            <div className="bg-white rounded-[24px] lg:rounded-[32px] shadow-sm border border-[#E9E5D9] hover:border-[#8DAA91] p-6 lg:p-8 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-4 lg:mb-6 border-b border-[#F9F7F2] pb-4 lg:pb-6">
                    <div className="bg-[#1E2420] p-2.5 rounded-xl text-[#D4A373]">
                        <Database size={20} className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg lg:text-xl font-bold text-[#1E2420]">پاراستن و هێنانەوەی باکئەپ</h2>
                        <p className="text-[10px] text-[#8B8378] mt-0.5">زانیارییەکانی مێنۆ، خەرجییەکان، وەسلەکان و ڕێکخستنەکان بپارێزە</p>
                    </div>
                </div>

                <p className="text-xs lg:text-sm text-[#8B8378] mb-6 leading-relaxed">
                   تکایە دڵنیابە لە دروستکردنی کۆپییەکی یەدەگ (Backup) بە شێوەیەکی خولی بۆ هێشتنەوەی داتاکانت بە سەلامەتی.
                </p>

                <div className="flex flex-col gap-3">
                    <button 
                       onClick={handleExportBackup}
                       disabled={saving}
                       className="w-full bg-[#1E2420] text-[#D4A373] hover:brightness-110 font-bold py-3.5 text-xs lg:text-sm rounded-xl lg:rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                    >
                       <Download size={16} />
                       دروستکردن و دابەزاندنی باکئەپ (Export)
                    </button>

                    <label className="flex items-center justify-center gap-2 w-full bg-white border-2 border-dashed border-[#E9E5D9] hover:border-[#8DAA91] hover:bg-[#F9F7F2] text-[#2D3631] font-bold py-3.5 text-xs lg:text-sm rounded-xl lg:rounded-2xl transition-all cursor-pointer">
                        <Upload size={16} />
                        <span>بارکردن و گێڕانەوەی باکئەپ (Import)</span>
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

            <div className="bg-white rounded-[24px] lg:rounded-[32px] shadow-sm border border-red-100 p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4 lg:mb-6 border-b border-red-50 pb-4 lg:pb-6">
                    <div className="bg-red-50 p-2 lg:p-3 rounded-xl lg:rounded-2xl text-red-500">
                        <AlertTriangle size={20} className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <h2 className="text-lg lg:text-xl font-bold text-red-500">سڕینەوەی داتاکان (مەترسیدار)</h2>
                </div>

                <p className="text-xs lg:text-sm text-[#8B8378] mb-6 leading-relaxed">
                   تکایە ئاگاداربە! سڕینەوەی داتاکان لەم بەشەوە بە تەواوی داتاکان لە بنکەی دراوەڕێس (Database) دەسڕێتەوە و ناگەڕێتەوە.
                </p>

                <div className="space-y-3">
                    <button 
                       onClick={() => handleDeleteAllTrigger('orders', 'داواکارییەکان')}
                       className="w-full bg-white border-2 border-red-100 hover:bg-red-50 hover:border-red-200 text-red-600 font-bold py-3 text-xs lg:text-sm rounded-xl lg:rounded-2xl transition-all"
                    >
                        سڕینەوەی وەسل و داواکارییەکان
                    </button>
                    <button 
                       onClick={() => handleDeleteAllTrigger('expenses', 'خەرجییەکان')}
                       className="w-full bg-white border-2 border-red-100 hover:bg-red-50 hover:border-red-200 text-red-600 font-bold py-3 text-xs lg:text-sm rounded-xl lg:rounded-2xl transition-all"
                    >
                        سڕینەوەی سەرجەم خەرجییەکان
                    </button>
                    <button 
                       onClick={() => handleDeleteAllTrigger('products', 'بەرهمەکان')}
                       className="w-full bg-white border-2 border-red-100 hover:bg-red-50 hover:border-red-200 text-red-600 font-bold py-3 text-xs lg:text-sm rounded-xl lg:rounded-2xl transition-all"
                    >
                        سڕینەوەی کۆی مێنۆ و بابەتەکان
                    </button>
                </div>
            </div>

            {/* Receipt Preview */}
            <div className="bg-[#E9E5D9] p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] flex items-center justify-center">
                 <div className="bg-white p-6 w-[280px] sm:w-full max-w-[300px] shadow-sm flex flex-col font-mono text-sm relative before:absolute before:top-0 before:left-0 before:right-0 before:h-2 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCwwIDQsOCA4LDAiIGZpbGw9IiNlOWU1ZDkiLz48L3N2Zz4=')] before:-mt-2 pb-8 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-2 after:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIHBvaW50cz0iMCw4IDQsMCA4LDgiIGZpbGw9IiNlOWU1ZDkiLz48L3N2Zz4=')] after:-mb-2">
                    <div className="text-center mb-6">
                        {settings.logoUrl && (
                            <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
                        )}
                        <h3 className="text-xl font-bold mb-1">{settings.storeName}</h3>
                        <p className="text-xs w-full text-gray-500 whitespace-pre-wrap">{settings.address}</p>
                        <p className="text-xs text-gray-500 mt-1">{settings.phone}</p>
                    </div>
                    
                    <div className="border-t border-b border-dashed border-gray-300 py-3 mb-3">
                        <div className="flex justify-between font-bold mb-2 text-xs sm:text-sm">
                            <span>کۆی گشتی:</span>
                            <span>٢٥,٠٠٠ د.ع</span>
                        </div>
                    </div>
                    
                    <div className="text-center text-xs text-gray-500 mt-4 whitespace-pre-wrap">
                        {settings.footerMessage}
                    </div>
                    
                    {/* Hardcoded system footer */}
                    <div className="mt-8 border-t border-gray-200 pt-3 text-center">
                        <p className="text-[10px] text-gray-400 font-bold tracking-widest">POWERED BY HELAV CAFE</p>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}
