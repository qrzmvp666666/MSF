import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login({ isModal = false, onSuccess }: { isModal?: boolean, onSuccess?: () => void }) {
  const navigate = useNavigate();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!account) {
      setError('请输入账号');
      return;
    }
    if (!password || password.length < 6) {
      setError('密码至少需要6位');
      return;
    }
    setLoading(true);

    const email = account.includes('@') ? account : `${account}@msf.local`;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid') || signInError.message.includes('credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('密码错误，请重试');
          } else {
            setError('登录/注册失败: ' + signUpError.message);
          }
          setLoading(false);
          return;
        }
      } else {
        setError('登录失败: ' + signInError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    if (isModal && onSuccess) {
      onSuccess();
    } else {
      navigate('/');
    }
  }

  return (
    <div className={`bg-white flex flex-col select-none ${isModal ? 'w-full h-full' : 'min-h-screen'}`}>
      <div className="relative bg-gradient-to-br from-red-500 via-red-500 to-orange-400 h-72 flex flex-col items-center justify-center overflow-hidden shrink-0">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -top-4 -left-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-white rounded-t-[32px]" />
        
        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm shadow-inner">
            <span className="text-3xl">🔥</span>
          </div>
          <div className="mt-4 text-[26px] font-bold tracking-widest text-white">猛料平台</div>
          <div className="mt-1.5 text-sm text-red-100">专业内容 · 精准分析</div>
        </div>
      </div>

      <div className="flex-1 bg-white px-6 pt-6 pb-10">
        <h2 className="text-[20px] font-bold text-gray-800 mb-6 text-center">账号登录</h2>

        <div className="mb-4">
          <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3 transition-colors focus-within:border-red-200">
            <User size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/[^a-zA-Z0-9_@.]/g, ''))}
              placeholder="请输入账号 (字母或数字)"
              className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3 transition-colors focus-within:border-red-200">
            <Lock size={18} className="text-gray-400 shrink-0" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码 (至少6位)"
              className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 text-[#ff4d4f] text-[13px] text-center font-medium bg-red-50 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-[54px] rounded-full bg-gradient-to-r from-red-500 to-orange-400 text-white text-[16px] font-bold shadow-[0_8px_20px_rgba(239,68,68,0.25)] active:scale-[0.98] transition-transform flex items-center justify-center mt-2"
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : '登 录'}
        </button>
        
        <p className="text-center text-gray-400 text-[12px] mt-6 tracking-wide">
          未注册账号将直接完成自动注册
        </p>
      </div>
    </div>
  );
}
