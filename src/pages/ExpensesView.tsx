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

  const totalAmount = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses.filter(ex => ex.date && ex.date.startsWith(todayStr));
  const totalToday = todayExpenses.reduce((sum, ex) => sum + ex.amount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col min-w-0 animate-in fade-in duration-300">
      
      {/* Premium Live Expense Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0 px-1">
        <div className="bg-white p-5 rounded-[24px] border border-[#E9E5D9] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[#8B8378] block">کۆی سەرجەم خەرجییەکان</span>
            <span className="text-2xl font-black text-rose-600 mt-1 font-mono inline-block">
              {totalAmount.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-gray-400 block mt-0.5">تۆماری گشتی خەرجییەکان</span>
          </div>
          <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100">
            <Wallet size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#E9E5D9] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[#8B8378] block">خەرجییەکانی ئەمڕۆ</span>
            <span className="text-2xl font-black text-[#1E2420] mt-1 font-mono inline-block">
              {totalToday.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-gray-400 block mt-0.5">کۆی گشتی ئەمڕۆ</span>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
            <Plus size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#E9E5D9] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[#8B8378] block">ژمارەی تۆماری خەرجی</span>
            <span className="text-2xl font-black text-[#2D2D2D] mt-1 font-mono inline-block">
              {expenses.length}
            </span>
            <span className="text-xs text-gray-400 block mt-0.5">تۆماری جیاواز</span>
          </div>
          <div className="p-3.5 bg-[#FAF8F5] rounded-2xl text-gray-600 border border-gray-100">
            <Tag size={22} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-5 rounded-[24px] border border-[#E9E5D9] shadow-[0_4px_20px_rgba(0,0,0,0.03)] m-1">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#E11D48] rounded-[18px] shadow-md border border-[#E11D48]/20">
             <Wallet size={24} className="stroke-[2]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#1E2420] tracking-tight">خەرجییەکان</h1>
            <p className="text-xs lg:text-sm text-[#8B8378] mt-1 font-bold">تۆمارکردن و بەدواداچوونی خەرجییەکان</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-b from-[#1E2420] to-[#2D3631] hover:from-[#1E2420] hover:to-[#1E2420] text-[#E11D48] border border-[#E11D48]/30 font-black py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm w-full md:w-auto whitespace-nowrap"
        >
          <Plus size={20} className="stroke-[2.5]" />
          تۆمارکردنی خەرجی
        </button>
      </div>

      <div className="bg-gradient-to-b from-white to-[#FDFBF7] rounded-[24px] lg:rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#E9E5D9] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="overflow-auto flex-1 max-w-full custom-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-[#8B8378] gap-4 py-20">
                 <div className="w-10 h-10 border-4 border-[#E9E5D9] border-t-[#E11D48] rounded-full animate-spin"></div>
                 <span className="font-bold text-sm tracking-wide">بارکردنی خەرجییەکان...</span>
             </div>
          ) : (
          <table className="w-full text-right border-collapse min-w-[500px]">
            <thead className="bg-white/50 backdrop-blur-md text-[#8B8378] text-[10px] lg:text-xs uppercase sticky top-0 z-10 border-b-2 border-[#E9E5D9] shadow-sm">
              <tr>
                <th className="px-6 py-5 font-black text-right tracking-wider">وردەکاری خەرجی</th>
                <th className="px-6 py-5 font-black text-right tracking-wider">ڕێکەوت</th>
                <th className="px-6 py-5 font-black text-right tracking-wider">بڕی پارە</th>
                <th className="px-6 py-5 font-black w-24 lg:w-32 text-left tracking-wider">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9F7F2]">
              {expenses.map((ex) => (
                <tr key={ex.id} className="hover:bg-white transition-all duration-300 group hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#FDFBF7] to-[#F9F7F2] rounded-xl flex items-center justify-center text-[#E11D48] flex-shrink-0 group-hover:bg-gradient-to-br group-hover:from-[#1E2420] group-hover:to-[#2D3631] transition-all duration-300 shadow-sm border border-[#E9E5D9]">
                              <Wallet size={20} className="stroke-[2.5]" />
                          </div>
                          <span className="font-black text-[#1E2420] text-base group-hover:text-[#E11D48] transition-colors">{ex.name}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[#8B8378] text-xs font-bold bg-white w-max px-3 py-1.5 rounded-xl border border-[#E9E5D9] shadow-sm group-hover:border-[#E11D48]/30 transition-colors">
                          <CalendarIcon size={14} className="text-[#E11D48]" />
                          {new Date(ex.date).toLocaleDateString('ku-IQ')} <span className="mx-1 text-[#E11D48]/50">|</span> {new Date(ex.date).toLocaleTimeString('ku-IQ', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                  </td>
                  <td className="px-6 py-4 font-black text-[#E11D48] text-base font-mono">{ex.amount.toLocaleString('en-US')} <span className="font-sans text-xs font-bold text-[#8B8378] ml-1">د.ع</span></td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-end opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform lg:translate-x-4 lg:group-hover:translate-x-0">
                      <button 
                        onClick={() => handleDelete(ex.id)}
                        className="p-2.5 text-[#E11D48] bg-red-50 hover:bg-[#E11D48] hover:text-white rounded-xl transition-all shadow-sm border border-red-100"
                        title="سڕینەوە"
                      >
                        <Trash2 size={18} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                   <td colSpan={4} className="py-20 text-center">
                     <div className="flex flex-col items-center justify-center gap-4 text-[#8B8378]">
                        <div className="p-6 bg-[#F9F7F2] rounded-full border-2 border-dashed border-[#E9E5D9]">
                           <Wallet size={32} className="text-[#E11D48] opacity-50 stroke-[1.5]" />
                        </div>
                        <p className="font-bold text-base">هیچ خەرجییەک تۆمارنەکراوە</p>
                        <button onClick={() => setShowModal(true)} className="text-[#E11D48] font-black text-sm hover:underline mt-2">یەکەم خەرجی زیاد بکە +</button>
                     </div>
                   </td>
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
