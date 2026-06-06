import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Loader2, Save, Store, Printer, AlertTriangle } from 'lucide-react';
import { useBranchStore } from '@/store/useBranchStore';

export function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentBranch } = useBranchStore();
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
      alert('ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوتکران');
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.UPDATE, `settings/${docName}`);
      alert('هەڵەیەک ڕوویدا لە پاشەکەوتکردندا');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAll = async (collectionName: string, label: string) => {
    if (confirm(`ئایا دڵنیایت لە سڕینەوەی هەموو ${label}؟ ئەم کارە هەڵناوەشێتەوە!`)) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        for (const document of snapshot.docs) {
          await deleteDoc(doc(db, collectionName, document.id));
        }
        alert(`هەموو ${label} سڕانەوە بە سەرکەوتوویی`);
      } catch (e) {
        console.error(e);
        handleFirestoreError(e, OperationType.DELETE, collectionName);
        alert('هەڵەیەک ڕوویدا لە کاتی سڕینەوەدا');
      }
    }
  };

  if (loading) {
     return <div className="flex h-full items-center justify-center text-[#8B8378]"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-12 w-full">
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
                       onClick={() => handleDeleteAll('orders', 'داواکارییەکان')}
                       className="w-full bg-white border-2 border-red-100 hover:bg-red-50 hover:border-red-200 text-red-600 font-bold py-3 text-xs lg:text-sm rounded-xl lg:rounded-2xl transition-all"
                    >
                        سڕینەوەی وەسل و داواکارییەکان
                    </button>
                    <button 
                       onClick={() => handleDeleteAll('expenses', 'خەرجییەکان')}
                       className="w-full bg-white border-2 border-red-100 hover:bg-red-50 hover:border-red-200 text-red-600 font-bold py-3 text-xs lg:text-sm rounded-xl lg:rounded-2xl transition-all"
                    >
                        سڕینەوەی سەرجەم خەرجییەکان
                    </button>
                    <button 
                       onClick={() => handleDeleteAll('products', 'بەرهمەکان')}
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
