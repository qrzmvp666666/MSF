import { createClient } from '@supabase/supabase-js';

// 获取环境变量中的 Supabase 项目 URL 和公开匿名 Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 创建 Supabase Client 并导出
// 这里做了非空判断避免开发环境没配置时页面直接白屏报错
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
