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

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

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

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthWrapper>
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
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthWrapper>
      </AuthProvider>
    </ErrorBoundary>
  );
}
