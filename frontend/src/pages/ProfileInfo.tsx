import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type EditField = 'nickname' | 'avatar' | 'password' | null;

const AVATARS = ['👨‍💼', '👩‍💼', '🧑‍🦲', '👨‍🍳', '🧑‍💻', '👩‍🎤', '🧑‍🚀', '🧑‍🎨'];

type Toast = { type: 'success' | 'error'; msg: string } | null;

export default function ProfileInfo() {
  const navigate = useNavigate();
  const [editField, setEditField] = useState<EditField>(null);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('👨‍💼');
  const [userId, setUserId] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [tempAvatar, setTempAvatar] = useState('👨‍💼');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // 加载用户信息
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id.slice(0, 8).toUpperCase());

      // Try to get account name from email
      const fallbackNickname = user.email ? user.email.replace('@msf.local', '') : '未设置';

      const { data } = await supabase
        .from('profiles')
        .select('nickname, avatar')
        .eq('id', user.id)
        .single();
      if (data) {
        setNickname(data.nickname || fallbackNickname);
        setAvatar(data.avatar ?? '👨‍💼');
      } else {
        setNickname(fallbackNickname);
      }
    })();
  }, []);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  }

  function openEdit(field: EditField) {
    if (field === 'nickname') setInputVal(nickname);
    if (field === 'avatar') setTempAvatar(avatar);
    if (field === 'password') { setPwdNew(''); setPwdConfirm(''); }
    setEditField(field);
  }

  async function confirmEdit() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      if (editField === 'nickname' || editField === 'avatar') {
        const patch = editField === 'nickname'
          ? { nickname: inputVal }
          : { avatar: tempAvatar };
        const { error } = await supabase
          .from('profiles')
          .upsert({ id: user.id, ...patch, updated_at: new Date().toISOString() });
        if (error) throw error;
        if (editField === 'nickname') setNickname(inputVal);
        if (editField === 'avatar') setAvatar(tempAvatar);
      }

      if (editField === 'password') {
        if (pwdNew !== pwdConfirm) throw new Error('两次密码不一致');
        if (pwdNew.length < 6) throw new Error('密码至少 6 位');
        const { error } = await supabase.auth.updateUser({ password: pwdNew });
        if (error) throw error;
      }

      showToast('success', '修改成功');
      setEditField(null);
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  const fieldTitle: Record<NonNullable<EditField>, string> = {
    nickname: '修改昵称', avatar: '选择头像', password: '修改密码',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-base font-medium text-gray-900">个人信息</h1>
        <div className="w-6" />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-14 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="px-4 py-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
          <button onClick={() => openEdit('avatar')} className="flex w-full items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-[15px] text-gray-500">头像</span>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-2xl border border-gray-100">{avatar}</div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </button>

          <button onClick={() => openEdit('nickname')} className="flex w-full items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-[15px] text-gray-500">昵称</span>
            <div className="flex items-center gap-2">
              <span className="text-[15px] text-gray-900">{nickname || '未设置'}</span>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </button>

          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-[15px] text-gray-500">用户ID</span>
            <span className="text-[15px] text-gray-900">{userId || '—'}</span>
          </div>

          <button onClick={() => openEdit('password')} className="flex w-full items-center justify-between px-4 py-4">
            <span className="text-[15px] text-gray-500">登录密码</span>
            <div className="flex items-center gap-2">
              <span className="text-[15px] tracking-[0.3em] text-gray-900">••••••••</span>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </button>
        </div>
        
        {/* 退出登录 */}
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/login');
          }}
          className="mt-6 flex w-full items-center justify-center rounded-2xl bg-white py-3.5 text-[15px] font-medium text-red-500 shadow-sm"
        >
          退出登录
        </button>
      </div>

      {/* Edit Bottom Sheet */}
      {editField && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => !loading && setEditField(null)} />
          <div className="fixed bottom-0 left-0 w-full max-w-md z-[70] rounded-t-[24px] bg-white px-5 pt-4 pb-10">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-gray-200" />
            <div className="relative mb-5 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-gray-900">{fieldTitle[editField]}</h3>
              <button disabled={loading} onClick={() => setEditField(null)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
                <X size={22} />
              </button>
            </div>

            {editField === 'avatar' && (
              <div className="grid grid-cols-4 gap-4 py-2">
                {AVATARS.map((a) => (
                  <button key={a} onClick={() => setTempAvatar(a)}
                    className={`flex h-16 w-full items-center justify-center rounded-2xl text-3xl transition-all ${tempAvatar === a ? 'bg-red-50 ring-2 ring-red-400' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    {a}
                  </button>
                ))}
              </div>
            )}

            {editField === 'nickname' && (
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="请输入新昵称"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] placeholder:text-gray-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            )}

            {editField === 'password' && (
              <div className="space-y-3">
                <input
                  type="password"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  placeholder="请输入新密码（至少 6 位）"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] placeholder:text-gray-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
                <input
                  type="password"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] placeholder:text-gray-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            )}

            <button
              onClick={confirmEdit}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-red-400 py-3.5 text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(255,77,79,0.25)] disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              确认{editField === 'avatar' ? '选择' : '修改'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
