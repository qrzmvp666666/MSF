import { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ComplaintRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setRecords(data);
      }
    } catch (e) {
      console.error('获取投诉记录失败', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100">
        <ChevronLeft size={24} className="text-gray-600 cursor-pointer" onClick={() => navigate(-1)} />
        <h1 className="flex-1 text-center font-bold text-gray-800 text-lg pr-6">投诉记录</h1>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="py-20 flex justify-center text-gray-400">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-2">
                  <span className="text-xs text-gray-500">
                    {new Date(record.created_at).toLocaleString('zh-CN')}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    record.status === '已处理' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {record.status || '处理中'}
                  </span>
                </div>
                <div className="mt-2 flex">
                  <p className="text-sm text-gray-700 leading-relaxed flex-1 whitespace-pre-wrap">
                    {record.content}
                  </p>
                </div>
                {record.image_data && (
                  <div className="mt-3">
                    <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-100 relative group cursor-pointer">
                      <img src={record.image_data} alt="截图" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon size={16} className="text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm border border-gray-100 mt-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <span className="text-2xl">📝</span>
            </div>
            <div className="mt-4 text-base font-medium text-gray-800">暂无投诉反馈记录</div>
          </div>
        )}
      </div>
    </div>
  );
}