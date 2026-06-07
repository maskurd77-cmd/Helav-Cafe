import React, { useState, useEffect } from 'react';
import { getOrders } from '@/services/orderService';
import { Order } from '@/types';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle, 
  ArrowUpRight, 
  Clock, 
  Star, 
  Wallet, 
  ArrowDownRight, 
  Tag, 
  LayoutDashboard,
  Sparkles,
  ClipboardCheck,
  Building2,
  CalendarDays,
  BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { useBranchStore } from '@/store/useBranchStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export function Dashboard() {
  const { currentBranch } = useBranchStore();
  const { settings } = useSettingsStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentBranch]);

  const loadData = async () => {
    try {
       setLoading(true);
       
       // Load Orders (automatically branch-aware via service)
       const ordersData = await getOrders();
       setOrders(ordersData);
       
       // Resolve correct branch expenses collection
       const expensesCollName = currentBranch === 'cafe' ? 'expenses' : 'expenses_hospital';
       
       // Load Expenses for the current branch
       const expensesSnapshot = await getDocs(collection(db, expensesCollName));
       let expTotal = 0;
       const todayStr = new Date().toDateString();
       
       expensesSnapshot.forEach(doc => {
         const data = doc.data();
         if (data.date) {
             const dateStr = typeof data.date === 'string' ? new Date(data.date).toDateString() : data.date.toDate().toDateString();
             if (dateStr === todayStr) {
                 expTotal += data.amount;
             }
         }
       });
       setExpensesTotal(expTotal);

    } catch (e) {
       console.error(e);
       handleFirestoreError(e, OperationType.LIST, 'orders/expenses');
    } finally {
       setLoading(false);
    }
  };

  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(o => {
     try {
       return new Date(o.date).toDateString() === todayStr;
     } catch (e) {
       return false;
     }
  });

  const totalSalesToday = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrdersToday = todayOrders.length;

  // Calculate most popular items
  const popularItemsMap = new Map<string, number>();
  todayOrders.forEach(o => {
      o.items.forEach(i => {
          popularItemsMap.set(i.name, (popularItemsMap.get(i.name) || 0) + i.quantity);
      });
  });
  const popularItems = Array.from(popularItemsMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

  // Dynamic calculation for 7-day analytical trends representation
  const getLast7DaysData = () => {
    const data = [];
    const KurdishDays = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const targetStr = targetDate.toDateString();
      const KurdishLabel = KurdishDays[targetDate.getDay()];
      
      const filteredDaysOrders = orders.filter(o => {
         try {
           return new Date(o.date).toDateString() === targetStr;
         } catch (_) {
           return false;
         }
      });
      
      const totalAmountSum = filteredDaysOrders.reduce((acc, current) => acc + current.total, 0);
      data.push({
         name: KurdishLabel,
         sales: totalAmountSum,
         ordersCount: filteredDaysOrders.length
      });
    }
    return data;
  };

  const chartData = getLast7DaysData();

  return (
    <div className="h-full flex flex-col gap-6 lg:gap-8 min-w-0 pb-6 lg:pb-0">
      
      {/* Dynamic Welcome Heading Banner - Simplified and Compact */}
      <div className="bg-gradient-to-l from-[#1E2420] to-[#2D3631] text-white p-5 lg:p-6 rounded-[24px] shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shrink-0 border border-[#D4A373]/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A373]/5 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-[#D4A373] border border-white/10 hidden sm:block">
             <LayoutDashboard size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white">
              بەخێربێیتەوە بۆ {settings.storeName || 'MAS MENU'}
            </h1>
            <p className="text-xs lg:text-sm text-white/70 mt-1 font-bold">
              ڕاپۆرت و ئاماری لقی: <strong className="text-[#D4A373]">{currentBranch === 'cafe' ? 'کافێ' : 'نەخۆشخانە'}</strong>
            </p>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-[11px] sm:text-xs">
           <CalendarDays size={14} className="text-[#D4A373]" />
           <p className="text-white/60 font-bold">ئەمڕۆ:</p>
           <p className="text-white font-mono font-black">{new Date().toLocaleDateString('ku-IQ')}</p>
        </div>
      </div>

      {/* Stats Grid of Today Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 shrink-0">
        
        {/* Stat Card 1: Today's Revenue */}
        <div className="bg-gradient-to-b from-white to-[#FDFBF7] p-7 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#E9E5D9] relative overflow-hidden group hover:border-[#8DAA91] hover:shadow-[0_20px_40px_rgba(141,170,145,0.15)] transition-all duration-500">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#8DAA91]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3.5 bg-green-50 rounded-[20px] text-green-600 shadow-inner border border-green-100 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp size={24} className="stroke-[2.5]" />
            </div>
            <span className="flex items-center text-xs font-black text-green-700 bg-green-100/80 px-3 py-1.5 rounded-xl border border-green-200">
              ئەمڕۆ <ArrowUpRight size={16} className="ml-1" />
            </span>
          </div>
          <p className="text-[#8B8378] text-xs font-bold mb-2 uppercase tracking-wider">کۆی فرۆشی دەراوزە (POS) بۆ ئەمڕۆ</p>
          <h3 className="text-3xl lg:text-4xl font-black text-[#1E2420] font-mono tracking-tight group-hover:text-[#8DAA91] transition-colors duration-500 flex items-baseline gap-1.5">
            {totalSalesToday.toLocaleString('en-US')} <span className="text-sm font-sans text-[#8B8378] font-bold">د.ع</span>
          </h3>
        </div>

        {/* Stat Card 2: Today's Orders */}
        <div className="bg-gradient-to-b from-white to-[#FDFBF7] p-7 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#E9E5D9] relative overflow-hidden group hover:border-[#D4A373] hover:shadow-[0_20px_40px_rgba(212,163,115,0.15)] transition-all duration-500">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#D4A373]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3.5 bg-amber-50 rounded-[20px] text-[#D4A373] border border-amber-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <ShoppingBag size={24} className="stroke-[2.5]" />
            </div>
            <span className="flex items-center text-xs font-black text-[#D4A373] bg-amber-50 px-3 py-1.5 rounded-xl border border-[#D4A373]/20">
               پسوولە
            </span>
          </div>
          <p className="text-[#8B8378] text-xs font-bold mb-2 uppercase tracking-wider">ژمارەی فاکتۆرە فەرمییەکان</p>
          <h3 className="text-3xl lg:text-4xl font-black text-[#1E2420] font-mono tracking-tight group-hover:text-[#D4A373] transition-colors duration-500 flex items-baseline gap-1.5">
            {totalOrdersToday} <span className="text-sm font-sans text-[#8B8378] font-bold">دانە</span>
          </h3>
        </div>

        {/* Stat Card 3: Today's Expenses */}
        <div className="bg-gradient-to-b from-white to-[#FDFBF7] p-7 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#E9E5D9] relative overflow-hidden group hover:border-[#E11D48] hover:shadow-[0_20px_40px_rgba(225,29,72,0.1)] transition-all duration-500 sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#E11D48]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3.5 bg-[#FFF1F2] rounded-[20px] text-[#E11D48] shadow-inner border border-red-100 group-hover:scale-110 transition-transform duration-500">
              <Wallet size={24} className="stroke-[2.5]" />
            </div>
            <span className="flex items-center text-xs font-black text-[#E11D48] bg-[#FFF1F2] px-3 py-1.5 rounded-xl border border-red-100">
              خەرجیی گشتی <ArrowDownRight size={16} className="ml-1" />
            </span>
          </div>
          <p className="text-[#8B8378] text-xs font-bold mb-2 uppercase tracking-wider">خەرجییەکانی تەواوی ئەمڕۆ</p>
          <h3 className="text-3xl lg:text-4xl font-black text-[#1E2420] font-mono tracking-tight group-hover:text-[#E11D48] transition-colors duration-500 flex items-baseline gap-1.5">
             {expensesTotal.toLocaleString('en-US')} <span className="text-sm font-sans text-[#8B8378] font-bold">د.ع</span>
          </h3>
        </div>

      </div>

      {/* 7-Days Sales Analytical Visualization Graph */}
      <div className="bg-gradient-to-b from-white to-[#FDFBF7] p-8 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-[#E9E5D9] shadow-md flex flex-col gap-6 shrink-0 hover:border-[#8DAA91] hover:shadow-xl transition-all duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] rounded-2xl shadow-xl border border-[#D4A373]/20">
              <BarChart3 size={24} className="stroke-[2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#1E2420] text-xl">دۆخی فرۆشتنی لقی ئێستا</h4>
              <p className="text-xs text-[#8B8378] mt-1 font-bold">گەشەی گشتی فرۆشراوەکان لە ماوەی ٧ ڕۆژی ڕابردوودا</p>
            </div>
          </div>
          <div className="text-right sm:text-left">
             <span className="text-sm font-black text-[#8DAA91] bg-green-50 border border-green-200 px-5 py-2.5 rounded-2xl inline-flex items-center gap-2 shadow-sm">
                تێکڕای فرۆش: {(chartData.reduce((acc, curr) => acc + curr.sales, 0) / 7).toLocaleString('en-US', {maximumFractionDigits: 0})} د.ع / ڕۆژانە
             </span>
          </div>
        </div>

        <div className="h-[280px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A373" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#D4A373" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E5D9" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8B8378', fontSize: 11, fontWeight: 700 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8B8378', fontSize: 11 }}
                orientation="right"
                tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1E2420',
                  borderColor: '#D4A373',
                  borderRadius: '16px',
                  color: '#fff',
                  textAlign: 'right',
                  direction: 'rtl',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ color: '#D4A373', fontWeight: 700 }}
                labelStyle={{ color: '#E9E5D9', fontWeight: 700, marginBottom: '4px' }}
                formatter={(value: any) => [`${Number(value).toLocaleString('en-US')} د.ع`, 'فرۆش']}
                labelFormatter={(label) => `ڕۆژ: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#D4A373" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#salesGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables & Top Items Section */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 min-h-0 pb-6 lg:pb-8">
        
        {/* Active/Recent Orders Table Panel */}
        <div className="lg:col-span-2 bg-white rounded-[28px] lg:rounded-[40px] shadow-sm border border-[#E9E5D9] flex flex-col overflow-hidden min-h-[350px]">
          <div className="p-6 border-b border-[#E9E5D9] flex flex-row justify-between items-center bg-[#FDFBF7] shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white border border-[#E9E5D9] rounded-xl text-[#D4A373] shadow-sm">
                <Clock size={18} />
              </div>
              <div>
                <h4 className="font-extrabold text-[#1E2420] text-base">تازەترین کارەکان</h4>
                <p className="text-[10px] text-[#8B8378] mt-0.5">دوایین پسوولەکانی فرۆشتنی سەر شاشە</p>
              </div>
            </div>
            <Link to="/receipts" className="text-xs font-bold bg-[#1E2420] text-white hover:bg-[#2D3631] px-5 py-2.5 rounded-full transition-all shadow-md">بینینی هەموو پسوڵەکان</Link>
          </div>
          
          <div className="flex-1 overflow-auto">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-[#8B8378] gap-2 p-8">
                   <div className="w-8 h-8 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
                   <span className="text-xs">بارکردن...</span>
                </div>
            ) : (
            <table className="w-full text-right border-collapse">
              <thead className="text-[#8B8378] text-[10px] uppercase bg-[#FDFBF7] sticky top-0 z-10 shadow-[0_1px_0_#E9E5D9]">
                <tr>
                  <th className="px-6 py-4 font-extrabold">کۆدی پسوولە</th>
                  <th className="px-6 py-4 font-extrabold hidden sm:table-cell">بابەتەکان</th>
                  <th className="px-6 py-4 font-extrabold">بڕی گشتی</th>
                  <th className="px-6 py-4 font-extrabold">دۆخی پارەدان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9F7F2]">
                {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-[#FDFBF7] transition-colors">
                     <td className="px-6 py-4">
                       <span className="font-mono text-xs font-bold bg-white border border-[#E9E5D9] text-[#1E2420] px-3 py-1.5 rounded-xl">
                         #{order.id.slice(0, 8).toUpperCase()}
                       </span>
                     </td>
                     <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                           {order.items.slice(0, 2).map((i, idx) => (
                             <span key={idx} className="bg-[#FDFBF7] text-[#1E2420] px-3 py-1.5 rounded-xl text-xs border border-[#E9E5D9] flex items-center gap-2">
                               <span className="text-[#D4A373] font-extrabold font-mono text-[10px] bg-[#1E2420] text-white px-1.5 py-0.5 rounded-md">{i.quantity}x</span> 
                               <span className="font-bold">{i.name}</span>
                             </span>
                           ))}
                           {order.items.length > 2 && (
                             <span className="bg-[#1E2420] text-white px-2 py-1 rounded-xl text-xs font-bold">
                               +{order.items.length - 2} بابەت زیاتر
                             </span>
                           )}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-[#1E2420] font-mono font-extrabold text-sm">
                       {order.total.toLocaleString('en-US')} <span className="text-gray-400 font-sans text-xs font-normal">د.ع</span>
                     </td>
                     <td className="px-6 py-4">
                       <span className="px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100 flex items-center justify-center gap-1.5 w-max">
                          <CheckCircle size={12} /> پەرداخت کرا
                       </span>
                     </td>
                   </tr>
                ))}
                {orders.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center py-24">
                           <div className="flex flex-col items-center gap-3 text-[#8B8378]">
                              <ShoppingBag size={36} className="text-[#E9E5D9] opacity-30" />
                              <span className="font-bold text-sm">هیچ داواکارییەک لەم مەودایەدا نییە</span>
                              <p className="text-xs text-[#8B8378]">تۆماری فرۆشتنەکان لێرە بە شێوەیەکی خۆکار تازە دەبێتەوە</p>
                           </div>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* Popular Items / Top Rated Sidebar panel */}
        <div className="bg-white rounded-[28px] lg:rounded-[40px] shadow-sm border border-[#E9E5D9] p-6 lg:p-8 flex flex-col min-h-[350px] lg:min-h-0 relative overflow-hidden bg-gradient-to-b from-white to-[#FDFBF7]">
          <h4 className="font-extrabold text-[#1E2420] mb-6 shrink-0 text-base flex items-center gap-2">
            <Star size={18} className="text-[#D4A373] fill-[#D4A373]" />
            باشترین فرۆشراوەکانی یەکەم
          </h4>
          
          <div className="space-y-4 flex-1 overflow-auto pr-1">
             {popularItems.length > 0 ? (
                  popularItems.map((item, i) => (
                     <div key={i} className="flex justify-between items-center p-4 bg-white border border-[#E9E5D9] rounded-2xl hover:border-[#D4A373] transition-all relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4A373] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#F9F7F2] flex items-center justify-center text-xs font-extrabold text-[#1E2420] border border-[#E9E5D9]">
                                #{i + 1}
                            </div>
                            <span className="font-extrabold text-[#2D3631] text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#8B8378] text-[9px] font-bold uppercase tracking-wider">دانە</span>
                            <span className="bg-[#1E2420] text-[#D4A373] px-3 py-1 rounded-xl text-xs font-extrabold font-mono shadow-inner">{item.quantity}</span>
                        </div>
                     </div>
                  ))
             ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#8B8378] gap-4">
                      <div className="p-4 bg-[#F9F7F2] rounded-full text-[#E9E5D9]">
                         <Tag size={32} />
                      </div>
                      <span className="text-xs font-bold text-gray-400">تا ئێستا کڕینی گشتی بۆ ئەمڕۆ نییە</span>
                  </div>
             )}
          </div>

          <div className="mt-6 pt-6 shrink-0 border-t border-dashed border-[#E9E5D9]">
            <div className="text-center">
              <span className="text-[9px] text-[#8B8378] font-bold uppercase tracking-[0.25em] opacity-60">
                 سیستەمی بەڕێوبەرایەتی کۆیی MAS MENU
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
