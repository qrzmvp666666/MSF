type DisplayUser = {
  email?: string | null;
  phone?: string | null;
  user_metadata?: {
    login_phone?: string | null;
  } | null;
};

export function normalizeChineseMainlandPhone(value?: string | null) {
  const normalizedPhone = String(value || '').replace(/^\+?86/, '');
  return /^1[3-9]\d{9}$/.test(normalizedPhone) ? normalizedPhone : '';
}

export function getFallbackNickname(user: DisplayUser) {
  const candidates = [
    user.email?.replace(/@msf\.local$/, ''),
    user.phone,
    user.user_metadata?.login_phone,
  ];

  for (const value of candidates) {
    const normalizedPhone = normalizeChineseMainlandPhone(value);
    if (normalizedPhone) {
      return normalizedPhone;
    }

    if (value) {
      return value;
    }
  }

  return '未设置';
}