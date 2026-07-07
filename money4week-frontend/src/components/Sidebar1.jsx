import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Wallet, Home, FileEdit, PiggyBank, BarChart2, Settings, LogOut, User } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('userCycleType');
      localStorage.removeItem('userCycleAnchor');
      navigate('/login', { replace: true });
    }
  };

  const mainMenuItems = [
    { path: '/', name: 'Trang chủ', icon: Home },
    { path: '/input', name: 'Nhập liệu', icon: FileEdit },
    { path: '/savings', name: 'Tiết kiệm', icon: PiggyBank },
    { path: '/reports', name: 'Báo cáo', icon: BarChart2 },
  ];

  const footerMenuItems = [
    { path: '/settings', name: 'Cài đặt', icon: Settings },
    { path: '/logout', name: 'Đăng xuất', icon: LogOut },
  ];

  // Map riêng cho Bottom Nav (theo yêu cầu: Trang chủ, Giao dịch (Báo cáo), Thêm (Nhập liệu), Tiết kiệm, Cá nhân)
  const bottomNavItems = [
    { path: '/', name: 'Trang chủ', icon: Home },
    { path: '/reports', name: 'Báo cáo', icon: BarChart2 },
    { path: '/input', name: 'Thêm', icon: FileEdit, isPrimary: true },
    { path: '/savings', name: 'Tiết kiệm', icon: PiggyBank },
    { path: '/settings', name: 'Cá nhân', icon: User },
  ];

  return (
    <>
      {/* ========================================= */}
      {/* DESKTOP SIDEBAR (Giữ nguyên 100%, ẩn trên Mobile) */}
      {/* ========================================= */}
      <aside className="hidden lg:flex sticky top-0 h-screen min-w-[250px] bg-white border-r border-[#C3C6D5]/30 flex-col justify-between px-6 py-8 box-border">
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-[25px] h-[20px] flex items-center justify-center text-[#094CB2]">
              <Wallet size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="font-serif font-bold text-[24px] leading-8 text-[#094CB2] m-0">Money4Week</h1>
              <span className="font-sans font-normal text-[12px] leading-4 text-[#434653] uppercase tracking-[0.3px]">Quản lý tài chính</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2 w-full">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg w-full box-border transition-all duration-200 border-r-4 ${
                      isActive ? 'bg-[#E5EDFF] border-[#094CB2] text-[#094CB2]' : 'border-transparent text-[#434653] hover:bg-gray-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={20} className={isActive ? 'text-[#094CB2]' : 'text-[#434653]'} strokeWidth={isActive ? 2.5 : 2} />
                      <span className={`font-sans text-[16px] leading-6 tracking-[0.4px] ${isActive ? 'font-bold' : 'font-normal'}`}>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2 w-full pt-6 border-t border-[#C3C6D5]/30 mt-auto">
          {footerMenuItems.map((item) => {
            const Icon = item.icon;
            if (item.path === '/logout') {
              return (
                <button key={item.path} onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all duration-200 border-r-4 border-transparent text-[#BA1A1A] hover:bg-[#BA1A1A]/10 cursor-pointer text-left bg-transparent border-none outline-none">
                  <Icon size={20} strokeWidth={2.5} className="text-[#BA1A1A]" />
                  <span className="font-sans text-[16px] leading-6 tracking-[0.4px] font-bold">{item.name}</span>
                </button>
              );
            }
            return (
              <NavLink key={item.path} to={item.path} className="flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all duration-200 border-r-4 border-transparent text-[#434653] hover:bg-gray-100">
                <Icon size={20} strokeWidth={2} className="text-[#434653]" />
                <span className="font-sans text-[16px] leading-6 tracking-[0.4px] font-normal">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </aside>

      {/* ========================================= */}
      {/* MOBILE BOTTOM NAVIGATION (Chỉ hiện trên Mobile) */}
      {/* ========================================= */}
      <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-[#C3C6D5]/30 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] z-[100] px-2 py-2 justify-between items-center pb-[env(safe-area-inset-bottom)]">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-[20%] transition-all duration-200 min-h-[48px] ${
                  isActive ? 'text-[#094CB2]' : 'text-[#737784]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.isPrimary ? (
                    <div className="absolute -top-6 w-[56px] h-[56px] bg-[#094CB2] rounded-full flex items-center justify-center shadow-lg border-[4px] border-[#F5F3F4]">
                      <Icon size={24} className="text-white" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <Icon size={24} className={isActive ? 'text-[#094CB2] fill-[#094CB2]/10' : 'text-[#737784]'} strokeWidth={isActive ? 2.5 : 2} />
                  )}
                  <span className={`font-sans text-[10px] leading-3 mt-1 ${item.isPrimary ? 'mt-8' : ''} ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;