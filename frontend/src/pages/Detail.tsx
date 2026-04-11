import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, MoreHorizontal, Gift, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Login from './Login';

export default function Detail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'caibei'>('alipay');
  
  // 数据状态
  const [material, setMaterial] = useState<{ title: string, price: string, created_at: string } | null>(null);
  const [records, setRecords] = useState<{ id: string, title: string, content: string, created_at: string, is_winner: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取详情和往期记录
  const fetchData = useCallback(async () => {
    if (!id) return;
    
    // 取资料详情
    const { data: matData } = await supabase.from('materials').select('*').eq('id', id).single();
    if (matData) {
      setMaterial({ title: matData.title, price: matData.price.toString(), created_at: matData.created_at });
    }
    
    // 取往期记录
    const { data: recData } = await supabase.from('records').select('*').eq('material_id', id).order('created_at', { ascending: false });
    if (recData) {
      setRecords(recData.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        created_at: r.created_at,
        is_winner: Boolean(r.is_winner),
      })));
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();

    // 订阅当前资料 records 表的变更以实现实时通信
    const channel = supabase
      .channel(`public:records:material_id=eq.${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'records',
        filter: `material_id=eq.${id}`
      }, () => {
        fetchData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'materials',
        filter: `id=eq.${id}`
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchData]);

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
      key: 'alipay' as const,
      label: '支付宝支付',
      hint: '推荐（付款优惠9.95折）',
      icon: <span className="text-xl font-bold italic font-sans" style={{fontFamily: 'sans-serif'}}>支</span>,
      iconClassName: 'bg-[#00a3fe] text-white',
    },
    {
      key: 'caibei' as const,
      label: '彩贝支付',
      hint: '用户余额：',
      icon: <Gift size={20} className="stroke-[2.5px]" />,
      iconClassName: 'bg-[#ff4d4f] text-white',
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-10">
        <ChevronLeft size={24} className="text-gray-600" onClick={() => navigate(-1)} />
        <div className="text-center">
          <h1 className="text-base font-medium">广聚天下</h1>
        </div>
        <MoreHorizontal size={24} className="text-gray-600" />
      </div>

      <div className="px-4 py-4">
        {/* Author info */}
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-200 overflow-hidden flex items-center justify-center mr-3">
             <span className="text-xl">🎁</span>
          </div>
          <span className="font-medium text-gray-800 text-lg">广聚天下</span>
        </div>

        {/* Notice */}
        <div className="bg-yellow-50 text-yellow-700 text-[13px] p-3 rounded-lg leading-relaxed mb-6">
          所有文字、图片仅供参考，不保证连续性及任何承诺，自愿付费打赏，请谨慎下单，购买即接受协议，本声明具有法律效力依据，请悉知！
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">正在加载数据...</div>
        ) : !material ? (
          <div className="text-center py-20 text-gray-500">资料不存在或已被删除</div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 leading-snug mb-3">
              {material.title}
            </h1>
            <div className="flex items-center text-xs text-gray-500 mb-6">
              <span>{new Date(material.created_at).toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')}</span>
              <span className="mx-2">•</span>
              <span>123321人已阅读</span>
            </div>

            {/* Paid Content */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                <span className="w-1 h-4 bg-red-500 rounded-full mr-2"></span>
                付费内容
              </h3>
              <div className="bg-white rounded-xl shadow-sm p-10 flex flex-col items-center justify-center border border-gray-100">
                <Gift className="text-red-400 w-16 h-16 mb-4 opacity-80" />
                <p className="text-gray-400 text-sm">打赏 ¥{parseFloat(material.price).toFixed(2)} 解锁核心机密资料</p>
                <button 
                  onClick={handleDonateClick}
                  className="mt-6 px-8 py-2.5 bg-red-500 text-white rounded-full text-sm font-bold shadow-md shadow-red-500/30"
                >
                  立即打赏解锁
                </button>
              </div>
            </div>

            {/* History records */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
                <span className="w-1 h-4 bg-orange-500 rounded-full mr-2"></span>
                相关往期战绩参考
              </h3>
              {records.length > 0 ? (
                <div className="space-y-4">
                  {records.map(record => (
                    <div key={record.id} className="relative overflow-hidden bg-orange-50/50 rounded-xl p-4 border border-orange-100/50">
                      {record.is_winner && (
                        <div className="pointer-events-none absolute right-3 top-3 rotate-12 rounded-full border-2 border-red-400 px-3 py-1 text-xs font-extrabold tracking-[0.2em] text-red-400 opacity-80">
                          中奖
                        </div>
                      )}
                      <p className="font-bold text-gray-900 mb-2 truncate pr-16">{record.title}</p>
                      <div 
                        className="text-[15px] prose-sm prose-p:my-1 prose-headings:my-2 [&_span]:!leading-normal" 
                        dangerouslySetInnerHTML={{ __html: record.content }} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100 text-gray-400 text-sm">
                  <p>暂无相关战绩记录</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Red Return Button */}
      <div 
        onClick={() => navigate(-1)}
        className="fixed right-3 bottom-24 w-12 h-12 bg-white/95 rounded-full flex items-center justify-center border-2 border-red-400 shadow-[0_2px_12px_rgba(239,68,68,0.25)] z-40 cursor-pointer hover:bg-red-50 transition-colors backdrop-blur-[2px]"
      >
        <span className="text-red-500 font-medium text-[13px] tracking-wider ml-0.5">返回</span>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-0 right-0 z-50 px-4 flex justify-center">
        <div className="bg-[#fdf4cd] rounded-full flex items-center justify-between pl-5 pr-1 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-[#fbe8b5] w-full max-w-[600px]">
          <div className="text-[#9d5c36] font-bold text-[17px] tracking-wide flex-1">
            打赏价格: {loading || !material ? '--' : parseFloat(material.price).toFixed(2)}
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
          <div className="fixed bottom-0 left-0 w-full max-w-md z-[70] rounded-t-3xl bg-[#f7f8fa] pb-8 shadow-[0_-16px_50px_rgba(0,0,0,0.18)] animate-[slideUp_0.2s_ease-out]">
            {/* Header */}
            <div className="relative flex items-center justify-center pt-5 pb-4 bg-white rounded-t-3xl">
              <h3 className="text-[17px] font-bold text-gray-900">选择赞赏方式</h3>
              <button
                onClick={() => setShowPaymentSheet(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-2"
              >
                <X size={22} strokeWidth={2} />
              </button>
            </div>

            {/* Options */}
            <div className="px-5 pt-5 space-y-4">
              {paymentOptions.map((option) => {
                const selected = paymentMethod === option.key;

                return (
                  <button
                    key={option.key}
                    onClick={() => setPaymentMethod(option.key)}
                    className="flex w-full items-center rounded-[20px] bg-white px-5 py-4 transition-all"
                  >
                    <div className={`mr-4 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${option.iconClassName}`}>
                      {option.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center">
                        <span className="text-[16px] font-medium text-gray-900">{option.label}</span>
                        {option.key === 'caibei' && (
                          <span className="ml-2 text-[14px] text-[#ff4d4f] underline underline-offset-2">去充值</span>
                        )}
                      </div>
                      
                      {option.key === 'alipay' && (
                        <div className="mt-1 text-[13px] text-[#ff4d4f]">
                          {option.hint}
                        </div>
                      )}
                      
                      {option.key === 'caibei' && (
                        <div className="mt-1 text-[13px] text-gray-400">
                          {option.hint}<span className="text-[#ff4d4f]">￥0.00</span>
                        </div>
                      )}
                    </div>
                    
                    <div 
                      className="ml-4 flex items-center justify-center w-[22px] h-[22px] rounded-full border-2 transition-colors duration-200" 
                      style={{ borderColor: selected ? '#ff4d4f' : '#f0f0f0' }}
                    >
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#ff4d4f]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer button */}
            <div className="px-5 mt-8">
              <button className="w-full rounded-full bg-[#ff4d4f] py-[14px] text-[17px] font-medium text-white transition-opacity active:opacity-90 shadow-sm">
                ￥ 288.00 确定打赏
              </button>
            </div>
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
