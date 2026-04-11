import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type EditField = 'phone' | 'nickname' | 'avatar' | null;

const AVATARS = ['👨‍💼', '👩‍💼', '🧑‍🦲', '👨‍🍳', '🧑‍💻', '👩‍🎤', '🧑‍🚀', '🧑‍🎨'];

export default function ProfileInfo() {
  const navigate = useNavigate();
  const [editField, setEditField] = useState<EditField>(null);
  const [phone, setPhone] = useState('138****8888');
  const [nickname, setNickname] = useState('永丰机械');
  const [avatar, setAvatar] = useState('👨‍💼');
  const [inputVal, setInputVal] = useState('');
  const [tempAvatar, setTempAvatar] = useState('👨‍💼');

  function openEdit(field: EditField) {
    if (field === 'phone') setInputVal(phone);
    if (field === 'nickname') setInputVal(nickname);
    if (field === 'avatar') setTempAvatar(avatar);
    setEditField(field);
  }

  function confirmEdit() {
    if (editField === 'phone') setPhone(inputVal);
    if (editField === 'nickname') setNickname(inputVal);
    if (editField === 'avatar') setAvatar(tempAvatar);
    setEditField(null);
  }

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
          <button onClick={() => openEdit('avatar')} className="flex w-full items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-[15px] text-gray-500">头像</span>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-2xl border border-gray-100">
                {avatar}
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </button>

          <button onClick={() => openEdit('nickname')} className="flex w-full items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-[15px] text-gray-500">昵称</span>
            <div className="flex items-center gap-2 text-gray-900">
              <span className="text-[15px]">{nickname}</span>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </button>

          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-[15px] text-gray-500">用户ID</span>
            <span className="text-[15px] text-gray-900">34203759</span>
          </div>

          <button onClick={() => openEdit('phone')} className="flex w-full items-center justify-between px-4 py-4 border-b border-gray-100">
            <span className="text-[15px] text-gray-500">手机号</span>
            <div className="flex items-center gap-2">
              <span className="text-[15px] text-gray-900">{phone}</span>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </button>

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

      {/* Edit Bottom Sheet */}
      {editField && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setEditField(null)} />
          <div className="fixed bottom-0 left-0 w-full max-w-md z-[70] rounded-t-[24px] bg-white px-5 pt-4 pb-10">
            <div className="relative mb-5 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-gray-900">
                {editField === 'phone' ? '修改手机号' : editField === 'nickname' ? '修改昵称' : '选择头像'}
              </h3>
              <button onClick={() => setEditField(null)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
                <X size={22} />
              </button>
            </div>

            {editField === 'avatar' ? (
              <div className="grid grid-cols-4 gap-4 py-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setTempAvatar(a)}
                    className={`flex h-16 w-full items-center justify-center rounded-2xl text-3xl transition-all ${
                      tempAvatar === a
                        ? 'bg-red-50 ring-2 ring-red-400'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type={editField === 'phone' ? 'tel' : 'text'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={editField === 'phone' ? '请输入手机号' : '请输入昵称'}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            )}

            <button
              onClick={confirmEdit}
              className="mt-5 w-full rounded-full bg-gradient-to-r from-red-500 to-red-400 py-3.5 text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(255,77,79,0.25)]"
            >
              确认{editField === 'avatar' ? '选择' : '修改'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
