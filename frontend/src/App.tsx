import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Profile from './pages/Profile';
import ProfileInfo from './pages/ProfileInfo';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Admin from './pages/Admin';
import { Home as HomeIcon, FileText, User } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();
  const path = location.pathname;
  const isLogin = path === '/login';

  return (
    <div className={`${isLogin ? '' : 'pb-14'} max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-lg overflow-x-hidden`}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<Home />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/info" element={<ProfileInfo />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isLogin && <BottomNav />}
    </div>
  );
}

function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  if (path.startsWith('/detail') || path === '/profile/info' || path === '/admin') return null;

  return (
    <div className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around items-center h-16 text-xs z-50">
      <Link to="/" className={`flex flex-col items-center p-2 ${path === '/' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
        <HomeIcon size={22} className="mb-1" />
        首页
      </Link>
      <Link to="/orders" className={`flex flex-col items-center p-2 ${path === '/orders' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
        <FileText size={22} className="mb-1" />
        记录
      </Link>
      <Link to="/profile" className={`flex flex-col items-center p-2 ${path === '/profile' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
        <User size={22} className="mb-1" />
        我的
      </Link>
    </div>
  );
}
