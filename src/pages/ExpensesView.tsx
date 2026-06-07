import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Plus, Trash2, Wallet, X, Calendar as CalendarIcon, Tag } from 'lucide-react';
import { useBranchStore } from '@/store/useBranchStore';

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
}

export function ExpensesView() {
  const { currentBranch } = useBranchStore();
  const collectionName = currentBranch === 'cafe' ? 'expenses' : 'expenses_hospital';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    loadExpenses();
  }, [currentBranch]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, collectionName), orderBy('date', 'desc')));
      setExpenses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.LIST, 'expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, collectionName), {
        name,
        amount: Number(amount),
        date: new Date().toISOString()
      });
      setShowModal(false);
      setName('');
      setAmount('');
      loadExpenses();
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.CREATE, 'expenses');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم خەرجییە؟')) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        loadExpenses();
      } catch (e) {
        console.error(e);
        handleFirestoreError(e, OperationType.DELETE, `expenses/${id}`);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1E2420]">خەرجییەکان</h1>
          <p className="text-xs lg:text-sm text-[#8B8378] mt-1">تۆمارکردن و بەدواداچوونی خەرجیەکان</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#1E2420] hover:bg-[#2D3631] text-[#E9E5D9] font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm w-full md:w-auto whitespace-nowrap"
        >
          <Plus size={18} />
          تۆمارکردنی خەرجی
        </button>
      </div>

      <div className="bg-white rounded-[24px] lg:rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#E9E5D9] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="overflow-auto flex-1 max-w-full">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-[#8B8378] gap-4">
                 <div className="w-8 h-8 border-4 border-[#E9E5D9] border-t-[#E11D48] rounded-full animate-spin"></div>
                 <span className="font-medium text-sm">بارکردنی خەرجییەکان...</span>
             </div>
          ) : (
          <table className="w-full text-right border-collapse min-w-[500px]">
            <thead className="bg-[#FDFBF7] text-[#8B8378] text-[10px] lg:text-xs uppercase sticky top-0 z-10 border-b border-[#E9E5D9]">
              <tr>
                <th className="px-6 py-4 font-semibold text-right">وردەکاری خەرجی</th>
                <th className="px-6 py-4 font-semibold text-right">ڕێکەوت</th>
                <th className="px-6 py-4 font-semibold text-right">بڕی پارە</th>
                <th className="px-6 py-4 font-semibold w-24 lg:w-32 text-left">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9F7F2]">
              {expenses.map((ex) => (
                <tr key={ex.id} className="hover:bg-[#FDFBF7] transition-colors group">
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F87171]/10 rounded-xl flex items-center justify-center text-[#E11D48] flex-shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-[#F87171]/20">
                              <Wallet size={18} />
                          </div>
                          <span className="font-bold text-[#1E2420] text-sm">{ex.name}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[#8B8378] text-xs font-medium bg-[#F9F7F2] w-max px-2 py-1 rounded-md border border-[#E9E5D9]">
                          <CalendarIcon size={12} />
                          {new Date(ex.date).toLocaleDateString('ku-IQ')} <span className="mx-1 text-[#D4A373]">|</span> {new Date(ex.date).toLocaleTimeString('ku-IQ', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#E11D48] text-sm font-mono">{ex.amount.toLocaleString('en-US')} <span className="font-sans text-xs font-normal text-[#8B8378]">د.ع</span></td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-end opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDelete(ex.id)}
                        className="p-2 text-[#8B8378] hover:text-[#E11D48] hover:bg-[#E11D48]/10 rounded-xl transition-colors"
                        title="سڕینەوە"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                   <td colSpan={4} className="text-center py-16 text-[#8B8378] text-sm font-medium">هیچ خەرجییەک تۆمارنەکراوە</td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 bg-[#FDFBF7] border-b border-[#E9E5D9] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1E2420]">تۆمارکردنی خەرجی</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-[#8B8378] hover:bg-white hover:shadow-sm rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
                <form id="expenseForm" onSubmit={handleAddExpense} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-[#1E2420] mb-2 flex items-center gap-1.5"><Tag size={16} className="text-[#D4A373]"/> وردەکاری خەرجی</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="بۆ نموونە: کرێی کارەبا" className="w-full bg-[#F9F7F2] border border-transparent focus:bg-white focus:border-[#D4A373] rounded-xl px-4 py-3 outline-none text-[#1E2420] transition-colors" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#1E2420] mb-2 flex items-center gap-1.5"><Wallet size={16} className="text-[#D4A373]"/> بڕی پارە <span className="text-[#8B8378] text-xs font-normal">(د.ع)</span></label>
                    <input required type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} placeholder="25000" className="w-full bg-[#F9F7F2] border border-transparent focus:bg-white focus:border-[#D4A373] rounded-xl px-4 py-3 outline-none text-[#E11D48] font-bold font-mono transition-colors" dir="ltr" />
                </div>
                </form>
            </div>
            
            <div className="p-6 bg-[#FDFBF7] border-t border-[#E9E5D9] flex gap-4">
                <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 bg-white border border-[#E9E5D9] hover:bg-[#F9F7F2] text-[#1E2420] font-bold py-3.5 rounded-xl transition-all"
                >
                    پاشگەزبوونەوە
                </button>
                <button 
                    type="submit" 
                    form="expenseForm"
                    className="flex-[2] bg-[#1E2420] hover:bg-[#2D3631] text-[#E9E5D9] font-bold py-3.5 rounded-xl transition-all shadow-lg"
                >
                    پاشەکەوتکردن
                </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
