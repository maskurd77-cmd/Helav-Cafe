import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { PosView } from './pages/PosView';
import { MenuView } from './pages/MenuView';
import { UsersView } from './pages/UsersView';
import { ExpensesView } from './pages/ExpensesView';
import { ReceiptsView } from './pages/ReceiptsView';
import { ReportsView } from './pages/ReportsView';
import { SettingsView } from './pages/SettingsView';
import { CustomerDisplay } from './pages/CustomerDisplay';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { LoginView } from './pages/LoginView';
import { HospitalRequesterPortal } from './pages/HospitalRequesterPortal';
import { HospitalRequests } from './pages/HospitalRequests';

function AppRoutes() {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9F7F2]">
        <div className="w-8 h-8 border-4 border-[#8DAA91] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // If role is a hospital requester, confine them strictly to the department request portal
  if (role === 'hospital_requester') {
    return (
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <div className="flex h-screen bg-[#F9F7F2]">
                <div className="flex-grow flex flex-col overflow-auto md:p-6">
                  {/* Provide a logout option inside the header if they want to log out */}
                  <div className="flex justify-end p-4 shrink-0">
                    <button 
                      onClick={() => import('@/firebase').then(({ auth }) => auth.signOut())}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-xl text-xs transition-colors"
                    >
                      چوونەدەرەوە
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <HospitalRequesterPortal />
                  </div>
                </div>
              </div>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/customer" element={<CustomerDisplay />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<PosView />} />
          <Route path="menu" element={<MenuView />} />
          <Route path="expenses" element={<ExpensesView />} />
          <Route path="receipts" element={<ReceiptsView />} />
          <Route path="reports" element={<ReportsView />} />
          <Route path="users" element={<UsersView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="requests" element={<HospitalRequests />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
