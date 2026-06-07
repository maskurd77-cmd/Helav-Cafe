import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { usePosStore } from '@/store/usePosStore';
import { HospitalRequest } from '@/types';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeftRight, 
  Compass, 
  AlertTriangle,
  FolderSync
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function HospitalRequests() {
  const [requests, setRequests] = useState<HospitalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'history'>('pending');
  const navigate = useNavigate();

  // Toast and Custom Confirm Dialog States
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'hospital_requests'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HospitalRequest[];
      setRequests(docsData);
      setLoading(false);
    }, (err) => {
      console.error("Error subscribing to hospital requests:", err);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAcceptRequest = async (request: HospitalRequest) => {
    try {
      const docRef = doc(db, 'hospital_requests', request.id);
      await updateDoc(docRef, { status: 'approved' });

      // Directly overlay the POS cart with these items
      usePosStore.setState({ cart: request.items });
      localStorage.setItem('customer_cart', JSON.stringify(request.items));

      showNotification('داواکارییەکە پەسەندکرا و خرایە ناو سەبەتەی فرۆشتنەوە', 'success');
      
      // Redirect to POS view so the cashier can finalize and print
      setTimeout(() => {
        navigate('/pos');
      }, 800);
    } catch (err) {
      console.error(err);
      showNotification('هەڵەیەک ڕوویدا لە کاتی پەسەندکردندا', 'error');
    }
  };

  const handleRejectRequest = (id: string) => {
    setConfirmRejectId(id);
  };

  const confirmRejectAction = async () => {
    if (!confirmRejectId) return;
    try {
      const docRef = doc(db, 'hospital_requests', confirmRejectId);
      await updateDoc(docRef, { status: 'rejected' });
      showNotification('داواکارییەکە ڕەتکرایەوە', 'success');
    } catch (err) {
      console.error(err);
      showNotification('کێشەیەک لە کاتی ڕەتکردنەوەدا ڕوویدا', 'error');
    } finally {
      setConfirmRejectId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pastRequests = requests.filter(r => r.status !== 'pending');

  const displayedRequests = filter === 'pending' ? pendingRequests : pastRequests;

  return (
    <div className="space-y-6 h-full flex flex-col min-w-0 pb-6 max-w-7xl mx-auto w-full relative">
      {/* Toast Feedback */}
      {toast && (
        <div className={cn(
          "fixed top-6 left-6 right-6 sm:left-auto sm:w-80 z-[110] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 transition-all duration-300 transform translate-y-0 scale-100",
          toast.type === 'success' 
            ? "bg-[#1E2420] border-[#8DAA91]/40 text-white" 
            : "bg-red-50 border-red-200 text-red-950"
        )}>
          <div className={cn("w-2 h-2 rounded-full shrink-0", toast.type === 'success' ? "bg-[#8DAA91]" : "bg-red-600")} />
          <span className="font-bold text-xs sm:text-sm">{toast.message}</span>
        </div>
      )}

      {/* Confirm Reject Modal */}
      {confirmRejectId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 text-right" dir="rtl">
              <h3 className="text-lg font-bold text-[#1E2420]">ڕەتکردنەوەی داواکاری‌</h3>
              <p className="text-xs sm:text-sm text-[#8B8378] mt-2 leading-relaxed">
                 ئایا دڵنیایت لە ڕەتکردنەوەی ئەم داواکارییە؟ ئەم کارە ناگەڕێتەوە.
              </p>
              <div className="mt-6 flex gap-3 justify-end">
                 <button 
                   onClick={() => setConfirmRejectId(null)}
                   className="px-5 py-2.5 rounded-xl border border-[#E9E5D9] text-[#1E2420] hover:bg-[#F9F7F2] text-xs font-bold transition-all"
                 >
                   پەشیمانبوونەوە
                 </button>
                 <button 
                   onClick={confirmRejectAction}
                   className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all"
                 >
                   دڵنیام، ڕەتکەرەوە
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1E2420]">داواکارییەکانی بەشەکان</h1>
          <p className="text-xs lg:text-sm text-[#8B8378] mt-1">بەڕێوەبردن و پەسەندکردنی داواکارییەکانی ناو نەخۆشخانە</p>
        </div>

        {/* Filter Toggle */}
        <div className="flex bg-white border border-[#E9E5D9] rounded-xl p-1 shadow-sm shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setFilter('pending')}
            className={cn(
              "flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              filter === 'pending'
                ? "bg-[#1E2420] text-white shadow-sm"
                : "text-[#8B8378] hover:text-[#1E2420]"
            )}
          >
            <Clock size={14} /> نوێکان ({pendingRequests.length})
          </button>
          <button
            onClick={() => setFilter('history')}
            className={cn(
              "flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              filter === 'history'
                ? "bg-[#1E2420] text-white shadow-sm"
                : "text-[#8B8378] hover:text-[#1E2420]"
            )}
          >
            <CheckCircle size={14} /> ئەرشیفکراو ({pastRequests.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
         {loading ? (
           <div className="flex h-64 items-center justify-center text-[#8B8378] gap-3">
              <div className="w-8 h-8 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
              <span className="font-bold text-sm">بارکردنی داواکارییەکان...</span>
           </div>
         ) : displayedRequests.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
             {displayedRequests.map((req) => (
                <div 
                  key={req.id} 
                  className={cn(
                    "bg-white rounded-[24px] border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group",
                    req.status === 'pending' ? "border-[#E9E5D9] hover:border-[#8DAA91]" : "border-gray-100 opacity-90"
                  )}
                >
                   {/* Top Info */}
                   <div>
                     <div className="flex justify-between items-start border-b border-[#F9F7F2] pb-4 mb-4">
                        <div>
                           <span className="text-[10px] font-mono tracking-widest text-[#8B8378] uppercase">{req.requesterEmail}</span>
                           <h3 className="text-lg font-bold text-[#1E2420] mt-1">{req.department}</h3>
                           <p className="text-[10px] text-[#8B8378] font-mono mt-0.5">{new Date(req.date).toLocaleString('ku-IQ')}</p>
                        </div>

                        {/* Status Label */}
                        <div className="shrink-0">
                          {req.status === 'pending' && (
                             <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Clock size={10} /> چاوەڕوانە
                             </span>
                          )}
                          {req.status === 'approved' && (
                             <span className="bg-green-50 text-green-600 border border-green-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle size={10} /> پەسەندکراو
                             </span>
                          )}
                          {req.status === 'rejected' && (
                             <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <XCircle size={10} /> ڕەتکراوە
                             </span>
                          )}
                        </div>
                     </div>

                     {/* Itemized breakdown cards */}
                     <div className="space-y-2 mb-4">
                        {req.items.map((item, index) => (
                           <div key={index} className="flex justify-between items-center text-xs text-[#2D3631] bg-[#FDFBF7] p-2.5 rounded-xl border border-gray-50">
                              <span>{item.name}</span>
                              <div className="flex items-center gap-3">
                                 <span className="text-[#8B8378] font-medium font-mono">x{item.quantity}</span>
                                 <span className="font-bold text-[#1E2420] font-mono">{(item.price * item.quantity).toLocaleString()} د.ع</span>
                              </div>
                           </div>
                        ))}
                     </div>

                     {/* Notes card */}
                     {req.notes && (
                       <div className="bg-[#FFFDF9] border border-amber-100/60 p-3 rounded-xl text-xs text-amber-800/80 mb-4 whitespace-pre-wrap leading-relaxed">
                          <strong>تێبینی بەشەکە:</strong> {req.notes}
                       </div>
                     )}
                   </div>

                   {/* Pricing & Control buttons */}
                   <div className="border-t border-[#F9F7F2] pt-4 mt-4">
                      <div className="flex justify-between items-center font-bold text-sm text-[#1E2420] mb-4">
                         <span>کۆی داواکارییەکە:</span>
                         <span className="font-mono text-base text-[#8DAA91]">{req.total.toLocaleString()} د.ع</span>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex gap-3">
                           <button 
                             onClick={() => handleRejectRequest(req.id)}
                             className="flex-1 border border-red-100 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold py-2.5 rounded-xl text-xs transition-all"
                           >
                             ڕەتکردنەوە
                           </button>
                           <button 
                             onClick={() => handleAcceptRequest(req)}
                             className="flex-[2] bg-[#1E2420] hover:bg-[#2D3631] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-[#1E2420]/10 flex items-center justify-center gap-1.5"
                           >
                              <CheckCircle size={14} /> پەسەندکردن و ناردن بۆ POS
                           </button>
                        </div>
                      )}
                   </div>
                </div>
             ))}
           </div>
         ) : (
           <div className="flex flex-col h-96 items-center justify-center text-[#8B8378] py-12 bg-white rounded-[32px] border border-[#E9E5D9]">
              <div className="p-4 bg-[#F9F7F2] rounded-full text-[#E9E5D9] mb-4">
                 <ClipboardList size={36} />
              </div>
              <p className="font-bold text-sm">هیچ داواکارییەک نییە بۆ پیشاندان</p>
              <p className="text-xs text-[#8B8378] mt-1">کاتێک بەشەکان داواکاری دەنێرن لێرە بە شێوەی ڕاستەوخۆ دەردەکەوێت</p>
           </div>
         )}
      </div>
    </div>
  );
}
