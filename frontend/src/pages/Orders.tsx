import { useState, useEffect } from 'react';
import { ReceiptText, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOrders([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('purchase_records')
        .select('*')
        .eq('auth_user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setOrders(data);
      }
    } catch (e) {
      console.error('获取订单记录失败：', e);
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
            className="flex-1 py-2 rounded-full text-sm font-medium transition-colors bg-red-500 text-white shadow-sm"
          >
            订单记录
          </button>
        </div>
      </div>

      <div className="px-4 py-1">
        {loading ? (
           <div className="py-20 flex justify-center text-gray-400">
             <Loader2 className="animate-spin" size={28} />
           </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-2">
                  <h3 className="text-base font-medium text-gray-800">{order.product_name || order.planName || '订阅套餐'}</h3>
                  <span className={`text-xs font-medium ${
                    order.payment_status === 'paid' ? 'text-green-500' : 
                    order.payment_status === 'pending' ? 'text-blue-500' : 
                    'text-gray-400'
                  }`}>
                    {order.payment_status === 'paid' ? '已支付' : 
                     order.payment_status === 'pending' ? '处理中' : 
                     order.payment_status === 'failed' ? '支付失败' :
                     order.payment_status === 'refunded' ? '已退款' :
                     order.payment_status === 'cancelled' ? '已取消' : order.payment_status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500 block">订单号: {order.order_no || order.id}</span>
                    <p className="mt-1 text-xs text-gray-400">{new Date(order.created_at).toLocaleString('zh-CN')}</p>
                  </div>
                  <div className="text-right flex items-end">
                    <span className="text-lg font-bold text-gray-800">¥{Number(order.amount).toFixed(2)}</span>
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
          </div>
        )}
      </div>
    </div>
  );
}
