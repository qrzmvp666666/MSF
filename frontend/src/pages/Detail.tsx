import { ChevronLeft, MoreHorizontal, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Detail() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
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
              <div className="flex flex-col space-y-1 text-red-500 font-medium ml-2">
                <span>龙</span>
                <span>马</span>
                <span>鸡</span>
                <span>狗</span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-2 mb-4">
              <p className="font-medium text-gray-700 mb-2">第099期 新澳 16码 连红稳吃肉</p>
              <div className="flex flex-col space-y-1 text-red-500 font-medium ml-2">
                <span>猪</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 w-full max-w-md bg-white border-t p-3 flex justify-between items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="text-gray-700 font-medium">
          打赏价格: <span className="text-red-500 font-bold text-lg">288.00</span>
        </div>
        <button className="bg-gradient-to-r from-red-400 to-red-600 text-white font-medium px-8 py-2.5 rounded-full shadow-md">
          打赏解锁
        </button>
      </div>

      {/* Floating Red Return Button */}
      <div className="fixed right-4 bottom-24 w-12 h-12 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-500 shadow-sm opacity-80">
        <span className="text-red-500 font-bold text-sm">返回</span>
      </div>
    </div>
  );
}
