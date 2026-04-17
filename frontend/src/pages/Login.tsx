import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock, Eye, EyeOff, MessageSquare, User, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthTab = 'login' | 'register';
type AuthMode = 'password' | 'code';

type PhoneCodeVerifyResponse = {
  success?: boolean;
  error?: string;
  phone?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    token_type?: string;
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const phonePattern = /^1[3-9]\d{9}$/;
const accountPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,20}$/;
const passwordLetterNumberPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;

function getEmailFromAccount(account: string) {
  return `${account}@msf.local`;
}

async function ensureDefaultProfileNickname(defaultNickname: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !defaultNickname) {
    return;
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, nickname')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile?.nickname) {
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      nickname: defaultNickname,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }
}

async function invokePublicFunction<T>(functionName: string, body: Record<string, unknown>) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('未配置 Supabase 环境变量');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });

  let payload: T & { error?: string; message?: string };

  try {
    payload = await response.json();
  } catch {
    payload = {} as T & { error?: string; message?: string };
  }

  if (!response.ok) {
    throw new Error(payload.error || payload.message || '请求失败，请稍后重试');
  }

  return payload;
}

async function signInWithAccountOrPhonePassword(account: string, password: string) {
  if (phonePattern.test(account)) {
    const phoneValue = `+86${account}`;

    const phoneLoginResult = await supabase.auth.signInWithPassword({
      phone: phoneValue,
      password,
    });

    if (!phoneLoginResult.error) {
      return phoneLoginResult;
    }
  }

  return supabase.auth.signInWithPassword({
    email: getEmailFromAccount(account),
    password,
  });
}

export default function Login({ isModal = false, onSuccess }: { isModal?: boolean; onSuccess?: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [loginMode, setLoginMode] = useState<AuthMode>('code');
  const [registerMode, setRegisterMode] = useState<AuthMode>('password');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const currentMode = activeTab === 'login' ? loginMode : registerMode;
  const isCodeMode = currentMode === 'code';

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [countdown]);

  const submitText = useMemo(() => {
    if (activeTab === 'login') {
      return isCodeMode ? '验证码登录' : '密码登录';
    }

    return isCodeMode ? '验证码注册' : '密码注册';
  }, [activeTab, isCodeMode]);

  const accountPlaceholder = useMemo(() => {
    if (activeTab === 'login') {
      return isCodeMode ? '请输入手机号' : '请输入账号';
    }

    return isCodeMode ? '请输入手机号' : '请输入账号（数字和字母组合）';
  }, [activeTab, isCodeMode]);

  function resetFeedback() {
    setError('');
  }

  function handleBackClick() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/');
  }

  function validatePhone() {
    if (!account) {
      throw new Error('请输入手机号');
    }

    if (!phonePattern.test(account)) {
      throw new Error('请输入正确的中国大陆手机号格式');
    }
  }

  function validatePasswordAccount() {
    if (!account) {
      throw new Error(activeTab === 'login' ? '请输入账号' : '请输入账号');
    }

    if (activeTab === 'register' && !accountPattern.test(account)) {
      throw new Error('账号需为4-20位字母和数字组合');
    }
  }

  async function completeAuthSuccess() {
    if (isModal && onSuccess) {
      onSuccess();
      return;
    }

    navigate('/');
  }

  async function handleSendCode() {
    resetFeedback();

    try {
      validatePhone();
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : '手机号格式错误');
      return;
    }

    setSendingCode(true);

    try {
      const result = await invokePublicFunction<{ success?: boolean; expiresIn?: number }>('phone-code-send', {
        phone: account,
      });
      setCountdown(result.expiresIn ? Math.min(result.expiresIn, 60) : 60);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '验证码发送失败');
    } finally {
      setSendingCode(false);
    }
  }

  async function handlePhoneCodeAuth() {
    if (!/^\d{4,6}$/.test(verificationCode.trim())) {
      throw new Error('请输入正确的验证码');
    }

    const result = await invokePublicFunction<PhoneCodeVerifyResponse>('phone-code-verify', {
      phone: account,
      code: verificationCode.trim(),
    });

    if (!result.session?.access_token || !result.session?.refresh_token) {
      throw new Error(result.error || '验证码登录失败');
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    if (sessionError) {
      throw new Error(sessionError.message || '保存登录状态失败');
    }

    if (activeTab === 'register') {
      await ensureDefaultProfileNickname(account);
    }
  }

  async function handlePasswordAuth() {
    if (!password || password.length < 6) {
      throw new Error('密码至少需要6位');
    }

    const email = getEmailFromAccount(account);

    if (activeTab === 'login') {
      const { error: signInError } = await signInWithAccountOrPhonePassword(account, password);

      if (signInError) {
        throw new Error('登录失败: 账号或密码错误');
      }

      return;
    }

    if (password !== confirmPassword) {
      throw new Error('两次输入的密码不一致');
    }

    if (!passwordLetterNumberPattern.test(password)) {
      throw new Error('注册密码必须为字母和数字组合');
    }

    if (password === account) {
      throw new Error('注册密码不能与账号相同');
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        throw new Error('该手机号已被注册，请直接登录');
      }

      throw new Error('注册失败: ' + signUpError.message);
    }

    await ensureDefaultProfileNickname(account);
  }

  async function handleSubmit() {
    resetFeedback();

    try {
      if (isCodeMode) {
        validatePhone();
      } else {
        validatePasswordAccount();
      }
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : '输入格式错误');
      return;
    }

    setLoading(true);

    try {
      if (isCodeMode) {
        await handlePhoneCodeAuth();
      } else {
        await handlePasswordAuth();
      }

      await completeAuthSuccess();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`bg-white flex flex-col select-none ${isModal ? 'w-full h-full' : 'min-h-screen'}`}>
      <div className="relative bg-gradient-to-br from-red-500 via-red-500 to-orange-400 h-72 flex flex-col items-center justify-center overflow-hidden shrink-0">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -top-4 -left-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-white rounded-t-[32px]" />

        {!isModal && (
          <button
            type="button"
            onClick={handleBackClick}
            className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm border border-white/60 transition-all duration-100 hover:bg-white active:scale-95 active:bg-gray-50 active:shadow-none touch-manipulation"
            aria-label="返回"
          >
            <ArrowLeft size={20} />
          </button>
        )}

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
            type="button"
            onClick={() => {
              setActiveTab('login');
              resetFeedback();
            }}
            className={`flex-1 py-2 text-[15px] font-medium z-10 transition-colors ${
              activeTab === 'login' ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              resetFeedback();
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
              placeholder={accountPlaceholder}
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

        {isCodeMode ? (
          <div className="mb-6">
            <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2.5 gap-3 transition-colors focus-within:border-red-200">
              <MessageSquare size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                inputMode="numeric"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="请输入短信验证码"
                className="flex-1 bg-transparent py-2 text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
              {verificationCode && (
                <button
                  type="button"
                  onClick={() => setVerificationCode('')}
                  className="text-gray-300 hover:text-gray-500 focus:outline-none"
                >
                  <XCircle size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="shrink-0 rounded-full bg-gradient-to-r from-red-500 to-orange-400 px-4 py-2 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s后重试` : '获取验证码'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3 transition-colors focus-within:border-red-200">
                <Lock size={18} className="text-gray-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeTab === 'login' ? '请输入密码' : '请输入密码 (至少6位)'}
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
                    type={showConfirmPassword ? 'text' : 'password'}
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
          </>
        )}

        <div className="mb-4 flex items-center justify-between px-1 text-[12px]">
          <span className="text-gray-400">
            {isCodeMode
              ? activeTab === 'login'
                ? '验证码校验成功后将直接登录'
                : '验证码校验成功后将自动注册并登录'
              : '\u00A0'}
          </span>
          <button
            type="button"
            onClick={() => {
              resetFeedback();
              if (activeTab === 'login') {
                setLoginMode(loginMode === 'password' ? 'code' : 'password');
              } else {
                setRegisterMode(registerMode === 'password' ? 'code' : 'password');
              }
            }}
            className="shrink-0 font-medium text-orange-500 hover:text-orange-600"
          >
            {activeTab === 'login'
              ? loginMode === 'password'
                ? '验证码登录'
                : '密码登录'
              : registerMode === 'password'
                ? '验证码注册'
                : '密码注册'}
          </button>
        </div>

        {error && (
          <div className="mb-4 text-[#ff4d4f] text-[13px] text-center font-medium bg-red-50 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-[54px] rounded-full bg-gradient-to-r from-red-500 to-orange-400 text-white text-[16px] font-bold shadow-[0_8px_20px_rgba(239,68,68,0.25)] active:scale-[0.98] transition-transform flex items-center justify-center mt-2"
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : submitText}
        </button>
      </div>
    </div>
  );
}
