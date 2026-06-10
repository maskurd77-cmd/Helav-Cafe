import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  MenuSquare, 
  Wallet, 
  Receipt, 
  BarChart3, 
  Users, 
  Settings,
  Coffee,
  LogOut,
  Menu,
  X,
  MonitorSmartphone,
  ChevronRight,
  ChevronLeft,
  Building2,
  ClipboardList,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  Lock,
  Monitor,
  Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useProductStore } from '@/store/useProductStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useBranchStore } from '@/store/useBranchStore';
import { VirtualKeyboard } from './VirtualKeyboard';
import { LockScreen } from './LockScreen';

const allNavItems = [
  { text: 'داشبۆرد', icon: LayoutDashboard, path: '/', permission: 'dashboard' },
  { text: 'فرۆشتن (POS)', icon: ShoppingCart, path: '/pos', permission: 'pos' },
  { text: 'مێنۆ', icon: MenuSquare, path: '/menu', permission: 'menu' },
  { text: 'شاشەی کڕیار', icon: MonitorSmartphone, path: '/customer', permission: 'customer' },
  { text: 'خەرجییەکان', icon: Wallet, path: '/expenses', permission: 'expenses' },
  { text: 'پسوڵەکان', icon: Receipt, path: '/receipts', permission: 'receipts' },
  { text: 'ڕاپۆرتەکان', icon: BarChart3, path: '/reports', permission: 'reports' },
  { text: 'بەکارهێنەران', icon: Users, path: '/users', permission: 'users' },
  { text: 'ڕێکخستنەکان', icon: Settings, path: '/settings', permission: 'settings' },
];

export function Layout() {
  const { user, role, permissions } = useAuth();
  const { settings } = useSettingsStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings?.appTheme || 'light');
  }, [settings?.appTheme]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [scale, setScale] = useState<number>(() => {
    const saved = localStorage.getItem('system_display_scale');
    return saved ? parseInt(saved, 10) : 100;
  });

  const [isAntiGlare, setIsAntiGlare] = useState(() => {
    return localStorage.getItem('system_anti_glare') === 'true';
  });

  const [showScreenSettings, setShowScreenSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('system_anti_glare', isAntiGlare ? 'true' : 'false');
    
    const styleId = 'anti-glare-styles';
    let styleEl = document.getElementById(styleId);
    
    if (isAntiGlare) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        /* Extreme contrast sunlight reading mode */
        .anti-glare-active, .anti-glare-active * {
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #000000 !important;
          text-shadow: none !important;
          box-shadow: none !important;
          font-weight: 800 !important;
        }
        /* Buttons should stay solid black with white bold text */
        .anti-glare-active button, 
        .anti-glare-active a.active, 
        .anti-glare-active .bg-emerald-600, 
        .anti-glare-active .bg-amber-600, 
        .anti-glare-active .bg-blue-600,
        .anti-glare-active .bg-\\[var\\(--bg-secondary\\)\\],
        .anti-glare-active .bg-black {
          background-color: #000000 !important;
          color: #ffffff !important;
          border: 3px solid #000000 !important;
        }
        /* Keep high contrast icons visible */
        .anti-glare-active svg {
          stroke: #000000 !important;
          stroke-width: 3px !important;
        }
        .anti-glare-active button svg, 
        .anti-glare-active a.active svg {
          stroke: #ffffff !important;
          stroke-width: 3px !important;
        }
        /* Hide light translucent blur overlays which wash out under direct sun */
        .anti-glare-active .backdrop-blur-sm,
        .anti-glare-active .backdrop-blur-md {
          backdrop-filter: none !important;
          background-color: #ffffff !important;
        }
        /* Force extreme visibility input text fields */
        .anti-glare-active input, .anti-glare-active textarea, .anti-glare-active select {
          background-color: #ffffff !important;
          color: #000000 !important;
          border: 3px solid #000000 !important;
        }
      `;
    } else {
      if (styleEl) {
        styleEl.remove();
      }
    }
  }, [isAntiGlare]);

  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem('isAppLocked') === 'true';
  });

  const handleLock = () => {
    setIsLocked(true);
    localStorage.setItem('isAppLocked', 'true');
  };

  const handleUnlock = () => {
    setIsLocked(false);
    localStorage.removeItem('isAppLocked');
  };
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowSyncSuccess(true);
      const timer = setTimeout(() => {
        setShowSyncSuccess(false);
      }, 4500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowSyncSuccess(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const initProducts = useProductStore(state => state.initProducts);
  const { initSettings } = useSettingsStore();
  const { currentBranch, setBranch } = useBranchStore();

  const [activeInputRef, setActiveInputRef] = useState<React.RefObject<HTMLInputElement | HTMLTextAreaElement> | null>(null);

  useEffect(() => {
    initProducts();
    initSettings();
  }, [initProducts, initSettings, currentBranch]);
  
  useEffect(() => {
    if (!settings?.enableVirtualKeyboard) {
      setActiveInputRef(null);
      return;
    }

    const handleFocusIn = (e: FocusEvent) => {
      // Show keyboard only if input is text/search/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.target.type === 'text' || e.target.type === 'search' || e.target.type === 'number' || e.target.tagName === 'TEXTAREA') {
          setActiveInputRef({ current: e.target });
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [settings?.enableVirtualKeyboard]);

  const handleKeyboardChange = (value: string) => {
    if (activeInputRef?.current) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        )?.set;

        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
        )?.set;

        if (activeInputRef.current instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
            nativeTextAreaValueSetter.call(activeInputRef.current, value);
        } else if (nativeInputValueSetter) {
            nativeInputValueSetter.call(activeInputRef.current, value);
        }
        activeInputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  let navItems = allNavItems;
  if (role !== 'admin' && permissions && permissions.length > 0) {
    navItems = allNavItems.filter((item) => permissions.includes(item.permission));
  } else if (role !== 'admin') {
     navItems = allNavItems.filter((item) => ['pos', 'menu', 'customer'].includes(item.permission));
  }

  // Protect routes based on role (if not admin and lacks dashboard permission, redirect to first allowed or /pos)
  if (role !== 'admin' && location.pathname === '/' && (!permissions || !permissions.includes('dashboard'))) {
    const firstAllowed = navItems.length > 0 ? navItems[0].path : '/pos';
    return <Navigate to={firstAllowed} replace />;
  }

  return (
    <div 
      className={cn(
        "flex h-screen overflow-hidden bg-[var(--bg-lighter)] text-[#3D3D3D]",
        isAntiGlare && "anti-glare-active"
      )}
      style={{ zoom: scale / 100 } as any}
    >
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Right Side for RTL */}
      <aside className={cn(
        "fixed lg:static inset-y-0 right-0 lg:h-screen bg-[var(--bg-secondary)] text-[var(--border-color)] flex-shrink-0 flex flex-col shadow-2xl z-50 transform transition-all duration-300 ease-out",
        isMobileMenuOpen ? "translate-x-0 w-72" : "translate-x-full lg:translate-x-0",
        !isMobileMenuOpen && (isDesktopSidebarCollapsed ? "lg:w-20" : "lg:w-64")
      )}>
        <div className={cn("p-6 flex items-center bg-[#181D1A]", isDesktopSidebarCollapsed ? "justify-center lg:p-4" : "justify-between lg:p-8")}>
          <div className={cn("transition-opacity duration-300", isDesktopSidebarCollapsed ? "hidden" : "block")}>
            <h1 className="text-xl font-bold tracking-tight text-[var(--accent-gold)]">
              {settings?.storeName || 'MAS MENU'}
            </h1>
            <p className="text-[10px] opacity-60 uppercase tracking-widest mt-1">سيستەمى بەڕێوەبردن</p>
          </div>
          {isDesktopSidebarCollapsed && (
            <div className="hidden lg:flex w-10 h-10 rounded-xl bg-[var(--text-dark)] items-center justify-center text-[var(--accent-gold)]">
                <Coffee size={24} />
            </div>
          )}
          <button 
            className="lg:hidden text-[var(--border-color)] opacity-70 hover:opacity-100 bg-[var(--text-dark)] p-2 rounded-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <button 
            className="hidden lg:flex absolute top-8 -left-3 bg-[var(--accent-gold)] text-[var(--bg-secondary)] w-6 h-6 rounded-full items-center justify-center hover:bg-white transition-colors shadow-md z-50"
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
        >
            {isDesktopSidebarCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto w-full no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                  isDesktopSidebarCollapsed ? "justify-center px-0" : "px-4",
                  isActive 
                    ? "bg-[var(--accent-gold)] text-[var(--bg-secondary)] shadow-md" 
                    : "hover:bg-[var(--text-dark)] text-[#A3B1A7] hover:text-white",
                  isDesktopSidebarCollapsed && "w-12 h-12 mx-auto"
                )
              }
              title={isDesktopSidebarCollapsed ? item.text : undefined}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={isDesktopSidebarCollapsed ? 22 : 18} className={cn("flex-shrink-0 transition-transform", isActive && "scale-110")} />
                  {!isDesktopSidebarCollapsed && <span>{item.text}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className={cn("p-3 bg-[#181D1A] border-t border-white/5", isDesktopSidebarCollapsed ? "p-2 flex flex-col items-center gap-2" : "flex items-center justify-between gap-2")}>
          {/* Screen & Sunlight Assistance Button */}
          <div className="relative flex items-center justify-center gap-1.5 w-full">
            {/* Symmetrical Tiny Icons Control Row */}
            <div className="flex items-center justify-center gap-1.5 w-full">
              {/* Screen Settings Toggle icon button */}
              <button 
                onClick={() => setShowScreenSettings(!showScreenSettings)}
                title="DPI / 4K"
                className={cn(
                  "flex items-center justify-center rounded-md border transition-all cursor-pointer h-7 w-7",
                  showScreenSettings
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                )}
              >
                <Monitor size={12} />
              </button>

              {/* Kiosk Fullscreen Toggle icon button */}
              <button 
                onClick={toggleFullscreen}
                title="Fullscreen"
                className="flex items-center justify-center rounded-md border bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 transition-all cursor-pointer h-7 w-7"
              >
                {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>

              {/* Logout icon button */}
              <button 
                onClick={handleLogout}
                title="Logout"
                className="flex items-center justify-center rounded-md border bg-rose-950/10 text-rose-400 border-rose-500/10 hover:bg-rose-950/25 transition-all cursor-pointer h-7 w-7"
              >
                <LogOut size={12} />
              </button>
            </div>

            {/* Screen Settings dropdown style sub-panel */}
            {showScreenSettings && (
              <div className={cn(
                "bg-[#131a15] border border-white/10 rounded-lg p-2 absolute bottom-9 right-0 w-44 space-y-2 text-right text-[9px] shadow-2xl text-gray-200 z-50",
                isDesktopSidebarCollapsed && "right-10 bottom-0"
              )}>
                <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1">
                  <span className="font-bold text-white text-[9px]">DPI / 4K</span>
                  <span className="text-[var(--accent-gold)] font-mono font-bold">{scale}%</span>
                </div>
                
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { val: 75, label: '75%' },
                    { val: 85, label: '85%' },
                    { val: 100, label: '100' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => {
                        setScale(opt.val);
                        localStorage.setItem('system_display_scale', opt.val.toString());
                      }}
                      className={cn(
                        "py-0.5 rounded text-[8px] font-black text-center transition-all cursor-pointer",
                        scale === opt.val 
                          ? "bg-[var(--accent-gold)] text-gray-900 font-extrabold shadow-sm" 
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Slider option for even more precise adjusting */}
                <div className="pt-1 border-t border-white/5">
                  <input 
                    type="range"
                    min="50"
                    max="110"
                    value={scale}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setScale(val);
                      localStorage.setItem('system_display_scale', val.toString());
                    }}
                    className="w-full accent-[var(--accent-gold)] bg-white/10 rounded h-0.5 cursor-pointer"
                  />
                </div>

                <div className="pt-1.5 border-t border-white/5 flex items-center justify-between gap-1">
                  <div className="text-right">
                    <span className="block font-bold text-white text-[8px]">☀️ دۆخی دژە-خۆر</span>
                  </div>
                  <button
                    onClick={() => setIsAntiGlare(!isAntiGlare)}
                    className={cn(
                      "relative inline-flex h-3 w-6 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-150 ease-in-out focus:outline-none",
                      isAntiGlare ? "bg-amber-400" : "bg-white/15"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-2 w-2 transform rounded-full bg-white shadow transition duration-150 ease-in-out",
                        isAntiGlare ? "-translate-x-2.5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-4 px-4 pb-4 lg:p-8 gap-4 lg:gap-8 overflow-hidden relative w-full min-w-0 bg-[#FDFBF7]">
        {location.pathname === '/' ? (
          <header className="flex justify-between items-center flex-shrink-0 bg-white p-4 lg:px-8 lg:py-5 rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-30 border border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2.5 bg-[var(--bg-lighter)] hover:bg-[var(--border-color)] rounded-xl text-[var(--text-dark)] transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
              <div className="hidden sm:block">
                  <h2 className="text-lg lg:text-2xl font-bold text-[var(--bg-secondary)]">بەخێربێیت، <span className="text-[var(--accent-gold)]">{user?.email?.split('@')[0]}</span></h2>
                  <p className="text-xs lg:text-sm text-[var(--text-muted)] mt-1">گەڕانەوەت خێر - سیستەمەکە ئامادەیە بۆ کارکردن</p>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:gap-5">
              {role === 'admin' && (
                 <NavLink to="/pos" className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-[var(--bg-secondary)] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                   <ShoppingCart size={16} />
                   <span>فرۆشتنی نوێ</span>
                 </NavLink>
              )}
              <button 
                onClick={handleLock}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[var(--bg-primary)] hover:bg-[var(--accent-gold)]/10 border border-[var(--border-color)] hover:border-[var(--accent-gold)]/30 flex items-center justify-center text-[var(--bg-secondary)] hover:text-[var(--accent-gold)] transition-all shadow-sm group"
                title="داخستنی شاشە (Lock)"
              >
                <Lock size={18} className="group-hover:scale-110 transition-transform" />
              </button>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#FDFBF7] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-gold)] shadow-sm">
                <Coffee size={20} />
              </div>
            </div>
          </header>
        ) : (
          <div className="lg:hidden flex justify-between items-center bg-white p-4 rounded-[20px] shadow-sm border border-[var(--border-color)] shrink-0">
             <button 
                className="p-2.5 bg-[var(--bg-lighter)] hover:bg-[var(--border-color)] rounded-xl text-[var(--text-dark)] transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleLock}
                  className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] flex items-center justify-center text-[var(--bg-secondary)] shadow-sm border border-[var(--border-color)]"
                >
                  <Lock size={18} />
                </button>
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent-gold)] shadow-sm border border-[var(--text-dark)]">
                  <Coffee size={18} />
                </div>
              </div>
          </div>
        )}
        <div className="flex-1 overflow-auto min-h-0 relative z-20">
          <Outlet />
        </div>
      </main>

      {settings?.enableVirtualKeyboard && activeInputRef && (
        <VirtualKeyboard 
            inputRef={activeInputRef} 
            onChange={handleKeyboardChange} 
            onClose={() => setActiveInputRef(null)} 
        />
      )}

      {/* Floating Network Sync Indicator */}
      {!isOnline && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#E11D48] text-white px-5 py-4 rounded-3xl shadow-[0_12px_40px_rgba(225,29,72,0.35)] border border-[#E11D48]/30 flex items-center gap-4 animate-bounce max-w-sm">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
            <WifiOff size={20} className="text-white" />
          </div>
          <div>
            <h5 className="font-extrabold text-[13px] leading-tight text-right text-white">دۆخی ئۆفلاین (Offline)</h5>
            <p className="text-[11px] text-white/90 leading-snug mt-1 text-right">سیستەمەکە بە باشی کار دەکات؛ فرۆشتنە نوێیەکان لە کۆمپیوتەرەکەتدا دەپارێزرێن تا هێڵ دێتەوە.</p>
          </div>
        </div>
      )}

      {showSyncSuccess && isOnline && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[var(--bg-secondary)] text-[var(--border-color)] px-5 py-4 rounded-3xl shadow-[0_12px_40px_rgba(30,36,32,0.35)] border border-[var(--accent-gold)]/20 flex items-center gap-4 max-w-sm border-t-4 border-t-[var(--accent-gold)]">
          <div className="w-10 h-10 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] rounded-full flex items-center justify-center shrink-0 animate-pulse">
            <Wifi size={20} />
          </div>
          <div>
            <h5 className="font-extrabold text-[13px] leading-tight text-right text-[var(--accent-gold)]">هێڵ پەیوەست بووەوە</h5>
            <p className="text-[11px] text-[#A3B1A7] leading-snug mt-1 text-right">هاوکاتکردنی داتاکان (Real-time Sync) لەگەڵ فایربەیس بە سەرکەوتوویی ئەنجامدرا!</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isLocked && (
          <LockScreen 
            correctPin={settings?.lockPin || '0000'} 
            onUnlock={handleUnlock} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
