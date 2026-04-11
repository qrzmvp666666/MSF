import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Lock, Eye, EyeOff, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login({ isModal = false, onSuccess }: { isModal?: boolean, onSuccess?: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!account) {
      setError('请输入账号');
      return;
    }
    if (!password || password.length < 6) {
      setError('密码至少需要6位');
      return;
    }
    
    if (activeTab === 'register') {
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }
    
    setLoading(true);

    const email = account.includes('@') ? account : `${account}@msf.local`;

    if (activeTab === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('登录失败: 账号或密码错误');
        setLoading(false);
        return;
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
        
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('该账号已被注册，请直接登录');
        } else {
          setError('注册失败: ' + signUpError.message);
        }
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
          <div className="mt-4 text-[26px] font-bold tracking-widest text-white">广聚天下</div>
        </div>
      </div>

      <div className="flex-1 bg-white px-6 pt-2 pb-10">
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6 relative">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out ${
              activeTab === 'login' ? 'translate-x-0' : 'translate-x-full'
            }`}
          />
          <button
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
            className={`flex-1 py-2 text-[15px] font-medium z-10 transition-colors ${
              activeTab === 'login' ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
            className={`flex-1 py-2 text-[15px] font-medium z-10 transition-colors ${
              activeTab === 'register' ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            注册
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3 transition-colors focus-within:border-red-200">
            <User size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value.trim())}
              placeholder="请输入账号 (字母或数字)"
              className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {account && (
              <button
                type="button"
                onClick={() => setAccount('')}
                className="text-gray-300 hover:text-gray-500 focus:outline-none"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3 transition-colors focus-within:border-red-200">
            <Lock size={18} className="text-gray-400 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码 (至少6位)"
              className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
            />
            {password && (
              <button
                type="button"
                onClick={() => setPassword('')}
                className="text-gray-300 hover:text-gray-500 focus:outline-none"
              >
                <XCircle size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none ml-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {activeTab === 'register' && (
          <div className="mb-6">
            <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3 transition-colors focus-within:border-red-200">
              <Lock size={18} className="text-gray-400 shrink-0" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
              {confirmPassword && (
                <button
                  type="button"
                  onClick={() => setConfirmPassword('')}
                  className="text-gray-300 hover:text-gray-500 focus:outline-none"
                >
                  <XCircle size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none ml-1"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 text-[#ff4d4f] text-[13px] text-center font-medium bg-red-50 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-[54px] rounded-full bg-gradient-to-r from-red-500 to-orange-400 text-white text-[16px] font-bold shadow-[0_8px_20px_rgba(239,68,68,0.25)] active:scale-[0.98] transition-transform flex items-center justify-center mt-2"
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : (activeTab === 'login' ? '登 录' : '注 册')}
        </button>
      </div>
    </div>
  );
}
