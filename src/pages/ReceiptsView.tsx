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

    const printDiv = document.createElement("div");
    printDiv.className = "direct-print-target";
    printDiv.innerHTML = printRef.current.innerHTML;
    document.body.appendChild(printDiv);

    setTimeout(() => {
      window.print();
      document.body.removeChild(printDiv);
    }, 50);
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
        <div className="bg-white p-5 rounded-[24px] border border-[var(--border-color)] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[var(--text-muted)] block">تەواوی داهاتی فرۆشراو (Total Revenue)</span>
            <span className="text-2xl font-black text-[var(--bg-secondary)] mt-1 font-mono inline-block">
              {totalSales.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-emerald-600 font-bold block mt-0.5">بە فەرمی لە سیستەم</span>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <ReceiptText size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[var(--border-color)] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[var(--text-muted)] block">تێکڕای نرخی پسوڵەکان (Average Ticket)</span>
            <span className="text-2xl font-black text-[#8DAA91] mt-1 font-mono inline-block">
              {avgTicket.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-gray-400 block mt-0.5">بۆ هەر کڕیارێک</span>
          </div>
          <div className="p-3.5 bg-[var(--bg-primary)] rounded-2xl text-[#8DAA91] border border-gray-100">
            <Printer size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[var(--border-color)] shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] font-bold text-[var(--text-muted)] block">ژمارەی گشتی پسوڵەکان (Transactions)</span>
            <span className="text-2xl font-black text-[var(--accent-gold)] mt-1 font-mono inline-block">
              {orders.length}
            </span>
            <span className="text-xs text-gray-400 block mt-0.5">پسوڵەی جێبەجێکراو</span>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-2xl text-[var(--accent-gold)] border border-amber-100">
            <Clock size={22} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-4 lg:px-6 lg:py-5 rounded-[24px] shadow-sm border border-[var(--border-color)] m-1">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[var(--bg-secondary)]">
            پسوڵەکان
          </h1>
          <p className="text-xs lg:text-sm text-[var(--text-muted)] mt-1">
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
              className="w-full bg-[#FDFBF7] border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/30 focus:border-[var(--accent-gold)] text-[var(--bg-secondary)] text-sm py-2.5 pr-10 pl-4 rounded-xl transition-all shadow-sm"
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[var(--accent-gold)]">
              <Search size={18} />
            </div>
          </div>
          <div className="relative w-full sm:w-48">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/30 focus:border-[var(--accent-gold)] text-[var(--bg-secondary)] text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="bg-white border border-[var(--border-color)] text-[var(--bg-secondary)] text-sm px-4 py-2.5 rounded-xl hover:bg-[var(--bg-lighter)] transition-colors whitespace-nowrap shadow-sm font-bold w-full sm:w-auto"
            >
              هەمووی نەهێڵە
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[24px] lg:rounded-[32px] shadow-sm border border-[var(--border-color)] flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="overflow-auto flex-1 max-w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-4 absolute inset-0 z-10 bg-white/50 backdrop-blur-sm">
              <div className="w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--accent-gold)] rounded-full animate-spin"></div>
              <span className="font-bold text-sm">بارکردنی پسوڵەکان...</span>
            </div>
          ) : (
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead className="bg-[#FDFBF7] text-[var(--text-muted)] text-[10px] lg:text-xs uppercase sticky top-0 z-10 shadow-[0_1px_0_rgba(233,229,217,1)]">
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
              <tbody className="divide-y divide-[var(--bg-lighter)]">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#FDFBF7] transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-[var(--border-color)] rounded-xl flex items-center justify-center text-[var(--accent-gold)] flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          <ReceiptText size={18} />
                        </div>
                        <span className="font-mono text-sm font-bold text-[var(--bg-secondary)]">
                          {order.invoiceNo || `#${order.id.slice(0, 8)}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 text-[var(--text-muted)]">
                        <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                          <CalendarIcon size={14} className="text-[var(--accent-gold)]" />
                          {new Date(order.date).toLocaleDateString("en-GB")}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Clock
                            size={14}
                            className="text-[var(--border-color)] opacity-0"
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
                            className="bg-white px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm flex items-center gap-1.5"
                          >
                            <span className="font-mono font-bold text-[var(--accent-gold)]">
                              {i.quantity}x
                            </span>
                            {i.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-[var(--bg-secondary)] text-sm font-mono tracking-tight">
                        {order.total.toLocaleString("en-US")}
                      </span>{" "}
                      <span className="font-sans text-[10px] font-bold text-[var(--text-muted)]">
                        IQD
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-lighter)] text-[var(--text-muted)] hover:text-[var(--bg-secondary)] hover:bg-[var(--border-color)] transition-colors focus:outline-none"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-24">
                      <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
                        <div className="p-4 bg-[var(--bg-lighter)] rounded-full">
                          <Search size={32} className="text-[var(--border-color)]" />
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
            <div className="bg-[var(--bg-secondary)] text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold font-mono tracking-tight text-[var(--accent-gold)]">
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
                    className="w-8 h-8 flex items-center justify-center bg-[var(--accent-gold)]/20 hover:bg-[var(--accent-gold)]/40 rounded-full transition-colors text-[var(--accent-gold)]"
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
                <div ref={printRef} className="receipt-container" style={{ padding: "0 15px 15px 15px", width: "72mm", maxWidth: "72mm", direction: "rtl", fontFamily: "Cairo, sans-serif" }}>
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
                      <span className="font-mono font-bold text-[var(--accent-gold)] bg-[var(--accent-gold)]/10 w-8 h-8 flex flex-col items-center justify-center rounded-lg">
                        {item.quantity}
                      </span>
                      <span className="font-bold text-[var(--bg-secondary)]">
                        {item.name}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-[var(--bg-secondary)]">
                      {(item.price * item.quantity).toLocaleString("en-US")}{" "}
                      <span className="text-[10px] text-[var(--text-muted)]">IQD</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-dashed border-[var(--border-color)]">
                <div className="flex justify-between items-center bg-[var(--bg-lighter)] p-4 rounded-2xl border border-[var(--border-color)]">
                  <span className="font-bold text-[var(--bg-secondary)] text-sm">
                    کۆی گشتی
                  </span>
                  <div className="text-xl font-bold font-mono text-[var(--bg-secondary)]">
                    {selectedOrder.total.toLocaleString("en-US")}{" "}
                    <span className="text-xs text-[var(--text-muted)] ml-1">IQD</span>
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
