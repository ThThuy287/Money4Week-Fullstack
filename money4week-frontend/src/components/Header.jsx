import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook để lấy đường dẫn hiện tại
  
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar') || null);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUserName(localStorage.getItem('userName') || 'Thanh Thủy');
      setUserAvatar(localStorage.getItem('userAvatar') || null);
    };
    handleProfileUpdate();
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'T';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  // Tự động xác định Tiêu đề dựa trên đường dẫn (Route)
  let titleDesktop = 'Tổng quan tài chính';
  let titleMobile = 'Tổng quan';

  switch (location.pathname) {
    case '/input':
      titleDesktop = 'Nhập liệu và quản lí chi tiêu';
      titleMobile = 'Nhập liệu';
      break;
    case '/savings':
      titleDesktop = 'Quản lí ví tiết kiệm';
      titleMobile = 'Tiết kiệm';
      break;
    case '/reports':
      titleDesktop = 'Báo cáo tổng kết chi tiêu';
      titleMobile = 'Báo cáo';
      break;
    case '/settings':
      titleDesktop = 'Cài đặt hệ thống';
      titleMobile = 'Cài đặt';
      break;
    default:
      titleDesktop = 'Tổng quan tài chính';
      titleMobile = 'Tổng quan';
      break;
  }

  return (
    // Responsive: Chiều cao và padding thay đổi
    <header className="sticky top-0 z-10 box-border w-full h-[70px] lg:h-[93px] px-4 lg:px-10 py-3 lg:py-4 flex justify-between items-center bg-[#FAF9FA]/90 backdrop-blur-[12px] border-b border-[#E3E2E3]/50 shadow-[0px_4px_24px_rgba(27,28,29,0.02)]">
      
      {/* Mobile Title (Chỉ hiển thị trên Mobile) - Đã bỏ nút Hamburger & rút gọn Text */}
      <div className="flex lg:hidden items-center">
        <h1 className="font-serif font-bold text-[20px] leading-[24px] text-[#094CB2] m-0 truncate max-w-[200px]">
          {titleMobile}
        </h1>
      </div>

      {/* Desktop Title */}
      <h1 className="hidden lg:block font-serif font-bold text-[32px] leading-[28px] text-[#094CB2] m-0">
        {titleDesktop}
      </h1>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Đã gỡ bỏ nút Thông báo (Cái chuông) */}

        <div 
          onClick={() => navigate('/settings')}
          className="flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-70 group"
          title="Đi đến Cài đặt"
        >
          {/* AVATAR */}
          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-[#E3E2E3] border border-[#C3C6D5]/30 rounded-[10px] flex justify-center items-center overflow-hidden group-hover:shadow-md transition-shadow">
            {userAvatar ? (
              <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif font-bold text-[14px] lg:text-[16px] text-[#434653] tracking-[0.5px]">
                {getInitials(userName)}
              </span>
            )}
          </div>
          
          {/* Tên chỉ hiện trên Desktop */}
          <span className="hidden lg:block font-sans font-bold text-[14px] leading-5 text-[#1B1C1D] text-center mt-1">
            {userName}
          </span>
        </div>
      </div>

    </header>
  );
};

export default Header;