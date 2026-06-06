import React, { useState, useEffect } from 'react';
import { getOrders } from '@/services/orderService';
import { Order } from '@/types';
import { handleFirestoreError, OperationType } from '@/firebase';
import { ReceiptText, Search, Calendar as CalendarIcon, X, Eye, Clock } from 'lucide-react';

export function ReceiptsView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // empty means all

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
       setLoading(true);
       const data = await getOrders();
       setOrders(data);
    } catch (e) {
       console.error(e);
       handleFirestoreError(e, OperationType.LIST, 'orders');
    } finally {
       setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    let matchesSearch = o.id.includes(searchQuery) || o.items.some(i => i.name.includes(searchQuery));
    let matchesDate = true;
    if (dateFilter) {
      const orderDate = new Date(o.date).toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
      matchesDate = orderDate === dateFilter;
    }
    return matchesSearch && matchesDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-4 lg:px-6 lg:py-5 rounded-[24px] shadow-sm border border-[#E9E5D9]">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1E2420]">وەسلەکان</h1>
          <p className="text-xs lg:text-sm text-[#8B8378] mt-1">ئەرشیفی فرۆشتنەکان و پسوڵەکان بەپێی کات</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
                <input 
                    type="text" 
                    placeholder="گەڕان بەدوای پسوڵە، خواردن..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#E9E5D9] outline-none focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] text-[#1E2420] text-sm py-2.5 pr-10 pl-4 rounded-xl transition-all shadow-sm"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#D4A373]">
                    <Search size={18} />
                </div>
            </div>
            <div className="relative w-full sm:w-48">
                <input 
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#E9E5D9] outline-none focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] text-[#1E2420] text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm"
                />
            </div>
            {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')}
                  className="bg-white border border-[#E9E5D9] text-[#1E2420] text-sm px-4 py-2.5 rounded-xl hover:bg-[#F9F7F2] transition-colors whitespace-nowrap shadow-sm font-bold w-full sm:w-auto"
                >
                  هەمووی نەهێڵە
                </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-[24px] lg:rounded-[32px] shadow-sm border border-[#E9E5D9] flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="overflow-auto flex-1 max-w-full">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-[#8B8378] gap-4 absolute inset-0 z-10 bg-white/50 backdrop-blur-sm">
                 <div className="w-10 h-10 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
                 <span className="font-bold text-sm">بارکردنی وەسلەکان...</span>
             </div>
          ) : (
          <table className="w-full text-right border-collapse min-w-[700px]">
             <thead className="bg-[#FDFBF7] text-[#8B8378] text-[10px] lg:text-xs uppercase sticky top-0 z-10 shadow-[0_1px_0_rgba(233,229,217,1)]">
              <tr>
                <th className="px-6 py-4 font-bold text-right tracking-wider">ژمارەی وەسل</th>
                <th className="px-6 py-4 font-bold text-right tracking-wider">ڕێکەوت</th>
                <th className="px-6 py-4 font-bold text-right tracking-wider w-1/3">وردەکاری (داواکارییەکان)</th>
                <th className="px-6 py-4 font-bold text-right tracking-wider">کۆی گشتی</th>
                <th className="px-6 py-4 font-bold text-center tracking-wider">بینین</th>
              </tr>
            </thead>
             <tbody className="divide-y divide-[#F9F7F2]">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FDFBF7] transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white border border-[#E9E5D9] rounded-xl flex items-center justify-center text-[#D4A373] flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                              <ReceiptText size={18} />
                          </div>
                          <span className="font-mono text-sm font-bold text-[#1E2420]">#{order.id.slice(0, 8)}</span>
                      </div>
                  </td>
                  <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 text-[#8B8378]">
                          <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                            <CalendarIcon size={14} className="text-[#D4A373]" />
                            {new Date(order.date).toLocaleDateString('en-GB')}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <Clock size={14} className="text-[#E9E5D9] opacity-0" />
                            {new Date(order.date).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                          </div>
                      </div>
                  </td>
                  <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                      {order.items.map((i, idx) => (
                          <span key={idx} className="bg-white px-2.5 py-1 rounded-lg text-xs font-medium text-[#1E2420] border border-[#E9E5D9] shadow-sm flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[#D4A373]">{i.quantity}x</span>{i.name}
                          </span>
                      ))}
                      </div>
                  </td>
                  <td className="px-6 py-5">
                      <span className="font-bold text-[#1E2420] text-sm font-mono tracking-tight">{order.total.toLocaleString('en-US')}</span> <span className="font-sans text-[10px] font-bold text-[#8B8378]">IQD</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F9F7F2] text-[#8B8378] hover:text-[#1E2420] hover:bg-[#E9E5D9] transition-colors focus:outline-none">
                          <Eye size={16} />
                      </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                   <td colSpan={5} className="text-center py-24">
                       <div className="flex flex-col items-center gap-3 text-[#8B8378]">
                          <div className="p-4 bg-[#F9F7F2] rounded-full">
                            <Search size={32} className="text-[#E9E5D9]" />
                          </div>
                          <span className="font-medium text-sm">هیچ وەسلێک نەدۆزرایەوە</span>
                       </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Receipt Details Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
              <div 
                className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                  <div className="bg-[#1E2420] text-white p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      <div className="relative z-10 flex justify-between items-start">
                          <div>
                              <h3 className="text-xl font-bold font-mono tracking-tight text-[#D4A373]">#{selectedOrder.id.slice(0, 8)}</h3>
                              <p className="text-xs text-white/60 mt-1">{new Date(selectedOrder.date).toLocaleString('en-GB')}</p>
                          </div>
                          <button 
                            onClick={() => setSelectedOrder(null)}
                            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                          >
                              <X size={16} />
                          </button>
                      </div>
                  </div>
                  
                  <div className="p-6 relative before:absolute before:inset-x-0 before:-top-4 before:h-8 before:bg-white before:rounded-t-[32px] before:-mt-4">
                      <div className="relative z-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                          {selectedOrder.items.map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                  <div className="flex gap-3 items-center">
                                      <span className="font-mono font-bold text-[#D4A373] bg-[#D4A373]/10 w-8 h-8 flex flex-col items-center justify-center rounded-lg">{item.quantity}</span>
                                      <span className="font-bold text-[#1E2420]">{item.name}</span>
                                  </div>
                                  <div className="font-mono font-bold text-[#1E2420]">
                                      {(item.price * item.quantity).toLocaleString('en-US')} <span className="text-[10px] text-[#8B8378]">IQD</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-dashed border-[#E9E5D9]">
                          <div className="flex justify-between items-center bg-[#F9F7F2] p-4 rounded-2xl border border-[#E9E5D9]">
                              <span className="font-bold text-[#1E2420] text-sm">کۆی گشتی</span>
                              <div className="text-xl font-bold font-mono text-[#1E2420]">
                                  {selectedOrder.total.toLocaleString('en-US')} <span className="text-xs text-[#8B8378] ml-1">IQD</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
