import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, secondaryAuth } from '@/firebase';
import { Plus, Trash2, User as UserIcon, Edit2, X } from 'lucide-react';

interface AppUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  permissions?: string[];
}

export function UsersView() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('cashier');
  const [permissions, setPermissions] = useState<string[]>([]);
  
  const AVAILABLE_PERMISSIONS = [
    { id: 'dashboard', label: 'داشبۆردی سەرەکی', info: 'بینینی ئامارە گشتییەکان' },
    { id: 'pos', label: 'کاشێر و فرۆشتن', info: 'دەرکردنی پسوڵەگە' },
    { id: 'menu', label: 'دەستکاری مێنۆ', info: 'دروستکردن و سڕینەوەی کاڵا' },
    { id: 'customer', label: 'شاشەی کڕیار', info: 'ڕووکاری کڕیار' },
    { id: 'expenses', label: 'خەرجییەکان', info: 'دیاریکردنی خەرجی' },
    { id: 'receipts', label: 'پسوڵەکان', info: 'گەران و پرینتکردنەوە' },
    { id: 'reports', label: 'ڕاپۆرتەکان', info: 'ڕاپۆرتی دارایی ڕۆژانە' },
    { id: 'users', label: 'بەکارهێنەران', info: 'دەسەڵاتەکان و ستاف' },
    { id: 'settings', label: 'ڕێکخستنەکان', info: 'کۆنترۆلکردنی سیستەم' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppUser)));
    } catch (e) {
      if (e instanceof Error && e.message.includes('permission')) {
          import('@/firebase').then(({ handleFirestoreError, OperationType }) => handleFirestoreError(e, OperationType.GET, 'users'));
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setEmail('');
    setPassword('');
    setName('');
    setRole('cashier');
    setPermissions(['pos', 'menu', 'customer']);
    setShowModal(true);
  };

  const openEditModal = (user: AppUser) => {
    setEditId(user.id);
    setEmail(user.email);
    setPassword(''); // Don't populate password for editing
    setName(user.name || '');
    setRole(user.role);
    setPermissions(user.permissions || ['pos', 'menu', 'customer']);
    setShowModal(true);
  };

  const togglePermission = (permId: string) => {
    setPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        // Update user
        await updateDoc(doc(db, 'users', editId), {
          name,
          role,
          permissions: role === 'admin' ? AVAILABLE_PERMISSIONS.map(p => p.id) : permissions
        });
      } else {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await signOut(secondaryAuth);
        
        const newUid = userCredential.user.uid;
        await setDoc(doc(db, 'users', newUid), {
          email,
          name,
          role,
          permissions: role === 'admin' ? AVAILABLE_PERMISSIONS.map(p => p.id) : permissions
        });
      }

      setShowModal(false);
      loadUsers();
    } catch (e: any) {
      alert("هەڵەیەک ڕوویدا: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە لە بنکەی داتا؟')) {
      await deleteDoc(doc(db, 'users', id));
      loadUsers();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-5 rounded-[24px] border border-[#E9E5D9] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] rounded-[18px] shadow-md border border-[#D4A373]/20">
             <UserIcon size={24} className="stroke-[2]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#1E2420] tracking-tight">بەکارهێنەران</h1>
            <p className="text-xs lg:text-sm text-[#8B8378] mt-1 font-bold">بەڕێوەبردنی ستاف، کاشێر و ئەدمین</p>
          </div>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-gradient-to-b from-[#1E2420] to-[#2D3631] hover:from-[#1E2420] hover:to-[#1E2420] text-[#D4A373] border border-[#D4A373]/30 font-black py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm w-full md:w-auto whitespace-nowrap"
        >
          <Plus size={20} className="stroke-[2.5]" />
          بەکارهێنەری نوێ
        </button>
      </div>

      <div className="bg-gradient-to-b from-white to-[#FDFBF7] rounded-[24px] lg:rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#E9E5D9] overflow-hidden flex-1 flex flex-col min-w-0">
        <div className="overflow-auto flex-1 custom-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-[#8B8378] gap-4 py-20">
                 <div className="w-10 h-10 border-4 border-[#E9E5D9] border-t-[#D4A373] rounded-full animate-spin"></div>
                 <span className="font-bold text-sm tracking-wide">بارکردنی بەکارهێنەران...</span>
             </div>
          ) : (
          <table className="w-full text-right border-collapse">
            <thead className="bg-white/50 backdrop-blur-md text-[#8B8378] text-[10px] lg:text-xs uppercase sticky top-0 z-10 border-b-2 border-[#E9E5D9] shadow-sm">
              <tr>
                <th className="px-6 py-5 font-black text-right tracking-wider">ناو و ئیمەیڵ</th>
                <th className="px-6 py-5 font-black text-right tracking-wider">ئەرک (Role)</th>
                <th className="px-6 py-5 font-black text-left tracking-wider">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9F7F2]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white transition-all duration-300 group hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FDFBF7] to-[#F9F7F2] rounded-[16px] flex items-center justify-center text-[#D4A373] flex-shrink-0 group-hover:bg-gradient-to-br group-hover:from-[#1E2420] group-hover:to-[#2D3631] transition-all duration-300 shadow-sm border border-[#E9E5D9]">
                        <UserIcon size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="font-black text-[#1E2420] text-base group-hover:text-[#D4A373] transition-colors">{u.name || 'بێ ناو'}</div>
                        <div className="text-xs font-bold text-[#8B8378] mt-1 tracking-wide">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase text-center min-w-[80px] inline-block shadow-sm border transition-colors ${
                      u.role === 'admin' 
                        ? 'bg-gradient-to-br from-[#1E2420] to-[#2D3631] text-[#D4A373] border-[#1E2420]' 
                        : 'bg-white text-[#8B8378] border-[#E9E5D9] group-hover:border-[#D4A373]'
                    }`}>
                        {u.role === 'admin' ? 'ئەدمین' : 'کاشێر'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform lg:translate-x-4 lg:group-hover:translate-x-0">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="p-2.5 text-[#8DAA91] bg-green-50 hover:bg-[#8DAA91] hover:text-white rounded-xl transition-all shadow-sm border border-green-100"
                        title="دەستکاریکردن"
                      >
                        <Edit2 size={18} className="stroke-[2.5]" />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-2.5 text-[#E11D48] bg-red-50 hover:bg-[#E11D48] hover:text-white rounded-xl transition-all shadow-sm border border-red-100"
                        title="سڕینەوە"
                      >
                        <Trash2 size={18} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                   <td colSpan={3} className="py-20 text-center">
                     <div className="flex flex-col items-center justify-center gap-4 text-[#8B8378]">
                        <div className="p-6 bg-[#F9F7F2] rounded-full border-2 border-dashed border-[#E9E5D9]">
                           <UserIcon size={32} className="text-[#D4A373] opacity-50 stroke-[1.5]" />
                        </div>
                        <p className="font-bold text-base">هیچ بەکارهێنەرێک نەدۆزرایەوە.</p>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#FDFBF7] border-b border-[#E9E5D9] flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-[#1E2420]">{editId ? 'دەستکاریکردنی بەکارهێنەر' : 'زیادکردنی بەکارهێنەر'}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-[#8B8378] hover:bg-white hover:shadow-sm rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar custom-scrollbar-slim">
              <form id="userForm" onSubmit={handleCreateOrUpdateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black text-[#1E2420] mb-2 focus-within:text-[#D4A373] transition-colors">ناوی تەواو</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="بۆ نموونە: ئەحمەد" className="w-full bg-[#FDFBF7] border border-[#E9E5D9] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] outline-none text-[#1E2420] text-sm transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#1E2420] mb-2 focus-within:text-[#D4A373] transition-colors">ئیمەیڵ</label>
                    <input required disabled={!!editId} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="username@example.com" className="w-full bg-[#FDFBF7] border border-[#E9E5D9] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] outline-none text-[#1E2420] text-left dir-ltr disabled:opacity-50 text-sm transition-all" />
                  </div>
                  {!editId && (
                    <div>
                      <label className="block text-xs font-black text-[#1E2420] mb-2 focus-within:text-[#D4A373] transition-colors">وشەی نهێنی</label>
                      <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="لانی کەم ٦ پیت بنووسە" className="w-full bg-[#FDFBF7] border border-[#E9E5D9] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] outline-none text-[#1E2420] text-left dir-ltr text-sm transition-all" minLength={6} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-black text-[#1E2420] mb-2 focus-within:text-[#D4A373] transition-colors">ئەرکی سەرەکی</label>
                    <div className="relative">
                      <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#E9E5D9] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] outline-none text-[#1E2420] text-sm appearance-none pr-10 transition-all font-bold">
                        <option value="cashier">کاشێر (Cashier)</option>
                        <option value="admin">سەرپەرشتیار / ئەدمین</option>
                      </select>
                      <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none text-neutral-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {role === 'cashier' && (
                  <div className="pt-6 border-t border-dashed border-[#E9E5D9]">
                    <div className="mb-5">
                      <h3 className="text-base font-black text-[#1E2420]">دەسەڵاتەکان و ڕێگەپێدانەکان</h3>
                      <p className="text-xs font-bold text-[#8B8378] mt-1">دیاریبکە ئەم بەکارهێنەرە دەتوانێت دەستی بە کام بەش لە سیستەمەکە هەبێت؟</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AVAILABLE_PERMISSIONS.map(perm => (
                        <div 
                          key={perm.id} 
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                            permissions.includes(perm.id) 
                              ? 'bg-gradient-to-r from-[#FAF8F5] to-amber-50 border-[#D4A373]/50 shadow-sm' 
                              : 'bg-white border-[#E9E5D9] hover:bg-neutral-50/50'
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-xs font-black transition-colors ${permissions.includes(perm.id) ? 'text-[#1E2420]' : 'text-neutral-600'}`}>
                              {perm.label}
                            </span>
                            <span className="text-[10px] font-bold text-neutral-400">{perm.info}</span>
                          </div>
                          
                          <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${permissions.includes(perm.id) ? 'bg-[#D4A373]' : 'bg-neutral-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${permissions.includes(perm.id) ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {role === 'admin' && (
                  <div className="pt-4 border-t border-dashed border-[#E9E5D9]">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                      <div className="text-emerald-500 bg-white p-2 rounded-lg shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-900">سەرپەرشتیاری گشتی (Full Access)</h4>
                        <p className="text-[10px] font-bold text-emerald-700/80 mt-0.5">ئەم بەکارهێنەرە دەسەڵاتی تەواوی بەسەر هەموو بەشەکانی سیستەمەکەدا هەیە.</p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 bg-[#FDFBF7] border-t border-[#E9E5D9] flex gap-4 shrink-0">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-[#E9E5D9] hover:bg-[#F9F7F2] text-[#1E2420] font-bold py-3.5 rounded-xl transition-all"
              >
                پاشگەزبوونەوە
              </button>
              <button 
                type="submit"
                form="userForm"
                className="flex-[2] bg-[#1E2420] hover:bg-[#2D3631] text-[#E9E5D9] font-bold py-3.5 rounded-xl transition-all shadow-lg"
              >
                {editId ? 'پاشەکەوتکردن' : 'دروستکردن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
