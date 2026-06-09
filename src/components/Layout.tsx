import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
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
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useProductStore } from '@/store/useProductStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useBranchStore } from '@/store/useBranchStore';
import { VirtualKeyboard } from './VirtualKeyboard';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  const { settings, initSettings } = useSettingsStore();
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
    <div className="flex h-screen overflow-hidden bg-[#F9F7F2] text-[#3D3D3D]">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Right Side for RTL */}
      <aside className={cn(
        "fixed lg:static inset-y-0 right-0 lg:h-screen bg-[#1E2420] text-[#E9E5D9] flex-shrink-0 flex flex-col shadow-2xl z-50 transform transition-all duration-300 ease-out",
        isMobileMenuOpen ? "translate-x-0 w-72" : "translate-x-full lg:translate-x-0",
        !isMobileMenuOpen && (isDesktopSidebarCollapsed ? "lg:w-20" : "lg:w-64")
      )}>
        <div className={cn("p-6 flex items-center bg-[#181D1A]", isDesktopSidebarCollapsed ? "justify-center lg:p-4" : "justify-between lg:p-8")}>
          <div className={cn("transition-opacity duration-300", isDesktopSidebarCollapsed ? "hidden" : "block")}>
            <h1 className="text-xl font-bold tracking-tight text-[#D4A373]">
              {settings?.storeName || 'MAS MENU'}
            </h1>
            <p className="text-[10px] opacity-60 uppercase tracking-widest mt-1">سيستەمى بەڕێوەبردن</p>
          </div>
          {isDesktopSidebarCollapsed && (
            <div className="hidden lg:flex w-10 h-10 rounded-xl bg-[#2D3631] items-center justify-center text-[#D4A373]">
                <Coffee size={24} />
            </div>
          )}
          <button 
            className="lg:hidden text-[#E9E5D9] opacity-70 hover:opacity-100 bg-[#2D3631] p-2 rounded-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <button 
            className="hidden lg:flex absolute top-8 -left-3 bg-[#D4A373] text-[#1E2420] w-6 h-6 rounded-full items-center justify-center hover:bg-white transition-colors shadow-md z-50"
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
                    ? "bg-[#D4A373] text-[#1E2420] shadow-md" 
                    : "hover:bg-[#2D3631] text-[#A3B1A7] hover:text-white",
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
        
        <div className={cn("p-6 bg-[#181D1A]", isDesktopSidebarCollapsed && "p-4 flex flex-col items-center gap-4")}>
          {!isDesktopSidebarCollapsed && (
            <div className="bg-[#2D3631] p-4 rounded-2xl border border-[#3D4741] mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 bg-[#4ADE80] rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                <span className="text-[10px] uppercase tracking-widest text-[#A3B1A7] font-bold">
                  {role === 'admin' ? 'ئەدمین' : 'کاشێر'}
                </span>
              </div>
              <p className="text-xs font-medium text-white truncate">{user?.email}</p>
            </div>
          )}

          {/* Full Screen (Kiosk) button */}
          <button 
            onClick={toggleFullscreen}
            title={isDesktopSidebarCollapsed ? "شاشەی تەواو" : "پڕکردنی شاشە (Full Screen)"}
            className={cn(
              "flex items-center justify-center transition-all duration-300 font-medium border mb-3 cursor-pointer",
              isDesktopSidebarCollapsed 
                ? "w-12 h-12 rounded-xl bg-[#D4A373]/10 text-[#D4A373] hover:bg-[#D4A373]/20 border-[#D4A373]/20" 
                : "gap-2 w-full px-4 py-3 bg-[#D4A373]/10 hover:bg-[#D4A373]/20 text-[#E9E5D9] hover:text-white rounded-xl border-[#D4A373]/20 text-sm"
            )}
          >
            {isFullscreen ? <Minimize2 size={isDesktopSidebarCollapsed ? 20 : 16} /> : <Maximize2 size={isDesktopSidebarCollapsed ? 20 : 16} />}
            {!isDesktopSidebarCollapsed && <span>شاشەی تەواو (Kiosk)</span>}
          </button>

          <button 
            onClick={handleLogout}
            title={isDesktopSidebarCollapsed ? "چوونە دەرەوە" : undefined}
            className={cn(
              "flex items-center justify-center transition-colors font-medium border",
              isDesktopSidebarCollapsed 
                ? "w-12 h-12 rounded-xl bg-[#E11D48]/10 text-[#E11D48] hover:bg-[#E11D48]/20 border-[#E11D48]/20" 
                : "gap-2 w-full px-4 py-3 bg-[#E11D48]/10 hover:bg-[#E11D48]/20 text-[#FEF2F2] rounded-xl border-[#E11D48]/20 text-sm"
            )}
          >
            <LogOut size={isDesktopSidebarCollapsed ? 20 : 16} />
            {!isDesktopSidebarCollapsed && <span>چوونە دەرەوە</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-4 px-4 pb-4 lg:p-8 gap-4 lg:gap-8 overflow-hidden relative w-full min-w-0 bg-[#FDFBF7]">
        {location.pathname === '/' ? (
          <header className="flex justify-between items-center flex-shrink-0 bg-white p-4 lg:px-8 lg:py-5 rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-30 border border-[#E9E5D9]">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2.5 bg-[#F9F7F2] hover:bg-[#E9E5D9] rounded-xl text-[#2D3631] transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
              <div className="hidden sm:block">
                  <h2 className="text-lg lg:text-2xl font-bold text-[#1E2420]">بەخێربێیت، <span className="text-[#D4A373]">{user?.email?.split('@')[0]}</span></h2>
                  <p className="text-xs lg:text-sm text-[#8B8378] mt-1">گەڕانەوەت خێر - سیستەمەکە ئامادەیە بۆ کارکردن</p>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:gap-5">
              {role === 'admin' && (
                 <NavLink to="/pos" className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-[#1E2420] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                   <ShoppingCart size={16} />
                   <span>فرۆشتنی نوێ</span>
                 </NavLink>
              )}
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#FDFBF7] border border-[#E9E5D9] flex items-center justify-center text-[#D4A373] shadow-sm">
                <Coffee size={20} />
              </div>
            </div>
          </header>
        ) : (
          <div className="lg:hidden flex justify-between items-center bg-white p-4 rounded-[20px] shadow-sm border border-[#E9E5D9] shrink-0">
             <button 
                className="p-2.5 bg-[#F9F7F2] hover:bg-[#E9E5D9] rounded-xl text-[#2D3631] transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-[#1E2420] flex items-center justify-center text-[#D4A373] shadow-sm border border-[#2D3631]">
                <Coffee size={18} />
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
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#1E2420] text-[#E9E5D9] px-5 py-4 rounded-3xl shadow-[0_12px_40px_rgba(30,36,32,0.35)] border border-[#D4A373]/20 flex items-center gap-4 max-w-sm border-t-4 border-t-[#D4A373]">
          <div className="w-10 h-10 bg-[#D4A373]/10 text-[#D4A373] rounded-full flex items-center justify-center shrink-0 animate-pulse">
            <Wifi size={20} />
          </div>
          <div>
            <h5 className="font-extrabold text-[13px] leading-tight text-right text-[#D4A373]">هێڵ پەیوەست بووەوە</h5>
            <p className="text-[11px] text-[#A3B1A7] leading-snug mt-1 text-right">هاوکاتکردنی داتاکان (Real-time Sync) لەگەڵ فایربەیس بە سەرکەوتوویی ئەنجامدرا!</p>
          </div>
        </div>
      )}
    </div>
  );
}
