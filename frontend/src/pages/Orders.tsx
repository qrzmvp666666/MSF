import { X, MoreHorizontal, ReceiptText } from 'lucide-react';

export default function Orders() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3">
        <X size={24} className="text-gray-600" />
        <div className="text-center">
          <h1 className="text-base font-medium">订单</h1>
          <p className="text-xs text-gray-400">www.xqacr.cn</p>
        </div>
        <MoreHorizontal size={24} className="text-gray-600" />
      </div>

      <div className="px-4 py-6">
        <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm border border-gray-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <ReceiptText className="text-red-400" size={28} />
          </div>
          <div className="mt-4 text-lg font-semibold text-gray-800">暂无订单记录</div>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            您当前还没有购买记录，后续接入 Supabase 后可在这里展示打赏订单和支付状态。
          </p>
        </div>
      </div>
    </div>
  );
}
