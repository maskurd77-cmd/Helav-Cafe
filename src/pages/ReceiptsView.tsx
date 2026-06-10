import React, { useState, useEffect, useRef } from "react";
import { getOrders } from "@/services/orderService";
import { Order } from "@/types";
import { handleFirestoreError, OperationType, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  ReceiptText,
  Search,
  Calendar as CalendarIcon,
  X,
  Eye,
  Clock,
  Printer,
} from "lucide-react";

export function ReceiptsView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // empty means all

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [storeSettings, setStoreSettings] = useState<any>({});

  useEffect(() => {
    loadOrders();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "general"));
      if (snap.exists()) {
        setStoreSettings(snap.data());
      }
    } catch (e) {
      console.error("Failed to load settings for printing", e);
    }
  };

  const handlePrint = (order: Order) => {
    if (!printRef.current) return;

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.write(`
        <html dir="rtl" lang="ku">
          <head>
            <title>Receipt</title><style>.receipt-table { width: 100%; border-collapse: collapse; margin-top: 5px; direction: rtl !important; } .receipt-table th { border-bottom: 2px solid #000; font-size: 12px; font-weight: 800; padding: 6px 0; color: #000 !important; font-family: 'Cairo', sans-serif; text-align: right; } .receipt-table td { border-bottom: 1px dotted #ccc; font-size: 13px; padding: 6px 0; vertical-align: top; color: #000 !important; font-weight: 700; } .col-name { text-align: right !important; direction: rtl !important; padding-right: 2px; font-family: 'Cairo', sans-serif; } .col-qty { text-align: center !important; width: 35px; font-weight: 800; font-family: 'Space Grotesk', 'Inter', monospace; } .col-price { text-align: left !important; width: 75px; font-weight: 800; font-family: 'Space Grotesk', monospace; direction: ltr !important; white-space: nowrap; } .item-row { direction: rtl !important; } .total-row { direction: rtl !important; } .total-amount { direction: ltr !important; text-align: left !important; }</style>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600;700&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
              * { box-sizing: border-box; color: #000 !important; font-family: 'Cairo', 'Inter', sans-serif; margin: 0; padding: 0; }
              body { padding: 0; font-size: 13px; color: #000; margin: 0 auto; background: #fff; width: 100%; max-width: 300px; line-height: 1.4; display: block; overflow-x: hidden; }
              .receipt-container { width: 100%; padding: 2mm 3mm 5mm 3mm; margin: 0 auto; direction: rtl; }
              .center { text-align: center; width: 100%; }
              .bold { font-weight: 800; }
              .logo-img { max-width: 60px; max-height: 60px; margin: 0 auto 8px; display: block; object-fit: contain; filter: grayscale(100%) contrast(1.2); }
              .header { font-size: 20px; margin-bottom: 2px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Space Grotesk', 'Cairo', sans-serif; text-align: center; }
              .sub { font-size: 11px; margin-bottom: 2px; color: #000; font-weight: 800; text-align: center; }
              .solid-line { border-top: 2px solid #000; margin: 10px 0; width: 100%; }
              .dashed-line { border-top: 1.5px dashed #000; margin: 10px 0; width: 100%; }
              .dotted-line { border-top: 1.5px dotted #000; margin: 10px 0; width: 100%; }
              .item-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; font-size: 14px; width: 100%; color: #000; font-weight: 800; }
              .item-qty { width: 25px; font-family: 'Space Grotesk', monospace; font-weight: 800; text-align: right; }
              .item-name-group { flex: 1; padding: 0 4px; text-align: right; }
              .item-price { width: 60px; text-align: left; font-family: 'Space Grotesk', monospace; font-weight: 800; }
              .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 2px solid #000; padding-top: 8px; width: 100%; }
              .total-label { font-size: 18px; font-weight: 800; }
              .total-amount { font-family: 'Space Grotesk', monospace; font-size: 20px; font-weight: 800; direction: ltr; text-align: left; }
              .footer { text-align: center; margin-top: 15px; font-size: 12px; color: #000; white-space: pre-wrap; line-height: 1.4; font-weight: 800; border-top: 1.5px dashed #000; padding-top: 10px; width: 100%; }
              .date-row { display: flex; justify-content: space-between; font-size: 11px; color: #000; margin-top: 10px; margin-bottom: 8px; font-family: 'Inter', monospace; font-weight: 800; text-transform: uppercase; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; width: 100%; direction: ltr; }
              .powered-by { text-align: center; margin-top: 15px; font-size: 9px; color: #000; font-weight: 800; letter-spacing: 2px; font-family: 'Inter', sans-serif; width: 100%; direction: ltr; }
              @page { margin: 0; }
              @media print { html, body { width: 100%; margin: 0 auto; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
            <!-- Physical RJ11 drawer pulse character: \x1b\x70\x00\x19\xfa -->
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.LIST, "orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders
    .filter((o) => {
      let matchesSearch =
        o.id.includes(searchQuery) ||
        (o.invoiceNo &&
          o.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        o.items.some((i) => i.name.includes(searchQuery));
      let matchesDate = true;
      if (dateFilter) {
        const orderDate = new Date(o.date).toLocaleDateString("en-CA"); // 'YYYY-MM-DD'
        matchesDate = orderDate === dateFilter;
      }
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = orders.length > 0 ? Math.round(totalSales / orders.length) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col min-w-0 animate-in fade-in duration-300">
      
      {/* Live Sales Metrics Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0 px-1">
        <div className="bg-white p-5 rounded-[24px] border border-[#E9E5D9] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[#8B8378] block">تەواوی داهاتی فرۆشراو (Total Revenue)</span>
            <span className="text-2xl font-black text-[#1E2420] mt-1 font-mono inline-block">
              {totalSales.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-emerald-600 font-bold block mt-0.5">بە فەرمی لە سیستەم</span>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <ReceiptText size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#E9E5D9] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[#8B8378] block">تێکڕای نرخی پسوڵەکان (Average Ticket)</span>
            <span className="text-2xl font-black text-[#8DAA91] mt-1 font-mono inline-block">
              {avgTicket.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-gray-400 block mt-0.5">بۆ هەر کڕیارێک</span>
          </div>
          <div className="p-3.5 bg-[#FAF8F5] rounded-2xl text-[#8DAA91] border border-gray-100">
            <Printer size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#E9E5D9] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[#8B8378] block">ژمارەی گشتی پسوڵەکان (Transactions)</span>
            <span className="text-2xl font-black text-[#D4A373] mt-1 font-mono inline-block">
              {orders.length}
            </span>
            <span className="text-xs text-gray-400 block mt-0.5">پسوڵەی جێبەجێکراو</span>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-2xl text-[#D4A373] border border-amber-100">
            <Clock size={22} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-4 lg:px-6 lg:py-5 rounded-[24px] shadow-sm border border-[#E9E5D9] m-1">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1E2420]">
            پسوڵەکان
          </h1>
          <p className="text-xs lg:text-sm text-[#8B8378] mt-1">
            ئەرشیفی فرۆشتنەکان و پسوڵەکان بەپێی کات
          </p>
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
              onClick={() => setDateFilter("")}
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
              <span className="font-bold text-sm">بارکردنی پسوڵەکان...</span>
            </div>
          ) : (
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead className="bg-[#FDFBF7] text-[#8B8378] text-[10px] lg:text-xs uppercase sticky top-0 z-10 shadow-[0_1px_0_rgba(233,229,217,1)]">
                <tr>
                  <th className="px-6 py-4 font-bold text-right tracking-wider">
                    ژمارەی پسوڵە
                  </th>
                  <th className="px-6 py-4 font-bold text-right tracking-wider">
                    ڕێکەوت
                  </th>
                  <th className="px-6 py-4 font-bold text-right tracking-wider w-1/3">
                    وردەکاری (داواکارییەکان)
                  </th>
                  <th className="px-6 py-4 font-bold text-right tracking-wider">
                    کۆی گشتی
                  </th>
                  <th className="px-6 py-4 font-bold text-center tracking-wider">
                    بینین
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9F7F2]">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#FDFBF7] transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-[#E9E5D9] rounded-xl flex items-center justify-center text-[#D4A373] flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          <ReceiptText size={18} />
                        </div>
                        <span className="font-mono text-sm font-bold text-[#1E2420]">
                          {order.invoiceNo || `#${order.id.slice(0, 8)}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 text-[#8B8378]">
                        <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                          <CalendarIcon size={14} className="text-[#D4A373]" />
                          {new Date(order.date).toLocaleDateString("en-GB")}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Clock
                            size={14}
                            className="text-[#E9E5D9] opacity-0"
                          />
                          {new Date(order.date).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((i, idx) => (
                          <span
                            key={idx}
                            className="bg-white px-2.5 py-1 rounded-lg text-xs font-medium text-[#1E2420] border border-[#E9E5D9] shadow-sm flex items-center gap-1.5"
                          >
                            <span className="font-mono font-bold text-[#D4A373]">
                              {i.quantity}x
                            </span>
                            {i.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-[#1E2420] text-sm font-mono tracking-tight">
                        {order.total.toLocaleString("en-US")}
                      </span>{" "}
                      <span className="font-sans text-[10px] font-bold text-[#8B8378]">
                        IQD
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F9F7F2] text-[#8B8378] hover:text-[#1E2420] hover:bg-[#E9E5D9] transition-colors focus:outline-none"
                      >
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
                        <span className="font-medium text-sm">
                          هیچ پسوڵەیەک نەدۆزرایەوە
                        </span>
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
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1E2420] text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold font-mono tracking-tight text-[#D4A373]">
                    {selectedOrder.invoiceNo ||
                      `#${selectedOrder.id.slice(0, 8)}`}
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    {new Date(selectedOrder.date).toLocaleString("en-GB")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrint(selectedOrder)}
                    className="w-8 h-8 flex items-center justify-center bg-[#D4A373]/20 hover:bg-[#D4A373]/40 rounded-full transition-colors text-[#D4A373]"
                    title="چاپکردنەوەی پسوڵە"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 relative before:absolute before:inset-x-0 before:-top-4 before:h-8 before:bg-white before:rounded-t-[32px] before:-mt-4">
              {/* Hidden receipt for printing */}
              <div style={{ display: "none" }}>
                <div ref={printRef} className="receipt-container">
                  <div className="center">
                    {storeSettings?.logoUrl && (
                      <img
                        src={storeSettings.logoUrl}
                        className="logo-img"
                        alt="Logo"
                      />
                    )}
                    <div
                      className="header"
                      style={{
                        marginBottom: storeSettings?.address ? "4px" : "10px",
                      }}
                    >
                      {storeSettings?.storeName || "MAS MENU"}
                    </div>
                    {selectedOrder.invoiceNo && (
                      <div
                        style={{
                          marginTop: "4px",
                          marginBottom: "4px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          border: "1.5px dashed #000",
                          padding: "2px 8px",
                          display: "inline-block",
                          borderRadius: "4px",
                          fontFamily: "Cairo, sans-serif",
                        }}
                      >
                        ژمارەی پسوڵە: {selectedOrder.invoiceNo}
                      </div>
                    )}
                    {storeSettings?.address && (
                      <div className="sub">{storeSettings.address}</div>
                    )}
                    {storeSettings?.phone && (
                      <div className="sub">{storeSettings.phone}</div>
                    )}
                  </div>

                  <div className="date-row">
                    <span>
                      {new Date(selectedOrder.date).toLocaleDateString("en-GB")}
                    </span>
                    <span>
                      {new Date(selectedOrder.date).toLocaleTimeString(
                        "en-US",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  </div>

                  <div className="solid-line"></div>

                  <table className="receipt-table">
                    <thead>
                      <tr>
                        <th className="col-name" style={{ textAlign: "right" }}>ناو / کاڵا</th>
                        <th className="col-qty" style={{ textAlign: "center" }}>بڕ</th>
                        <th className="col-price" style={{ textAlign: "left" }}>نرخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="col-name">{item.name}</td>
                          <td className="col-qty">{item.quantity}x</td>
                          <td className="col-price">
                            {(item.price * item.quantity).toLocaleString("en-US")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="dashed-line"></div>

                  <div className="total-row">
                    <div className="total-label">کۆی گشتی:</div>
                    <div className="total-amount">
                      {selectedOrder.total.toLocaleString("en-US")}{" "}
                      <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                        .IQD
                      </span>
                    </div>
                  </div>

                  {storeSettings?.footerMessage && (
                    <div className="footer" style={{ textAlign: "center", marginTop: "15px", fontSize: "11px", color: "black", borderTop: "1.5px dashed #000", paddingTop: "10px", width: "100%" }}>
                      {storeSettings.footerMessage}
                    </div>
                  )}

                  <div className="powered-by" style={{ textAlign: "center", marginTop: "15px", fontSize: "9px", color: "black", fontWeight: "800", letterSpacing: "2.5px", fontFamily: "'Inter', sans-serif", borderTop: "1.5px dashed #000", paddingTop: "10px", width: "100%", direction: "ltr" }}>
                    POWERED BY MAS MENU - REPRINT
                  </div>
                </div>
              </div>

              <div className="relative z-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex gap-3 items-center">
                      <span className="font-mono font-bold text-[#D4A373] bg-[#D4A373]/10 w-8 h-8 flex flex-col items-center justify-center rounded-lg">
                        {item.quantity}
                      </span>
                      <span className="font-bold text-[#1E2420]">
                        {item.name}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-[#1E2420]">
                      {(item.price * item.quantity).toLocaleString("en-US")}{" "}
                      <span className="text-[10px] text-[#8B8378]">IQD</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-dashed border-[#E9E5D9]">
                <div className="flex justify-between items-center bg-[#F9F7F2] p-4 rounded-2xl border border-[#E9E5D9]">
                  <span className="font-bold text-[#1E2420] text-sm">
                    کۆی گشتی
                  </span>
                  <div className="text-xl font-bold font-mono text-[#1E2420]">
                    {selectedOrder.total.toLocaleString("en-US")}{" "}
                    <span className="text-xs text-[#8B8378] ml-1">IQD</span>
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
