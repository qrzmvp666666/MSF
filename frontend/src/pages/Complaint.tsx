import { useState } from 'react';
import { ChevronLeft, Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Complaint() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('请输入投诉内容');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('您尚未登录');
        navigate('/login', { replace: true });
        return;
      }
      
      const { error } = await supabase.from('complaints').insert({
        user_id: session.user.id,
        content: content.trim(),
        image_data: image, // in a real app this should be uploaded to a bucket and URL saved
        status: '处理中'
      });
      
      if (error) {
        alert('提交失败: ' + error.message);
      } else {
        alert('提交成功！感谢您的反馈。');
        navigate('/complaint-records');
      }
    } catch (e: any) {
      console.error(e);
      alert('提交异常');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100">
        <ChevronLeft size={24} className="text-gray-600 cursor-pointer" onClick={() => navigate(-1)} />
        <h1 className="font-bold text-gray-800 text-lg">意见与投诉</h1>
        <div 
          onClick={() => navigate('/complaint-records')}
          className="text-sm text-gray-600 font-medium cursor-pointer active:text-gray-900"
        >
          投诉记录
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <textarea
            className="w-full bg-transparent resize-none outline-none text-gray-700 text-sm leading-relaxed min-h-[120px] placeholder-gray-400"
            placeholder="请详细描述您遇到的问题或投诉内容..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
          />
          <div className="text-right text-xs text-gray-400 mt-2">
            {content.length}/500
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-50">
            <h4 className="text-gray-700 text-sm font-medium mb-3">上传截图 (选填)</h4>
            {image ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-100">
                <img src={image} alt="Screenshot" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
                <Camera size={24} className="mb-1 text-gray-400" />
                <span className="text-xs">添加图片</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-red-500 text-white font-bold py-3.5 rounded-full shadow-md shadow-red-500/20 active:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '提交中...' : '提交反馈'}
        </button>
      </div>
    </div>
  );
}
