import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Coffee,
  ReceiptText,
  X,
  Tag,
  Banknote,
  ShoppingBag,
  MonitorSmartphone,
  Percent,
  ChevronRight,
  Coins,
  Check,
  Printer,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { useProductStore } from "@/store/useProductStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useBranchStore } from "@/store/useBranchStore";
import { addOrder } from "@/services/orderService";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { motion, AnimatePresence } from "motion/react";

export function PosView() {
  const [activeCategory, setActiveCategory] = useState("هەمووی");

  const { products, loading } = useProductStore();
  const { settings } = useSettingsStore();

  const categories = [
    "هەمووی",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const [checkingOut, setCheckingOut] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number | string>("");
  const [receivedAmount, setReceivedAmount] = useState<number | string>("");

  // Custom Item Modal States
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemCategory, setCustomItemCategory] = useState("گشتی");

  // Cash Drawer simulated trigger state
  const [showDrawerAnimation, setShowDrawerAnimation] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState("");

  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
  } = usePosStore();

  // Web Audio physical cash register simulated slide and bell dinger synthesizer
  const kickCashDrawer = () => {
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // 1. Sleek metallic bell ding (two high-frequency sines with subtle detune)
        const oscBell1 = ctx.createOscillator();
        const oscBell2 = ctx.createOscillator();
        const gainBell = ctx.createGain();

        oscBell1.type = "sine";
        oscBell1.frequency.setValueAtTime(1380, now);
        oscBell2.type = "sine";
        oscBell2.frequency.setValueAtTime(1415, now);

        gainBell.gain.setValueAtTime(0.24, now);
        gainBell.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        oscBell1.connect(gainBell);
        oscBell2.connect(gainBell);
        gainBell.connect(ctx.destination);

        oscBell1.start(now);
        oscBell2.start(now);
        oscBell1.stop(now + 1.9);
        oscBell2.stop(now + 1.9);

        // 2. Linear frequency sliding clunk (simulating drawer sliding open)
        const oscClunk = ctx.createOscillator();
        const gainClunk = ctx.createGain();
        oscClunk.type = "triangle";
        oscClunk.frequency.setValueAtTime(90, now);
        oscClunk.frequency.linearRampToValueAtTime(130, now + 0.16);

        gainClunk.gain.setValueAtTime(0.15, now);
        gainClunk.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        oscClunk.connect(gainClunk);
        gainClunk.connect(ctx.destination);
        oscClunk.start(now);
        oscClunk.stop(now + 0.3);
      }
    } catch (e) {
      console.warn(
        "Physical sound hardware block or browser focus missing.",
        e,
      );
    }

    // Trigger visual slider feedback modal
    setShowDrawerAnimation(true);
    setTimeout(() => {
      setShowDrawerAnimation(false);
    }, 2200);
  };

  // Keyboard shortcut hooks (F1 = Checkout, F2 = Custom Item Modal, F3 = Cashdrawer, Enter/Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 key: Checkout
      if (e.key === "F1") {
        e.preventDefault();
        if (cart.length > 0 && !checkingOut) {
          if (showCheckoutModal) {
            handleCheckout();
          } else {
            openCheckoutModal();
          }
        }
        return;
      }

      // F2 key: Custom Item Modal
      if (e.key === "F2") {
        e.preventDefault();
        setShowCustomItemModal(true);
        return;
      }

      // F3 key: Kick physical cash drawer simulation
      if (e.key === "F3") {
        e.preventDefault();
        kickCashDrawer();
        return;
      }

      // Normal actions if not currently editing forms
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      if (e.key === "Enter") {
        e.preventDefault();
        if (cart.length > 0 && !checkingOut) {
          if (showCheckoutModal) {
            handleCheckout();
          } else {
            openCheckoutModal();
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (showCheckoutModal) {
          setShowCheckoutModal(false);
        } else if (showCustomItemModal) {
          setShowCustomItemModal(false);
        } else {
          clearCart();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, checkingOut, showCheckoutModal, showCustomItemModal]);

  const { currentBranch } = useBranchStore();

  // Sync cart for customer display
  useEffect(() => {
    setDoc(doc(db, "settings", `customer_display_cart_${currentBranch}`), {
      cart,
      updatedAt: new Date().toISOString(),
    }).catch(console.error);
  }, [cart, currentBranch]);

  const getFinalTotal = () => {
    const total = getCartTotal();
    const discount = Number(discountAmount) || 0;
    return Math.max(0, total - discount);
  };

  const [printMethod, setPrintMethod] = useState<"iframe" | "direct">("iframe");

  const openCheckoutModal = () => {
    if (cart.length === 0) return;
    setDiscountAmount("");
    setReceivedAmount("");
    setPrintMethod("iframe"); // Default to high-compatibility iframe
    setShowCheckoutModal(true);
  };

  const triggerDirectWindowPrint = () => {
    if (!receiptRef.current) return;
    const printDiv = document.createElement("div");
    printDiv.className = "direct-print-target";
    printDiv.innerHTML = receiptRef.current.innerHTML;
    document.body.appendChild(printDiv);

    setTimeout(() => {
      window.print();
      document.body.removeChild(printDiv);
    }, 150);
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;
    const price = Number(customItemPrice) || 0;

    const customItem = {
      id: `custom-${Date.now()}`,
      name: customItemName,
      price,
      category: customItemCategory || "گشتی",
      status: "available",
      image: "",
    };

    addToCart(customItem);
    setShowCustomItemModal(false);
    setCustomItemName("");
    setCustomItemPrice("");
  };

  const handleCheckout = async (doPrint: boolean = true) => {
    if (cart.length === 0) return;

    setCheckingOut(true);
    try {
      const finalTotal = getFinalTotal();

      // Calculate next sequential invoice ID/number
      const prefix = settings.invoicePrefix || "#";
      const nextNum =
        settings.invoiceNextNumber !== undefined
          ? settings.invoiceNextNumber
          : settings.invoiceStartNumber || 1000;
      const invoiceNo = `${prefix}${nextNum}`;

      setCurrentInvoiceNo(invoiceNo);

      await addOrder({
        items: cart,
        total: finalTotal,
        date: new Date(),
        status: "completed",
        invoiceNo: invoiceNo,
      });

      // Update next invoice counter safely in Firestore
      try {
        const docName = currentBranch === "cafe" ? "general" : "hospital";
        await updateDoc(doc(db, "settings", docName), {
          invoiceNextNumber: nextNum + 1,
        });
      } catch (err) {
        console.error("Failed to increment next invoice counter:", err);
      }

      // Beautiful Print logic
      if (doPrint && receiptRef.current) {
        if (printMethod === "direct") {
          // 1. Direct browser window.print() method
          triggerDirectWindowPrint();
        } else {
          // 2. Iframe dynamic silent-style printing method
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
                      body { padding: 0; font-size: 13px; color: #000; margin: 0 !important; background: #fff; width: 72mm; max-width: 72mm; line-height: 1.4; display: block; overflow: hidden; }
                      .receipt-container { width: 72mm; max-width: 72mm; padding: 0mm 4mm 5mm 4mm; margin: 0 auto; direction: rtl; }
                      .center { text-align: center; width: 100%; }
                      .bold { font-weight: 800; }
                      .logo-img { max-width: 60px; max-height: 60px; margin: 0 auto 8px; display: block; object-fit: contain; filter: grayscale(100%) contrast(1.2); }
                      .header { font-size: 20px; margin-bottom: 2px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Space Grotesk', 'Cairo', sans-serif; text-align: center; }
                      .sub { font-size: 12px; font-weight: 600; color: #000; margin-bottom: 1px; white-space: pre-wrap; line-height: 1.3; font-family: 'Inter', sans-serif; text-align: center; }
                      .dashed-line { border-bottom: 1.5px dashed #000; margin: 8px 0; width: 100%; }
                      .dotted-line { border-bottom: 1px dotted #000; margin: 6px 0; width: 100%; }
                      .solid-line { border-bottom: 2px solid #000; margin: 8px 0; width: 100%; }
                      .item-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; align-items: flex-start; width: 100%; flex-wrap: nowrap; }
                      .item-name-group { flex: 1; padding-right: 0px; padding-left: 8px; line-height: 1.2; font-weight: 700; text-align: right; }
                      .item-qty { font-weight: 800; font-size: 13px; margin-top: 0px; width: 20px; text-align: right; flex-shrink: 0; }
                      .item-price { min-width: 65px; text-align: left; font-weight: 800; font-family: 'Space Grotesk', monospace; font-size: 13px; white-space: nowrap; direction: ltr; flex-shrink: 0; }
                      .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; margin-top: 6px; align-items: center; width: 100%; }
                      .total-label { font-size: 15px; font-weight: 800; }
                      .total-amount { font-family: 'Space Grotesk', monospace; font-size: 20px; font-weight: 800; direction: ltr; text-align: left; }
                      .footer { text-align: center; margin-top: 15px; font-size: 12px; color: #000; white-space: pre-wrap; line-height: 1.4; font-weight: 800; border-top: 1.5px dashed #000; padding-top: 10px; width: 100%; }
                      .date-row { display: flex; justify-content: space-between; font-size: 11px; color: #000; margin-top: 10px; margin-bottom: 8px; font-family: 'Inter', monospace; font-weight: 800; text-transform: uppercase; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; width: 100%; direction: ltr; }
                      .powered-by { text-align: center; margin-top: 15px; font-size: 9px; color: #000; font-weight: 800; letter-spacing: 2px; font-family: 'Inter', sans-serif; width: 100%; direction: ltr; }
                      @page { size: 80mm auto; margin: 0; }
                      @media print {
                         html, body { width: 72mm; margin: 0 auto; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                         .receipt-container { width: 72mm; max-width: 72mm; padding: 0mm 4mm 5mm 4mm; margin: 0 auto; }
                      }
                   </style>
                 </head>
                 <body>
                   ${receiptRef.current.innerHTML}
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
        }
      }

      // Kick realistic cash register bell and on-screen drawer animation on checkout!
      kickCashDrawer();

      clearCart();
      setIsCartOpen(false);
      setShowCheckoutModal(false);
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.CREATE, "orders");
    } finally {
      setCheckingOut(false);
    }
  };

  const filteredProducts =
    activeCategory === "هەمووی"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US") + " د.ع";
  };

  return (
    <div className="flex bg-[#F9F7F2] overflow-hidden h-full gap-4 lg:gap-8 relative min-w-0 pb-6 lg:pb-0">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-[32px] lg:rounded-[40px] border border-[#E9E5D9] shadow-sm overflow-hidden min-w-0">
        <div className="p-4 lg:p-6 border-b border-[#F9F7F2] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h4 className="font-bold text-[#1E2420] text-lg lg:text-xl flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#D4A373]" />
            بڕگەکان
          </h4>
          <div className="flex gap-2 min-w-0 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 lg:px-5 py-2 lg:py-2.5 rounded-full font-bold transition-all text-xs lg:text-sm whitespace-nowrap ${
                  activeCategory === category
                    ? "bg-[#1E2420] text-[#E9E5D9] shadow-md"
                    : "bg-[#F9F7F2] text-[#8B8378] hover:bg-[#E9E5D9] hover:text-[#2D3631]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 lg:p-5 overflow-y-auto flex-grow h-0 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8B8378] gap-4">
              <div className="w-8 h-8 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
              <span className="font-medium text-sm">بارکردنی بابەتەکان...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 select-none">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.status === "تەواو بووە"}
                  className={`bg-white p-3 lg:p-5 rounded-2xl lg:rounded-[22px] border-2 border-[#E9E5D9] hover:border-[#D4A373] active:scale-[0.97] hover:shadow-[0_8px_24px_rgba(212,163,115,0.08)] transition-all text-right flex flex-col items-center group relative overflow-hidden min-h-[140px] justify-between gap-2.5 cursor-pointer ${product.status === "تەواو بووە" ? "opacity-45 cursor-not-allowed border-dashed" : ""}`}
                >
                  <div className="w-14 h-14 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#1E2420] group-hover:bg-[#1E2420] group-hover:text-[#D4A373] transition-colors shrink-0 duration-300 overflow-hidden shadow-inner border border-[#E9E5D9]/40 relative">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" referrerPolicy="no-referrer" />
                    ) : (
                      <Coffee
                        size={22}
                        className="group-hover:rotate-6 transition-transform text-[#A37B4D]"
                      />
                    )}
                  </div>
                  <div className="text-center w-full flex-1 flex flex-col justify-center">
                    <h3 className="font-extrabold text-[#1E2420] text-xs lg:text-[13px] leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                  <div className="text-center w-full mt-auto">
                    <span className="inline-block bg-[#F9F7F2] group-hover:bg-[#1E2420]/10 px-2.5 py-1 rounded-lg text-[#1E2420] font-black text-xs font-mono group-hover:text-[#D4A373] transition-colors">
                      {product.price.toLocaleString("en-US")}{" "}
                      <span className="font-sans text-[10px] font-normal">
                        د.ع
                      </span>
                    </span>
                  </div>
                  {product.status === "تەواو بووە" && (
                    <div className="absolute inset-0 bg-[#F9F7F2]/80 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="bg-[#E11D48] text-white px-2.5 py-1 rounded-lg font-bold text-[10px]">
                        تەواو بووە
                      </span>
                    </div>
                  )}
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center font-bold text-[#8B8378] bg-[#F9F7F2] rounded-3xl mt-2 text-xs">
                  هیچ بابەتێک نەدۆزرایەوە بۆ فرۆشتن. تکایە لە بەشی مێنۆ بەروبووم
                  زیاد بکە.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Keyboard Shortcut Info Bar */}
        <div className="p-3 bg-[#FDFBF7] border-t border-[#E9E5D9] flex flex-wrap gap-x-4 gap-y-2 items-center justify-center shrink-0">
          <span className="text-[10px] text-[#8B8378] font-bold flex items-center gap-1">
            <kbd className="bg-[#1E2420]/5 px-2 py-0.5 rounded font-mono text-[#1E2420] border border-[#1E2420]/10 text-[10px] shadow-sm">
              F1
            </kbd>{" "}
            حیسابکردن
          </span>
          <span className="text-[10px] text-[#8B8378] font-bold flex items-center gap-1">
            <kbd className="bg-[#1E2420]/5 px-2 py-0.5 rounded font-mono text-[#1E2420] border border-[#1E2420]/10 text-[10px] shadow-sm">
              F2
            </kbd>{" "}
            بابەتی دەستی (کاتی)
          </span>
          <span className="text-[10px] text-[#8B8378] font-bold flex items-center gap-1">
            <kbd className="bg-[#1E2420]/5 px-2 py-0.5 rounded font-mono text-[#1E2420] border border-[#1E2420]/10 text-[10px] shadow-sm">
              F3
            </kbd>{" "}
            تاقیکردنەوەی درۆوەر
          </span>
          <span className="text-[10px] text-[#8B8378] font-bold flex items-center gap-1">
            <kbd className="bg-[#1E2420]/5 px-2 py-0.5 rounded font-mono text-[#1E2420] border border-[#1E2420]/10 text-[10px] shadow-sm">
              Enter
            </kbd>{" "}
            تەواوکردنی حیساب
          </span>
          <span className="text-[10px] text-[#8B8378] font-bold flex items-center gap-1">
            <kbd className="bg-[#1E2420]/5 px-2 py-0.5 rounded font-mono text-[#1E2420] border border-[#1E2420]/10 text-[10px] shadow-sm">
              ESC
            </kbd>{" "}
            داخستن
          </span>
        </div>
      </div>

      {/* Mobile Cart Toggle Button */}
      <button
        className="lg:hidden fixed bottom-6 left-6 z-40 bg-[#1E2420] text-[#E9E5D9] p-4 rounded-full shadow-2xl flex items-center justify-center w-14 h-14 border border-[#2D3631]"
        onClick={() => setIsCartOpen(true)}
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <div className="absolute -top-2 -right-3 bg-[#E11D48] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          )}
        </div>
      </button>

      {/* Cart Sidebar Overlay (Mobile) */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Cart Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 lg:static w-[280px] lg:w-[320px] bg-white border-l lg:border border-[#E9E5D9] lg:rounded-[32px] flex flex-col shadow-2xl lg:shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden shrink-0 z-50 transform transition-transform duration-300 lg:transform-none ${isCartOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-3 border-b border-[#E9E5D9] flex items-center justify-between shrink-0 bg-[#FDFBF7]">
          <h2 className="font-bold text-[#1E2420] text-sm flex items-center gap-2">
            داواکارییەکان
            <span className="bg-[#1E2420] text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </h2>
          <div className="flex items-center gap-1">
            <Link
              to="/customer"
              target="_blank"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-[#8B8378] hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#E9E5D9] hover:text-[#1E2420]"
              title="کردنەوەی شاشەی کڕیار"
            >
              <MonitorSmartphone size={16} />
            </Link>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-[#E11D48] hover:text-white flex items-center gap-1 font-bold px-2 py-1 rounded-full hover:bg-[#E11D48] transition-colors"
                title="سڕینەوەی سەلەی کاڵاکان"
              >
                <Trash2 size={14} />
                <span className="hidden lg:inline text-[11px]">پاککردنەوە</span>
              </button>
            )}
            <button
              className="lg:hidden p-1 text-[#8B8378] hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#E9E5D9]"
              onClick={() => setIsCartOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8B8378] space-y-2 opacity-70">
              <div className="w-14 h-14 bg-[#F9F7F2] rounded-full flex items-center justify-center">
                <ShoppingCart size={24} className="text-[#D4A373]" />
              </div>
              <p className="font-medium text-xs">سەبەتەی کاڵاکان بەتاڵە</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 p-2.5 bg-white rounded-[16px] border border-[#E9E5D9] hover:border-[#D4A373] transition-colors shadow-sm group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#1E2420] text-[#D4A373] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <h4 className="font-bold text-[#1E2420] text-xs leading-snug pt-0.5 max-w-[140px]">
                      {item.name}
                    </h4>
                  </div>
                  <span className="font-bold text-[#1E2420] text-xs font-mono bg-[#F9F7F2] px-1.5 py-0.5 rounded mr-1">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
                <div className="flex justify-between items-center pl-7">
                  <span className="text-[#8B8378] text-[10px] font-mono">
                    {formatPrice(item.price)} دانەیەک
                  </span>
                  <div className="flex items-center gap-1 bg-[#F9F7F2] rounded-full p-0.5 border border-[#E9E5D9]">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-full text-[#1E2420] transition-colors shadow-sm"
                    >
                      <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="w-4 text-center font-bold text-[#1E2420] text-[11px]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-full text-[#1E2420] transition-colors shadow-sm"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="p-3 bg-[#FDFBF7] border-t border-[#E9E5D9] grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCustomItemModal(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border border-[#E9E5D9] hover:border-[#D4A373] hover:bg-[#F9F7F2] text-[#1E2420] font-bold text-[11px] transition-colors cursor-pointer"
            title="کاڵای دەرەکی مۆد مینی"
          >
            <Plus size={14} className="text-[#D4A373]" />
            کاڵای دەستی [F2]
          </button>
          <button
            type="button"
            onClick={kickCashDrawer}
            className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border border-[#E9E5D9] hover:border-[#1E2420] hover:bg-[#1E2420]/5 text-[#1E2420] font-bold text-[11px] transition-colors cursor-pointer"
            title="درۆوەری کاش"
          >
            <Banknote size={14} className="text-[#D4A373]" />
            کاش درۆوەر [F3]
          </button>
        </div>

        <div className="p-4 bg-[#1E2420] text-white shrink-0 relative overflow-hidden flex flex-col justify-end lg:rounded-b-[32px] lg:m-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>

          <div className="relative z-10 flex justify-between items-end mb-3">
            <span className="text-white/70 font-medium text-xs">کۆی گشتی:</span>
            <div className="text-right flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-[#D4A373] tracking-tight">
                {getCartTotal().toLocaleString("en-US")}
              </span>
              <span className="text-[10px] text-white/70">د.ع</span>
            </div>
          </div>
          <button
            disabled={cart.length === 0 || checkingOut}
            onClick={openCheckoutModal}
            className="w-full relative z-10 bg-[#D4A373] hover:brightness-110 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed text-[#1E2420] font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#D4A373]/20 disabled:shadow-none flex justify-center items-center gap-2 text-sm border border-transparent disabled:border-white/10"
          >
            {checkingOut ? "چاوەڕێبە..." : "پارەدان و پسوڵە"}
          </button>
        </div>
      </div>

      {/* Hidden Beautiful Receipt Template */}
      <div className="hidden">
        <div ref={receiptRef} className="receipt-container" style={{ padding: "0px 15px 15px 15px", width: "72mm", maxWidth: "72mm", direction: "rtl", fontFamily: "'Cairo', sans-serif" }}>
          <div className="center" style={{ textAlign: "center" }}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} className="logo-img" alt="Logo" style={{ maxWidth: "65px", maxHeight: "65px", margin: "0 auto 8px", borderRadius: "8px", objectFit: "contain" }} />
            ) : (
              <div style={{ fontSize: "24px", fontWeight: "900", color: "#000", letterSpacing: "1px", marginBottom: "4px" }}>☕</div>
            )}
            <div
              className="header"
              style={{ fontSize: "19px", fontWeight: "800", color: "#000", marginBottom: "4px", fontFamily: "'Cairo', sans-serif" }}
            >
              {settings.storeName || "MAS MENU"}
            </div>
            {currentInvoiceNo && (
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  fontWeight: "800",
                  border: "1.5px solid #000",
                  padding: "2px 10px",
                  display: "inline-block",
                  borderRadius: "6px",
                  fontFamily: "'Cairo', sans-serif",
                  backgroundColor: "#000",
                  color: "#fff"
                }}
              >
                ژمارەی پسوڵە: #{currentInvoiceNo}
              </div>
            )}
            {settings.address && <div className="sub" style={{ fontSize: "11px", marginTop: "6px", color: "#333", fontWeight: "600" }}>📍 {settings.address}</div>}
            {settings.phone && <div className="sub" style={{ fontSize: "11px", color: "#333", fontWeight: "700", direction: "ltr" }}>📞 {settings.phone}</div>}
          </div>

          <div className="date-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#000", marginTop: "12px", marginBottom: "10px", borderTop: "1.5px dashed #000", borderBottom: "1.5px dashed #000", padding: "5px 0", direction: "ltr", fontWeight: "700" }}>
            <span>{new Date().toLocaleDateString("en-GB")}</span>
            <span style={{ fontWeight: "800" }}>{currentBranch === "cafe" ? "لقی کافتریـا" : "لقی نەخۆشخانە"}</span>
            <span>
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <table className="receipt-table" style={{ width: "100%", borderCollapse: "collapse", margin: "10px 0" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #000" }}>
                <th className="col-name" style={{ textAlign: "right", fontSize: "11px", fontWeight: "800", padding: "5px 0" }}>کاڵا / نـاو</th>
                <th className="col-qty" style={{ textAlign: "center", fontSize: "11px", fontWeight: "800", padding: "5px 0", width: "40px" }}>بڕ</th>
                <th className="col-price" style={{ textAlign: "left", fontSize: "11px", fontWeight: "800", padding: "5px 0", width: "80px" }}>کۆی گشتی</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px dotted #ccc" }}>
                  <td className="col-name" style={{ fontSize: "12px", fontWeight: "700", padding: "6px 0", color: "#000" }}>{item.name}</td>
                  <td className="col-qty" style={{ fontSize: "12px", fontWeight: "800", padding: "6px 0", textAlign: "center", color: "#000" }}>{item.quantity}</td>
                  <td className="col-price" style={{ fontSize: "12px", fontWeight: "800", padding: "6px 0", textAlign: "left", fontFamily: "'Space Grotesk', monospace", direction: "ltr", color: "#000" }}>
                    {(item.price * item.quantity).toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {Number(discountAmount) > 0 && (
            <div
              className="item-row"
              style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", marginTop: "6px", color: "#444" }}
            >
              <div className="item-name-group">داشکان (Discount):</div>
              <div className="item-price" style={{ fontFamily: "'Space Grotesk', monospace", fontWeight: "800", color: "#d97706" }}>
                - {Number(discountAmount).toLocaleString("en-US")} IQD
              </div>
            </div>
          )}

          <div className="solid-line" style={{ borderBottom: "1.5px solid #000", margin: "8px 0" }}></div>

          <div className="total-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <div className="total-label" style={{ fontSize: "14px", fontWeight: "900", color: "#000" }}>کۆتایی دەفتەر:</div>
            <div className="total-amount" style={{ fontFamily: "'Space Grotesk', monospace", fontSize: "18px", fontWeight: "900", color: "#000", direction: "ltr" }}>
              {getFinalTotal().toLocaleString("en-US")}{" "}
              <span style={{ fontSize: "11px", fontWeight: "800" }}>IQD</span>
            </div>
          </div>

          {Number(receivedAmount) > 0 && (
            <>
              <div className="dotted-line" style={{ borderBottom: "1.5px dashed #000", margin: "8px 0" }}></div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  marginTop: "6px",
                  fontWeight: "700"
                }}
              >
                <div style={{ color: "#333" }}>کاش وەرگیراو:</div>
                <div style={{ fontFamily: "monospace", fontWeight: "800" }}>
                  {Number(receivedAmount).toLocaleString("en-US")} IQD
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  marginTop: "4px",
                  fontWeight: "700"
                }}
              >
                <div style={{ color: "#333" }}>گێڕانەوە (باقی):</div>
                <div style={{ fontFamily: "monospace", fontWeight: "800" }}>
                  {Math.max(
                    0,
                    Number(receivedAmount) - getFinalTotal(),
                  ).toLocaleString("en-US")}{" "}
                  IQD
                </div>
              </div>
            </>
          )}

          <div className="footer" style={{ textAlign: "center", marginTop: "16px", fontSize: "11px", color: "#000", fontWeight: "800", whiteSpace: "pre-wrap", lineHeight: "1.4", borderTop: "2.5px double #000", paddingTop: "12px" }}>
            {settings.footerMessage || "سەرکەوتووبن، سوپاس بۆ کڕینەکەتان!"}
          </div>
          <div className="powered-by" style={{ textAlign: "center", marginTop: "12px", fontSize: "8.5px", color: "#555", fontWeight: "850", letterSpacing: "2px", fontFamily: "'Inter', sans-serif", width: "100%", direction: "ltr" }}>
            POWERED BY MAS MENU
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-[#0c1012]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white rounded-[32px] w-full max-w-[520px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col border border-neutral-100 text-right dir-rtl"
              dir="rtl"
            >
              {/* Luxury Header */}
              <div className="px-6 py-5 bg-gradient-to-b from-[#FFFDF9] to-white border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] rounded-2xl shadow-md ring-4 ring-neutral-50">
                    <Banknote size={22} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#1E2420] tracking-tight">
                      پەڕەی پارەدان
                    </h2>
                    <p className="text-xs text-neutral-400 font-bold mt-0.5">
                      تەواوکردنی فرۆشتن بە خێرایی
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                >
                  <X size={20} className="stroke-[2.5]" />
                </button>
              </div>

              {/* Professional Main Grid Container */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)] bg-[#FCFAF6]/30">
                
                {/* Upper Status Row: Two Distinct Visual Pillars */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1E2420] p-4 rounded-2xl flex flex-col justify-between shadow-md relative overflow-hidden ring-1 ring-white/10">
                    <div className="absolute -top-5 -left-5 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
                    <span className="text-white/50 font-bold text-xs mb-1block">کۆبەند و کۆی گشتی</span>
                    <span className="text-xl font-black text-white font-mono tracking-tight flex items-baseline gap-1 mt-1">
                      {getCartTotal().toLocaleString("en-US")}{" "}
                      <span className="font-sans text-[10px] text-[#D4A373] font-bold">د.ع</span>
                    </span>
                  </div>

                  <div className="bg-white border border-[#E9E5D9] p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <span className="text-[#8B8378] font-bold text-xs mb-1 block">کۆی داشکانی دیاریکراو</span>
                    <span className="text-xl font-black text-amber-700 font-mono tracking-tight flex items-baseline gap-1 mt-1">
                      {Number(discountAmount || 0).toLocaleString("en-US")}{" "}
                      <span className="font-sans text-[10px] text-neutral-400 font-bold">د.ع</span>
                    </span>
                  </div>
                </div>

                {/* Vertical Stack: Mini Ticket Review & Input Panels */}
                <div className="space-y-4 items-start">
                  
                  {/* Pricing and Inputs Inputs Panel */}
                  <div className="space-y-3.5">
                    
                    {/* Discount Box */}
                    <div className="bg-white rounded-2xl p-4 border border-[#E9E5D9] shadow-sm flex flex-col justify-between">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-black text-neutral-800 mb-2">
                          <Tag size={13} className="text-[#D4A373]" />
                          داشکاندن (بە بەهای نووسراو)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                            placeholder="نموونە: 2000"
                            className="w-full bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#D4A373] focus:ring-4 focus:ring-[#D4A373]/5 rounded-xl pl-4 pr-10 py-2.5 outline-none text-neutral-900 text-left dir-ltr transition-all font-mono font-black text-sm placeholder:text-right placeholder:text-xs placeholder:font-sans"
                          />
                          <Percent size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Premium Fast discount buttons with dynamic touch */}
                      <div className="flex gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-1">
                        {[1000, 2000, 5000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setDiscountAmount(amt.toString())}
                            className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all border shrink-0 ${
                              discountAmount === amt.toString()
                                ? "bg-[#1E2420] text-[#D4A373] border-[#1E2420]"
                                : "bg-white text-neutral-600 border-neutral-200 hover:border-[#D4A373] hover:bg-amber-50/10"
                            }`}
                          >
                            {amt.toLocaleString("en-US")} د.ع
                          </button>
                        ))}
                        {discountAmount !== "" && (
                          <button
                            type="button"
                            onClick={() => setDiscountAmount("")}
                            className="px-2.5 py-1.5 text-[11px] font-extrabold bg-rose-50 text-rose-500 rounded-lg shrink-0 hover:bg-rose-100 transition-colors"
                          >
                            پاککردنەوە
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cash Received Box */}
                    <div className="bg-white rounded-2xl p-4 border border-[#E9E5D9] shadow-sm flex flex-col justify-between">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-black text-neutral-800 mb-2">
                          <Coins size={13} className="text-[#D4A373]" />
                          پارەی پێدراوی کڕیار (کاش)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={receivedAmount}
                            onChange={(e) => setReceivedAmount(e.target.value)}
                            placeholder="بڕی پارەی پێدراو..."
                            className="w-full bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#D4A373] focus:ring-4 focus:ring-[#D4A373]/5 rounded-xl pl-4 pr-10 py-2.5 outline-none text-neutral-900 text-left dir-ltr transition-all font-mono font-black text-sm placeholder:text-right placeholder:text-xs placeholder:font-sans"
                          />
                          <Banknote size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Genuine Iraqi Dinars Banknotes Quick Select */}
                      <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                        <button
                          type="button"
                          onClick={() => setReceivedAmount(getFinalTotal().toString())}
                          className="col-span-2 py-2 px-2 text-[11px] font-bold bg-[#1E2420] hover:bg-[#2C342F] text-[#D4A373] rounded-lg shadow-sm hover:translate-y-[-1px] active:translate-y-[1px] transition-all text-center flex items-center justify-center gap-1"
                        >
                          <Check size={12} className="stroke-[3]" />
                          بێ باقی (ڕێک)
                        </button>
                        {[10000, 25000].map((note) => (
                          <button
                            key={note}
                            type="button"
                            onClick={() => setReceivedAmount(note.toString())}
                            className={`py-2 px-1 text-[11px] font-black border transition-all rounded-lg ${
                              receivedAmount === note.toString()
                                ? "bg-[#D4A373] text-[#1E2420] border-[#D4A373] shadow-inner"
                                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                            }`}
                          >
                            {note >= 1000 ? `${note / 1000}K` : note}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Print Options Block: Only Method Selector now */}
                <div className="bg-[#FAF8F4] px-4 py-3 rounded-2xl border border-[#E9E5D9]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 font-bold flex items-center gap-1.5">
                      <Printer size={12} />
                      تەکنیکی چاپکردن:
                    </span>
                    <div className="flex bg-white p-0.5 rounded-lg border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setPrintMethod("iframe")}
                        className={`py-1 px-2 rounded-md text-[10px] font-black transition-all ${
                          printMethod === "iframe"
                            ? "bg-[#1E2420] text-[#D4A373] shadow-sm"
                            : "text-neutral-500 hover:text-neutral-900"
                        }`}
                      >
                        ناوەکی
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintMethod("direct")}
                        className={`py-1 px-2 rounded-md text-[10px] font-black transition-all ${
                          printMethod === "direct"
                            ? "bg-[#1E2420] text-[#D4A373] shadow-sm"
                            : "text-neutral-500 hover:text-neutral-900"
                        }`}
                      >
                        سیستەم
                      </button>
                    </div>
                  </div>
                </div>

                {/* Elegant and Symmetrical Financial Change Center */}
                <div className="border-t border-dashed border-neutral-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center bg-[#FDFBF7] p-4 rounded-2xl border border-neutral-150 shadow-inner">
                    <div className="text-right">
                      <span className="text-xs text-neutral-500 font-black block">کۆتایی حیساب</span>
                    </div>
                    <span className="text-2xl font-black text-[#1E2420] font-mono tracking-tight flex items-baseline gap-1">
                      {getFinalTotal().toLocaleString("en-US")}{" "}
                      <span className="font-sans text-xs text-[#8B8378] font-bold">د.ع</span>
                    </span>
                  </div>

                  {/* Cash Change Panel with Interactive Colors */}
                  <AnimatePresence>
                    {Number(receivedAmount) > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        {Number(receivedAmount) >= getFinalTotal() ? (
                          <div className="flex justify-between items-center bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 flex-row">
                            <div className="text-right">
                              <span className="text-[#10B981] font-black text-xs block">باقی و گێڕانەوە</span>
                            </div>
                            <span className="text-xl font-black text-[#10B981] font-mono tracking-tight flex items-baseline gap-1">
                              {(Number(receivedAmount) - getFinalTotal()).toLocaleString("en-US")}{" "}
                              <span className="font-sans text-[10px] font-bold">د.ع</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 flex-row">
                            <div className="text-right">
                              <span className="text-rose-500 font-black text-xs block">پارەی ماوە و ناتەواو</span>
                            </div>
                            <span className="text-xl font-black text-rose-500 font-mono tracking-tight flex items-baseline gap-1">
                              {(getFinalTotal() - Number(receivedAmount)).toLocaleString("en-US")}{" "}
                              <span className="font-sans text-[10px] font-bold">د.ع</span>
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Buttons Footer: Separated Print Actions */}
              <div className="px-5 py-4 bg-[#FCFAF6] border-t border-neutral-100 flex flex-col gap-2.5">
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleCheckout(false)}
                    disabled={checkingOut || (Number(receivedAmount) > 0 && Number(receivedAmount) < getFinalTotal())}
                    className="flex-1 bg-white border border-[#E9E5D9] hover:border-neutral-300 disabled:opacity-50 text-[#1E2420] font-black py-3 rounded-xl transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2 text-xs"
                  >
                    {checkingOut ? (
                      <div className="w-3.5 h-3.5 border-2 border-[#1E2420] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span>تەنها تۆمارکردن</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCheckout(true)}
                    disabled={checkingOut || (Number(receivedAmount) > 0 && Number(receivedAmount) < getFinalTotal())}
                    className="flex-1 bg-gradient-to-r from-[#1E2420] to-[#2D3631] hover:brightness-110 disabled:opacity-50 text-[#D4A373] disabled:text-[#D4A373]/50 font-black py-3 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 text-xs"
                  >
                    {checkingOut ? (
                      <div className="w-3.5 h-3.5 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Printer size={14} className="stroke-[2.5]" />
                        <span>چاپکردن و تۆمارکردن</span>
                      </>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold py-2.5 rounded-xl transition-all text-xs"
                >
                  پاشگەزبوونەوە
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Item Modal dialog */}
      {showCustomItemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-[#E9E5D9] animate-in fade-in zoom-in duration-200 text-right dir-rtl"
            dir="rtl"
          >
            <div className="p-6 bg-[#FDFBF7] border-b border-[#E9E5D9] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1E2420] flex items-center gap-2">
                <Plus size={24} className="text-[#D4A373]" />
                زیادکردنی بابەت بە دەستی
              </h2>
              <button
                onClick={() => setShowCustomItemModal(false)}
                className="p-2 text-[#8B8378] hover:bg-[#F9F7F2] rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#1E2420] mb-2 text-right">
                  ناوی بابەت (کوردی یان ئینگلیزی)
                </label>
                <input
                  type="text"
                  required
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="بۆ نموونە: کێکی شوکولاتەی تایبەت"
                  className="w-full bg-[#F9F7F2] border border-[#E9E5D9] rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#D4A373] outline-none text-[#1E2420] text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#1E2420] mb-2 text-right">
                    نرخ (بە دینار)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    min="0"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    placeholder="3000"
                    className="w-full bg-[#F9F7F2] border border-[#E9E5D9] rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#D4A373] outline-none text-[#1E2420] font-mono text-left"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1E2420] mb-2 text-right">
                    کۆمەڵە (پۆلێن)
                  </label>
                  <select
                    value={customItemCategory}
                    onChange={(e) => setCustomItemCategory(e.target.value)}
                    className="w-full bg-[#F9F7F2] border border-[#E9E5D9] rounded-xl px-3 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#D4A373] outline-none text-[#1E2420] text-right"
                  >
                    <option value="گشتی">گشتی</option>
                    <option value="گەرم">گەرم</option>
                    <option value="سارد">سارد</option>
                    <option value="خۆراک">خۆراک</option>
                    <option value="شیرینی">شیرینی</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E9E5D9] flex items-start gap-2.5 mt-2 text-right">
                <span className="text-[11px] text-[#8B8378] leading-relaxed">
                  ● کاڵاکان بە شێوازێکی کاتی تەنها بۆ ئەم پرۆسەیە لە نێو
                  سەبەتەکەدا دروست دەبن و پێویستیان بە تۆمارکردنی هەمیشەیی لە
                  مێنۆدا نابێت.
                </span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="flex-1 bg-white border border-[#E9E5D9] text-[#1E2420] font-bold py-3.5 rounded-xl text-xs"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-[#1E2420] text-[#D4A373] hover:brightness-110 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1"
                >
                  <Plus size={14} />
                  زیادکردن بۆ سەبەتە
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animated Cash Drawer Simulation */}
      {showDrawerAnimation && (
        <div className="fixed inset-0 bg-[#1E2420]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full border border-[#D4A373]/30 shadow-[0_20px_50px_rgba(212,163,115,0.25)] text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
            <div className="relative w-32 h-24 bg-[#E9E5D9] rounded-xl border-4 border-[#1E2420] shadow-inner overflow-hidden flex flex-col justify-end">
              {/* Cash Drawer slide body */}
              <div className="absolute top-2 left-2 right-2 bottom-1 bg-[#1E2420] rounded-lg border border-[#D4A373] flex flex-col justify-between p-2 shadow-md animate-pulse">
                <div className="flex justify-around gap-1">
                  <div className="h-5 w-4 bg-emerald-500 rounded-sm shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                    $
                  </div>
                  <div className="h-5 w-4 bg-emerald-500 rounded-sm shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                    $
                  </div>
                  <div className="h-5 w-4 bg-emerald-500 rounded-sm shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                    $
                  </div>
                </div>
                <div className="h-2 w-full bg-[#D4A373] rounded-full self-center"></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#1E2420]">
                مەکینەی درۆوەر کرایەوە
              </h3>
              <p className="text-xs text-[#8B8378] leading-relaxed">
                سیستەمی مەکینەی پارەدان بە سەرکەوتوویی کرایەوە و زەنگی
                ئاگادارکردنەوە لێدرا!
              </p>
            </div>
            <div className="bg-[#4ADE80]/15 border border-[#4ADE80]/30 text-[#15803d] font-bold text-[10px] py-1.5 px-3 rounded-full">
              ● LIVE CASH DRAWER SIGNAL RECEIVED (RJ11 Pulse Triggered)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
