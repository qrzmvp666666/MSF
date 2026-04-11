import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ArrowLeft, Plus, Edit2, Trash2, Check, User, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Record {
  id: string;
  title: string;
  content: string;
  material_id?: string;
  created_at?: string;
}

interface Material {
  id: string;
  title: string;
  price: string;
  created_at?: string;
  records: Record[];
}

const RichTextEditor = ({ content, onChange }: { content: string, onChange: (val: string) => void }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[150px] border border-gray-200 rounded-md p-3 bg-white',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>加粗</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>斜体</button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive('strike') ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>删除线</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-xs rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>列表</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default function Admin() {
  const navigate = useNavigate();
  // 登录状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 业务状态
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data: mats, error: matsErr } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    const { data: recs, error: recsErr } = await supabase.from('records').select('*').order('created_at', { ascending: false });
    
    if (!matsErr && !recsErr) {
      const matched = (mats || []).map((m: { id: string, title: string, price: number, created_at: string }) => ({
        id: m.id,
        title: m.title,
        price: String(m.price || 0),
        created_at: m.created_at,
        records: (recs || []).filter((r: { id: string, title: string, content: string, material_id: string }) => r.material_id === m.id)
      }));
      setMaterials(matched);
      // update editingMaterial if currently editing
      if (editingMaterial) {
        const updated = matched.find(m => m.id === editingMaterial.id);
        if (updated) setEditingMaterial(updated);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMaterials();
    }
  }, [isAuthenticated]);

  async function handleLogin() {
    setLoginError('');
    if (!account) {
      setLoginError('请输入账号');
      return;
    }
    if (!password) {
      setLoginError('请输入密码');
      return;
    }
    setLoginLoading(true);
    
    // 匹配 admin 表中的超管账号
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', account)
      .eq('password', password)
      .single();

    if (error || !data) {
      setLoginError('账号或密码错误 (若未创建请去Supabase插入表)');
      setLoginLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setLoginLoading(false);
  }

  const handleSaveMaterial = async () => {
    if (!editingMaterial) return;
    if (editingMaterial.id.startsWith('new_')) {
      await supabase.from('materials').insert({
        title: editingMaterial.title,
        price: parseFloat(editingMaterial.price) || 0
      });
    } else {
      await supabase.from('materials').update({
        title: editingMaterial.title,
        price: parseFloat(editingMaterial.price) || 0
      }).eq('id', editingMaterial.id);
    }
    setEditingMaterial(null);
    fetchMaterials();
  };

  const handleCreateMaterial = () => {
    setEditingMaterial({
      id: 'new_' + Date.now(),
      title: '新资料标题',
      price: '0.00',
      records: []
    });
  };

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('确定要删除这条资料及其所有记录吗？')) {
      await supabase.from('materials').delete().eq('id', id);
      fetchMaterials();
    }
  };

  const handleSaveRecord = async () => {
    if (!editingRecord || !editingMaterial) return;
    if (editingRecord.id.startsWith('new_')) {
      await supabase.from('records').insert({
        material_id: editingMaterial.id,
        title: editingRecord.title,
        content: editingRecord.content
      });
    } else {
      await supabase.from('records').update({
        title: editingRecord.title,
        content: editingRecord.content
      }).eq('id', editingRecord.id);
    }
    setEditingRecord(null);
    fetchMaterials();
  };

  const handleCreateRecord = () => {
    setEditingRecord({
      id: 'new_' + Date.now(),
      title: '新往期记录标题 (如: 第100期...)',
      content: '<p><span style="color: red; font-size: 18px">输入记录内容...</span></p>'
    });
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      await supabase.from('records').delete().eq('id', id);
      fetchMaterials();
    }
  };

  // =============== Admin 登录视图 (仿 Login.tsx 风格) ===============
  if (!isAuthenticated) {
    return (
      <div className="bg-white flex flex-col select-none min-h-screen">
        <div className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 h-72 flex flex-col items-center justify-center overflow-hidden shrink-0">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -top-4 -left-8 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-white rounded-t-[32px]" />
          
          <button onClick={() => navigate('/')} className="absolute top-4 left-4 z-20 text-white/80 p-2"><ArrowLeft size={24} /></button>

          <div className="relative z-10 flex flex-col items-center mb-8">
            <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm shadow-inner">
              <span className="text-3xl">⚙️</span>
            </div>
            <div className="mt-4 text-[26px] font-bold tracking-widest text-white">内部后台</div>
            <div className="mt-1.5 text-sm text-gray-300">管理员专用通道</div>
          </div>
        </div>

        <div className="flex-1 bg-white px-6 pt-6 pb-10">
          <h2 className="text-[20px] font-bold text-gray-800 mb-6 text-center">账号登录</h2>

          <div className="mb-4">
            <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3 transition-colors focus-within:border-gray-300">
              <User size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value.replace(/[^a-zA-Z0-9_@.]/g, ''))}
                placeholder="请输入管理员账号"
                className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3 transition-colors focus-within:border-gray-300">
              <Lock size={18} className="text-gray-400 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
            </div>
          </div>

          {loginError && (
            <div className="mb-4 text-[#ff4d4f] text-[13px] text-center font-medium bg-red-50 py-2 rounded-lg">
              {loginError}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full h-[54px] rounded-full bg-gradient-to-r from-slate-700 to-slate-900 text-white text-[16px] font-bold shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center mt-2"
          >
            {loginLoading ? <Loader2 size={24} className="animate-spin" /> : '登 录'}
          </button>
        </div>
      </div>
    );
  }

  // =============== 1. 记录内容编辑器 ===============
  if (editingRecord) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
          <button onClick={() => setEditingRecord(null)} className="flex items-center text-gray-600">
            <ArrowLeft size={20} className="mr-1" />
            <span className="text-sm">返回</span>
          </button>
          <span className="text-base font-medium">编辑往期记录</span>
          <button onClick={handleSaveRecord} className="flex items-center text-blue-500 font-medium">
            <Check size={20} className="mr-1" />
            <span className="text-sm">保存</span>
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">记录期号/标题</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={editingRecord.title}
              onChange={(e) => setEditingRecord({...editingRecord, title: e.target.value})}
            />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">连红结果 (富文本)</label>
            <RichTextEditor 
              content={editingRecord.content} 
              onChange={(val) => setEditingRecord({...editingRecord, content: val})} 
            />
          </div>
        </div>
      </div>
    );
  }

  // =============== 2. 资料编辑器 ===============
  if (editingMaterial) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
          <button onClick={() => setEditingMaterial(null)} className="flex items-center text-gray-600">
            <ArrowLeft size={20} className="mr-1" />
            <span className="text-sm">返回外层</span>
          </button>
          <span className="text-base font-medium w-full text-center truncate mx-4">
            {editingMaterial.id.startsWith('new_') ? '发布新资料' : '编辑资料'}
          </span>
          <button onClick={handleSaveMaterial} className="flex items-center text-blue-500 font-medium whitespace-nowrap">
            <Check size={20} className="mr-1" />
            <span className="text-sm">保存</span>
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">资料标题 (文章名称)</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={editingMaterial.title}
                onChange={(e) => setEditingMaterial({...editingMaterial, title: e.target.value})}
              />
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">解锁价格</label>
              <input 
                type="number" 
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={editingMaterial.price}
                onChange={(e) => setEditingMaterial({...editingMaterial, price: e.target.value})}
              />
            </div>
          </div>

          {!editingMaterial.id.startsWith('new_') && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-800">该资料的往期记录 (必须先保存资料才可加记录)</h2>
                <button 
                  onClick={handleCreateRecord}
                  className="flex items-center text-sm text-red-500 bg-red-50 px-3 py-1.5 rounded-full"
                >
                  <Plus size={16} className="mr-1" />
                  添加往期记录
                </button>
              </div>
              
              <div className="space-y-3">
                {editingMaterial.records.map(record => (
                  <div key={record.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{record.title}</h3>
                    </div>
                    <div 
                      className="text-sm text-gray-500 mb-3 bg-red-50/50 p-2 rounded"
                      dangerouslySetInnerHTML={{__html: record.content}}
                    />
                    <div className="flex justify-end gap-4 pt-2 border-t border-gray-50">
                      <button onClick={() => setEditingRecord({...record})} className="flex items-center text-xs text-blue-500">
                        <Edit2 size={14} className="mr-1" /> 编辑期号内容
                      </button>
                      <button onClick={() => handleDeleteRecord(record.id)} className="flex items-center text-xs text-red-500">
                        <Trash2 size={14} className="mr-1" /> 删除期号
                      </button>
                    </div>
                  </div>
                ))}
                
                {editingMaterial.records.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                    暂无往期记录
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // =============== 3. 资料列表 ===============
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 flex items-center justify-center bg-white px-4 py-3 shadow-sm">
        <button onClick={() => navigate('/')} className="text-gray-600 absolute left-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-base font-medium">后台管理 - 资料列表</h1>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-800">所有资料</h2>
              <button 
                onClick={handleCreateMaterial}
                className="flex items-center text-sm text-red-500 bg-red-50 px-3 py-1.5 rounded-full"
              >
                <Plus size={16} className="mr-1" />
                发布新资料
              </button>
            </div>

            <div className="space-y-3">
              {materials.map(material => (
                <div key={material.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                  <div className="pr-2">
                    <h3 className="text-base font-medium text-gray-800 leading-snug mb-2">{material.title}</h3>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                      <span className="text-red-500 font-semibold">单价: ¥{material.price}</span>
                      <span>{material.records.length} 条记录</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-4 pt-3 mt-3 border-t border-gray-50">
                    <button onClick={() => setEditingMaterial({...material})} className="flex items-center text-sm text-blue-500">
                      <Edit2 size={16} className="mr-1" /> 编辑 & 记录
                    </button>
                    <button onClick={() => handleDeleteMaterial(material.id)} className="flex items-center text-sm text-red-500">
                      <Trash2 size={16} className="mr-1" /> 删除
                    </button>
                  </div>
                </div>
              ))}

              {materials.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                  当前暂无资料，去新建一个吧
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
