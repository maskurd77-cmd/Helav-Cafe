import React, { useState, useEffect } from 'react';
import { getOrders } from '@/services/orderService';
import { Order } from '@/types';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingBag, CheckCircle, ArrowUpRight, Clock, Star, Wallet, ArrowDownRight, Tag } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';

export function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
       setLoading(true);
       
       // Load Orders
       const ordersData = await getOrders();
       setOrders(ordersData);
       
       // Load Expenses for today
       const expensesSnapshot = await getDocs(collection(db, 'expenses'));
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
       import('@/firebase').then(({ handleFirestoreError, OperationType }) => handleFirestoreError(e, OperationType.LIST, 'orders/expenses'));
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
      .slice(0, 4);

  return (
    <div className="h-full flex flex-col gap-6 lg:gap-8 min-w-0 pb-6 lg:pb-0">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 shrink-0">
        
        {/* Stat Card 1 */}
        <div className="bg-white p-6 rounded-[24px] lg:rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#E9E5D9] relative overflow-hidden group hover:border-[#D4A373] hover:shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#F9F7F2] rounded-2xl text-[#1E2420] group-hover:bg-[#1E2420] group-hover:text-[#D4A373] transition-colors">
              <TrendingUp size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-lg">
              ئەمڕۆ <ArrowUpRight size={14} className="ml-1" />
            </span>
          </div>
          <p className="text-[#8B8378] text-sm font-medium mb-1">کۆی فرۆشی ئەمڕۆ</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-[#1E2420] font-mono tracking-tight">
            {totalSalesToday.toLocaleString('en-US')} <span className="text-base font-sans text-[#8B8378] font-normal">د.ع</span>
          </h3>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white p-6 rounded-[24px] lg:rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#E9E5D9] relative overflow-hidden group hover:border-[#D4A373] hover:shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#F9F7F2] rounded-2xl text-[#1E2420] group-hover:bg-[#1E2420] group-hover:text-[#D4A373] transition-colors">
              <ShoppingBag size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
               ئەمڕۆ
            </span>
          </div>
          <p className="text-[#8B8378] text-sm font-medium mb-1">ژمارەی داواکارییەکان</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-[#1E2420] font-mono tracking-tight">
            {totalOrdersToday} <span className="text-base font-sans text-[#8B8378] font-normal">دانە</span>
          </h3>
        </div>

        {/* Stat Card 3 - Expenses */}
        <div className="bg-white p-6 rounded-[24px] lg:rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#E9E5D9] relative overflow-hidden group hover:border-[#E11D48] hover:shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#FFF1F2] rounded-2xl text-[#E11D48] group-hover:bg-[#E11D48] group-hover:text-white transition-colors">
              <Wallet size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-[#E11D48] bg-[#E11D48]/10 px-2 py-1 rounded-lg">
              ئەمڕۆ <ArrowDownRight size={14} className="ml-1" />
            </span>
          </div>
          <p className="text-[#8B8378] text-sm font-medium mb-1">خەرجییەکانی ئەمڕۆ</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-[#1E2420] font-mono tracking-tight">
             {expensesTotal.toLocaleString('en-US')} <span className="text-base font-sans text-[#8B8378] font-normal">د.ع</span>
          </h3>
        </div>

      </div>

      {/* Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 min-h-0 pb-6 lg:pb-8">
        
        {/* Active Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-[24px] lg:rounded-[40px] shadow-sm border border-[#E9E5D9] flex flex-col overflow-hidden min-h-[350px]">
          <div className="p-6 border-b border-[#E9E5D9] flex justify-between items-center shrink-0 bg-[#FDFBF7]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white border border-[#E9E5D9] rounded-xl text-[#D4A373] shadow-sm">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-[#1E2420] text-lg">دوایین داواکارییەکان</h4>
            </div>
            <Link to="/receipts" className="text-[#1E2420] text-sm font-bold bg-white border border-[#E9E5D9] px-5 py-2.5 rounded-full hover:bg-[#F9F7F2] transition-colors shadow-sm">بینینی هەمووی</Link>
          </div>
          <div className="flex-1 overflow-auto bg-white">
            {loading ? (
                <div className="flex items-center justify-center h-full text-[#8B8378] font-medium p-8">بارکردن...</div>
            ) : (
            <table className="w-full text-right border-collapse">
              <thead className="text-[#8B8378] text-[10px] lg:text-xs uppercase sticky top-0 bg-[#FDFBF7] shadow-[0_1px_0_#E9E5D9] z-10">
                <tr>
                  <th className="px-6 py-4 font-bold text-right tracking-wider">ژمارە</th>
                  <th className="px-6 py-4 font-bold text-right hidden sm:table-cell tracking-wider">داواکاری</th>
                  <th className="px-6 py-4 font-bold text-right tracking-wider">کۆی گشتی</th>
                  <th className="px-6 py-4 font-bold text-right tracking-wider">بارودۆخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9F7F2]">
                {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-[#FDFBF7] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-medium bg-[#F9F7F2] border border-[#E9E5D9] text-[#1E2420] px-2.5 py-1.5 rounded-md">
                        #{order.id.slice(0, 6)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-sm text-[#1E2420] hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {order.items.slice(0, 2).map((i, idx) => (
                            <span key={idx} className="bg-[#F9F7F2] text-[#1E2420] px-2.5 py-1 rounded-lg text-xs border border-[#E9E5D9] flex items-center gap-1.5">
                              <span className="text-[#D4A373] font-bold font-mono">{i.quantity}x</span> {i.name}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="bg-[#1E2420] text-white px-2 py-1 rounded-lg text-xs font-bold border border-[#1E2420]">
                              +{order.items.length - 2}
                            </span>
                          )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-[#1E2420] font-bold font-mono text-sm">
                      {order.total.toLocaleString('en-US')} <span className="text-[#8B8378] text-xs font-sans">د.ع</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 bg-[#10B981]/10 text-[#10B981] rounded-full text-xs font-bold border border-[#10B981]/20 flex items-center justify-center gap-1.5 w-max">
                        <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full"></div> تەواو
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center py-20">
                           <div className="flex flex-col items-center gap-3 text-[#8B8378]">
                              <div className="p-4 bg-[#F9F7F2] rounded-full">
                                <ShoppingBag size={32} className="text-[#E9E5D9]" />
                              </div>
                              <span className="font-medium text-sm">هیچ داواکارییەک نییە</span>
                           </div>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* Popular Items Section */}
        <div className="bg-white rounded-[24px] lg:rounded-[40px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#E9E5D9] p-6 lg:p-8 flex flex-col min-h-[350px] lg:min-h-0 bg-gradient-to-b from-white to-[#FDFBF7]">
          <h4 className="font-bold text-[#1E2420] mb-6 shrink-0 text-base flex items-center gap-2">
            <Star size={18} className="text-[#D4A373] fill-[#D4A373]" />
            پڕفرۆشترینەکانی ئەمڕۆ
          </h4>
          
          <div className="space-y-4 flex-1 overflow-auto pr-2">
             {popularItems.length > 0 ? (
                 popularItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-[#F9F7F2] rounded-[20px] transition-all relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4A373] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#1E2420] shadow-sm border border-[#E9E5D9]">
                                {i + 1}
                            </div>
                            <span className="font-bold text-[#1E2420] text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#8B8378] text-[10px] font-bold uppercase tracking-wider">دانە</span>
                            <span className="bg-white px-3 py-1.5 rounded-full text-xs font-bold font-mono text-[#D4A373] shadow-sm border border-[#E9E5D9] min-w-[36px] text-center">{item.quantity}</span>
                        </div>
                    </div>
                 ))
             ) : (
                 <div className="h-full flex flex-col items-center justify-center text-[#8B8378] gap-4">
                     <div className="p-4 bg-[#F9F7F2] rounded-full text-[#E9E5D9]">
                        <Tag size={32} />
                     </div>
                     <span className="text-sm font-medium">بۆ ئەمڕۆ هیچ نەفرۆشراوە</span>
                 </div>
             )}
          </div>

          <div className="mt-6 pt-6 shrink-0 border-t border-dashed border-[#E9E5D9]">
            <div className="text-center">
              <div className="text-[10px] text-[#8B8378] font-bold uppercase tracking-[0.2em] opacity-80">POWERED BY HELAV CAFE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
