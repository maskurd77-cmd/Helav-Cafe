import React, { useState, useEffect } from 'react';
import { getOrders } from '@/services/orderService';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Order } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { 
  Calendar, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CalendarDays, 
  Printer, 
  FileText, 
  TrendingUp as TrendingIcon,
  ShoppingBag,
  Layers,
  Search,
  CheckCircle,
  Clock,
  Briefcase,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useBranchStore } from '@/store/useBranchStore';
import { useAuth } from '@/components/AuthProvider';

export function ReportsView() {
  const { user } = useAuth();
  const { settings } = useSettingsStore();
  const { currentBranch } = useBranchStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'thisMonth' | 'lastMonth' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  
  // Tab control inside reports view for high professionalism
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'expenses'>('overview');
  
  // Search state for analytical tables
  const [productQuery, setProductQuery] = useState('');
  const [expenseQuery, setExpenseQuery] = useState('');

  useEffect(() => {
    if (dateRange === 'custom' && !customDate) return;
    loadData();
  }, [dateRange, customDate, currentBranch]);

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

       const expensesCollectionName = currentBranch === 'cafe' ? 'expenses' : 'expenses_hospital';
       let expensesQuery;
       if (startDate && endDate) {
           expensesQuery = query(
               collection(db, expensesCollectionName),
               where('date', '>=', startDate.toISOString()),
               where('date', '<=', endDate.toISOString())
           );
       } else {
           expensesQuery = query(collection(db, expensesCollectionName));
       }

       const [ordersData, expDataSnap] = await Promise.all([
         getOrders(startDate, endDate),
         getDocs(expensesQuery)
       ]);
       
       setOrders(ordersData);
       setExpenses(expDataSnap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) })));
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
  const avgOrderValue = orders.length > 0 ? Math.round(totalSales / orders.length) : 0;

  // Analytical Category Share Calculation
  const categoryShareMap: Record<string, number> = {};
  // Product analytics calculations
  const productPerformanceMap: Record<string, { name: string; category: string; quantity: number; totalSales: number }> = {};

  orders.forEach(o => {
     o.items.forEach(item => {
        // Category Share
        categoryShareMap[item.category] = (categoryShareMap[item.category] || 0) + (item.price * item.quantity);
        
        // Product Performance
        if (!productPerformanceMap[item.name]) {
           productPerformanceMap[item.name] = {
              name: item.name,
              category: item.category,
              quantity: 0,
              totalSales: 0
           };
        }
        productPerformanceMap[item.name].quantity += item.quantity;
        productPerformanceMap[item.name].totalSales += (item.price * item.quantity);
     });
  });

  const categoryShareList = Object.keys(categoryShareMap).map(catName => ({
     name: catName,
     value: categoryShareMap[catName],
     percentage: totalSales > 0 ? Math.round((categoryShareMap[catName] / totalSales) * 100) : 0
  })).sort((a, b) => b.value - a.value);

  const productPerformanceList = Object.values(productPerformanceMap)
    .sort((a, b) => b.quantity - a.quantity);

  const filteredProductsPerformance = productPerformanceList.filter(p => 
     p.name.toLowerCase().includes(productQuery.toLowerCase()) || 
     p.category.toLowerCase().includes(productQuery.toLowerCase())
  );

  const filteredExpenses = expenses.filter(e => 
     e.name.toLowerCase().includes(expenseQuery.toLowerCase())
  ).sort((a, b) => {
     const dateA = a.date ? new Date(a.date).getTime() : 0;
     const dateB = b.date ? new Date(b.date).getTime() : 0;
     return dateB - dateA; // descending
  });

  const handlePrintReport = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const rangeLabels: Record<string, string> = {
      today: 'ئەمڕۆ',
      yesterday: 'دوێنێ',
      thisMonth: 'ئەم مانگە',
      lastMonth: 'مانگی پێشوو',
      all: 'هەموو کاتێک',
      custom: `بەرواری ${customDate}`
    };

    const selectedRangeStr = rangeLabels[dateRange] || 'دیاریکراو';

    const salesHtml = orders.map((o, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-family: monospace;">#${o.id.substring(0, 8).toUpperCase()}</td>
        <td style="font-family: monospace;">${new Date(o.date).toLocaleDateString('ku-IQ')} ${new Date(o.date).toLocaleTimeString('ku-IQ', {hour: '2-digit', minute:'2-digit'})}</td>
        <td style="font-family: monospace; font-weight: bold; text-align: left;">${o.total.toLocaleString()} د.ع</td>
      </tr>
    `).join('');

    const expensesHtml = expenses.map((e, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${e.name}</td>
        <td style="font-family: monospace;">${e.date ? new Date(e.date).toLocaleDateString('ku-IQ') : ''}</td>
        <td style="font-family: monospace; font-weight: bold; text-align: left;">${e.amount.toLocaleString()} د.ع</td>
      </tr>
    `).join('');

    const topSellingHtml = productPerformanceList.slice(0, 5).map((p, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td style="text-align: center; font-family: monospace;">${p.quantity}</td>
        <td style="font-family: monospace; font-weight: bold; text-align: left;">${p.totalSales.toLocaleString()} د.ع</td>
      </tr>
    `).join('');

    const logoHtml = settings?.logoUrl 
      ? `<img src="${settings.logoUrl}" style="max-height: 70px; width: auto; margin-bottom: 12px; object-fit: contain;" referrerPolicy="no-referrer" />`
      : '';

    const branchLabel = currentBranch === 'cafe' ? 'لقى کافێ' : 'لقى نەخۆشخانە';

    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="ku" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>ڕاپۆرتی دارایی سەرەکى دوقۆڵی</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 45px;
            color: #1e2420;
            direction: rtl;
            background: #fff;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px dashed #E9E5D9;
            padding-bottom: 25px;
          }
          .header h1 {
            font-size: 24px;
            margin: 5px 0;
            color: #1e2420;
            font-weight: 800;
          }
          .header p {
            font-size: 13px;
            color: #8b8378;
            margin: 4px 0;
          }
          .meta-info {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 30px;
            color: #555;
            background: #fdfbf7;
            padding: 14px 20px;
            border-radius: 12px;
            border: 1px solid #e9e5d9;
          }
          .cards-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 35px;
          }
          .card {
            border: 1px solid #e9e5d9;
            border-radius: 14px;
            padding: 18px;
            text-align: center;
            background: #fff;
          }
          .card.net {
            background: #1e2420;
            border-color: #1e2420;
            color: #fff;
          }
          .card.net .card-title {
            color: rgba(255,255,255,0.7);
          }
          .card.net .card-value {
            color: #d4a373;
          }
          .card-title {
            font-size: 11px;
            color: #8b8378;
            margin-bottom: 8px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .card-value {
            font-size: 18px;
            font-weight: 800;
            color: #1e2420;
          }
          h2.section-title {
            font-size: 14px;
            color: #1e2420;
            border-right: 4px solid #d4a373;
            padding-right: 10px;
            margin-top: 35px;
            margin-bottom: 15px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 11px;
          }
          th, td {
            border: 1px solid #eaeaea;
            padding: 12px 14px;
            text-align: right;
          }
          th {
            background-color: #fdfbf7;
            color: #333;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          .print-footer {
            text-align: center;
            margin-top: 70px;
            font-size: 10px;
            color: #acacac;
            border-top: 1px dashed #eaeaea;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <h1>${settings?.storeName || 'کافێ و مێنۆی نیشتمانی'}</h1>
          <p>${branchLabel}</p>
          <p style="font-weight: bold; margin-top: 12px; font-size: 16px; color: #1e2420; letter-spacing: -0.5px;">دۆخی فەرمی دارایی و بزاوتەکانی گەنجینە</p>
          <p style="font-weight: bold; color: #d4a373; font-size: 12px;">ماوەی ڕاپۆرتکردن: ${selectedRangeStr}</p>
        </div>

        <div class="meta-info">
          <div><strong>ڕێکەوت و کاتی چاپ:</strong> ${new Date().toLocaleString('ku-IQ')}</div>
          <div><strong>بەکارھێنەرى بەرپرس:</strong> ${user?.email || 'بەرپرسی سیستەم'}</div>
        </div>

        <div class="cards-container">
          <div class="card">
            <div class="card-title">داهاتی فرۆشتن</div>
            <div class="card-value">${totalSales.toLocaleString()} د.ع</div>
          </div>
          <div class="card">
            <div class="card-title">تێکڕای پسوولە (AOV)</div>
            <div class="card-value">${avgOrderValue.toLocaleString()} د.ع</div>
          </div>
          <div class="card">
            <div class="card-title">خەرجی گشتی</div>
            <div class="card-value" style="color: #b71c1c;">${totalExpenses.toLocaleString()} د.ع</div>
          </div>
          <div class="card net">
            <div class="card-title">قازانجی کاتی</div>
            <div class="card-value">
              ${netIncome.toLocaleString()} د.ع
            </div>
          </div>
        </div>

        <h2 class="section-title">باشترین و پڕفرۆشترین بەرهەمەکانی ئەم بزووتنەوەیە (Top 5)</h2>
        ${productPerformanceList.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">ڕێز</th>
                <th>ناوی بابەت</th>
                <th>بەش / هاوپۆل</th>
                <th style="text-align: center;">دانەی فرۆشراو</th>
                <th style="text-align: left;">پارەی کۆکراوە</th>
              </tr>
            </thead>
            <tbody>
              ${topSellingHtml}
            </tbody>
          </table>
        ` : `<p style="font-size: 11px; color: #888; background: #fafafa; padding: 12px; border-radius: 8px; text-align: center;">هیچ داتایەکی بەرهەم بەردەست نییە.</p>`}

        <h2 class="section-title">دوایین پسوولەکان و فرۆشتی دەروازە (POS Transactions)</h2>
        ${orders.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style="width: 45px; text-align: center;">ڕیز</th>
                <th>کۆدی پسوولە</th>
                <th>ڕێکەوتی تۆمار</th>
                <th style="text-align: left;">بڕی گشتی پارە</th>
              </tr>
            </thead>
            <tbody>
              ${salesHtml}
            </tbody>
          </table>
        ` : `<p style="font-size: 11px; color: #888; background: #fafafa; padding: 12px; border-radius: 8px; text-align: center;">هیچ کڕینێک لەم کاتەدا تۆمار فۆرمات نەکراوە.</p>`}

        <h2 class="section-title">وردەکاری لوتکەی خەرجییەکان (Company Expenses)</h2>
        ${expenses.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style="width: 45px; text-align: center;">رێزبەندی</th>
                <th>ناوی بابەت / هۆکاری خەرجکردن</th>
                <th>مێژوو</th>
                <th style="text-align: left;">بڕی خەرجکراو</th>
              </tr>
            </thead>
            <tbody>
              ${expensesHtml}
            </tbody>
          </table>
        ` : `<p style="font-size: 11px; color: #888; background: #fafafa; padding: 12px; border-radius: 8px; text-align: center;">هیچ خەرجییەک لەم مەودا کاتییەدا بوونی نییە.</p>`}

        <div class="print-footer">
          ئەم ڕاپۆرتە بە شێوەیەکی فەرمی لە مۆدی بەڕێوەبەرایەتی سیستەمی کۆیی ${settings?.storeName || 'Helav'} هاتووەتە دروستکردن.
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.parent.document.body.removeChild(window.frameElement);
            }, 500);
          };
        </script>
      </body>
      </html>
    `);

    iframeDoc.close();
  };

  // Simple chart grouping logic by date
  const chartDataMap: Record<string, number> = {};
  orders.forEach(o => {
      const dateObj = new Date(o.date);
      const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      chartDataMap[dateStr] = (chartDataMap[dateStr] || 0) + o.total;
  });
  
  const chartData = Object.keys(chartDataMap).map(k => ({ name: k, total: chartDataMap[k] })).reverse();

  return (
    <div className="space-y-6 h-full flex flex-col min-w-0 pb-6">
      
      {/* Page Header Banner */}
      <div className="bg-[#1E2420] text-white p-6 lg:p-8 rounded-[32px] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A373]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <span className="bg-[#D4A373]/20 border border-[#D4A373]/30 text-[#D4A373] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
             لق تاقیکردنەوە پڕۆفیشناڵ {currentBranch === 'cafe' ? 'کافێ' : 'نەخۆشخانە'}
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mt-3 flex items-center gap-2">
            <Activity className="text-[#D4A373] w-8 h-8 animate-pulse" />
            سیستەمی ڕاپۆرت و شیکاری دارایی
          </h1>
          <p className="text-white/60 text-xs lg:text-sm mt-1.5 font-medium">
             بینینی داهاتی پسوولەکان، ڕێژەی مۆدێرنی خەرجییەکان، و باشترینەکانی فرۆشتنی لقی {currentBranch === 'cafe' ? 'کافێ' : 'نەخۆشخانە'} چڕ بە ژمێریاری نوێ
          </p>
        </div>

        {/* Action Controls in Header Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
          
          {/* Print Button */}
          <button
            onClick={handlePrintReport}
            className="bg-[#D4A373] text-[#1E2420] hover:bg-[#cdaf8f] font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-[#D4A373]/10 flex items-center justify-center gap-2 active:scale-95"
          >
            <Printer size={16} />
            <span>چاپکردنی ڕاپۆرت</span>
          </button>

          {dateRange === 'custom' && (
             <div className="relative">
               <input 
                 type="date"
                 value={customDate}
                 onChange={(e) => setCustomDate(e.target.value)}
                 className="w-full bg-[#2D3631] border border-white/10 text-white font-bold py-3 px-4 rounded-2xl text-xs focus:ring-2 focus:ring-[#D4A373] focus:border-transparent outline-none"
               />
             </div>
          )}

          <div className="relative">
            <select 
              value={dateRange} 
              onChange={(e) => {
                  setDateRange(e.target.value as any);
                  if (e.target.value !== 'custom') setCustomDate('');
              }}
              className="w-full appearance-none bg-[#2D3631] border border-white/10 text-white font-bold py-3 pl-5 pr-12 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:focus:ring-[#D4A373] focus:border-transparent outline-none cursor-pointer hover:bg-[#343e38] transition-colors"
            >
              <option value="today">ئەمڕۆ</option>
              <option value="yesterday">دوێنێ</option>
              <option value="thisMonth">ئەم مانگە</option>
              <option value="lastMonth">مانگی پێشوو</option>
              <option value="all">هەموو کاتێک</option>
              <option value="custom">دیاریکراو...</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/60">
              <Calendar size={16} />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8B8378] bg-white rounded-[32px] border border-[#E9E5D9] h-96">
              <div className="w-9 h-9 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
              <span className="font-bold text-sm mt-3">بارکردنی شیکارییە داراییەکان و چارتی قازانج...</span>
          </div>
      ) : (
          <div className="flex-1 flex flex-col gap-6 min-h-0">
             
             {/* Bento Grid Stats Structure (5 Cards) */}
             <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 shrink-0">
                {/* 1. Total Sales */}
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E9E5D9] relative overflow-hidden group hover:border-[#8DAA91] transition-all">
                    <div className="flex justify-between items-start mb-2.5">
                        <div className="p-2.5 bg-green-50 rounded-xl text-green-600">
                          <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                           داهات
                        </span>
                    </div>
                    <p className="text-[#8B8378] text-[11px] font-medium mb-1">کۆی فرۆشتن</p>
                    <h3 className="text-lg lg:text-xl font-extrabold text-[#1E2420] font-mono whitespace-nowrap">
                        {totalSales.toLocaleString()} <span className="text-[10px] font-sans text-[#8B8378] font-normal">د.ع</span>
                    </h3>
                </div>

                {/* 2. Total Expenses */}
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E9E5D9] relative overflow-hidden group hover:border-[#E11D48] transition-all">
                    <div className="flex justify-between items-start mb-2.5">
                        <div className="p-2.5 bg-red-50 rounded-xl text-[#E11D48]">
                          <TrendingDown size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-[#E11D48] bg-red-50 px-2 py-0.5 rounded-md">
                           خەرجکراو
                        </span>
                    </div>
                    <p className="text-[#8B8378] text-[11px] font-medium mb-1">خەرجی گشتی</p>
                    <h3 className="text-lg lg:text-xl font-extrabold text-[#1E2420] font-mono whitespace-nowrap">
                        {totalExpenses.toLocaleString()} <span className="text-[10px] font-sans text-[#8B8378] font-normal">د.ع</span>
                    </h3>
                </div>

                {/* 3. Basket Average (AOV) */}
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E9E5D9] relative overflow-hidden group hover:border-[#D4A373] transition-all">
                    <div className="flex justify-between items-start mb-2.5">
                        <div className="p-2.5 bg-[#F9F7F2] rounded-xl text-[#D4A373]">
                          <Briefcase size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-[#D4A373] bg-[#F9F7F2] px-2 py-0.5 rounded-md font-mono">
                           AOV
                        </span>
                    </div>
                    <p className="text-[#8B8378] text-[11px] font-medium mb-1">تێکڕای پسوولە</p>
                    <h3 className="text-lg lg:text-xl font-extrabold text-[#1E2420] font-mono whitespace-nowrap">
                        {avgOrderValue.toLocaleString()} <span className="text-[10px] font-sans text-[#8B8378] font-normal">د.ع</span>
                    </h3>
                </div>

                {/* 4. Total Invoices Scale */}
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E9E5D9] relative overflow-hidden group hover:border-[#8DAA91] transition-all">
                    <div className="flex justify-between items-start mb-2.5">
                        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                          <ShoppingBag size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                           قەبارە
                        </span>
                    </div>
                    <p className="text-[#8B8378] text-[11px] font-medium mb-1">کۆی کارەکان</p>
                    <h3 className="text-lg lg:text-xl font-extrabold text-[#1E2420] font-mono whitespace-nowrap">
                        {orders.length} <span className="text-[10px] font-sans text-[#8B8378] font-normal">پسوولە</span>
                    </h3>
                </div>

                {/* 5. Net Profit Charcoal Card */}
                <div className="bg-[#1E2420] p-5 rounded-[24px] shadow-md text-white relative overflow-hidden flex flex-col justify-between col-span-2 lg:col-span-1">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -ml-5 -mt-5"></div>
                    <div className="relative z-10 flex justify-between items-start mb-2.5">
                        <div className="p-2.5 bg-white/10 rounded-xl text-[#D4A373] backdrop-blur-sm">
                          <Wallet size={18} />
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${netIncome >= 0 ? 'bg-[#4ADE80]/20 text-[#4ADE80]' : 'bg-red-500/20 text-red-400'}`}>
                           {netIncome >= 0 ? 'سوود' : 'زیان'}
                        </span>
                    </div>
                    <div>
                        <p className="text-white/60 text-[11px] font-medium mb-1">قازانجی پوخت</p>
                        <h3 className="text-lg lg:text-xl font-extrabold text-[#D4A373] font-mono whitespace-nowrap">
                            {netIncome.toLocaleString()} <span className="text-[10px] font-normal text-white/50">د.ع</span>
                        </h3>
                    </div>
                </div>
             </div>

             {/* Internal Navigation Tabs for Report sections */}
             <div className="flex bg-white border border-[#E9E5D9] rounded-2xl p-1 shrink-0 shadow-inner w-full md:w-max">
                 <button 
                   onClick={() => setActiveTab('overview')}
                   className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                     activeTab === 'overview' ? 'bg-[#1E2420] text-white shadow-md' : 'text-[#8B8378] hover:text-[#1E2420]'
                   }`}
                 >
                    <Activity size={14} /> داشبۆردی گشتی و چارتەکان
                 </button>
                 <button 
                   onClick={() => setActiveTab('products')}
                   className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                     activeTab === 'products' ? 'bg-[#1E2420] text-white shadow-md' : 'text-[#8B8378] hover:text-[#1E2420]'
                   }`}
                 >
                    <Layers size={14} /> فرۆشتنی مێنو و بابەتەکان
                 </button>
                 <button 
                   onClick={() => setActiveTab('expenses')}
                   className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                     activeTab === 'expenses' ? 'bg-[#1E2420] text-white shadow-md' : 'text-[#8B8378] hover:text-[#1E2420]'
                   }`}
                 >
                    <Wallet size={14} /> خستنەڕووی خەرجکراوەکان
                 </button>
             </div>

             {/* Screen Area governed by Tabs */}
             <div className="flex-1 min-h-0">
                {activeTab === 'overview' && (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-stretch">
                      
                      {/* Left: Revenues Over Time Chart (Grid 2) */}
                      <div className="lg:col-span-2 bg-white rounded-[28px] border border-[#E9E5D9] p-6 flex flex-col min-h-[350px]">
                         <div className="flex items-center justify-between mb-6 shrink-0">
                            <h4 className="font-extrabold text-[#1E2420] text-sm lg:text-base flex items-center gap-2">
                               <span className="w-1.5 h-6 bg-[#D4A373] rounded-full"></span>
                               چارتی هێڵی تەوژمی داهاتی فرۆشتنەکان
                            </h4>
                            <span className="text-xs text-[#8B8378] bg-[#F9F7F2] border border-[#E9E5D9] px-3 py-1.5 rounded-full font-bold">
                                بێ کێشە و ڕاستەوخۆ
                            </span>
                         </div>

                         <div className="flex-1 w-full min-w-0 relative" dir="ltr">
                            {chartData.length > 0 ? (
                               <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                     <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                           <stop offset="5%" stopColor="#1E2420" stopOpacity={0.2}/>
                                           <stop offset="95%" stopColor="#1E2420" stopOpacity={0}/>
                                        </linearGradient>
                                     </defs>
                                     <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" vertical={false} />
                                     <XAxis 
                                        dataKey="name" 
                                        tick={{fontSize: 11, fill: '#8B8378', fontWeight: 'bold'}}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                     />
                                     <YAxis 
                                        tick={{fontSize: 11, fill: '#8B8378', fontFamily: 'monospace'}}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => val >= 1000 ? `${(val / 1000)}k` : val}
                                        dx={-10}
                                     />
                                     <Tooltip 
                                        cursor={{ stroke: '#D4A373', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: '1px solid #E9E5D9',
                                            boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                                            fontSize: '13px',
                                            fontWeight: 'extrabold',
                                            color: '#1E2420',
                                            backgroundColor: '#ffffff'
                                        }}
                                        formatter={(val: number) => [`${val.toLocaleString()} د.ع`, 'کۆی گشتی']}
                                        labelStyle={{ color: '#8B8378', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}
                                     />
                                     <Area 
                                        type="monotone" 
                                        dataKey="total" 
                                        stroke="#1E2420" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorTotal)" 
                                        animationDuration={1100}
                                        dot={{ stroke: '#D4A373', strokeWidth: 2, r: 4, fill: '#FFFFFF' }}
                                        activeDot={{ r: 6, stroke: '#1E2420', strokeWidth: 2, fill: '#D4A373' }}
                                     />
                                  </AreaChart>
                               </ResponsiveContainer>
                            ) : (
                               <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8B8378] gap-3">
                                  <CalendarDays size={36} className="text-gray-300" />
                                  <span className="text-xs font-bold">هیچ فرۆشراوێک تۆمار نەکراوە بۆ ئەم هێڵە کاتییە</span>
                                </div>
                            )}
                         </div>
                      </div>

                      {/* Right: Category Revenue Share Meters (Grid 1) */}
                      <div className="bg-white rounded-[28px] border border-[#E9E5D9] p-6 flex flex-col min-h-[350px]">
                         <h4 className="font-extrabold text-[#1E2420] text-sm lg:text-base flex items-center gap-2 mb-6 shrink-0">
                            <Layers size={18} className="text-[#D4A373]" />
                            ڕێژەی هۆبەکانی داهات
                         </h4>

                         <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                            {categoryShareList.length > 0 ? (
                               categoryShareList.map((cat, idx) => (
                                  <div key={idx} className="space-y-2">
                                     <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-[#1E2420] flex items-center gap-1.5">
                                           <span className="w-2.5 h-2.5 rounded-full bg-[#1E2420] shrink-0"></span>
                                           {cat.name}
                                        </span>
                                        <div className="flex items-center gap-2 font-mono">
                                           <span className="font-bold text-[#D4A373]">{cat.percentage}%</span>
                                           <span className="text-gray-400">({cat.value.toLocaleString()} د.ع)</span>
                                        </div>
                                     </div>
                                     
                                     {/* Custom elegant progress tracking meter */}
                                     <div className="h-3 w-full bg-[#F5F2EA] rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-[#1E2420] to-[#D4A373] rounded-full transition-all duration-1000"
                                          style={{ width: `${cat.percentage}%` }}
                                        ></div>
                                     </div>
                                  </div>
                               ))
                            ) : (
                               <div className="h-full flex flex-col items-center justify-center text-[#8B8378] py-8">
                                  <Sparkles size={32} className="opacity-10 mb-2" />
                                  <p className="text-xs font-bold text-gray-400">داتای بەشەکان خاڵییە</p>
                               </div>
                            )}
                         </div>
                      </div>

                   </div>
                )}

                {/* Tab 2: Itemized product performance */}
                {activeTab === 'products' && (
                    <div className="bg-white rounded-[28px] border border-[#E9E5D9] p-6 flex flex-col h-full min-h-[400px]">
                       <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-[#F9F7F2] pb-5 mb-5 shrink-0">
                          <div>
                             <h3 className="font-extrabold text-sm lg:text-base text-[#1E2420]">شیکاریی هەر بەرهەمێک</h3>
                             <p className="text-xs text-[#8B8378] mt-0.5">بەپێی ژمارەی فرۆشراو و پارەی کەڵەکەبوو لە تێکڕای لقەکەدا</p>
                          </div>
                          
                          {/* Search products filter */}
                          <div className="relative w-full sm:w-80">
                             <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                <Search size={16} />
                             </div>
                             <input 
                               type="text" 
                               value={productQuery}
                               onChange={(e) => setProductQuery(e.target.value)}
                               placeholder="گەڕان بەدوای بەرهەم یان مێنو..."
                               className="w-full bg-[#FDFBF7] border border-[#E9E5D9] rounded-2xl py-2.5 pl-4 pr-11 text-xs outline-none focus:ring-2 focus:ring-[#D4A373] text-[#1E2420] font-medium"
                             />
                          </div>
                       </div>

                       <div className="flex-1 overflow-auto">
                          {filteredProductsPerformance.length > 0 ? (
                             <table className="w-full text-right border-collapse">
                                <thead className="text-[#8B8378] text-[10px] lg:text-xs uppercase bg-[#FDFBF7] shadow-[0_1px_0_#E9E5D9] sticky top-0 z-10">
                                   <tr>
                                      <th className="px-6 py-4 font-extrabold">ڕیز</th>
                                      <th className="px-6 py-4 font-extrabold">ناوی بەرهەم</th>
                                      <th className="px-6 py-4 font-extrabold">بەش / هاوپۆل</th>
                                      <th className="px-6 py-4 font-extrabold text-center">ژمارەی فرۆشراو</th>
                                      <th className="px-6 py-4 font-extrabold text-left">پارەی پەیداکراو</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                   {filteredProductsPerformance.map((p, idx) => (
                                      <tr key={idx} className="hover:bg-[#FDFBF7] transition-all duration-150">
                                         <td className="px-6 py-4 text-xs font-mono font-bold text-gray-400">{idx + 1}</td>
                                         <td className="px-6 py-4 font-bold text-[#1E2420]">{p.name}</td>
                                         <td className="px-6 py-4">
                                            <span className="bg-[#F9F7F2] text-[#2D3631] px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#E9E5D9]">
                                               {p.category}
                                            </span>
                                         </td>
                                         <td className="px-6 py-4 text-center font-mono font-extrabold text-gray-800">{p.quantity}</td>
                                         <td className="px-6 py-4 text-left font-mono font-extrabold text-[#8DAA91]">{p.totalSales.toLocaleString()} <span className="font-sans text-[10px] text-gray-400 font-normal">د.ع</span></td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          ) : (
                             <div className="flex flex-col items-center justify-center py-16 text-[#8B8378]">
                                <Layers size={36} className="opacity-20 mb-3" />
                                <span className="text-xs font-bold">هیچ بابەتێکی مێنو نەدۆزرایەوە</span>
                             </div>
                          )}
                       </div>
                    </div>
                )}

                {/* Tab 3: Detailed Expenses structure */}
                {activeTab === 'expenses' && (
                    <div className="bg-white rounded-[28px] border border-[#E9E5D9] p-6 flex flex-col h-full min-h-[400px]">
                       <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-[#F9F7F2] pb-5 mb-5 shrink-0">
                          <div>
                             <h3 className="font-extrabold text-sm lg:text-base text-[#1E2420]">تۆماری خەرجییەکان</h3>
                             <p className="text-xs text-[#8B8378] mt-0.5">بەپێی مێژووی سەرهەڵدان و وردەکاری بڕە پارەی خەرجکراو لە لقی فەرمی</p>
                          </div>
                          
                          <div className="relative w-full sm:w-80">
                             <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                <Search size={16} />
                             </div>
                             <input 
                               type="text" 
                               value={expenseQuery}
                               onChange={(e) => setExpenseQuery(e.target.value)}
                               placeholder="گەڕان بەدوای هۆکاری خەرجی..."
                               className="w-full bg-[#FDFBF7] border border-[#E9E5D9] rounded-2xl py-2.5 pl-4 pr-11 text-xs outline-none focus:ring-2 focus:ring-[#D4A373] text-[#1E2420] font-medium"
                             />
                          </div>
                       </div>

                       <div className="flex-1 overflow-auto">
                          {filteredExpenses.length > 0 ? (
                             <table className="w-full text-right border-collapse">
                                <thead className="text-[#8B8378] text-[10px] lg:text-xs uppercase bg-[#FDFBF7] shadow-[0_1px_0_#E9E5D9] sticky top-0 z-10">
                                   <tr>
                                      <th className="px-6 py-4 font-extrabold">ڕیزبەندی</th>
                                      <th className="px-6 py-4 font-extrabold">هۆکاری خەرجکردن / بابەت</th>
                                      <th className="px-6 py-4 font-extrabold">مێژوو</th>
                                      <th className="px-6 py-4 font-extrabold text-left">بڕی خەرجکراو</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                   {filteredExpenses.map((exp, idx) => (
                                      <tr key={idx} className="hover:bg-[#FDFBF7] transition-all duration-150">
                                         <td className="px-6 py-4 text-xs font-mono font-bold text-gray-400">{idx + 1}</td>
                                         <td className="px-6 py-4 font-extrabold text-[#1E2420]">{exp.name}</td>
                                         <td className="px-6 py-4 text-xs text-[#8B8378] font-mono">
                                             {exp.date ? new Date(exp.date).toLocaleString('ku-IQ', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                                         </td>
                                         <td className="px-6 py-4 text-left font-mono font-extrabold text-red-600">{exp.amount.toLocaleString()} <span className="font-sans text-[10px] text-gray-400 font-normal">د.ع</span></td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          ) : (
                             <div className="flex flex-col items-center justify-center py-16 text-[#8B8378]">
                                <Wallet size={36} className="opacity-20 mb-3" />
                                <span className="text-xs font-bold">هیچ خەرجییەک لەم لیستی تاقیگەیەدا نییە</span>
                             </div>
                          )}
                       </div>
                    </div>
                )}
             </div>

          </div>
      )}

    </div>
  );
}
