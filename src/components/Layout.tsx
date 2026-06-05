import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useProductStore } from '@/store/useProductStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const adminNavItems = [
  { text: 'داشبۆرد', icon: LayoutDashboard, path: '/' },
  { text: 'فرۆشتن (POS)', icon: ShoppingCart, path: '/pos' },
  { text: 'مێنۆ', icon: MenuSquare, path: '/menu' },
  { text: 'خەرجییەکان', icon: Wallet, path: '/expenses' },
  { text: 'وەسلەکان', icon: Receipt, path: '/receipts' },
  { text: 'ڕاپۆرتەکان', icon: BarChart3, path: '/reports' },
  { text: 'بەکارهێنەران', icon: Users, path: '/users' },
  { text: 'ڕێکخستنەکان', icon: Settings, path: '/settings' },
];

const cashierNavItems = [
  { text: 'فرۆشتن (POS)', icon: ShoppingCart, path: '/pos' },
  { text: 'مێنۆ', icon: MenuSquare, path: '/menu' },
];

export function Layout() {
  const { user, role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const initProducts = useProductStore(state => state.initProducts);
  const initSettings = useSettingsStore(state => state.initSettings);

  React.useEffect(() => {
    initProducts();
    initSettings();
  }, [initProducts, initSettings]);
  
  const handleLogout = () => {
    signOut(auth);
  };

  const navItems = role === 'admin' ? adminNavItems : cashierNavItems;

  // Protect routes based on role
  if (role === 'cashier' && location.pathname === '/') {
    return <Navigate to="/pos" replace />;
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
        "fixed lg:static inset-y-0 right-0 w-72 lg:w-64 bg-[#1E2420] text-[#E9E5D9] flex-shrink-0 flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ease-out lg:transform-none",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 lg:p-8 flex justify-between items-center bg-[#181D1A]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#D4A373]">Helav Cafe</h1>
            <p className="text-[10px] opacity-60 uppercase tracking-widest mt-1">سیستەمی بەڕێوەبردن</p>
          </div>
          <button 
            className="lg:hidden text-[#E9E5D9] opacity-70 hover:opacity-100 bg-[#2D3631] p-2 rounded-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                  isActive 
                    ? "bg-[#D4A373] text-[#1E2420] shadow-md" 
                    : "hover:bg-[#2D3631] text-[#A3B1A7] hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={cn("flex-shrink-0 transition-transform", isActive && "scale-110")} />
                  <span>{item.text}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-6 bg-[#181D1A]">
          <div className="bg-[#2D3631] p-4 rounded-2xl border border-[#3D4741] mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 bg-[#4ADE80] rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
              <span className="text-[10px] uppercase tracking-widest text-[#A3B1A7] font-bold">
                {role === 'admin' ? 'ئەدمین' : 'کاشێر'}
              </span>
            </div>
            <p className="text-xs font-medium text-white truncate">{user?.email}</p>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#E11D48]/10 hover:bg-[#E11D48]/20 text-[#FEF2F2] rounded-xl transition-colors font-medium border border-[#E11D48]/20"
          >
            <LogOut size={16} />
            <span className="text-sm">چوونە دەرەوە</span>
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
    </div>
  );
}
