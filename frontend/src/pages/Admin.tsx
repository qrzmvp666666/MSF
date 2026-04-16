import { useState, useEffect, memo, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ArrowLeft, Plus, Edit2, Trash2, Check, User, Lock, Loader2, Eye, EyeOff, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Record {
  id: string;
  title: string;
  content: string;
  is_winner: boolean;
  issue_number?: number | null;
  material_id?: string;
  created_at?: string;
}

interface Material {
  id: string;
  title: string;
  price: string;
  created_at?: string;
  records: Record[];
  views: number;
  sales: number;
  streak: number;
}

const extensions = [StarterKit];

const editorProps = {
  attributes: {
    class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[150px] border border-gray-200 rounded-md p-3 bg-white',
  },
};

function extractIssueNumber(title: string) {
  const match = title.match(/第\s*(\d+)\s*期/i);
  return match ? Number(match[1]) : null;
}

function normalizeIssueNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 365) {
    return null;
  }

  return parsed;
}

function getRecordIssueNumber(record: Pick<Record, 'issue_number' | 'title'>) {
  return normalizeIssueNumber(record.issue_number) ?? normalizeIssueNumber(extractIssueNumber(record.title));
}

function compareRecords(left: Record, right: Record) {
  const leftIssue = getRecordIssueNumber(left) ?? -1;
  const rightIssue = getRecordIssueNumber(right) ?? -1;
  const issueDiff = rightIssue - leftIssue;
  if (issueDiff !== 0) {
    return issueDiff;
  }

  const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
  const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
  const timeDiff = rightTime - leftTime;
  if (timeDiff !== 0) {
    return timeDiff;
  }

  return right.title.localeCompare(left.title, 'zh-CN');
}

function getSuggestedIssueNumber(records: Record[]) {
  const usedIssues = new Set(
    records
      .map((record) => getRecordIssueNumber(record))
      .filter((issue): issue is number => issue !== null),
  );

  const todayIssueNumber = getIssueNumberByDate(new Date());
  if (!usedIssues.has(todayIssueNumber)) {
    return todayIssueNumber;
  }

  for (let issue = todayIssueNumber + 1; issue <= 365; issue += 1) {
    if (!usedIssues.has(issue)) {
      return issue;
    }
  }

  for (let issue = todayIssueNumber - 1; issue >= 1; issue -= 1) {
    if (!usedIssues.has(issue)) {
      return issue;
    }
  }

  return null;
}

const ISSUE_DATE_REFERENCE_YEAR = 2020;
const ISSUE_DATE_TEMPLATE_YEAR = 2021;

function getIssueNumberByDate(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffInMs = currentDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffInMs / 86400000) + 1;

  return dayOfYear >= 1 && dayOfYear <= 365 ? dayOfYear : 365;
}

function formatIssueDate(issueNumber: number | null) {
  const normalizedIssueNumber = normalizeIssueNumber(issueNumber);
  if (!normalizedIssueNumber) {
    return '';
  }

  const date = new Date(ISSUE_DATE_TEMPLATE_YEAR, 0, normalizedIssueNumber);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${ISSUE_DATE_REFERENCE_YEAR}-${month}-${day}`;
}

const issueOptions = Array.from({ length: 365 }, (_, index) => {
  const issueNumber = 365 - index;
  return {
    value: issueNumber,
    label: `${String(issueNumber).padStart(2, '0')}期（${formatIssueDate(issueNumber)}）`,
  };
});

const RichTextEditor = memo(({ initialContent, onChange }: { initialContent: string, onChange: (val: string) => void }) => {
  const [content] = useState(initialContent);
  const editor = useEditor({
    extensions,
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps,
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>加粗</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>斜体</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-xs rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>H2</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}, () => true); // 永远跳过 React 的外部重渲染，避免打断输入法



export default function Admin() {
  const navigate = useNavigate();
  // 登录状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    const { data: recs, error: recsErr } = await supabase.from('records').select('*').order('issue_number', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
    
    if (!matsErr && !recsErr) {
      const matched = (mats || []).map((m: { id: string, title: string, price: number, created_at: string, views?: number, sales?: number, streak?: number }) => ({
        id: m.id,
        title: m.title,
        price: String(m.price || 0),
        created_at: m.created_at,
        views: m.views ?? 0,
        sales: m.sales ?? 0,
        streak: m.streak ?? 0,
        records: (recs || [])
          .filter((r: { id: string, title: string, content: string, material_id: string, is_winner?: boolean, issue_number?: number | null }) => r.material_id === m.id)
          .map((r) => ({
            ...r,
            issue_number: normalizeIssueNumber(r.issue_number) ?? normalizeIssueNumber(extractIssueNumber(r.title)),
            is_winner: Boolean(r.is_winner),
          }))
          .sort(compareRecords)
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
      const { data } = await supabase.from('materials').insert({
        title: editingMaterial.title,
        price: parseFloat(editingMaterial.price) || 0,
        views: editingMaterial.views ?? 0,
        sales: editingMaterial.sales ?? 0,
        streak: editingMaterial.streak ?? 0,
      }).select().single();
      
      if (data && editingMaterial.records && editingMaterial.records.length > 0) {
        const recordsToInsert = editingMaterial.records.map(r => ({
          material_id: data.id,
          title: r.title,
          content: r.content,
          is_winner: r.is_winner,
          issue_number: getRecordIssueNumber(r),
        }));
        await supabase.from('records').insert(recordsToInsert);
      }
    } else {
      await supabase.from('materials').update({
        title: editingMaterial.title,
        price: parseFloat(editingMaterial.price) || 0,
        views: editingMaterial.views ?? 0,
        sales: editingMaterial.sales ?? 0,
        streak: editingMaterial.streak ?? 0,
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
      views: 0,
      sales: 0,
      streak: 0,
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

    const issueNumber = getRecordIssueNumber(editingRecord);
    if (!issueNumber) {
      alert('请选择 1-365 之间的期数');
      return;
    }

    const duplicateRecord = editingMaterial.records.find((record) => record.id !== editingRecord.id && getRecordIssueNumber(record) === issueNumber);
    if (duplicateRecord) {
      alert(`第${issueNumber}期已存在，期数不可重复`);
      return;
    }

    const recordToSave = {
      ...editingRecord,
      issue_number: issueNumber,
    };

    if (editingMaterial.id.startsWith('new_')) {
      const newRecords = [...editingMaterial.records];
      const idx = newRecords.findIndex(r => r.id === editingRecord.id);
      if (idx >= 0) {
        newRecords[idx] = recordToSave;
      } else {
        newRecords.push(recordToSave);
      }
      setEditingMaterial({ ...editingMaterial, records: newRecords.sort(compareRecords) });
      setEditingRecord(null);
      return;
    }

    if (editingRecord.id.startsWith('new_')) {
      await supabase.from('records').insert({
        material_id: editingMaterial.id,
        title: recordToSave.title,
        content: recordToSave.content,
        is_winner: recordToSave.is_winner,
        issue_number: recordToSave.issue_number,
      });
    } else {
      await supabase.from('records').update({
        title: recordToSave.title,
        content: recordToSave.content,
        is_winner: recordToSave.is_winner,
        issue_number: recordToSave.issue_number,
      }).eq('id', editingRecord.id);
    }
    setEditingRecord(null);
    fetchMaterials();
  };

  const handleCreateRecord = () => {
    const suggestedIssueNumber = editingMaterial ? getSuggestedIssueNumber(editingMaterial.records) : null;
    setEditingRecord({
      id: 'new_' + Date.now(),
      title: '新记录标题',
      content: '<p><span style="color: red; font-size: 18px">输入记录内容...</span></p>',
      is_winner: false,
      issue_number: suggestedIssueNumber,
    });
  };

  const handleContentChange = useCallback((val: string) => {
    setEditingRecord(prev => prev ? { ...prev, content: val } : prev);
  }, []);

  const handleDeleteRecord = async (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      if (editingMaterial?.id.startsWith('new_')) {
        setEditingMaterial({
          ...editingMaterial,
          records: editingMaterial.records.filter(r => r.id !== id)
        });
      } else {
        await supabase.from('records').delete().eq('id', id);
        fetchMaterials();
      }
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
                onChange={(e) => setAccount(e.target.value.trim())}
                placeholder="请输入管理员账号"
                className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {account && (
                <button
                  type="button"
                  onClick={() => setAccount('')}
                  className="text-gray-300 hover:text-gray-500 focus:outline-none"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 gap-3 transition-colors focus-within:border-gray-300">
              <Lock size={18} className="text-gray-400 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setPassword('')}
                  className="text-gray-300 hover:text-gray-500 focus:outline-none"
                >
                  <XCircle size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none ml-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
    const selectedIssueNumber = getRecordIssueNumber(editingRecord);
    const selectedIssueDate = formatIssueDate(selectedIssueNumber);
    const usedIssueNumbers = new Set(
      (editingMaterial?.records || [])
        .filter((record) => record.id !== editingRecord.id)
        .map((record) => getRecordIssueNumber(record))
        .filter((issue): issue is number => issue !== null),
    );
    const availableIssueOptions = issueOptions.filter((option) => !usedIssueNumbers.has(option.value) || option.value === selectedIssueNumber);

    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
          <button onClick={() => setEditingRecord(null)} className="flex items-center text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <span className="text-base font-medium">编辑往期记录</span>
          <button onClick={handleSaveRecord} className="flex items-center text-blue-500 font-medium">
            <Check size={20} className="mr-1" />
            <span className="text-sm">保存</span>
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">记录标题</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={editingRecord.title}
              onChange={(e) => setEditingRecord({ ...editingRecord, title: e.target.value })}
            />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">期数</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              value={editingRecord.issue_number ?? ''}
              onChange={(e) => setEditingRecord({
                ...editingRecord,
                issue_number: e.target.value ? Number(e.target.value) : null,
              })}
            >
              <option value="">请选择期数</option>
              {availableIssueOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-400">
              {selectedIssueNumber && selectedIssueDate
                ? `${String(selectedIssueNumber).padStart(2, '0')}期对应日期：${selectedIssueDate}。已自动过滤已有记录的期数，期数越大排序越靠前。`
                : '可选 01 期到 365 期，每期默认对应固定日期，且已自动过滤已有记录的期数，期数越大排序越靠前。'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">中奖状态</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingRecord({ ...editingRecord, is_winner: false })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!editingRecord.is_winner ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                未中
              </button>
              <button
                type="button"
                onClick={() => setEditingRecord({ ...editingRecord, is_winner: true })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${editingRecord.is_winner ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500'}`}
              >
                中奖
              </button>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
            <RichTextEditor 
              key={editingRecord.id}
              initialContent={editingRecord.content} 
              onChange={handleContentChange} 
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
            <ArrowLeft size={24} />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">资料标题</label>
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
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">展示标签数据</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-16 shrink-0">🔥 连胜期</span>
                  <input type="number" min="0" className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={editingMaterial.streak}
                    onChange={(e) => setEditingMaterial({...editingMaterial, streak: parseInt(e.target.value) || 0})} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-16 shrink-0">👁 阅读量</span>
                  <input type="number" min="0" className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={editingMaterial.views}
                    onChange={(e) => setEditingMaterial({...editingMaterial, views: parseInt(e.target.value) || 0})} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-16 shrink-0">📦 销售量</span>
                  <input type="number" min="0" className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={editingMaterial.sales}
                    onChange={(e) => setEditingMaterial({...editingMaterial, sales: parseInt(e.target.value) || 0})} />
                </div>
              </div>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-800">往期记录</h2>
                {editingMaterial.id.startsWith('new_') && (
                  <span className="text-[11px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">随资料一起保存</span>
                )}
              </div>
              <button 
                onClick={handleCreateRecord}
                className="flex items-center text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-full font-medium"
              >
                <Plus size={14} className="mr-1" />
                添加记录
              </button>
            </div>
            
            <div className="space-y-3">
              {editingMaterial.records.map(record => (
                <div key={record.id} className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 pr-2 min-w-0">
                      {getRecordIssueNumber(record) && (
                        <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                          {String(getRecordIssueNumber(record)).padStart(2, '0')}期
                        </span>
                      )}
                      <h3 className="text-[13px] font-bold text-gray-800 truncate">{record.title}</h3>
                    </div>
                    {record.is_winner && (
                      <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">已中</span>
                    )}
                  </div>
                  <div 
                    className="text-xs text-gray-600 mb-2 bg-red-50/50 px-2.5 py-2 rounded-lg line-clamp-3"
                    dangerouslySetInnerHTML={{__html: record.content}}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setEditingRecord({...record})} className="flex items-center text-xs text-blue-500 font-medium bg-blue-50 px-3 py-1.5 rounded-full">
                      <Edit2 size={13} className="mr-1" /> 编辑
                    </button>
                    <button onClick={() => handleDeleteRecord(record.id)} className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-full">
                      <Trash2 size={13} className="mr-1" /> 删除
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
                    {/* 标签行 */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {material.streak > 0 && (
                        <span className="bg-red-50 text-red-500 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-red-100">🔥 连胜{material.streak}期</span>
                      )}
                      {material.views > 0 && (
                        <span className="bg-orange-50 text-orange-500 text-[11px] font-medium px-2 py-0.5 rounded-full border border-orange-100">👁 {material.views.toLocaleString()}阅读</span>
                      )}
                      {material.sales > 0 && (
                        <span className="bg-green-50 text-green-600 text-[11px] font-medium px-2 py-0.5 rounded-full border border-green-100">📦 已售{material.sales}份</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                      <span className="text-red-500 font-semibold">单价: ¥{material.price}</span>
                      <span>{material.records.length} 条记录</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-4 pt-3 mt-3 border-t border-gray-50">
                    <button onClick={() => setEditingMaterial({...material})} className="flex items-center text-sm text-blue-500 font-medium bg-blue-50 px-4 py-1.5 rounded-full">
                      <Edit2 size={15} className="mr-1.5" /> 管理 & 编辑
                    </button>
                    <button onClick={() => handleDeleteMaterial(material.id)} className="flex items-center text-sm text-gray-500 font-medium bg-gray-50 px-4 py-1.5 rounded-full">
                      <Trash2 size={15} className="mr-1.5" /> 删除
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
