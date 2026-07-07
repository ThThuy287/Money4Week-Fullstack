import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Import tĩnh các Components layout dùng chung (cần load ngay lập tức)
import Sidebar from './components/Sidebar1';
import Footer from './components/Footer';
import Header from './components/Header';

// 🚀 Chuyển đổi sang Lazy Loading cho các Pages (Chỉ tải khi người dùng truy cập)
const Home = lazy(() => import('./pages/Home'));
const Input = lazy(() => import('./pages/Input'));
const Savings = lazy(() => import('./pages/Savings'));
const Reports = lazy(() => import('./pages/Reports'));
const PDFPreview = lazy(() => import('./pages/PDFPreview'));
const Settings = lazy(() => import('./pages/Settings'));
const Auth = lazy(() => import('./pages/Auth'));

// Component Hiển thị lúc chờ tải Code (Tránh màn hình trắng)
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#F5F3F4]">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E3E2E3] border-t-[#094CB2]"></div>
      <span className="font-sans text-sm text-[#737784] font-medium">Đang tải giao diện...</span>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (token) return <Navigate to="/" replace />;
  return children;
};

const AppLayout = () => {
  const location = useLocation();
  const isFullScreenPage = location.pathname === '/reports/preview' || location.pathname === '/login';

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F5F3F4]">
      {!isFullScreenPage && <Sidebar />}
      
      <div className={`${isFullScreenPage ? 'w-full' : 'flex-1'} flex flex-col min-h-screen relative w-full lg:w-auto`}>
        
        {!isFullScreenPage && (
          <div className="sticky top-0 z-50 w-full bg-[#F5F3F4]">
             <Header />
          </div>
        )}
        
        <main className={`${isFullScreenPage ? '' : 'flex-1 p-4 pb-24 lg:p-8 lg:pb-8 overflow-x-hidden'}`}>
          {/* Bọc Routes bằng Suspense để xử lý việc tải lười */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/input" element={<ProtectedRoute><Input /></ProtectedRoute>} />
              <Route path="/savings" element={<ProtectedRoute><Savings /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/reports/preview" element={<ProtectedRoute><PDFPreview /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              
              <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        {!isFullScreenPage && <Footer className="hidden lg:flex" />}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;