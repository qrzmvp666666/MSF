import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Headphones, ChevronRight, FileText, History, X, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getFallbackNickname } from '../lib/userDisplay';

type Toast = { type: 'success' | 'error'; msg: string } | null;

const SERVICE_WECHAT_ID = 'wxid_n6hkateue4se22';
const SERVICE_QR_IMAGE = '/service-wechat-qr.png';

export default function Profile() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('👨‍💼');
  const [userId, setUserId] = useState('');
  const [serviceOpen, setServiceOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  }

  async function handleCopyWechat() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SERVICE_WECHAT_ID);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = SERVICE_WECHAT_ID;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast('success', '微信号已复制');
    } catch {
      showToast('error', '复制失败，请手动添加');
    }
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUserId(user.id.slice(0, 8).toUpperCase());

      const fallbackNickname = getFallbackNickname(user);

      const { data } = await supabase
        .from('profiles')
        .select('nickname, avatar')
        .eq('id', user.id)
        .single();
      if (data) {
        setNickname(data.nickname || fallbackNickname);
        setAvatar(data.avatar ?? '👨‍💼');
      } else {
        setNickname(fallbackNickname);
      }
    })();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {toast && (
        <div className={`fixed top-14 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="px-4 py-4">
        {/* User Info */}
        <Link to="/profile/info" className="mb-6 flex items-center justify-between rounded-2xl transition-colors hover:bg-white/60">
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center mr-4 border border-gray-100">
               <span className="text-2xl">{avatar}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{nickname || '未设置'}</h2>
              <div className="flex items-center mt-1">
                <span className="bg-red-50 text-red-500 text-xs px-2 py-0.5 rounded mr-2 border border-red-100">SVIP</span>
                <span className="text-gray-500 text-sm">ID: {userId || '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>

        {/* Balance Card (已隐藏) */}
        {/* 
        <div className="bg-gradient-to-r from-red-400 to-red-600 rounded-2xl p-5 text-white mb-6 shadow-md relative overflow-hidden">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium mr-2 text-red-50">我的彩贝</span>
            <Eye size={16} className="text-red-100 opacity-80" />
          </div>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-bold">0.00</span>
            <button className="bg-white text-red-500 text-sm font-medium px-4 py-1.5 rounded-full shadow-sm">
              去充值
            </button>
          </div>
          <div className="absolute -right-4 -top-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
          <div className="absolute right-10 -bottom-10 w-24 h-24 rounded-full bg-red-700 opacity-20"></div>
        </div>
        */}

        {/* More Functions */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 mb-3 text-lg">更多功能</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Item 1 (彩贝明细已隐藏) */}
            {/* 
            <div className="bg-white rounded-xl p-4 flex items-center shadow-sm">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-base mb-1">彩贝明细</h4>
                <p className="text-xs text-gray-400">每一笔账都清楚</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Wallet className="text-red-400" size={20} />
              </div>
            </div>
            */}

            {/* 订单记录 */}
            <div onClick={() => navigate('/orders?tab=orders')} className="bg-white rounded-xl p-4 flex items-center shadow-sm cursor-pointer active:bg-gray-50">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-base mb-1">订单记录</h4>
                <p className="text-xs text-gray-400">查看您的购买记录</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <FileText className="text-blue-400" size={20} />
              </div>
            </div>

            {/* 兑换记录 */}
            <div onClick={() => navigate('/orders?tab=exchange')} className="bg-white rounded-xl p-4 flex items-center shadow-sm cursor-pointer active:bg-gray-50">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-base mb-1">兑换记录</h4>
                <p className="text-xs text-gray-400">查看您的兑换详情</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <History className="text-purple-400" size={20} />
              </div>
            </div>

            {/* 投诉 */}
            <div onClick={() => navigate('/complaint')} className="bg-white rounded-xl p-4 flex items-center shadow-sm cursor-pointer active:bg-gray-50">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-base mb-1">投诉</h4>
                <p className="text-xs text-gray-400">全程贴心伴您行</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <MessageSquare className="text-orange-400" size={20} />
              </div>
            </div>

            {/* 客服 */}
            <div onClick={() => setServiceOpen(true)} className="bg-white rounded-xl p-4 flex items-center shadow-sm cursor-pointer active:bg-gray-50">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-base mb-1">联系客服</h4>
                <p className="text-xs text-gray-400">听见您的每句话</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <Headphones className="text-orange-400" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {serviceOpen && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/45" onClick={() => setServiceOpen(false)} />
          <div className="fixed inset-x-4 top-1/2 z-[80] mx-auto w-auto max-w-sm -translate-y-1/2 rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">联系客服</h3>
                <p className="mt-1 text-sm text-gray-400">扫码添加微信，或直接复制微信号</p>
              </div>
              <button onClick={() => setServiceOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 active:bg-gray-200">
                <X size={18} />
              </button>
            </div>

            <div className="rounded-3xl bg-gradient-to-b from-emerald-50 to-white p-4">
              <div className="overflow-hidden rounded-[28px] bg-white p-3 shadow-sm ring-1 ring-emerald-100">
                <img
                  src={SERVICE_QR_IMAGE}
                  alt="微信二维码"
                  className="h-auto w-full rounded-2xl bg-white"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                    const fallback = event.currentTarget.nextElementSibling as HTMLDivElement | null;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="hidden aspect-square w-full items-center justify-center rounded-2xl bg-gray-50 px-6 text-center text-sm leading-6 text-gray-400">
                  请将客服二维码图片放到 frontend/public/service-wechat-qr.png
                </div>
              </div>

              <p className="mt-4 text-center text-sm leading-6 text-gray-400">
                微信号：<span className="font-semibold text-gray-700">{SERVICE_WECHAT_ID}</span>
              </p>
            </div>

            <button
              onClick={handleCopyWechat}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 py-3.5 text-base font-bold text-white shadow-[0_10px_24px_rgba(16,185,129,0.28)] active:scale-[0.99]"
            >
              <Copy size={18} />
              复制微信号
            </button>
          </div>
        </>
      )}
    </div>
  );
}
