import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import authApi from '../api/authApi';

const Auth = () => {
  const navigate = useNavigate();
  
  const [authMode, setAuthMode] = useState('login'); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  
  // State quản lý lỗi chung (từ Backend) và thông báo thành công
  const [globalError, setGlobalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // State quản lý lỗi cho TỪNG Ô NHẬP LIỆU (Inline Validation)
  const [fieldErrors, setFieldErrors] = useState({});

  // Hàm xóa lỗi của một ô cụ thể khi người dùng bắt đầu gõ lại
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
    }
    setGlobalError(null); // Xóa luôn lỗi chung nếu có
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalError(null);
    setSuccessMsg(null);
    
    let errors = {};

    // 1. KIỂM TRA LỖI FRONTEND (VALIDATION)
    if (authMode === 'register' && !fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên!';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Định dạng email không hợp lệ (VD: user@gmail.com)';
    }

    if (authMode === 'register' || authMode === 'forgot') {
      if (password.length < 8) {
        errors.password = 'Mật khẩu quá ngắn. Vui lòng nhập tối thiểu 8 ký tự!';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp!';
      }
    } else if (authMode === 'login' && !password) {
      errors.password = 'Vui lòng nhập mật khẩu!';
    }

    // Nếu có bất kỳ lỗi nào ở từng ô -> Dừng lại và hiển thị đỏ
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    // 2. GỬI LÊN BACKEND KHI ĐÃ QUA VÒNG KIỂM TRA
    try {
      if (authMode === 'login') {
        const response = await authApi.login({ email, password });
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
        navigate('/'); 
        
      } else if (authMode === 'register') {
        await authApi.register({ full_name: fullName, email, password });
        setSuccessMsg('Tạo tài khoản thành công! Vui lòng đăng nhập.');
        setAuthMode('login');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setFieldErrors({});
        
      } else if (authMode === 'forgot') {
        // Đổi mật khẩu trực tiếp
        await authApi.resetPasswordDirect({ email, newPassword: password }); 
        setSuccessMsg('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
        setAuthMode('login'); 
        setPassword('');
        setConfirmPassword('');
        setFieldErrors({});
      }
    } catch (err) {
      // 3. XỬ LÝ LỖI TỪ BACKEND (VD: Sai mật khẩu, Email đã tồn tại)
      const backendError = 
        err.response?.data?.message || 
        err.response?.data?.error?.message || 
        'Có lỗi kết nối. Vui lòng kiểm tra lại!';
      
      setGlobalError(backendError);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setAuthMode(newMode);
    setGlobalError(null);
    setSuccessMsg(null);
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-row w-full h-screen bg-white overflow-hidden">
      {/* CỘT TRÁI: BRANDING */}
      <div className="hidden lg:flex flex-col justify-center items-start p-16 w-1/2 h-full bg-[#094CB2] relative isolation-isolate overflow-hidden">
        <div className="absolute w-[500px] h-[500px] -right-[250px] -top-[250px] bg-[#3366CC] mix-blend-multiply opacity-70 blur-[32px] rounded-xl z-0"></div>
        <div className="absolute w-[600px] h-[600px] -left-[200px] -bottom-[200px] bg-[#2259BF] mix-blend-multiply opacity-50 blur-[32px] rounded-xl z-0"></div>

        <div className="flex flex-col items-start gap-4 max-w-[576px] relative z-10">
          <h1 className="font-serif font-bold text-[72px] leading-[72px] tracking-[-1.8px] text-white m-0">
            Money4Week
          </h1>
          <h2 className="font-serif font-bold text-[30px] leading-[41px] text-white opacity-90 m-0 mt-2">
            Quản lý tài chính theo chu kỳ 4 tuần
          </h2>
          <p className="font-sans font-normal text-[18px] leading-[29px] text-white opacity-80 m-0 max-w-[448px] mt-4">
            Giải pháp thông minh giúp bạn kiểm soát dòng tiền, tự động chia nhỏ mục tiêu tiết kiệm và không bao giờ trễ hạn thanh toán.
          </p>
        </div>
      </div>

      {/* CỘT PHẢI: FORM AUTH */}
      <div className="flex flex-col justify-center items-center p-8 w-full lg:w-1/2 h-full bg-white overflow-y-auto custom-scrollbar">
        <div className="flex flex-col items-start w-full max-w-[448px] gap-6 animate-fade-in relative">
          
          <div className="flex flex-col gap-2 w-full">
            <h2 className="font-serif font-bold text-[30px] leading-[36px] text-[#1B1C1D] m-0">
              {authMode === 'login' ? "Chào mừng bạn quay lại!" : 
               authMode === 'register' ? "Tạo tài khoản mới" : 
               "Đặt lại mật khẩu"}
            </h2>
            <p className="font-sans font-normal text-[16px] leading-[24px] text-[#434653] m-0">
              {authMode === 'login' ? "Vui lòng đăng nhập để tiếp tục quản lý tài chính." : 
               authMode === 'register' ? "Bắt đầu hành trình quản lý tài chính thông minh của bạn." : 
               "Nhập email tài khoản của bạn và tạo mật khẩu mới."}
            </p>
          </div>

          {authMode === 'forgot' && (
            <button 
              type="button" 
              onClick={() => switchMode('login')}
              className="flex items-center gap-2 font-sans font-semibold text-[14px] text-[#434653] hover:text-[#094CB2] transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </button>
          )}

          <form className="flex flex-col gap-5 w-full" onSubmit={handleSubmit} noValidate>
            
            {/* THÔNG BÁO LỖI CHUNG (TỪ BACKEND) */}
            {globalError && (
              <div className="w-full p-3 bg-[#FEF2F2] border border-[#F87171] text-[#991B1B] rounded-lg text-[14px] font-sans flex items-center gap-2 animate-fade-in">
                <AlertCircle size={18} className="shrink-0" />
                <span>{globalError}</span>
              </div>
            )}

            {/* THÔNG BÁO THÀNH CÔNG */}
            {successMsg && (
              <div className="w-full p-3 bg-[#F0FDF4] border border-[#4ADE80] text-[#166534] rounded-lg text-[14px] font-sans animate-fade-in">
                {successMsg}
              </div>
            )}

            {/* Input Họ tên */}
            {authMode === 'register' && (
              <div className="flex flex-col gap-1 w-full">
                <label className="font-sans font-semibold text-[14px] text-[#1B1C1D]">Họ và tên</label>
                <div className="relative w-full h-[49px]">
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); clearFieldError('fullName'); }}
                    placeholder="VD: Thanh Thủy" 
                    className={`w-full h-full bg-white border ${fieldErrors.fullName ? 'border-[#BA1A1A] ring-1 ring-[#BA1A1A]/20' : 'border-[#C3C6D5] focus:border-[#094CB2]'} rounded-lg pl-12 pr-4 font-sans text-[16px] text-[#1B1C1D] focus:outline-none transition-colors placeholder:text-[#C3C6D5]`}
                  />
                  <User size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${fieldErrors.fullName ? 'text-[#BA1A1A]' : 'text-[#737784]'}`} />
                </div>
                {fieldErrors.fullName && <span className="font-sans text-[12px] text-[#BA1A1A] mt-1 animate-fade-in">{fieldErrors.fullName}</span>}
              </div>
            )}

            {/* Input Email */}
            <div className="flex flex-col gap-1 w-full">
              <label className="font-sans font-semibold text-[14px] text-[#1B1C1D]">Email</label>
              <div className="relative w-full h-[49px]">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                  placeholder="VD: email@gmail.com" 
                  className={`w-full h-full bg-white border ${fieldErrors.email ? 'border-[#BA1A1A] ring-1 ring-[#BA1A1A]/20' : 'border-[#C3C6D5] focus:border-[#094CB2]'} rounded-lg pl-12 pr-4 font-sans text-[16px] text-[#1B1C1D] focus:outline-none transition-colors placeholder:text-[#C3C6D5]`}
                />
                <Mail size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${fieldErrors.email ? 'text-[#BA1A1A]' : 'text-[#737784]'}`} />
              </div>
              {fieldErrors.email && <span className="font-sans text-[12px] text-[#BA1A1A] mt-1 animate-fade-in">{fieldErrors.email}</span>}
            </div>

            {/* Input Mật khẩu */}
            <div className="flex flex-col gap-1 w-full">
              <label className="font-sans font-semibold text-[14px] text-[#1B1C1D]">
                  {authMode === 'forgot' ? "Mật khẩu mới" : "Mật khẩu"}
              </label>
              <div className="relative w-full h-[49px]">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  placeholder="••••••••" 
                  className={`w-full h-full bg-white border ${fieldErrors.password ? 'border-[#BA1A1A] ring-1 ring-[#BA1A1A]/20' : 'border-[#C3C6D5] focus:border-[#094CB2]'} rounded-lg pl-12 pr-12 font-sans text-[16px] text-[#1B1C1D] focus:outline-none transition-colors placeholder:text-[#C3C6D5]`}
                />
                {authMode === 'forgot' ? 
                  <KeyRound size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${fieldErrors.password ? 'text-[#BA1A1A]' : 'text-[#737784]'}`} /> : 
                  <Lock size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${fieldErrors.password ? 'text-[#BA1A1A]' : 'text-[#737784]'}`} />
                }
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737784] hover:text-[#1B1C1D] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && <span className="font-sans text-[12px] text-[#BA1A1A] mt-1 animate-fade-in">{fieldErrors.password}</span>}
            </div>

            {/* Input Xác nhận mật khẩu */}
            {(authMode === 'register' || authMode === 'forgot') && (
              <div className="flex flex-col gap-1 w-full">
                <label className="font-sans font-semibold text-[14px] text-[#1B1C1D]">Xác nhận mật khẩu mới</label>
                <div className="relative w-full h-[49px]">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                    placeholder="Nhập lại mật khẩu" 
                    className={`w-full h-full bg-white border ${fieldErrors.confirmPassword ? 'border-[#BA1A1A] ring-1 ring-[#BA1A1A]/20' : 'border-[#C3C6D5] focus:border-[#094CB2]'} rounded-lg pl-12 pr-12 font-sans text-[16px] text-[#1B1C1D] focus:outline-none transition-colors placeholder:text-[#C3C6D5]`}
                  />
                  {authMode === 'forgot' ? 
                    <KeyRound size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${fieldErrors.confirmPassword ? 'text-[#BA1A1A]' : 'text-[#737784]'}`} /> : 
                    <Lock size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${fieldErrors.confirmPassword ? 'text-[#BA1A1A]' : 'text-[#737784]'}`} />
                  }
                </div>
                {fieldErrors.confirmPassword && <span className="font-sans text-[12px] text-[#BA1A1A] mt-1 animate-fade-in">{fieldErrors.confirmPassword}</span>}
              </div>
            )}

            {/* Link Quên mật khẩu */}
            {authMode === 'login' && (
              <div className="flex justify-end w-full">
                <button 
                  type="button" 
                  onClick={() => switchMode('forgot')}
                  className="font-sans font-semibold text-[14px] text-[#094CB2] hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Nút Submit */}
            <div className="pt-2 w-full">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[52px] bg-gradient-to-r from-[#094CB2] to-[#3366CC] hover:opacity-90 disabled:opacity-50 transition-opacity rounded-lg font-sans font-bold text-[16px] text-white flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(9,76,178,0.2)]"
              >
                {loading ? "Đang xử lý..." : 
                 authMode === 'login' ? "Đăng nhập" : 
                 authMode === 'register' ? "Đăng ký" : 
                 "Cập nhật mật khẩu"}
              </button>
            </div>

            {/* Chuyển đổi qua lại Đăng nhập / Đăng ký */}
            {authMode !== 'forgot' && (
              <div className="flex flex-row justify-center items-center gap-1 w-full pt-2">
                <span className="font-sans font-normal text-[14px] text-[#434653]">
                  {authMode === 'login' ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}
                </span>
                <button 
                  type="button" 
                  onClick={() => switchMode(authMode === 'login' ? 'register' : 'login')}
                  className="font-sans font-bold text-[14px] text-[#094CB2] hover:underline cursor-pointer"
                >
                  {authMode === 'login' ? "Đăng ký ngay" : "Đăng nhập ngay"}
                </button>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;