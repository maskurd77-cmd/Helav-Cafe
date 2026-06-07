import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';
import { Coffee } from 'lucide-react';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('ئیمەیڵ یان وشەی نهێنی هەڵەیە');
      } else {
        setError('کێشەیەک ڕوویدا: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[40px] shadow-xl border border-[#E9E5D9] p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#F9F7F2] rounded-full flex items-center justify-center mx-auto mb-4 text-[#8DAA91]">
            <Coffee size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#2D3631]">MAS MENU</h1>
          <p className="text-[#8B8378] mt-2">سیستەمی بەڕێوەبردن</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#2D3631] mb-2">ئیمەیڵ</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F9F7F2] border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
              placeholder="admin@helav.cafe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-[#2D3631] mb-2">وشەی نهێنی</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F9F7F2] border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#8DAA91] outline-none text-[#2D3631] text-left dir-ltr"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8DAA91] hover:brightness-110 disabled:opacity-50 text-white font-bold py-4 rounded-full transition-all shadow-lg shadow-[#8DAA9133]"
          >
            {loading ? 'چاوەڕێبە...' : 'چوونە ژوورەوە'}
          </button>
        </form>
      </div>
    </div>
  );
}
