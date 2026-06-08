// MasTech Auto Subscription Protection (Support: +9647508134034)
import React, { useEffect, useState } from "react";

export default function SubscriptionLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    async function checkSubscription() {
      // پشکنین لەسەر هەردوو ناونیشانەکە بۆ دڵنیابوونەوەی زیاتر لە بەردەستبوونی خزمەتگوزاری دارایی و ڕاگوێستن
      const endpoints = [
        "https://masagency.vercel.app/api/subscription/check/qomRBGigeDnYSdUHhg5t",
        "https://ais-dev-ipdceuoehcen5e6coz7yvc-518362444188.europe-west2.run.app/api/subscription/check/qomRBGigeDnYSdUHhg5t"
      ];

      for (const url of endpoints) {
        try {
          console.log(`[MasTech] Checking subscription at: ${url}`);
          const res = await fetch(url, {
            headers: {
              "Accept": "application/json"
            }
          });
          
          if (res.ok) {
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("text/html")) {
              console.warn(`[MasTech] Warning: Endpoint ${url} returned HTML instead of JSON. Skipping.`);
              continue;
            }

            const status = await res.json();
            console.log("[MasTech] Subscription response received:", status);
            
            // هەڵگرتنی ئەنجام بۆ نیشاندانی دیباگەر لە کۆنسۆڵدا
            (window as any).mastechStatus = status;

            // پشکنینی مەرجی قوفڵکردن بە توندی و بە شێوەیەکی گونجاو لە هەموو بارودۆخێکدا
            const isLockedResponse = 
              (status.has_expiry && !status.active) || 
              (status.active === false) || 
              (status.active === "false") ||
              (status.status === "expired") ||
              (status.expired === true) ||
              (status.expired === "true");

            if (isLockedResponse) {
              setIsLocked(true);
              setServiceName(status.service_name || "ئەم بەرهەمە");
              setExpiryDate(status.expiry_date || "");
              console.log("[MasTech] System locked! Subscription is inactive/expired.");
              break; // ئەگەر قفڵ بوو، پشکنینەکە ڕادەگرین
            } else {
              console.log("[MasTech] Subscription is active and system is unlocked.");
              setIsLocked(false);
              break; // ئەگەر چالاک بوو، سیستەمەکە ڕاناگرین
            }
          } else {
            console.warn(`[MasTech] Endpoint ${url} returned status code: ${res.status}`);
          }
        } catch (e) {
          console.warn(`[MasTech] Subscription endpoint connection or parsing failed for ${url}:`, e);
        }
      }
    }

    // پشکنینی سەرەتا
    checkSubscription();

    // پشکنینی خولی یەک لە دوای یەک هەر ٣٠ چرکە جارێک بۆ نوێبوونەوەی ئۆتۆماتیکی بێ ڕیفرێش
    const intervalId = setInterval(checkSubscription, 30000);

    // پشکنینی دەستبەجێ کاتێک بەکارهێنەر شاشەکە یان تابەکەی دەکاتەوە
    const handleFocus = () => {
      console.log("[MasTech] Window focused - triggering background auto-subscription check...");
      checkSubscription();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkSubscription();
      }
    });

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  if (!isLocked) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "#0f172a",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif",
      zIndex: 9999999,
      padding: "20px",
      textAlign: "center",
      direction: "rtl"
    }}>
      <div style={{
        background: "#1e293b",
        padding: "40px",
        borderRadius: "24px",
        border: "1px solid #ef4444",
        maxWidth: "500px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
      }}>
        <div style={{ fontSize: "70px", marginBottom: "20px" }}>⚠️</div>
        <h2 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "10px", color: "#f87171" }}>ئەم سیستەمە ڕاگیراوە!</h2>
        <p style={{ fontSize: "16px", color: "#94a3b8", lineHeight: "1.6", marginBottom: "30px" }}>
          سەبسکرایپشنی خزمەتگوزاری <strong>{serviceName}</strong> لە بەرواری {expiryDate} بەسەرچووە. تکایە پەیوەندی بکە بە کۆمپانیای MasTech بۆ فعالکردنی خێرا.
        </p>
        <a 
          href="https://wa.me/9647508134034"
          style={{
            display: "inline-block",
            background: "#10b981",
            color: "white",
            padding: "12px 30px",
            borderRadius: "12px",
            fontWeight: "bold",
            textDecoration: "none",
            boxShadow: "0 4px 6px -1px rgba(16,185,129,0.3)"
          }}
        >
          پەیوەندی کردن بە MasTech 💬
        </a>
      </div>
    </div>
  );
}
