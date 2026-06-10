import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { 
  Plus, 
  Trash2, 
  Wallet, 
  X, 
  Calendar as CalendarIcon, 
  Tag, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Sparkles, 
  AlertTriangle,
  Lightbulb,
  Check,
  TrendingUp,
  Receipt,
  Layers,
  ShoppingBag,
  User,
  Home,
  Plug,
  Megaphone,
  Truck
} from 'lucide-react';
import { useBranchStore } from '@/store/useBranchStore';
import { motion, AnimatePresence } from 'motion/react';

interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category?: string;
  notes?: string;
}

// Highly stylized Kuridsh Categories for expenses with beautiful icons & styles
const EXPENSE_CATEGORIES = [
  { id: 'general', name: 'خەرجی گشتی', icon: Wallet, color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  { id: 'materials', name: 'کڕینی کاڵا و کەرەستە', icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  { id: 'salaries', name: 'مووچە و شایستەی دارایی', icon: User, color: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' },
  { id: 'rent', name: 'کرێی مانگانە / ساڵانە', icon: Home, color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  { id: 'utilities', name: 'ئاو و کارەبا و خزمەتگوزاری', icon: Plug, color: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' },
  { id: 'marketing', name: 'ڕیکلام و مارکێتینگ', icon: Megaphone, color: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
  { id: 'delivery', name: 'گواستنەوە و دابەشکردن', icon: Truck, color: 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20' },
];

export function ExpensesView() {
  const { currentBranch } = useBranchStore();
  const collectionName = currentBranch === 'cafe' ? 'expenses' : 'expenses_hospital';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState<{ id: string; name: string } | null>(null);
  
  // Add Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [notes, setNotes] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Custom notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      triggerToast('هەڵەیەک لە بارکردنی خەرجییەکان ڕوویدا', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) {
      triggerToast('تکایە هەموو کێڵگە بەتاڵەکان پڕبکەرەوە', 'error');
      return;
    }
    
    try {
      await addDoc(collection(db, collectionName), {
        name: name.trim(),
        amount: Number(amount),
        category,
        notes: notes.trim(),
        date: new Date().toISOString()
      });
      setShowModal(false);
      setName('');
      setAmount('');
      setCategory('general');
      setNotes('');
      triggerToast('خەرجی نوێ بە سەرکەوتوویی تۆمارکرا');
      loadExpenses();
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.CREATE, 'expenses');
      triggerToast('سەرکەوتوو نەبوو لە پاشەکەوتکردنی خەرجی', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmConfig) return;
    try {
      await deleteDoc(doc(db, collectionName, deleteConfirmConfig.id));
      triggerToast(`خەرجی [${deleteConfirmConfig.name}] بە سەرکەوتوویی سڕایەوە`);
      setDeleteConfirmConfig(null);
      loadExpenses();
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.DELETE, `expenses/${deleteConfirmConfig.id}`);
      triggerToast('سەرکەوتوو نەبوو لە سڕینەوەی خەرجیەکە', 'error');
    }
  };

  // Quick select presets for Kuridsh Dinar
  const amountPresets = [5000, 10000, 25000, 50000, 100000, 250000];

  const handlePresetSelect = (val: number) => {
    setAmount(val.toString());
  };

  // Calculation helpers
  const totalAmount = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses.filter(ex => ex.date && ex.date.startsWith(todayStr));
  const totalToday = todayExpenses.reduce((sum, ex) => sum + ex.amount, 0);
  
  // Process filters
  const filteredAndSortedExpenses = expenses
    .filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (ex.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedFilterCategory === 'all' || ex.category === selectedFilterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Calculate category distribution for clean professional analytics
  const categoryStats = EXPENSE_CATEGORIES.map(categoryInfo => {
    const sum = expenses
      .filter(e => e.category === categoryInfo.id)
      .reduce((s, e) => s + e.amount, 0);
    const percentage = totalAmount > 0 ? Math.round((sum / totalAmount) * 100) : 0;
    return {
      ...categoryInfo,
      sum,
      percentage
    };
  }).filter(c => c.sum > 0);

  // Export to simple beautiful CSV
  const exportToCSV = () => {
    if (filteredAndSortedExpenses.length === 0) {
      triggerToast('هیچ زانیارییەک نییە بۆ بەرهەمهێنان', 'error');
      return;
    }

    const headers = ['Active Branch', 'Detail', 'Category', 'Amount (IQD)', 'Date', 'Notes'];
    const rows = filteredAndSortedExpenses.map(ex => {
      const cat = EXPENSE_CATEGORIES.find(c => c.id === ex.category)?.name || 'گشتی';
      const formattedDate = new Date(ex.date).toLocaleString('ku-IQ');
      return [
        currentBranch === 'cafe' ? 'کافێ' : 'نەخۆشخانە',
        `"${ex.name.replace(/"/g, '""')}"`,
        `"${cat}"`,
        ex.amount,
        `"${formattedDate}"`,
        `"${(ex.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MAS_EXPENSES_${currentBranch.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('ڕاپۆرتی خەرجییەکان ئامادەکرا و دابەزێندرا');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col min-w-0 animate-in fade-in duration-300 relative text-right" dir="rtl">
      
      {/* Toast Notification popup */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-[0_12px_45px_-8px_rgba(0,0,0,0.15)] border-r-4 ${
              toast.type === 'success' 
                ? "bg-[#1E2420] border-[#8DAA91] text-white" 
                : "bg-rose-950 border-rose-600 text-white"
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${toast.type === 'success' ? "bg-[#8DAA91]" : "bg-rose-500 animate-pulse"}`} />
            <span className="font-bold text-xs">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Premium Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white dark:bg-[#1E1E1E] p-6 rounded-[28px] border border-[var(--border-color)] shadow-sm relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 bg-gradient-to-br from-[#1E1E1E] to-[#2E2E2E] dark:from-[#2a2a2a] dark:to-[#1a1a1a] text-rose-500 rounded-2xl shadow-xl border border-rose-500/20">
             <Wallet size={28} className="stroke-[2] text-rose-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[var(--bg-secondary)] tracking-tight">سیستەمی بەڕێوەبردنی خەرجییەکان</h1>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-bold">لێرە دەتوانیت سەرجەم خەرجییەکانی چێشتخانە و کافتریا یان نەخۆشخانە لێکبدەیتەوە بە فلتەری پێشکەوتوو</p>
          </div>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-2">
          <button 
            onClick={exportToCSV}
            className="flex-1 md:flex-initial bg-white hover:bg-gray-50 text-[var(--bg-secondary)] border border-[var(--border-color)] font-bold py-3 px-5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs"
            title="دابەزاندنی فایلەکەی بە Excel"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            دەرهێنانی Excel
          </button>

          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-initial bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-rose-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-xs"
          >
            <Plus size={18} className="stroke-[3]" />
            تۆمارکردنی خەرجی نوێ
          </button>
        </div>
      </div>

      {/* Premium Live Expense Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 px-1">
        {/* Total Expenses Card */}
        <div className="bg-gradient-to-bl from-white to-rose-50/10 dark:from-[#1E1E1E] dark:to-[#221c1d] p-5 rounded-[24px] border border-[var(--border-color)] shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/[0.02] rounded-full blur-2xl pointer-events-none"></div>
          <div className="text-right z-10">
            <span className="text-[11px] font-black text-[var(--text-muted)] tracking-wider">سەرجەم خەرجییە گشتییەکان</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-rose-600 font-mono tracking-tight">
                {totalAmount.toLocaleString('en-US')}
              </span>
              <span className="text-xs font-black text-rose-500">د.ع</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-semibold block mt-1">تۆمارکراوە لەم لکەدا</span>
          </div>
          <div className="p-4 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl text-rose-600 border border-rose-500/10 dark:border-rose-500/30 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <Wallet size={24} className="stroke-[2]" />
          </div>
        </div>

        {/* Today's Expenses Card */}
        <div className="bg-gradient-to-bl from-white to-amber-50/10 dark:from-[#1E1E1E] dark:to-[#24211b] p-5 rounded-[24px] border border-[var(--border-color)] shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none"></div>
          <div className="text-right z-10">
            <span className="text-[11px] font-black text-[var(--text-muted)] tracking-wider">کۆی خەرجییەکانی ئەمڕۆ</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-500 font-mono tracking-tight">
                {totalToday.toLocaleString('en-US')}
              </span>
              <span className="text-xs font-black text-amber-600">د.ع</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-semibold block mt-1">
              کۆی گشتی بەردەست لە {new Date().toLocaleDateString('ku-IQ')}
            </span>
          </div>
          <div className="p-4 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-500 border border-amber-500/10 dark:border-amber-500/30 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <CalendarIcon size={24} className="stroke-[2]" />
          </div>
        </div>

        {/* Count Card */}
        <div className="bg-gradient-to-bl from-white to-blue-50/10 dark:from-[#1E1E1E] dark:to-[#1c1f24] p-5 rounded-[24px] border border-[var(--border-color)] shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/[0.02] rounded-full blur-2xl pointer-events-none"></div>
          <div className="text-right z-10">
            <span className="text-[11px] font-black text-[var(--text-muted)] tracking-wider">سەرجەم ژمارەی خەرجییەکان</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                {expenses.length}
              </span>
              <span className="text-xs font-black text-blue-500">تۆمار</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-semibold block mt-1">تۆمارە جیاوازە پاشەکەوتکراوەکان</span>
          </div>
          <div className="p-4 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-500/10 dark:border-blue-500/30 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <Tag size={24} className="stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Dynamic Category Spending Visualizer (Professional Feature) */}
      {categoryStats.length > 0 && (
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[24px] border border-[var(--border-color)] shadow-sm shrink-0">
          <div className="flex items-center gap-2 mb-4 justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-[var(--bg-secondary)]">
              <Sparkles size={16} className="text-rose-500" />
              <span>دابەشبوونی خەرجییەکان بەپێی بەشەکان (ڕێژەی گشتی)</span>
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-full border border-[var(--border-color)]">
              شیکاری چڕوپڕ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {categoryStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="p-3 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)]/50 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black text-[var(--bg-secondary)]">{stat.name}</span>
                    <span className="text-[10px] font-mono font-black text-neutral-500">{stat.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-150 dark:bg-neutral-800 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-rose-500 rounded-full" 
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                    <span>کۆ: {stat.sum.toLocaleString('en-US')} د.ع</span>
                    <Icon size={12} className="text-rose-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Advanced Filters */}
      <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-[24px] border border-[var(--border-color)] shadow-xs flex flex-col md:flex-row gap-4 items-center shrink-0">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="گەڕان بەدوای تێبینی یان وردەکاری..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-rose-500/40 rounded-xl pr-10 pl-4 py-2.5 text-xs text-[var(--text-dark)] focus:outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Categories filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedFilterCategory('all')}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-black transition-all ${
              selectedFilterCategory === 'all'
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/15'
                : 'bg-[var(--bg-primary)] text-[var(--bg-secondary)] border-[var(--border-color)] hover:bg-white'
            }`}
          >
            سەرجەم بەشەکان
          </button>
          
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedFilterCategory(cat.id)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 ${
                selectedFilterCategory === cat.id
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/15'
                  : 'bg-[var(--bg-primary)] text-[var(--bg-secondary)] border-[var(--border-color)] hover:bg-white'
              }`}
            >
              <cat.icon size={13} />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort Trigger */}
        <div className="mr-auto w-full md:w-auto flex justify-end">
          <button 
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="px-3.5 py-2.5 bg-[var(--bg-primary)] hover:bg-white rounded-xl border border-[var(--border-color)] text-xs text-[var(--bg-secondary)] font-bold transition-all flex items-center gap-1.5"
            title="گۆڕینی ڕیزبەندی کات"
          >
            <CalendarIcon size={14} className="text-rose-500" />
            ڕیزبەندی: {sortOrder === 'desc' ? 'لەکۆنەوە بۆ نوێ' : 'لەنوێوە بۆ کۆن'}
          </button>
        </div>
      </div>

      {/* Main Table Card Area */}
      <div className="bg-gradient-to-b from-white to-[#FDFBF7] dark:from-[#1E1E1E] dark:to-[#171717] rounded-[24px] lg:rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-[var(--border-color)] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="overflow-auto flex-1 max-w-full custom-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-4 py-24">
                 <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin"></div>
                 <span className="font-bold text-xs">بارکردنی لیستی خەرجییە شاهانەکان...</span>
             </div>
          ) : (
          <table className="w-full text-right border-collapse min-w-[650px]">
            <thead className="bg-gray-50/70 dark:bg-black/10 backdrop-blur-md text-[var(--text-muted)] text-[11px] uppercase sticky top-0 z-10 border-b border-[var(--border-color)] shadow-xs">
              <tr>
                <th className="px-6 py-4 font-black tracking-wider">وردەکاری خەرجی</th>
                <th className="px-6 py-4 font-black tracking-wider">بەش (Category)</th>
                <th className="px-6 py-4 font-black tracking-wider">تێبینی</th>
                <th className="px-6 py-4 font-black tracking-wider">ڕێکەوتی واژۆ</th>
                <th className="px-6 py-4 font-black tracking-wider">بڕی پارە</th>
                <th className="px-6 py-4 font-black w-24 text-left tracking-wider">کردارەکان</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[var(--bg-lighter)] dark:divide-neutral-800">
              {filteredAndSortedExpenses.map((ex) => {
                const catInfo = EXPENSE_CATEGORIES.find(c => c.id === ex.category) || {
                  name: 'خەرجی گشتی',
                  icon: Wallet,
                  color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10'
                };
                const CatIcon = catInfo.icon;

                return (
                  <tr key={ex.id} className="hover:bg-white/50 dark:hover:bg-white/[0.02] transition-all duration-200 group relative">
                    {/* Detail name */}
                    <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0 border border-rose-500/10 transition-all duration-300">
                                <Receipt size={18} className="stroke-[2.5]" />
                            </div>
                            <span className="font-black text-[var(--bg-secondary)] text-sm group-hover:text-rose-600 transition-colors">{ex.name}</span>
                        </div>
                    </td>

                    {/* Category with color pill */}
                    <td className="px-6 py-4.5">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black border flex items-center gap-1.5 w-max ${catInfo.color}`}>
                        <CatIcon size={12} />
                        {catInfo.name}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-6 py-4.5">
                      <span className="text-xs text-[var(--text-muted)] font-medium max-w-xs block truncate" title={ex.notes || '-'}>
                        {ex.notes || '-'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs font-bold font-mono">
                            <CalendarIcon size={13} className="text-neutral-400" />
                            {new Date(ex.date).toLocaleDateString('ku-IQ')} | {new Date(ex.date).toLocaleTimeString('ku-IQ', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4.5 font-black text-rose-600 dark:text-rose-500 text-sm font-mono">
                      {ex.amount.toLocaleString('en-US')} 
                      <span className="font-sans text-[10px] font-bold text-gray-400 ml-1">د.ع</span>
                    </td>

                    {/* Action Deletion */}
                    <td className="px-6 py-4.5 text-left">
                      <div className="flex items-center justify-end opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200">
                        <button 
                          onClick={() => setDeleteConfirmConfig({ id: ex.id, name: ex.name })}
                          className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-500 rounded-xl transition-all shadow-sm border border-red-100 dark:border-rose-950"
                          title="سڕینەوەی ئەم تۆمارە"
                        >
                          <Trash2 size={16} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAndSortedExpenses.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-24 text-center">
                     <div className="flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]">
                        <div className="p-6 bg-rose-500/[0.02] rounded-[32px] border-2 border-dashed border-[var(--border-color)]">
                           <Wallet size={36} className="text-rose-400 opacity-60 stroke-[1.5]" />
                        </div>
                        <p className="font-bold text-sm text-[var(--bg-secondary)]">هیچ خەرجییەک نوێ ئەم فلتەرە کۆنێکت ناکات</p>
                        <p className="text-xs text-[var(--text-muted)]">دەتوانیت لە ڕێگەی دوگمەی سەرەوە خەرجییەکانت زیاد بکەیت</p>
                        <button onClick={() => setShowModal(true)} className="text-rose-500 font-black text-xs hover:underline mt-2">زیادکردنی خەرجی یەکەم +</button>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Add New Expense Modal Popup */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#1E1E1E] rounded-[32px] w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col text-right"
            >
              {/* Top Banner decoration */}
              <div className="h-1.5 bg-gradient-to-r from-rose-600 to-amber-500 w-full" />
              
              <div className="p-6 bg-gray-50/50 dark:bg-black/10 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-600">
                    <Receipt size={22} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[var(--bg-secondary)]">تۆمارکردنی حەسیبە / خەرجی تازە</h2>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">بە بەکارهێنانی کێلگەکانی خوارەوە پاشەکەوت بکە</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 text-[var(--text-muted)] hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4 text-right">
                <form id="expenseForm" onSubmit={handleAddExpense} className="space-y-4">
                  {/* Expense detail name */}
                  <div>
                    <label className="block text-xs font-black text-[var(--bg-secondary)] mb-1.5 flex items-center gap-2">
                      <Tag size={14} className="text-rose-500" />
                      وردەکاری خەرجی <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="بۆ نموونە: کڕینی چۆپ و مێز بۆ کافێ، یان کرێی کارەبا" 
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-rose-500/50 rounded-xl px-4 py-3 outline-none text-xs text-[var(--bg-secondary)] transition-all font-semibold placeholder:text-gray-400" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-black text-[var(--bg-secondary)] mb-1.5 flex items-center gap-2">
                        <Wallet size={14} className="text-rose-500" />
                        بڕی پارە بە دینار <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        required 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        placeholder="بۆ نموونە: 25000" 
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-rose-500/50 rounded-xl px-4 py-3 outline-none text-rose-500 font-extrabold font-mono text-center text-sm transition-all pb-3" 
                        dir="ltr"
                      />
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-xs font-black text-[var(--bg-secondary)] mb-1.5 flex items-center gap-2">
                        <Layers size={14} className="text-rose-500" />
                        دیاریکردنی بەشی خەرجی
                      </label>
                      <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-rose-500/50 rounded-xl px-4 py-3 outline-none text-xs text-[var(--bg-secondary)] transition-all font-bold"
                      >
                        {EXPENSE_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Iraqi Dinar Fast Presets */}
                  <div>
                    <span className="block text-[10px] font-black text-rose-500 mb-2">دیاریکردنی بڕی پارەی خێرا (presets):</span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {amountPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handlePresetSelect(preset)}
                          className="py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-rose-500 hover:text-white transition-all text-[10px] font-sans font-black text-[var(--bg-secondary)] hover:shadow-md"
                        >
                          {(preset / 1000).toLocaleString('en-US')}K د.ع
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional notes/description */}
                  <div>
                    <label className="block text-xs font-black text-[var(--bg-secondary)] mb-1.5 flex items-center gap-2">
                      <Lightbulb size={14} className="text-rose-500" />
                      تێبینی زیاتر و وردەکاری وەک (ژمارەی مۆبایل، ناوی فرۆشگا...)
                    </label>
                    <textarea 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      placeholder="لێرە دەتوانیت وردەکاری زیاتر پاشەکەوت بکەیت بۆ ڕاپۆرتەکان" 
                      rows={3}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-rose-500/50 rounded-xl px-4 py-3 outline-none text-xs text-[var(--bg-secondary)] transition-all font-semibold placeholder:text-gray-400" 
                    />
                  </div>
                </form>
              </div>
              
              <div className="p-6 bg-gray-50/50 dark:bg-black/10 border-t border-[var(--border-color)] flex gap-4">
                  <button 
                      type="button" 
                      onClick={() => setShowModal(false)} 
                      className="flex-1 bg-white hover:bg-gray-100 border border-[var(--border-color)] text-[var(--bg-secondary)] font-bold py-3.5 rounded-xl transition-all text-xs"
                  >
                      پاشگەزبوونەوە
                  </button>
                  <button 
                      type="submit" 
                      form="expenseForm"
                      className="flex-[2] bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-black py-3.5 rounded-xl transition-all shadow-lg hover:shadow-rose-600/15 text-xs"
                  >
                      تۆمارکردن لە بنکەی زانیاری
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Royal Interactive custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmConfig && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.95, y: 10, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.95, y: 10, opacity: 0 }}
               className="bg-white dark:bg-[#1E1E1E] rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-red-500/20 text-right overflow-hidden relative"
             >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 to-amber-500"></div>
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-5 border border-rose-100 dark:border-rose-500/20 shadow-sm mx-auto">
                   <AlertTriangle size={30} className="animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-[var(--bg-secondary)] mb-2 text-center">ئایا تەواو دڵنیایت لە سڕینەوە؟</h3>
                <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed text-center">
                   ئایا دڵنیایت لە سڕینەوەی ئەم خەرجییە کە ناوی <strong className="text-rose-500">[{deleteConfirmConfig.name}]</strong>؟ ئەم ڕیکۆردە لە سیستمەکە و ڕاپۆرتی گشتی دەسڕێتەوە و ناگەڕێتەوە.
                </p>
                <div className="mt-8 flex gap-3 justify-end w-full">
                   <button 
                     onClick={() => setDeleteConfirmConfig(null)}
                     className="flex-1 py-3 px-4 rounded-xl border border-[var(--border-color)] text-[var(--bg-secondary)] hover:bg-[var(--bg-lighter)] text-xs font-black transition-all"
                   >
                     پاشگەزبوونەوە
                   </button>
                   <button 
                     onClick={handleDelete}
                     className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-l from-rose-600 to-red-500 hover:from-rose-700 hover:from-red-600 text-white shadow-md text-xs font-black transition-all"
                   >
                     بەڵێ، دەسرێتەوە
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
