import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfileInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-base font-medium text-gray-900">个人信息</h1>
        <div className="w-6" />
      </div>

      <div className="px-4 py-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-[15px] text-gray-500">头像</span>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-2xl border border-gray-100">
                👨‍💼
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-[15px] text-gray-500">昵称</span>
            <div className="flex items-center gap-2 text-gray-900">
              <span className="text-[15px]">永丰机械</span>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-[15px] text-gray-500">手机号</span>
            <span className="text-[15px] text-gray-900">138****8888</span>
          </div>

          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <div className="text-[15px] text-gray-500">登录密码</div>
              <div className="mt-1 text-xs text-gray-400">出于安全原因，密码不支持明文展示</div>
            </div>
            <div className="flex items-center gap-2 text-gray-900">
              <span className="text-[15px] tracking-[0.3em]">••••••••</span>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
