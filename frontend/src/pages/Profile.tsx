import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Headphones, ChevronRight, FileText, History } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('👨‍💼');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUserId(user.id.slice(0, 8).toUpperCase());

      const fallbackNickname = user.email ? user.email.replace('@msf.local', '') : '未设置';

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
            <div className="bg-white rounded-xl p-4 flex items-center shadow-sm">
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
    </div>
  );
}
