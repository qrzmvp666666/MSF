import { X, MoreHorizontal, Eye, MessageSquare, ShieldCheck, Headphones, Wallet } from 'lucide-react';

export default function Profile() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-10">
        <X size={24} className="text-gray-600" />
        <div className="text-center font-medium">www.xqacr.cn</div>
        <MoreHorizontal size={24} className="text-gray-600" />
      </div>

      <div className="px-4 py-4">
        {/* User Info */}
        <div className="flex items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center mr-4 border border-gray-100">
             <span className="text-2xl">👨‍💼</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">永丰机械</h2>
            <div className="flex items-center mt-1">
              <span className="bg-red-50 text-red-500 text-xs px-2 py-0.5 rounded mr-2 border border-red-100">SVIP</span>
              <span className="text-gray-500 text-sm">34203759</span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
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
          {/* Decorative shapes */}
          <div className="absolute -right-4 -top-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
          <div className="absolute right-10 -bottom-10 w-24 h-24 rounded-full bg-red-700 opacity-20"></div>
        </div>

        {/* More Functions */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 mb-3 text-lg">更多功能</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Item 1 */}
            <div className="bg-white rounded-xl p-4 flex items-center shadow-sm">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-base mb-1">彩贝明细</h4>
                <p className="text-xs text-gray-400">每一笔账都清楚</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Wallet className="text-red-400" size={20} />
              </div>
            </div>

            {/* Item 2 */}
            <div className="bg-white rounded-xl p-4 flex items-center shadow-sm">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-base mb-1">投诉</h4>
                <p className="text-xs text-gray-400">全程贴心伴您行</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <MessageSquare className="text-orange-400" size={20} />
              </div>
            </div>

            {/* Item 3 */}
            <div className="bg-white rounded-xl p-4 flex items-center shadow-sm">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-base mb-1">隐私协议</h4>
                <p className="text-xs text-gray-400">全心守护您隐私</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <ShieldCheck className="text-red-400" size={20} />
              </div>
            </div>

            {/* Item 4 */}
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
