import { useState, useEffect } from 'react';
import { X, Search, Volume2, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Material {
  id: string;
  title: string;
  price: string;
  created_at: string;
}

export default function Home() {
  const noticeText = '平台仅提供信息展示服务。所有文字、图片仅供参考，请谨慎判断，自愿下单购买。';
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = async () => {
    const { data } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setMaterials(data.map(m => ({
        id: m.id,
        title: m.title,
        price: m.price.toString(),
        created_at: m.created_at
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMaterials();

    // 订阅 materials 表的插入、更新和删除
    const channel = supabase
      .channel('public:materials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        fetchMaterials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-10">
        <X size={24} className="text-gray-600" />
        <div className="text-center">
          <h1 className="text-base font-medium">广聚天下</h1>
        </div>
        <MoreHorizontal size={24} className="text-gray-600" />
      </div>

      <div className="px-4 py-2">
        {/* Top Card */}
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-[14px] p-5 text-white relative overflow-hidden mb-4 shadow-sm mt-1">
          <div className="relative z-10 text-white">
            {/* User Info & Complain Button */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center mr-2 shadow-sm border border-white/20">
                  <span className="text-xl">🧑‍🦲</span>
                </div>
                <span className="font-medium text-lg tracking-wide">六叔猛料</span>
              </div>
              <button className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 text-[13px] font-medium backdrop-blur-sm border border-white/30 transition-colors">
                <AlertCircle size={15} />
                <span>投诉TA</span>
              </button>
            </div>
            
            {/* Description */}
            <p className="text-[13px] font-normal opacity-90 mt-1">汇聚全网顶级分析推荐，每天更新精选数据</p>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute -right-4 -top-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
        </div>

        {/* Announcement */}
        <div className="bg-white rounded-xl px-3 py-3 flex items-center text-sm text-gray-600 mb-4 shadow-sm border border-gray-100">
          <Volume2 size={18} className="text-orange-500 mr-2 flex-shrink-0" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="notice-marquee">
              <div className="notice-marquee-track">
                <span className="notice-marquee-text">{noticeText}</span>
                <span className="notice-marquee-text" aria-hidden="true">{noticeText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-full p-1 mb-4">
          <button className="flex-1 bg-red-500 text-white py-2 rounded-full text-sm font-medium">所有套餐</button>
          <button className="flex-1 text-gray-600 py-2 rounded-full text-sm font-medium">历史战绩</button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="请输入文章名称" 
            className="w-full bg-white rounded-full py-2.5 pl-10 pr-20 text-sm focus:outline-none shadow-sm"
          />
          <button className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-medium">
            搜索
          </button>
        </div>

        {/* List */}
        <div className="space-y-3 pb-20">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">加载数据中...</div>
          ) : materials.length > 0 ? (
            materials.map((m) => (
              <Link to={`/detail/${m.id}`} key={m.id} className="block bg-white rounded-xl p-4 shadow-sm active:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-bold text-gray-800 text-base leading-snug w-2/3">{m.title}</h3>
                  <span className="text-red-500 font-bold text-lg">¥{parseFloat(m.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>发布时间</span>
                  <span>{new Date(m.created_at).toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  );
}
