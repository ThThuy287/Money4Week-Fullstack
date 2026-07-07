import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, Info, Plus, Edit2, Trash2, X, LogOut,
  ShoppingCart, Coffee, Briefcase, GraduationCap, Dumbbell, Plane, Banknote, PartyPopper, Cat, Film,
  Car, Home, Utensils, Luggage, PiggyBank, Zap, Droplet, Wifi, Smartphone, Wallet,
  TrendingUp, CreditCard, Heart, Book, Music, Gift, Monitor, Shirt, Scissors, Baby,
  Gamepad2, Wrench, Leaf, Bus, Train, Fuel, Camera, Shield, Activity, Landmark
} from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import transactionsApi from '../api/transactionsApi'; 
import usersApi from '../api/usersApi'; 

const CATEGORY_COLORS = [
  '#094CB2', '#1B7B4D', '#C9510C', '#7030A0', '#D03A72', '#00BCD4', '#FFEB3B', '#4CAF50',
  '#F44336', '#9C27B0', '#FF9800', '#795548', '#607D8B', '#E91E63', '#3F51B5'
];

const CATEGORY_ICONS = [
  { id: 'ShoppingCart', comp: ShoppingCart }, { id: 'Coffee', comp: Coffee }, 
  { id: 'Briefcase', comp: Briefcase }, { id: 'GraduationCap', comp: GraduationCap },
  { id: 'Dumbbell', comp: Dumbbell }, { id: 'Plane', comp: Plane },
  { id: 'Banknote', comp: Banknote }, { id: 'PartyPopper', comp: PartyPopper },
  { id: 'Cat', comp: Cat }, { id: 'Film', comp: Film },
  { id: 'Car', comp: Car }, { id: 'Home', comp: Home },
  { id: 'Utensils', comp: Utensils }, { id: 'Luggage', comp: Luggage },
  { id: 'PiggyBank', comp: PiggyBank }, { id: 'Zap', comp: Zap },
  { id: 'Droplet', comp: Droplet }, { id: 'Wifi', comp: Wifi },
  { id: 'Smartphone', comp: Smartphone }, { id: 'Wallet', comp: Wallet },
  { id: 'TrendingUp', comp: TrendingUp }, { id: 'CreditCard', comp: CreditCard },
  { id: 'Heart', comp: Heart }, { id: 'Book', comp: Book },
  { id: 'Music', comp: Music }, { id: 'Gift', comp: Gift },
  { id: 'Monitor', comp: Monitor }, { id: 'Shirt', comp: Shirt },
  { id: 'Scissors', comp: Scissors }, { id: 'Baby', comp: Baby },
  { id: 'Gamepad2', comp: Gamepad2 }, { id: 'Wrench', comp: Wrench },
  { id: 'Leaf', comp: Leaf }, { id: 'Bus', comp: Bus },
  { id: 'Train', comp: Train }, { id: 'Fuel', comp: Fuel },
  { id: 'Camera', comp: Camera }, { id: 'Shield', comp: Shield },
  { id: 'Activity', comp: Activity }, { id: 'Landmark', comp: Landmark }
];

const getIconComponent = (iconName) => {
  const found = CATEGORY_ICONS.find(i => i.id === iconName);
  return found ? found.comp : Wallet;
};

const hexToRgba = (hex, alpha) => {
  let r = 0, g = 0, b = 0;
  if (hex && hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Settings = () => {
  const [globalError, setGlobalError] = useState(null);
  const [globalSuccess, setGlobalSuccess] = useState(null);

  const showSuccess = (msg) => { setGlobalSuccess(msg); setTimeout(() => setGlobalSuccess(null), 3000); };
  const showError = (msg) => { setGlobalError(msg); setTimeout(() => setGlobalError(null), 4000); };

  const [avatarPreview, setAvatarPreview] = useState(() => {
    const saved = localStorage.getItem('userAvatar');
    return saved && saved !== 'null' ? saved : null;
  });
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
  const [cycleType, setCycleType] = useState(localStorage.getItem('userCycleType') || '4_weeks');
  const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState(localStorage.getItem('userCycleAnchor') || '');

  const cycleOptions = [
    { value: '4_weeks', label: 'Mỗi 4 tuần (28 ngày)' },
    { value: '30_days', label: 'Mỗi 30 ngày' },
    { value: '1_month', label: 'Theo tháng dương lịch' }
  ];

  const fetchUserProfile = async () => {
    try {
      const res = await usersApi.getProfile();
      if (res) {
        setFullName(res.full_name || '');
        setJobTitle(res.job_title || '');
        setAvatarPreview(res.avatar_url || null);
        
        const cType = localStorage.getItem('userCycleType') || res.cycle_type || '4_weeks';
        setCycleType(cType);
        
        const anchor = localStorage.getItem('userCycleAnchor') || res.cycle_anchor_date;
        if (anchor) {
          setStartDate(anchor.split('T')[0]);
        } else {
          const today = new Date();
          setStartDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
        }

        if (res.email) {
          setEmail(res.email);
          localStorage.setItem('userEmail', res.email); 
        }

        localStorage.setItem('userName', res.full_name || 'Thanh Thủy');
        if (res.avatar_url) localStorage.setItem('userAvatar', res.avatar_url);
        window.dispatchEvent(new Event('profileUpdated'));
      }
    } catch (err) {
      console.error('Lỗi lấy profile:', err);
    }
  };

  const handleSaveProfile = async (overrideData = {}) => {
    try {
      const payload = {
        full_name: overrideData.full_name !== undefined ? overrideData.full_name : fullName,
        job_title: overrideData.job_title !== undefined ? overrideData.job_title : jobTitle,
        avatar_url: overrideData.avatar_url !== undefined ? overrideData.avatar_url : avatarPreview,
        cycle_type: overrideData.cycle_type !== undefined ? overrideData.cycle_type : cycleType,
        cycle_anchor_date: overrideData.cycle_anchor_date !== undefined ? overrideData.cycle_anchor_date : startDate
      };

      await usersApi.updateProfile(payload);

      localStorage.setItem('userName', payload.full_name.trim() || 'Thanh Thủy');
      if (payload.avatar_url) localStorage.setItem('userAvatar', payload.avatar_url);
      
      localStorage.setItem('userCycleType', payload.cycle_type);
      localStorage.setItem('userCycleAnchor', payload.cycle_anchor_date);

      window.dispatchEvent(new Event('profileUpdated'));
      
      showSuccess("Đã lưu thiết lập!");
    } catch (err) {
      showError("Có lỗi xảy ra khi lưu thông tin!");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setAvatarPreview(compressedBase64);
        handleSaveProfile({ avatar_url: compressedBase64 });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (name) => {
    if (!name) return 'T';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  const endDate = useMemo(() => {
    if (!startDate) return '...';
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return '...';
    let end = new Date(start);
    if (cycleType === '4_weeks') end.setDate(start.getDate() + 27);
    else if (cycleType === '30_days') end.setDate(start.getDate() + 29);
    else if (cycleType === '1_month') end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const d = String(end.getDate()).padStart(2, '0');
    const m = String(end.getMonth() + 1).padStart(2, '0');
    const y = end.getFullYear();
    return `${d}/${m}/${y}`;
  }, [cycleType, startDate]);

  // ==========================================
  // HÀM ĐĂNG XUẤT
  // ==========================================
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?')) {
      localStorage.clear(); // Xóa toàn bộ dữ liệu phiên làm việc
      window.location.href = '/login'; // Chuyển hướng về trang đăng nhập
    }
  };

  // ==========================================
  // STATE DANH MỤC
  // ==========================================
  const [categories, setCategories] = useState([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  
  const [catName, setCatName] = useState('');
  const [catNote, setCatNote] = useState('');
  const [catColor, setCatColor] = useState(CATEGORY_COLORS[0]);
  const [catIcon, setCatIcon] = useState(CATEGORY_ICONS[0].id);
  const [catType, setCatType] = useState('expense'); 
  const [catLimit, setCatLimit] = useState(''); 
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [isLoadingCats, setIsLoadingCats] = useState(false);

  const fetchCategories = async () => {
    setIsLoadingCats(true);
    try {
      const res = await transactionsApi.getCategories(); 
      setCategories(res || []);
    } catch (err) { showError('Lỗi tải dữ liệu danh mục.'); }
    finally { setIsLoadingCats(false); }
  };

  useEffect(() => { 
    fetchCategories(); 
    fetchUserProfile(); 
  }, []);

  const handleOpenCreateCat = () => {
    setEditingCatId(null);
    setCatName(''); setCatNote('');
    setCatType('expense'); setCatLimit('');
    setCatColor(CATEGORY_COLORS[0]); setCatIcon(CATEGORY_ICONS[0].id);
    setIsCatModalOpen(true);
  };

  const handleEditCat = (cat) => {
    setEditingCatId(cat.id);
    setCatName(cat.name); setCatNote(cat.note || '');
    setCatType(cat.type || 'expense');
    setCatLimit(cat.limit_amount ? cat.limit_amount.toString() : '');
    setCatColor(cat.color_hex || CATEGORY_COLORS[0]);
    setCatIcon(cat.icon || CATEGORY_ICONS[0].id);
    setIsCatModalOpen(true);
  };

  const handleDeleteCat = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
      await transactionsApi.deleteCategory(id); 
      showSuccess("Đã xóa danh mục.");
      fetchCategories();
    } catch (err) { showError("Lỗi xóa danh mục."); }
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) { showError("Vui lòng nhập tên danh mục!"); return; }
    try {
      setIsSubmittingCat(true);
      const limitVal = parseInt(String(catLimit).replace(/\D/g, '')) || 0;
      const payload = {
        name: catName.trim(), note: catNote.trim(), color_hex: catColor,
        icon: catIcon, type: catType, limit_amount: limitVal 
      };

      if (editingCatId) {
        await transactionsApi.updateCategory(editingCatId, payload); 
        showSuccess("Cập nhật danh mục thành công!");
      } else {
        await transactionsApi.createCategory(payload); 
        showSuccess("Tạo danh mục thành công!");
      }
      setIsCatModalOpen(false); fetchCategories();
    } catch (err) { showError("Lỗi lưu danh mục!"); } 
    finally { setIsSubmittingCat(false); }
  };

  const [activeSection, setActiveSection] = useState('profile');
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['profile', 'cycle', 'categories'];
      let current = 'profile';
      const detectionLine = window.innerHeight / 2; 

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= detectionLine) current = section;
        }
      }
      if ((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight - 10) current = 'categories';
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id); 
    const el = document.getElementById(id);
    if (el) {
      const offset = window.innerWidth < 1024 ? 100 : 120; 
      const elementPosition = el.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-8 pb-[10vh] relative items-start max-w-[1152px] mx-auto px-4 lg:px-0 -mt-4 sm:-mt-2 lg:mt-0 animate-fade-in">
      
      {/* THÔNG BÁO GLOBAL */}
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:top-8 sm:right-8 z-[9999] flex flex-col gap-2 pointer-events-none">
        {globalError && (
          <div className="bg-[#FEF2F2] border border-[#F87171] text-[#991B1B] px-5 py-4 rounded-xl flex justify-between items-center shadow-lg animate-fade-in min-w-[280px] pointer-events-auto">
            <span className="font-sans text-[14px] lg:text-[15px] font-medium pr-4">{globalError}</span>
            <button onClick={() => setGlobalError(null)} className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -mr-3"><X size={20} /></button>
          </div>
        )}
        {globalSuccess && (
          <div className="bg-[#F0FDF4] border border-[#4ADE80] text-[#166534] px-5 py-4 rounded-xl flex justify-between items-center shadow-lg animate-fade-in min-w-[280px] pointer-events-auto">
            <span className="font-sans text-[14px] lg:text-[15px] font-medium pr-4">{globalSuccess}</span>
            <button onClick={() => setGlobalSuccess(null)} className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -mr-3"><X size={20} /></button>
          </div>
        )}
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden lg:block w-[280px] shrink-0 bg-white border border-[#E3E2E3]/50 rounded-2xl p-5 shadow-[0px_4px_24px_rgba(27,28,29,0.04)] sticky top-28 z-30">
        <ul className="flex flex-col gap-2 w-full">
          {[{ id: 'profile', label: 'Hồ sơ cá nhân' }, { id: 'cycle', label: 'Tùy chỉnh Chu kỳ' }, { id: 'categories', label: 'Quản lý Danh mục' }].map((item) => (
            <li key={item.id} className="flex-1">
              <button onClick={() => scrollToSection(item.id)} className={`w-full h-full flex items-center justify-start px-6 py-4 rounded-xl text-left transition-colors cursor-pointer min-h-[48px] ${activeSection === item.id ? 'bg-[#094CB2]/10 text-[#094CB2] font-sans font-bold' : 'text-[#434653] font-sans font-medium hover:bg-[#F5F3F4]'}`}>
                <span className="text-[15px] leading-[1.2] break-words">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex-1 flex flex-col gap-8 relative z-10 w-full overflow-hidden mt-2 lg:mt-0">
        
        {/* HỒ SƠ */}
        <div id="profile" className="scroll-mt-[100px] lg:scroll-mt-[120px] bg-white border border-[#E3E2E3]/50 rounded-2xl p-6 lg:p-8 shadow-sm lg:shadow-[0px_4px_24px_rgba(27,28,29,0.04)] flex flex-col gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 lg:w-48 lg:h-48 bg-[#094CB2]/5 rounded-bl-full pointer-events-none z-0"></div>
          <h3 className="font-serif font-bold text-[22px] lg:text-[26px] text-[#1B1C1D] m-0 relative z-10">Hồ sơ cá nhân</h3>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 lg:gap-8 relative z-10">
            <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full sm:rounded-2xl overflow-hidden bg-[#F5F3F4] border border-[#E3E2E3] flex items-center justify-center shadow-sm shrink-0">
              {avatarPreview && avatarPreview !== 'null' ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif font-bold text-[28px] lg:text-[40px] text-[#434653] tracking-[0.5px]">{getInitials(fullName)}</span>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              <label className="bg-[#EFEDEE] hover:bg-gray-200 transition-colors rounded-xl text-[#094CB2] font-sans font-bold text-[14px] lg:text-[15px] px-6 w-fit cursor-pointer flex items-center justify-center m-0 min-h-[48px]">
                Tải ảnh lên
                <input type="file" accept="image/jpeg, image/png, image/gif" onChange={handleImageUpload} className="hidden" />
              </label>
              <p className="font-sans text-[12px] lg:text-[13px] text-[#737784] m-0">Định dạng JPG, PNG. Tối đa 5MB.</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Họ và tên</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => {
                    setFullName(e.target.value);
                    localStorage.setItem('userName', e.target.value.trim() || 'Thanh Thủy'); 
                    window.dispatchEvent(new Event('profileUpdated')); 
                  }} 
                  onBlur={() => handleSaveProfile()} 
                  placeholder="Nhập họ và tên..." 
                  className="w-full h-[52px] px-5 bg-[#F5F3F4] rounded-xl font-sans font-medium text-[15px] lg:text-[16px] text-[#1B1C1D] focus:outline-none focus:ring-1 focus:ring-[#094CB2] transition-colors hover:bg-[#E3E2E3]/50" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Công việc / Học tập</label>
                <input 
                  type="text" 
                  value={jobTitle} 
                  onChange={e => setJobTitle(e.target.value)} 
                  onBlur={() => handleSaveProfile()} 
                  placeholder="VD: Sinh viên..." 
                  className="w-full h-[52px] px-5 bg-[#F5F3F4] rounded-xl font-sans font-medium text-[15px] lg:text-[16px] text-[#1B1C1D] focus:outline-none focus:ring-1 focus:ring-[#094CB2] transition-colors hover:bg-[#E3E2E3]/50" 
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Email liên hệ (Không thể sửa)</label>
              <input type="email" value={email} disabled className="w-full h-[52px] px-5 bg-[#E3E2E3]/50 rounded-xl font-sans font-medium text-[15px] lg:text-[16px] text-[#737784] cursor-not-allowed border border-[#C3C6D5]/30" />
            </div>

            {/* NÚT ĐĂNG XUẤT */}
            <div className="pt-6 mt-2 border-t border-[#E3E2E3]/50 flex justify-end">
              <button 
                onClick={handleLogout} 
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 h-[52px] rounded-xl font-sans font-bold text-[14px] lg:text-[15px] text-[#BA1A1A] bg-[#FEF2F2] border border-[#F87171]/30 hover:bg-[#FEE2E2] transition-colors cursor-pointer"
              >
                <LogOut size={20} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* CHU KỲ */}
        <div id="cycle" className="scroll-mt-[100px] lg:scroll-mt-[120px] bg-white border border-[#E3E2E3]/50 rounded-2xl p-6 lg:p-8 shadow-sm lg:shadow-[0px_4px_24px_rgba(27,28,29,0.04)] flex flex-col gap-6 relative z-10">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-serif font-bold text-[22px] lg:text-[26px] text-[#1B1C1D] m-0">Tùy chỉnh Chu kỳ</h3>
            <p className="font-sans text-[13px] lg:text-[14px] text-[#737784] m-0">Hệ thống sẽ tự động làm mới các báo cáo và ví dựa trên chu kỳ bạn chọn.</p>
          </div>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6 pt-2">
            
            {/* Custom Dropdown Chu kỳ */}
            <div className="flex flex-col gap-2 relative">
              <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Loại chu kỳ</label>
              <div className="relative w-full">
                <button 
                  type="button"
                  onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)}
                  className="w-full h-[52px] px-5 bg-[#F5F3F4] rounded-xl font-sans font-medium text-[15px] lg:text-[16px] text-[#1B1C1D] flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-[#094CB2] cursor-pointer"
                >
                  <span className="truncate pr-4">{cycleOptions.find(o => o.value === cycleType)?.label}</span>
                  <ChevronDown size={20} className={`text-[#434653] transition-transform shrink-0 ${isCycleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCycleDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCycleDropdownOpen(false)}></div>
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E3E2E3]/50 shadow-[0_8px_24px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden z-50 py-2 animate-fade-in">
                      {cycleOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setCycleType(opt.value);
                            handleSaveProfile({ cycle_type: opt.value });
                            setIsCycleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-5 py-4 font-sans text-[15px] hover:bg-gray-50 transition-colors ${cycleType === opt.value ? 'text-[#094CB2] font-bold bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Ngày bắt đầu</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleSaveProfile({ cycle_anchor_date: e.target.value }); 
                }} 
                className="w-full h-[52px] px-5 bg-[#F5F3F4] rounded-xl font-sans font-medium text-[15px] lg:text-[16px] text-[#1B1C1D] focus:outline-none focus:ring-1 focus:ring-[#094CB2] [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
              />
            </div>
            
            <div className="flex items-center gap-3 bg-[#094CB2]/5 border border-[#094CB2]/10 rounded-xl px-5 py-4 sm:col-span-2">
              <Info size={20} className="text-[#094CB2] shrink-0" />
              <span className="font-sans text-[13px] lg:text-[14px] text-[#434653] leading-relaxed">Dự kiến ngày tổng kết chu kỳ tiếp theo sẽ là: <span className="font-bold text-[#094CB2]">{endDate}</span></span>
            </div>
          </div>
        </div>

        {/* DANH MỤC */}
        <div id="categories" className="scroll-mt-[100px] lg:scroll-mt-[120px] bg-transparent flex flex-col gap-6 relative z-10 pt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-serif font-bold text-[22px] lg:text-[26px] text-[#1B1C1D] m-0">Quản lý Danh mục</h3>
              <p className="font-sans text-[13px] lg:text-[14px] text-[#737784] m-0">Phân loại và quản lý các nguồn tiền của bạn.</p>
            </div>
            <button onClick={handleOpenCreateCat} className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3 lg:py-3 bg-[#094CB2] rounded-xl font-sans font-bold text-[14px] lg:text-[15px] text-white hover:bg-blue-800 transition-colors shadow-sm cursor-pointer min-h-[48px]">
              <Plus size={20} /> Thêm danh mục
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {isLoadingCats ? <span className="font-sans text-[14px] lg:text-[15px] text-[#737784] italic">Đang tải...</span> : categories.length === 0 ? <span className="font-sans text-[14px] lg:text-[15px] text-[#737784] italic">Chưa có danh mục nào.</span> : (
              categories.map(cat => {
                const IconComp = getIconComponent(cat.icon);
                return (
                  <div key={cat.id} className="flex justify-between items-center p-4 lg:p-5 bg-white border border-[#E3E2E3]/80 rounded-2xl hover:shadow-md transition-shadow group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-50" style={{ backgroundColor: cat.color_hex || '#094CB2' }}></div>
                    <div className="flex items-center gap-4 pl-2 lg:pl-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: hexToRgba(cat.color_hex || '#094CB2', 0.1) }}>
                        <IconComp size={20} style={{ color: cat.color_hex || '#094CB2' }} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <span className="font-sans font-bold text-[15px] lg:text-[16px] text-[#1B1C1D] truncate max-w-[120px] lg:max-w-[130px]">{cat.name}</span>
                          {cat.type === 'income' && <span className="text-[9px] bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-[0.5px]">THU</span>}
                        </div>
                        <span className="font-sans text-[12px] lg:text-[13px] text-[#737784] truncate max-w-[150px]">{cat.note || 'Tùy chọn'}</span>
                      </div>
                    </div>
                    {/* Luôn hiển thị nút thao tác trên Mobile */}
                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditCat(cat)} className="p-2.5 text-gray-400 hover:text-[#094CB2] hover:bg-blue-50 rounded-xl cursor-pointer transition-colors min-w-[44px] min-h-[44px] flex justify-center items-center"><Edit2 size={18} /></button>
                      <button onClick={(e) => handleDeleteCat(cat.id, e)} className="p-2.5 text-gray-400 hover:text-[#BA1A1A] hover:bg-red-50 rounded-xl cursor-pointer transition-colors min-w-[44px] min-h-[44px] flex justify-center items-center"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
      </main>

      {/* MODAL THÊM / SỬA DANH MỤC */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[672px] flex flex-col animate-slide-up relative max-h-[90vh] overflow-hidden">
            
            <div className="px-6 lg:px-8 py-5 lg:py-6 flex justify-between items-center shrink-0 border-b border-[#E3E2E3]/50">
              <h2 className="font-serif font-bold text-[22px] lg:text-[28px] text-[#1B1C1D] m-0 pr-8">
                {editingCatId ? 'Cập nhật Danh mục' : 'Thêm Danh mục mới'}
              </h2>
              <button onClick={() => setIsCatModalOpen(false)} disabled={isSubmittingCat} className="p-2 text-gray-400 hover:text-[#1B1C1D] rounded-xl hover:bg-gray-100 cursor-pointer transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center absolute right-4 lg:right-6">
                <X size={24} />
              </button>
            </div>

            <div className="px-6 lg:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              <div className="flex flex-col gap-6 lg:gap-8">
                
                <div className="flex flex-col gap-2">
                  <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Loại danh mục</label>
                  <div className="flex p-1.5 bg-[#F5F3F4] rounded-xl w-full sm:w-fit min-h-[52px]">
                    <button onClick={() => setCatType('expense')} className={`flex-1 sm:flex-none px-6 lg:px-8 py-2.5 rounded-lg font-sans font-bold text-[14px] lg:text-[15px] uppercase tracking-[0.5px] transition-all ${catType === 'expense' ? 'bg-white text-[#BA1A1A] shadow-sm' : 'text-[#737784] hover:text-[#1B1C1D]'}`}>Khoản Chi</button>
                    <button onClick={() => setCatType('income')} className={`flex-1 sm:flex-none px-6 lg:px-8 py-2.5 rounded-lg font-sans font-bold text-[14px] lg:text-[15px] uppercase tracking-[0.5px] transition-all ${catType === 'income' ? 'bg-white text-[#16A34A] shadow-sm' : 'text-[#737784] hover:text-[#1B1C1D]'}`}>Khoản Thu</button>
                  </div>
                </div>

                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col gap-2">
                    <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Tên danh mục</label>
                    <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Ví dụ: Mua sắm" className="w-full h-[52px] px-5 bg-[#F5F3F4] rounded-xl font-sans font-medium text-[15px] lg:text-[16px] text-[#1B1C1D] focus:outline-none focus:ring-1 focus:ring-[#094CB2]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Ghi chú (Tùy chọn)</label>
                    <input type="text" value={catNote} onChange={e => setCatNote(e.target.value)} placeholder="Ví dụ: Chi tiêu hàng ngày..." className="w-full h-[52px] px-5 bg-[#F5F3F4] rounded-xl font-sans font-medium text-[15px] lg:text-[16px] text-[#1B1C1D] focus:outline-none focus:ring-1 focus:ring-[#094CB2]" />
                  </div>
                </div>

                {catType === 'expense' && (
                  <div className="flex flex-col gap-2 w-full animate-fade-in">
                    <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Hạn mức chi tiêu / Tháng</label>
                    <div className="relative w-full">
                      <NumericFormat value={catLimit} onValueChange={(values) => setCatLimit(values.value)} valueIsNumericString={true} thousandSeparator="." decimalSeparator="," allowNegative={false} placeholder="Không giới hạn" className="w-full h-[52px] pl-5 pr-16 bg-[#F5F3F4] rounded-xl font-sans font-medium text-[15px] lg:text-[16px] text-[#1B1C1D] focus:outline-none focus:ring-1 focus:ring-[#094CB2]" />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-sans font-bold text-[14px] lg:text-[15px] text-[#434653]">VNĐ</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 w-full">
                  <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Màu sắc nhận diện</label>
                  <div className="flex flex-wrap items-center gap-3 w-full pt-1">
                    {CATEGORY_COLORS.map(color => (
                      <button key={color} onClick={() => setCatColor(color)} className={`w-10 h-10 rounded-full transition-transform cursor-pointer shrink-0 ${catColor === color ? 'shadow-[0_0_0_2px_white,0_0_0_4px_#094CB2] scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <label className="font-sans font-bold text-[12px] lg:text-[13px] text-[#737784] uppercase tracking-[0.5px]">Biểu tượng (Icon)</label>
                  <div className="bg-[#F5F3F4] border border-[#E3E2E3] rounded-2xl p-4 max-h-[220px] overflow-y-auto custom-scrollbar">
                    <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-10 justify-start sm:justify-items-center">
                      {CATEGORY_ICONS.map(iconObj => {
                        const Icon = iconObj.comp;
                        const isSelected = catIcon === iconObj.id;
                        return (
                          <button key={iconObj.id} onClick={() => setCatIcon(iconObj.id)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${isSelected ? 'bg-white shadow-sm ring-2 ring-[#094CB2]' : 'hover:bg-gray-200'}`}>
                            <Icon size={24} className={isSelected ? 'text-[#094CB2]' : 'text-[#737784]'} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="px-6 lg:px-8 py-5 lg:py-6 border-t border-[#E3E2E3] bg-white flex flex-col-reverse sm:flex-row justify-end gap-4 shrink-0">
              <button onClick={() => setIsCatModalOpen(false)} disabled={isSubmittingCat} className="w-full sm:w-auto px-6 py-3 bg-[#F5F3F4] text-[#1B1C1D] rounded-xl font-sans font-bold text-[14px] lg:text-[15px] hover:bg-gray-200 transition-colors cursor-pointer min-h-[52px]">Hủy bỏ</button>
              <button onClick={handleSaveCategory} disabled={isSubmittingCat} className="w-full sm:w-auto px-8 py-3 bg-[#094CB2] text-white rounded-xl font-sans font-bold text-[14px] lg:text-[15px] hover:bg-blue-800 transition-colors cursor-pointer shadow-sm min-h-[52px]">{isSubmittingCat ? 'Đang xử lý...' : (editingCatId ? 'Cập nhật' : 'Lưu Danh Mục')}</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;