import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  
  // Trích xuất thông tin người dùng từ bộ nhớ (Dữ liệu thật hoàn toàn)
const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar') || null);
const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');

  useEffect(() => {
    // Hàm lắng nghe sự thay đổi để cập nhật thời gian thực
    const handleProfileUpdate = () => {
      setUserName(localStorage.getItem('userName') || 'Thanh Thủy');
      setUserAvatar(localStorage.getItem('userAvatar') || null);
      setUserEmail(localStorage.getItem('userEmail') || '');
    };

    // Chạy một lần lúc mới load để chắc chắn lấy đúng dữ liệu
    handleProfileUpdate();

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  // Hàm tự động tạo Avatar chữ (VD: Thanh Thủy -> TT)
  const getInitials = (name) => {
    if (!name) return 'T';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-10 box-border w-full h-[93px] px-10 py-4 flex justify-between items-center bg-[#FAF9FA]/80 backdrop-blur-[12px] border-b border-[#E3E2E3]/50 shadow-[0px_4px_24px_rgba(27,28,29,0.02)]">
      
      <h1 className="font-serif font-bold text-[32px] leading-[28px] text-[#094CB2] m-0">
        Quản lí ví tiết kiệm
      </h1>

      <div 
        onClick={() => navigate('/settings')}
        className="flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-70 group"
        title="Đi đến Cài đặt"
      >
        {/* AVATAR */}
        <div className="w-10 h-10 bg-[#E3E2E3] border border-[#C3C6D5]/30 rounded-[10px] flex justify-center items-center overflow-hidden group-hover:shadow-md transition-shadow">
          {userAvatar ? (
            <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="font-serif font-bold text-[16px] text-[#434653] tracking-[0.5px]">
              {getInitials(userName)}
            </span>
          )}
        </div>
        
        {/* HỌ VÀ TÊN (TRÍCH XUẤT ĐẦY ĐỦ) */}
        <span className="font-sans font-bold text-[14px] leading-5 text-[#1B1C1D] text-center mt-1">
          {userName}
        </span>
        
        
      </div>

    </header>
  );
};

export default Header;