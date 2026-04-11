import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MoreHorizontal, ReceiptText, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

// 模拟的订单列表数据
const mockOrders = [
  {
    id: 'ORD-20260411-001',
    planName: '年度终极套餐',
    amount: '199.00',
    status: '处理中',
    date: '2026-04-11 10:23:45',
  },
  {
    id: 'ORD-20260410-002',
    planName: '季度尊享套餐',
    amount: '59.00',
    status: '已支付',
    date: '2026-04-10 14:15:22',
  },
  {
    id: 'ORD-20260408-003',
    planName: '单月体验套餐',
    amount: '19.90',
    status: '已关闭',
    date: '2026-04-08 09:30:11',
  }
];

export default function Orders() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'exchange' ? 'exchange' : 'orders';
  const [activeTab, setActiveTab] = useState<'orders' | 'exchange'>(initialTab);

  const [exchangeRecords, setExchangeRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 这里的订单记录可后续再接入数据库，目前保持现状（mock 数据）
  const hasOrders = mockOrders && mockOrders.length > 0;

  useEffect(() => {
    if (activeTab === 'exchange') {
      fetchExchangeRecords();
    }
  }, [activeTab]);

  const fetchExchangeRecords = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setExchangeRecords([]);
        return;
      }
      // 假设表名为 exchange_records
      const { data, error } = await supabase
        .from('exchange_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setExchangeRecords(data);
      }
    } catch (e) {
      console.error('获取兑换记录失败：', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 bg-gray-50 px-4 py-3">
        {/* Tabs */}
        <div className="flex bg-gray-200/60 rounded-full p-1 backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600'}`}
          >
            订单记录
          </button>
          <button 
            onClick={() => setActiveTab('exchange')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'exchange' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600'}`}
          >
            兑换记录
          </button>
        </div>
      </div>

      <div className="px-4 py-1">
        {activeTab === 'orders' ? (
          /* ================= 订单记录内容 ================= */
          hasOrders ? (
            <div className="space-y-3">
              {mockOrders.map((order) => (
                <div key={order.id} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-2">
                    <h3 className="text-base font-medium text-gray-800">{order.planName}</h3>
                    <span className={`text-xs font-medium ${
                      order.status === '已支付' ? 'text-green-500' : 
                      order.status === '处理中' ? 'text-blue-500' : 
                      'text-gray-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block">订单号: {order.id}</span>
                      <p className="mt-1 text-xs text-gray-400">{order.date}</p>
                    </div>
                    <div className="text-right flex items-end">
                      <span className="text-lg font-bold text-gray-800">¥{order.amount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm border border-gray-100 mt-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <ReceiptText className="text-red-400" size={28} />
              </div>
              <div className="mt-4 text-lg font-semibold text-gray-800">暂无订单记录</div>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                您当前还没有购买记录，后续接入 Supabase 后可在这里展示打赏订单和支付状态。
              </p>
            </div>
          )
        ) : (
          /* ================= 兑换记录内容 ================= */
          loading ? (
             <div className="py-20 flex justify-center text-gray-400">
               <Loader2 className="animate-spin" size={28} />
             </div>
          ) : exchangeRecords && exchangeRecords.length > 0 ? (
            <div className="space-y-3">
              {exchangeRecords.map((record: any) => (
                <div key={record.id} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-2">
                    <h3 className="text-base font-medium text-gray-800">{record.title || record.item_name || '兑换项目'}</h3>
                    <span className={`text-xs font-medium ${
                      record.status === '已完成' || record.status === 'success' ? 'text-green-500' : 
                      record.status === '处理中' || record.status === 'pending' ? 'text-blue-500' : 
                      'text-gray-400'
                    }`}>
                      {record.status || '已完成'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block">兑换记录号: {record.id.slice(0,8)}</span>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(record.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right flex items-end">
                      <span className="text-lg font-bold text-gray-800 text-purple-600">
                        {record.amount || record.points || record.cost ? '-' + (record.amount || record.points || record.cost) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm border border-gray-100 mt-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
                <RefreshCw className="text-purple-400" size={28} />
              </div>
              <div className="mt-4 text-lg font-semibold text-gray-800">暂无兑换记录</div>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                您当前没有任何兑换操作记录。
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
