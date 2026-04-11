import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Phone, Lock, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

type LoginMode = 'otp' | 'password';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCountdown() {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function sendOtp() {
    setError('');
    if (!phone || phone.length < 11) {
      setError('请输入正确的 11 位手机号');
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+86${phone}`,
    });
    setSending(false);
    if (error) {
      setError(error.message);
    } else {
      startCountdown();
    }
  }

  async function handleLogin() {
    setError('');
    if (!phone || phone.length < 11) {
      setError('请输入正确的 11 位手机号');
      return;
    }
    setLoading(true);

    if (mode === 'otp') {
      if (!otp || otp.length < 4) {
        setError('请输入验证码');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.verifyOtp({
        phone: `+86${phone}`,
        token: otp,
        type: 'sms',
      });
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } else {
      if (!password) {
        setError('请输入密码');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        phone: `+86${phone}`,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col select-none">
      {/* 顶部渐变区域 */}
      <div className="relative bg-gradient-to-br from-red-500 via-red-500 to-orange-400 h-72 flex flex-col items-center justify-center overflow-hidden">
        {/* 装饰圆 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -top-4 -left-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-white rounded-t-[32px]" />
        {/* Logo & Slogan */}
        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm shadow-inner">
            <span className="text-3xl">🔥</span>
          </div>
          <div className="mt-4 text-[26px] font-bold tracking-widest text-white">猛料平台</div>
          <div className="mt-1.5 text-sm text-red-100">专业内容 · 精准分析</div>
        </div>
      </div>

      {/* 登录卡片 */}
      <div className="flex-1 bg-white px-6 pt-6 pb-10">
        {/* 标签切换 */}
        <div className="flex rounded-2xl bg-gray-100 p-1 mb-7">
          {(['otp', 'password'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setOtp(''); setPassword(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                mode === m
                  ? 'bg-white text-red-500 shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              {m === 'otp' ? '验证码登录' : '密码登录'}
            </button>
          ))}
        </div>

        {/* 手机号输入 */}
        <div className="mb-3.5">
          <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3">
            <Phone size={17} className="text-gray-300 shrink-0" />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[14px] text-gray-500 font-medium">+86</span>
              <div className="w-px h-3.5 bg-gray-200" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="请输入手机号"
              className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
            />
          </div>
        </div>

        {/* 验证码模式 */}
        {mode === 'otp' && (
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3">
                <Shield size={17} className="text-gray-300 shrink-0" />
                <input
                  type="number"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="请输入验证码"
                  className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
                />
              </div>
              <button
                onClick={sendOtp}
                disabled={sending || countdown > 0}
                className={`shrink-0 h-[54px] px-4 rounded-2xl text-sm font-semibold transition-all ${
                  countdown > 0 || sending
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-500 active:bg-red-100'
                }`}
              >
                {sending
                  ? <Loader2 size={16} className="animate-spin" />
                  : countdown > 0
                    ? `${countdown}s`
                    : '发送验证码'
                }
              </button>
            </div>
          </div>
        )}

        {/* 密码模式 */}
        {mode === 'password' && (
          <div className="mb-5">
            <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3">
              <Lock size={17} className="text-gray-300 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-500 leading-relaxed">
            {error}
          </div>
        )}

        {/* 登录按钮 */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-orange-400 py-4 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(255,77,79,0.32)] active:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          登录
        </button>

        {/* 协议 */}
        <p className="mt-5 text-center text-xs text-gray-400 leading-relaxed">
          登录即表示已阅读并同意
          <span className="text-red-400 cursor-pointer">《用户协议》</span>
          与
          <span className="text-red-400 cursor-pointer">《隐私政策》</span>
        </p>
      </div>
    </div>
  );
}
