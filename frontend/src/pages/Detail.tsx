import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Gift, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { normalizeChineseMainlandPhone } from '../lib/userDisplay';
import Login from './Login';

const donateH5Url = import.meta.env.VITE_DONATE_H5_URL || '';

function getUserPhone(session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) {
  const candidates = [
    session?.user?.phone,
    session?.user?.user_metadata?.login_phone,
    session?.user?.email?.replace(/@msf\.local$/, ''),
  ];

  for (const value of candidates) {
    const normalizedPhone = normalizeChineseMainlandPhone(value);

    if (normalizedPhone) {
      return normalizedPhone;
    }
  }

  return '';
}

function buildDonateUrl(phone: string) {
  if (!donateH5Url) return '';

  const url = donateH5Url.startsWith('http://') || donateH5Url.startsWith('https://')
    ? new URL(donateH5Url)
    : new URL(donateH5Url, window.location.origin);

  if (phone) {
    url.searchParams.set('phone', phone);
  }

  return url.toString();
}

function tryParseJson(value: unknown): Record<string, unknown> | null {
  if (!value) return null;

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function extractMaterialIdFromRemark(remark: unknown): string | null {
  const queue: unknown[] = [remark];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    const parsed = tryParseJson(current);
    if (!parsed) {
      continue;
    }

    const directMaterialId = parsed.material_id;
    if (typeof directMaterialId === 'string' && directMaterialId.trim()) {
      return directMaterialId.trim();
    }

    const directSource = parsed.source;
    if (typeof directSource === 'string' && directSource.trim()) {
      return directSource.trim();
    }

    const directMaterialCode = parsed.materialId;
    if (typeof directMaterialCode === 'string' && directMaterialCode.trim()) {
      return directMaterialCode.trim();
    }

    Object.values(parsed).forEach((value) => {
      if (value && (typeof value === 'string' || typeof value === 'object')) {
        queue.push(value);
      }
    });
  }

  return null;
}

function extractIssueNumber(title: string) {
  const match = title.match(/第\s*(\d+)\s*期/i);
  return match ? Number(match[1]) : -1;
}

function compareRecords(
  left: { title: string; created_at: string },
  right: { title: string; created_at: string },
) {
  const issueDiff = extractIssueNumber(right.title) - extractIssueNumber(left.title);
  if (issueDiff !== 0) {
    return issueDiff;
  }

  const timeDiff = new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }

  return right.title.localeCompare(left.title, 'zh-CN');
}

export default function Detail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showDonateIframe, setShowDonateIframe] = useState(false);
  const [donateIframeUrl, setDonateIframeUrl] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const historySectionRef = useRef<HTMLDivElement | null>(null);
  
  // 数据状态
  const [material, setMaterial] = useState<{ title: string, price: string, created_at: string } | null>(null);
  const [records, setRecords] = useState<{ id: string, title: string, content: string, created_at: string, is_winner: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 兑换相关状态
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // 获取详情和往期记录
  const checkUnlockStatus = useCallback(async (userId: string) => {
    if (!id) return false;

    const { data: exData } = await supabase
      .from('exchange_records')
      .select('id')
      .eq('material_id', id)
      .eq('user_id', userId)
      .eq('status', '已完成')
      .limit(1);

    if (exData && exData.length > 0) {
      return true;
    }

    const { data: matchedPurchaseRecords } = await supabase
      .from('purchase_records')
      .select('id')
      .eq('auth_user_id', userId)
      .eq('payment_status', 'paid')
      .eq('material_id', id)
      .limit(1);

    if (matchedPurchaseRecords && matchedPurchaseRecords.length > 0) {
      return true;
    }

    const { data: purchaseData } = await supabase
      .from('purchase_records')
      .select('id, order_no, payment_status, material_id, remark')
      .eq('auth_user_id', userId)
      .eq('payment_status', 'paid')
      .order('completed_time', { ascending: false })
      .limit(20);

    return (purchaseData || []).some((record) => record.material_id === id || extractMaterialIdFromRemark(record.remark) === id);
  }, [id]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setIsUnlocked(false);
    
    // 取资料详情
    const { data: matData } = await supabase.from('materials').select('*').eq('id', id).single();
    if (matData) {
      setMaterial({ title: matData.title, price: matData.price.toString(), created_at: matData.created_at });
    }
    
    // 取往期记录
    const { data: recData } = await supabase.from('records').select('*').eq('material_id', id).order('created_at', { ascending: false });
    if (recData) {
      const normalizedRecords = recData.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        created_at: r.created_at,
        is_winner: Boolean(r.is_winner),
      }));

      normalizedRecords.sort(compareRecords);
      setRecords(normalizedRecords);
    }
    
    // 检查当前用户是否已解锁该内容
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const unlocked = await checkUnlockStatus(session.user.id);
      if (unlocked) {
        setIsUnlocked(true);
      }
    }

    setLoading(false);
  }, [checkUnlockStatus, id]);

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

  useEffect(() => {
    if (!showDonateIframe || isUnlocked) {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchData();
    }, 3000);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchData, isUnlocked, showDonateIframe]);

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      alert('请输入兑换码');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    
    setIsRedeeming(true);
    try {
      // 验证兑换码
      const { data: codeData, error: codeError } = await supabase
        .from('exchange_codes')
        .select('*')
        .eq('code', redeemCode)
        .single();
        
      if (codeError || !codeData || codeData.is_used) {
        alert('兑换码无效或已被使用');
        setIsRedeeming(false);
        return;
      }
      
      // 生成兑换记录
      const title = material ? material.title : '兑换内容';
      const { error: recordError } = await supabase.from('exchange_records').insert({
        user_id: session.user.id,
        material_id: id,
        code: redeemCode,
        title: title,
        status: '已完成'
      });
      
      if (recordError) {
        alert('生成兑换记录失败: ' + recordError.message);
        setIsRedeeming(false);
        return;
      }
      
      // 更新兑换码状态
      await supabase
        .from('exchange_codes')
        .update({ is_used: true })
        .eq('id', codeData.id);
        
      alert('兑换成功！');
      setIsUnlocked(true);
      setRedeemCode('');
    } catch (e: any) {
      console.error(e);
      alert('兑换出错: ' + e.message);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleDonateClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    const nextUrl = buildDonateUrl(getUserPhone(session));
    if (!nextUrl) {
      alert('未配置打赏 H5 地址');
      return;
    }

    const donateUrl = new URL(nextUrl);
    donateUrl.searchParams.set('source', id || '');
    donateUrl.searchParams.set('material_id', id || '');
    donateUrl.searchParams.set('price', material?.price || '');

    setDonateIframeUrl(donateUrl.toString());
    setShowDonateIframe(true);
  };

  const handleCloseDonateIframe = () => {
    setShowDonateIframe(false);
    void fetchData();
  };

  const handleScrollToHistory = () => {
    historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/');
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      <div className="px-4 py-4">
        {/* Author info */}
        <div className="relative mb-4 mt-2 flex items-center justify-center">
          <button
            type="button"
            onClick={handleBackClick}
            className="absolute left-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm border border-gray-100 transition-colors hover:bg-gray-50 active:scale-[0.98]"
            aria-label="返回"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-orange-200">
              <span className="text-xl">🎁</span>
            </div>
            <span className="text-lg font-medium text-gray-800">广聚天下</span>
          </div>
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
            <div className="flex items-center text-xs text-gray-500 mb-6 mt-2">
              <span>{new Date(material.created_at).toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')}</span>
              <span className="mx-2">•</span>
              <span>123321人已阅读</span>
            </div>

            {/* Paid Content */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-lg flex items-center mb-0">
                  <span className="w-1 h-4 bg-red-500 rounded-full mr-2"></span>
                  付费内容
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleScrollToHistory}
                    className="text-xs text-orange-500 bg-orange-50 px-2.5 py-1 rounded border border-orange-100 transition-colors hover:bg-orange-100"
                  >
                    往期
                  </button>
                  {records.length > 0 && (
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                      已更新: {new Date(records[0].created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              {isUnlocked && records.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="font-bold text-gray-900 mb-3">{records[0].title}</p>
                  <div 
                    className="text-[15px] prose-sm prose-p:my-1 prose-headings:my-2 [&_span]:!leading-normal"
                    dangerouslySetInnerHTML={{ __html: records[0].content }}
                  />
                </div>
              ) : isUnlocked ? (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center text-gray-500">
                  暂无最新内容
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center border border-gray-100">
                  <Gift className="text-red-400 w-12 h-12 mb-4 opacity-80" />
                  <p className="text-gray-400 text-sm mb-5">
                    打赏 ¥{parseFloat(material.price).toFixed(2)} 或使用兑换码解锁
                  </p>
                  
                  <div className="w-full max-w-xs relative mb-4 flex items-center">
                    <input 
                      type="text" 
                      value={redeemCode}
                      onChange={e => setRedeemCode(e.target.value)}
                      placeholder="请输入兑换码" 
                      className="w-full border border-gray-200 rounded-full pl-4 pr-20 py-2.5 text-sm focus:outline-none focus:border-red-400 transition-colors bg-gray-50"
                    />
                    <button 
                      onClick={handleRedeem}
                      disabled={isRedeeming}
                      className="absolute right-1 top-1 bottom-1 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full text-sm font-medium whitespace-nowrap active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
                    >
                      {isRedeeming ? '...' : '兑换'}
                    </button>
                  </div>

                  <div className="flex items-center w-full max-w-xs my-2">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-3 text-xs text-gray-400 font-medium tracking-widest uppercase">或者</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>

                  <button 
                    onClick={handleDonateClick}
                    className="mt-2 px-8 py-2.5 bg-red-500 text-white rounded-full text-sm font-bold shadow-md shadow-red-500/30 w-full max-w-xs"
                  >
                    立即打赏解锁
                  </button>
                </div>
              )}
            </div>

            {/* History records */}
            <div ref={historySectionRef} className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
                <span className="w-1 h-4 bg-orange-500 rounded-full mr-2"></span>
                相关往期战绩参考
              </h3>
              {records.length > 1 ? (
                <div className="space-y-4">
                  {records.slice(1).map(record => (
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

      {/* Floating Action Bar */}
      <div className="fixed bottom-5 left-0 right-0 z-50 px-4 flex justify-center">
        <div className="bg-[#fdf4cd] rounded-full flex items-center justify-between pl-4 pr-1 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-[#fbe8b5] w-full max-w-[520px]">
          <div className="text-[#9d5c36] font-bold text-[15px] tracking-wide flex-1">
            打赏价格: {loading || !material ? '--' : parseFloat(material.price).toFixed(2)}
          </div>
          <button
            onClick={handleDonateClick}
            className="bg-gradient-to-r from-[#ff6b57] to-[#ff4141] hover:opacity-95 text-white font-bold text-[15px] px-6 py-2.5 rounded-full shadow-md transition-opacity"
          >
            打赏解锁
          </button>
        </div>
      </div>

      {showDonateIframe && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-[1px]"
            onClick={handleCloseDonateIframe}
          />
          <div className="fixed inset-0 z-[70] bg-white animate-[slideUp_0.2s_ease-out]">
            <button
              onClick={handleCloseDonateIframe}
              className="absolute left-3 z-[80] flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f7fb]/95 text-gray-700 shadow-[0_4px_12px_rgba(15,23,42,0.08)] ring-1 ring-black/5 backdrop-blur-[2px] transition-colors hover:bg-white"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="h-full bg-gray-50">
              <iframe
                key={donateIframeUrl}
                src={donateIframeUrl}
                title="打赏 H5 页面"
                className="h-full w-full border-0 bg-white"
                allow="payment *; clipboard-write"
              />
            </div>
            <button
              onClick={handleCloseDonateIframe}
              className="fixed right-0 bottom-24 z-[80] overflow-hidden rounded-l-full border-y-2 border-l-2 border-red-300 bg-white/95 pl-4 pr-3 py-2.5 text-left shadow-[0_4px_14px_rgba(239,68,68,0.18)] backdrop-blur-[2px] transition-colors hover:bg-red-50"
            >
              <span className="block text-[12px] font-semibold leading-4 text-red-500 whitespace-nowrap">支付成功后点此返回</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-red-400 whitespace-nowrap">查阅付费内容</span>
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
          <Login isModal onSuccess={() => { setShowLoginModal(false); void handleDonateClick(); }} />
        </div>
      )}
    </div>
  );
}
