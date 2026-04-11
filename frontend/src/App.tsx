import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Profile from './pages/Profile';
import { Home as HomeIcon, FileText, User } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="pb-14 max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-lg overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/detail" element={<Detail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  if (path === '/detail') return null;

  return (
    <div className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around items-center h-16 text-xs z-50">
      <Link to="/" className={`flex flex-col items-center p-2 ${path === '/' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
        <HomeIcon size={22} className="mb-1" />
        首页
      </Link>
      <Link to="/orders" className={`flex flex-col items-center p-2 ${path === '/orders' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
        <FileText size={22} className="mb-1" />
        订单
      </Link>
      <Link to="/profile" className={`flex flex-col items-center p-2 ${path === '/profile' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
        <User size={22} className="mb-1" />
        我的
      </Link>
    </div>
  );
}
