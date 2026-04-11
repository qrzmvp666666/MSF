import { X, MoreHorizontal, ReceiptText } from 'lucide-react';

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
  // 可以切换 false 或 [] 测试空状态
  const hasOrders = mockOrders && mockOrders.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <div className="w-6" />
        <div className="text-center">
          <h1 className="text-base font-medium">广聚天下</h1>
        </div>
        <MoreHorizontal size={24} className="text-gray-600" />
      </div>

      <div className="px-4 py-4">
        {hasOrders ? (
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
        )}
      </div>
    </div>
  );
}
