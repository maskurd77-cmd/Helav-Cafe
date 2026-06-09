import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  permissions: string[] | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, role: null, permissions: [] });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[] | null>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRole(data.role);
            setPermissions(data.permissions || []);
          } else {
            setRole('admin'); // Default role if user doc doesn't exist
            setPermissions(['pos', 'menu', 'expenses', 'receipts', 'reports', 'settings', 'users', 'customer']);
          }
        } catch (e) {
          console.error("Error fetching user role", e);
          setRole('admin');
          setPermissions(['pos', 'menu', 'expenses', 'receipts', 'reports', 'settings', 'users', 'customer']);
        }
      } else {
        setRole(null);
        setPermissions([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role, permissions }}>
        {children}
    </AuthContext.Provider>
  );
};
