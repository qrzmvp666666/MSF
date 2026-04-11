import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ArrowLeft, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Record {
  id: string;
  title: string;
  content: string;
}

interface Material {
  id: string;
  title: string;
  price: string;
  date: string;
  records: Record[];
}

const mockMaterials: Material[] = [
  {
    id: 'm1',
    title: '第101期 新澳 站长特供 一肖一码 爆红🔥🔥🔥',
    price: '1999.99',
    date: '2026-04-11 11:56',
    records: [
      {
        id: 'r1',
        title: '第100期 新澳 16码 连红稳吃肉',
        content: '<p><span style="color: red; font-size: 18px">龙 马 鸡 狗</span></p>'
      },
      {
        id: 'r2',
        title: '第099期 新澳 16码 连红稳吃肉',
        content: '<p><span style="color: red; font-size: 18px">猪</span></p>'
      }
    ]
  },
  {
    id: 'm2',
    title: '第101期 新澳 16码 连红稳吃肉',
    price: '288.00',
    date: '2026-04-11 11:50',
    records: []
  }
];

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

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-xs rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          加粗
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-xs rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          斜体
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 text-xs rounded ${editor.isActive('strike') ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          删除线
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-xs rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-xs rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          列表
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default function Admin() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);

  // -- Material Operations --
  const handleSaveMaterial = () => {
    if (editingMaterial) {
      if (materials.find(m => m.id === editingMaterial.id)) {
        setMaterials(materials.map(m => m.id === editingMaterial.id ? editingMaterial : m));
      } else {
        setMaterials([editingMaterial, ...materials]);
      }
      setEditingMaterial(null);
    }
  };

  const handleCreateMaterial = () => {
    setEditingMaterial({
      id: Date.now().toString(),
      title: '新资料标题',
      price: '0.00',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      records: []
    });
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('确定要删除这条资料及其所有记录吗？')) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  // -- Record Operations --
  const handleSaveRecord = () => {
    if (editingRecord && editingMaterial) {
      const records = [...editingMaterial.records];
      const idx = records.findIndex(r => r.id === editingRecord.id);
      if (idx > -1) {
        records[idx] = editingRecord;
      } else {
        records.unshift(editingRecord);
      }
      setEditingMaterial({ ...editingMaterial, records });
      setEditingRecord(null);
    }
  };

  const handleCreateRecord = () => {
    setEditingRecord({
      id: Date.now().toString(),
      title: '新往期记录标题 (如: 第100期...)',
      content: '<p>新内容...</p>'
    });
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('确定要删除这条记录吗？') && editingMaterial) {
      const records = editingMaterial.records.filter(r => r.id !== id);
      setEditingMaterial({ ...editingMaterial, records });
    }
  };

  // 1. Record Editor View
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

  // 2. Material Editor View
  if (editingMaterial) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
          <button onClick={() => setEditingMaterial(null)} className="flex items-center text-gray-600">
            <ArrowLeft size={20} className="mr-1" />
            <span className="text-sm">返回外层</span>
          </button>
          <span className="text-base font-medium">编辑资料</span>
          <button onClick={handleSaveMaterial} className="flex items-center text-blue-500 font-medium">
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
                type="text" 
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={editingMaterial.price}
                onChange={(e) => setEditingMaterial({...editingMaterial, price: e.target.value})}
              />
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-800">该资料的往期记录</h2>
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
                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
                    <button onClick={() => setEditingRecord({...record})} className="flex items-center text-xs text-blue-500">
                      <Edit2 size={14} className="mr-1" /> 编辑
                    </button>
                    <button onClick={() => handleDeleteRecord(record.id)} className="flex items-center text-xs text-red-500">
                      <Trash2 size={14} className="mr-1" /> 删除
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
        </div>
      </div>
    );
  }

  // 3. Materials List View
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-base font-medium">后台管理 - 资料列表</h1>
        <div className="w-6" />
      </div>

      <div className="p-4 space-y-4">
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
            <div key={material.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-medium text-gray-800 leading-snug mb-2">{material.title}</h3>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span className="text-red-500 font-semibold">单价: ¥{material.price}</span>
                <span>{material.records.length} 条记录</span>
              </div>
              
              <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-gray-50">
                <button onClick={() => setEditingMaterial({...material})} className="flex items-center text-sm text-blue-500">
                  <Edit2 size={16} className="mr-1" /> 管理 & 记录
                </button>
                <button onClick={() => handleDeleteMaterial(material.id)} className="flex items-center text-sm text-red-500">
                  <Trash2 size={16} className="mr-1" /> 删除
                </button>
              </div>
            </div>
          ))}
          {materials.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
              当前暂无资料
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
