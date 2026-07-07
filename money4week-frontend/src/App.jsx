import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Import các Components dùng chung
import Sidebar from './components/Sidebar1';
import Footer from './components/Footer';
import Header from './components/Header';

// Import các Trang (Pages)
import Home from './pages/Home';
import Input from './pages/Input';
import Savings from './pages/Savings';
import Reports from './pages/Reports';
import PDFPreview from './pages/PDFPreview';
import Settings from './pages/Settings';
import Auth from './pages/Auth';

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
    // Mobile: flex-col, Desktop: flex-row
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F5F3F4]">
      {!isFullScreenPage && <Sidebar />}
      
      <div className={`${isFullScreenPage ? 'w-full' : 'flex-1'} flex flex-col min-h-screen relative w-full lg:w-auto`}>
        
        {!isFullScreenPage && (
          <div className="sticky top-0 z-50 w-full bg-[#F5F3F4]">
             <Header />
          </div>
        )}
        
        {/* Mobile: padding nhỏ hơn (p-4), cách đáy nhiều hơn (pb-24) để tránh Bottom Nav */}
        {/* Desktop: padding lớn (lg:p-8), bỏ padding đáy (lg:pb-8) */}
        <main className={`${isFullScreenPage ? '' : 'flex-1 p-4 pb-24 lg:p-8 lg:pb-8 overflow-x-hidden'}`}>
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