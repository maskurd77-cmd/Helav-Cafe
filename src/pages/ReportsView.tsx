import React, { useState, useEffect } from 'react';
import { getOrders } from '@/services/orderService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Order } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, Wallet, TrendingUp, TrendingDown, Activity, CalendarDays } from 'lucide-react';

export function ReportsView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'thisMonth' | 'lastMonth' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');

  useEffect(() => {
    if (dateRange === 'custom' && !customDate) return;
    loadData();
  }, [dateRange, customDate]);

  const loadData = async () => {
    try {
       setLoading(true);

       // Calculate date ranges
       let startDate: Date | undefined;
       let endDate: Date | undefined;

       const now = new Date();
       if (dateRange === 'today') {
           startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
           endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
       } else if (dateRange === 'yesterday') {
           startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
           endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
       } else if (dateRange === 'thisMonth') {
           startDate = new Date(now.getFullYear(), now.getMonth(), 1);
           endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
       } else if (dateRange === 'lastMonth') {
           startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
           endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
       } else if (dateRange === 'custom' && customDate) {
           const [year, month, day] = customDate.split('-').map(Number);
           startDate = new Date(year, month - 1, day);
           endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
       }

       let expensesQuery;
       if (startDate && endDate) {
           expensesQuery = query(
               collection(db, 'expenses'),
               where('date', '>=', startDate.toISOString()),
               where('date', '<=', endDate.toISOString())
           );
       } else {
           expensesQuery = query(collection(db, 'expenses'));
       }

       const [ordersData, expDataSnap] = await Promise.all([
         getOrders(startDate, endDate),
         getDocs(expensesQuery)
       ]);
       
       setOrders(ordersData);
       setExpenses(expDataSnap.docs.map(d => d.data()));
    } catch (e) {
       console.error(e);
       handleFirestoreError(e, OperationType.LIST, 'expenses or orders');
    } finally {
       setLoading(false);
    }
  };

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalSales - totalExpenses;

  // Simple chart grouping logic by date
  const chartDataMap: Record<string, number> = {};
  orders.forEach(o => {
      const dateObj = new Date(o.date);
      // Format as DD/MM for better chart display
      const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      chartDataMap[dateStr] = (chartDataMap[dateStr] || 0) + o.total;
  });
  
  const chartData = Object.keys(chartDataMap).map(k => ({ name: k, total: chartDataMap[k] })).reverse(); // Keep chronological order if it was reverse

  return (
    <div className="space-y-6 h-full flex flex-col min-w-0 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1E2420]">ڕاپۆرتەکان</h1>
          <p className="text-xs lg:text-sm text-[#8B8378] mt-1">سەرجەم داتا و ئامارەکان</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {dateRange === 'custom' && (
             <div className="relative w-full sm:w-48">
               <input 
                 type="date"
                 value={customDate}
                 onChange={(e) => setCustomDate(e.target.value)}
                 className="w-full bg-white border border-[#E9E5D9] outline-none focus:ring-2 focus:ring-[#D4A373] focus:border-transparent text-[#1E2420] font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm shadow-[#E9E5D9]/20"
               />
             </div>
          )}
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#8B8378]">
              <Calendar size={18} />
            </div>
            <select 
              value={dateRange} 
              onChange={(e) => {
                  setDateRange(e.target.value as any);
                  if (e.target.value !== 'custom') setCustomDate('');
              }}
              className="w-full sm:w-auto appearance-none bg-white border border-[#E9E5D9] outline-none focus:ring-2 focus:ring-[#D4A373] focus:border-transparent text-[#1E2420] font-bold py-2.5 pl-4 pr-12 rounded-xl text-sm transition-all shadow-sm shadow-[#E9E5D9]/20 cursor-pointer"
            >
              <option value="today">ئەمڕۆ</option>
              <option value="yesterday">دوێنێ</option>
              <option value="thisMonth">ئەم مانگە</option>
              <option value="lastMonth">مانگی پێشوو</option>
              <option value="all">هەموو کاتێک</option>
              <option value="custom">دیاریکراو...</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8B8378] gap-4">
              <div className="w-8 h-8 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
              <span className="font-medium">کۆکردنەوەی داتاکان...</span>
          </div>
      ) : (
          <div className="flex-1 flex flex-col gap-6 min-h-0">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 shrink-0">
                
                {/* Total Sales */}
                <div className="bg-white p-6 rounded-[24px] lg:rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#E9E5D9] relative overflow-hidden group hover:border-[#8DAA91] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-2xl text-green-600 transition-colors">
                        <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-[#8B8378] text-sm font-medium mb-1">کۆی گشتی داهات</p>
                    <h3 className="text-2xl lg:text-3xl font-bold text-[#1E2420] font-mono">
                        {totalSales.toLocaleString('en-US')} <span className="text-base font-sans text-[#8B8378] font-normal">د.ع</span>
                    </h3>
                </div>

                {/* Total Expenses */}
                <div className="bg-white p-6 rounded-[24px] lg:rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#E9E5D9] relative overflow-hidden group hover:border-[#E11D48] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 rounded-2xl text-[#E11D48] transition-colors">
                        <TrendingDown size={24} />
                        </div>
                    </div>
                    <p className="text-[#8B8378] text-sm font-medium mb-1">کۆی گشتی خەرجی</p>
                    <h3 className="text-2xl lg:text-3xl font-bold text-[#1E2420] font-mono">
                        {totalExpenses.toLocaleString('en-US')} <span className="text-base font-sans text-[#8B8378] font-normal">د.ع</span>
                    </h3>
                </div>

                {/* Net Income */}
                <div className="bg-[#1E2420] p-6 rounded-[24px] lg:rounded-[32px] shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-10 -mt-10"></div>
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#D4A373]/20 rounded-full blur-xl -mr-5 -mb-5"></div>
                    
                    <div className="relative z-10 flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/10 rounded-2xl text-[#D4A373] backdrop-blur-sm">
                        <Wallet size={24} />
                        </div>
                        {netIncome > 0 && (
                            <span className="text-xs font-bold text-[#4ADE80] bg-[#4ADE80]/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#4ADE80]/20">
                                قازانج
                            </span>
                        )}
                        {netIncome < 0 && (
                            <span className="text-xs font-bold text-[#F87171] bg-[#F87171]/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#F87171]/20">
                                زیان
                            </span>
                        )}
                    </div>
                    <div className="relative z-10 mt-auto">
                        <p className="text-white/60 text-sm font-medium mb-1">سوودی پوخت</p>
                        <h3 className="text-2xl lg:text-3xl font-bold text-white font-mono dir-ltr text-right">
                            {netIncome.toLocaleString('en-US')} <span className="text-base font-sans text-white/60 font-normal">د.ع</span>
                        </h3>
                    </div>
                </div>

             </div>

             <div className="bg-white rounded-[24px] lg:rounded-[40px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#E9E5D9] p-6 lg:p-8 flex-1 min-h-[350px] flex flex-col min-w-0">
                 <div className="flex items-center gap-3 mb-6 shrink-0">
                     <div className="p-2 bg-[#F9F7F2] rounded-xl text-[#1E2420]">
                         <Activity size={20} />
                     </div>
                     <h4 className="font-bold text-[#1E2420] text-base">چارتی داهات تایبەت بە کات</h4>
                 </div>
                 
                 <div className="flex-1 w-full min-w-0 relative" dir="ltr">
                     {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E5D9" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fontSize: 12, fill: '#8B8378', fontFamily: 'Inter'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    tick={{fontSize: 12, fill: '#8B8378', fontFamily: 'monospace'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `${value >= 1000 ? (value / 1000) + 'k' : value}`}
                                    dx={-10}
                                />
                                <Tooltip 
                                    cursor={{fill: '#F9F7F2', opacity: 0.5}} 
                                    contentStyle={{
                                        borderRadius: '16px', 
                                        border: '1px solid #E9E5D9', 
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: '#1E2420',
                                        backgroundColor: '#ffffff'
                                    }} 
                                    formatter={(value: number) => [`${value.toLocaleString('en-US')} IQD`, 'داهات']}
                                    labelStyle={{ color: '#8B8378', marginBottom: '4px', fontSize: '12px', fontWeight: 'normal' }}
                                />
                                <Bar 
                                    dataKey="total" 
                                    fill="#1E2420" 
                                    radius={[6, 6, 0, 0]} 
                                    barSize={40}
                                    animationDuration={1000}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8B8378] gap-4">
                            <div className="p-4 bg-[#F9F7F2] rounded-full text-[#E9E5D9]">
                                <CalendarDays size={32} />
                            </div>
                            <span className="font-medium text-sm">هیچ داتایەک نییە بۆ پیشاندان لەم ماوەیەدا</span>
                        </div>
                     )}
                 </div>
             </div>
          </div>
      )}
    </div>
  );
}
