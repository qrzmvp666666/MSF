import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Profile from './pages/Profile';
import ProfileInfo from './pages/ProfileInfo';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Complaint from './pages/Complaint';
import ComplaintRecords from './pages/ComplaintRecords';
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
    <div
      className="max-w-md mx-auto bg-gray-50 relative shadow-lg overflow-x-hidden min-h-full"
      style={isLogin ? undefined : { paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/adminqyf" element={<Admin />} />
        <Route path="/" element={<Home />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/info" element={<ProfileInfo />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/complaint" element={<Complaint />} />
        <Route path="/complaint-records" element={<ComplaintRecords />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isLogin && <BottomNav />}
    </div>
  );
}

function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  if (path.startsWith('/detail') || path === '/profile/info' || path === '/adminqyf' || path === '/complaint' || path === '/complaint-records') return null;

  return (
    <div
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t bg-white bottom-nav-safe-area"
    >
      <div className="flex h-14 items-center justify-around text-xs">
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
    </div>
  );
}
