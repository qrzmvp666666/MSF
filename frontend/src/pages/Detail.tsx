import { useState } from 'react';
import { ChevronLeft, MoreHorizontal, Gift, X, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Login from './Login';

export default function Detail() {
  const navigate = useNavigate();
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'star-card'>('wechat');

  const handleDonateClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    setShowPaymentSheet(true);
  };

  const paymentOptions = [
    {
      key: 'wechat' as const,
      label: '微信支付',
      hint: '推荐（到账更快）',
      icon: '微',
      iconClassName: 'bg-[#07c160] text-white',
    },
    {
      key: 'alipay' as const,
      label: '支付宝支付',
      hint: '推荐（付款优惠9.95折）',
      icon: '支',
      iconClassName: 'bg-[#1698ff] text-white',
    },
    {
      key: 'star-card' as const,
      label: '星卡支付',
      hint: '账户余额：¥ 0.00',
      icon: '星',
      iconClassName: 'bg-[#ff5a5f] text-white',
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-10">
        <ChevronLeft size={24} className="text-gray-600" onClick={() => navigate(-1)} />
        <div className="text-center">
          <h1 className="text-base font-medium">知识</h1>
          <p className="text-xs text-gray-400">www.xqacr.cn</p>
        </div>
        <MoreHorizontal size={24} className="text-gray-600" />
      </div>

      <div className="px-4 py-4">
        {/* Author info */}
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-200 overflow-hidden flex items-center justify-center mr-3">
             <span className="text-xl">🧑‍🦲</span>
          </div>
          <span className="font-medium text-gray-800 text-lg">六叔猛料</span>
        </div>

        {/* Notice */}
        <div className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded-lg leading-relaxed mb-6">
          所有文字、图片仅供参考，不保证连续性及任何承诺，自愿付费打赏，请谨慎下单，购买即接受协议，本声明具有法律效力依据，请悉知！
        </div>

        {/* Paid Content */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3 text-lg">付费内容</h3>
          <div className="bg-white rounded-xl shadow-sm p-10 flex flex-col items-center justify-center border border-gray-100">
            <Gift className="text-red-400 w-16 h-16 mb-4 opacity-80" />
            <p className="text-gray-400 text-sm">打赏解锁付费内容</p>
          </div>
        </div>

        {/* History records */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 text-lg">往期记录</h3>
          <div className="bg-white rounded-xl shadow-sm p-4 text-sm border border-gray-100">
            <div className="mb-4">
              <p className="font-medium text-gray-700 mb-2">第100期 新澳 16码 连红稳吃肉</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-red-500 font-medium ml-2 mt-3 text-[15px]">
                <span>龙</span>
                <span>马</span>
                <span>鸡</span>
                <span>狗</span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-2 mb-4">
              <p className="font-medium text-gray-700 mb-2">第099期 新澳 16码 连红稳吃肉</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-red-500 font-medium ml-2 mt-3 text-[15px]">
                <span>猪</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Red Return Button */}
      <div 
        onClick={() => navigate(-1)}
        className="fixed right-3 bottom-24 w-12 h-12 bg-white/95 rounded-full flex items-center justify-center border-2 border-red-400 shadow-[0_2px_12px_rgba(239,68,68,0.25)] z-40 cursor-pointer hover:bg-red-50 transition-colors backdrop-blur-[2px]"
      >
        <span className="text-red-500 font-medium text-[13px] tracking-wider ml-0.5">返回</span>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-0 w-full max-w-md z-50 px-4">
        <div className="bg-[#fdf4cd] rounded-full flex items-center justify-between pl-5 pr-1 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-[#fbe8b5]">
          <div className="text-[#9d5c36] font-bold text-[17px] tracking-wide flex-1">
            打赏价格: 288.00
          </div>
          <button
            onClick={handleDonateClick}
            className="bg-gradient-to-r from-[#ff6b57] to-[#ff4141] hover:opacity-95 text-white font-bold text-[16px] px-8 py-3 rounded-full shadow-md transition-opacity"
          >
            打赏解锁
          </button>
        </div>
      </div>

      {showPaymentSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-[1px]"
            onClick={() => setShowPaymentSheet(false)}
          />
          <div className="fixed bottom-0 left-0 w-full max-w-md z-[70] rounded-t-[26px] bg-[#fbfbfd] px-5 pt-3 pb-8 shadow-[0_-16px_50px_rgba(0,0,0,0.18)] animate-[slideUp_0.2s_ease-out]">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-gray-200" />

            <div className="relative mb-5">
              <h3 className="text-center text-[18px] font-bold tracking-wide text-gray-900">选择赞赏方式</h3>
              <button
                onClick={() => setShowPaymentSheet(false)}
                className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={26} strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-4">
              {paymentOptions.map((option) => {
                const selected = paymentMethod === option.key;

                return (
                  <button
                    key={option.key}
                    onClick={() => setPaymentMethod(option.key)}
                    className={`flex w-full items-center rounded-[22px] px-5 py-5 transition-all ${
                      selected
                        ? 'bg-white border border-[#ffd7d9] shadow-[0_10px_28px_rgba(255,90,95,0.12)]'
                        : 'bg-white border border-[#f1f2f5] shadow-[0_6px_20px_rgba(15,23,42,0.05)]'
                    }`}
                  >
                    <div className={`mr-4 flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold shadow-sm ${option.iconClassName}`}>
                      {option.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[17px] font-medium tracking-wide text-gray-900">{option.label}</div>
                      <div className={`mt-1 text-[13px] leading-none ${option.key === 'star-card' ? 'text-gray-400' : 'text-[#ff5a5f]'}`}>
                        {option.key === 'star-card' ? '用户余额：' : option.hint}
                        {option.key === 'star-card' && (
                          <>
                            <span className="ml-1 text-[#ff5a5f]">¥ 0.00</span>
                            <span className="ml-3 font-medium underline underline-offset-2 text-[#ff5a5f]">去充值</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-[#ff4d4f]">
                      {selected ? <CheckCircle2 size={24} fill="currentColor" className="text-[#ff4d4f]" /> : <Circle size={24} className="text-[#e5e7eb]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button className="mt-7 w-full rounded-full bg-gradient-to-r from-[#ff5b5b] via-[#ff4b51] to-[#ff3d45] py-4 text-[18px] font-bold tracking-wide text-white shadow-[0_12px_30px_rgba(255,77,79,0.32)] transition-transform active:scale-[0.99]">
              ¥ 288.00 确定打赏
            </button>
          </div>
        </>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] bg-white animate-[slideUp_0.3s_ease-out]">
          <button
            onClick={() => setShowLoginModal(false)}
            className="absolute top-4 right-4 z-[110] p-2 bg-black/10 rounded-full text-white hover:bg-black/20 transition-colors"
          >
            <X size={20} />
          </button>
          <Login isModal onSuccess={() => { setShowLoginModal(false); setShowPaymentSheet(true); }} />
        </div>
      )}
    </div>
  );
}
