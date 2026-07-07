import React, { useState, useMemo, useEffect } from 'react';
import {
  MoreVertical, Plus, Filter, X, Info, Trash2, Edit2, ChevronDown,
  ShoppingCart, Coffee, Briefcase, GraduationCap, Dumbbell, Plane, Banknote, PartyPopper, Cat, Film,
  Car, Home, Utensils, Luggage, PiggyBank, Zap, Droplet, Wifi, Smartphone, Wallet
} from 'lucide-react';
import walletsApi from '../api/walletsApi';

const colors = ['#094CB2', '#F59E0B', '#F43F5E', '#A855F7', '#16A34A'];

// Danh sách Icon độc lập cho Ví
const WALLET_ICONS = [
  { id: 'ShoppingCart', comp: ShoppingCart }, { id: 'Coffee', comp: Coffee },
  { id: 'Briefcase', comp: Briefcase }, { id: 'GraduationCap', comp: GraduationCap },
  { id: 'Dumbbell', comp: Dumbbell }, { id: 'Plane', comp: Plane },
  { id: 'Banknote', comp: Banknote }, { id: 'PartyPopper', comp: PartyPopper },
  { id: 'Cat', comp: Cat }, { id: 'Film', comp: Film },
  { id: 'Car', comp: Car }, { id: 'Home', comp: Home },
  { id: 'Utensils', comp: Utensils }, { id: 'Luggage', comp: Luggage },
  { id: 'PiggyBank', comp: PiggyBank }, { id: 'Zap', comp: Zap },
  { id: 'Droplet', comp: Droplet }, { id: 'Wifi', comp: Wifi },
  { id: 'Smartphone', comp: Smartphone }, { id: 'Wallet', comp: Wallet }
];

const getIconComponent = (iconName) => {
  const found = WALLET_ICONS.find(i => i.id === iconName);
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

const Savings = () => {
  // ==========================================
  // 1. STATE QUẢN LÝ DỮ LIỆU TỪ API
  // ==========================================
  const [wallets, setWallets] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [globalSuccess, setGlobalSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const [walletsRes, historyRes] = await Promise.all([
        walletsApi.getWallets().catch(() => []), 
        walletsApi.getHistory().catch(() => [])
      ]);

      const mappedWallets = (Array.isArray(walletsRes) ? walletsRes : []).map((w, index) => {
        const targetNum = w.target_amount || 1;
        const currentNum = w.current_amount || 0;
        const percent = Math.min(100, Math.floor((currentNum / targetNum) * 100));
        const themeColor = w.color || colors[index % colors.length];
        
        return {
          id: w.id,
          title: w.name,
          current: `${currentNum.toLocaleString('vi-VN')} VNĐ`,
          target: `${(w.target_amount || 0).toLocaleString('vi-VN')} VNĐ`,
          percent: percent,
          color: themeColor,
          bgLight: hexToRgba(themeColor, 0.1),
          icon: getIconComponent(w.icon),
          rawIconId: w.icon || 'Wallet',
          deadline: w.deadline, 
          isAuto: w.isAuto || w.is_auto || false,
          autoFrequency: w.autoFrequency || w.auto_frequency || 'Hàng tuần',
          autoAmount: w.autoAmount || w.auto_amount || 0,
        };
      });

      setWallets(mappedWallets);
      setHistory(Array.isArray(historyRes) ? historyRes : []);
    } catch (err) {
      setGlobalError('Không thể tải dữ liệu ví tiết kiệm. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showSuccess = (msg) => { setGlobalSuccess(msg); setTimeout(() => setGlobalSuccess(null), 3000); };
  const showError = (msg) => { setGlobalError(msg); setTimeout(() => setGlobalError(null), 4000); };

  // ==========================================
  // 2. TÍNH TOÁN HEADER TỔNG TÀI SẢN
  // ==========================================
  const [openMenuId, setOpenMenuId] = useState(null);

  const getTodayFormatted = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const extractNumber = (currencyString) => parseInt(String(currencyString).replace(/\D/g, '')) || 0;

  const { totalCurrent, overallPercent } = useMemo(() => {
    let currentSum = 0; let targetSum = 0;
    wallets.forEach(wallet => {
      currentSum += extractNumber(wallet.current);
      targetSum += extractNumber(wallet.target);
    });
    const percent = targetSum > 0 ? Math.floor((currentSum / targetSum) * 100) : 0;
    return { totalCurrent: currentSum, overallPercent: percent > 100 ? 100 : percent };
  }, [wallets]);

  // ==========================================
  // 3. XỬ LÝ SỰ KIỆN TẠI VÍ VÀ LỊCH SỬ
  // ==========================================
  const toggleWalletAuto = async (id) => {
    setWallets(wallets.map(w => w.id === id ? { ...w, isAuto: !w.isAuto } : w));
  };

  const handleDeleteWallet = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa ví tiết kiệm này không?")) {
      try {
        await walletsApi.deleteWallet(id);
        showSuccess('Đã xóa ví tiết kiệm thành công!');
        fetchData();
      } catch (err) { showError('Không thể xóa ví. Vui lòng thử lại!'); }
    }
    setOpenMenuId(null);
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterWalletId, setFilterWalletId] = useState('all');
  const [showAllHistory, setShowAllHistory] = useState(false); 

  const filteredHistory = useMemo(() => {
    if (filterWalletId === 'all') return history;
    return history.filter(h => h.walletId === filterWalletId);
  }, [history, filterWalletId]);

  const displayHistory = showAllHistory ? filteredHistory : filteredHistory.slice(0, 5);

  // Hàm helper để parse string thành số có chấm (ví dụ: 1000000 -> 1.000.000)
  const formatInputNumber = (val) => {
    let value = String(val).replace(/\D/g, '');
    if (value) value = parseInt(value, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return value;
  };

  // ==========================================
  // 4. MODAL: TẠO / SỬA VÍ TIẾT KIỆM
  // ==========================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState(null);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletTarget, setNewWalletTarget] = useState('');
  const [newWalletDate, setNewWalletDate] = useState('');
  const [selectedColor, setSelectedColor] = useState('#094CB2');
  const [selectedIcon, setSelectedIcon] = useState('Wallet'); 
  const [autoFrequency, setAutoFrequency] = useState('Hàng tuần');
  const [isFrequencyDropdownOpen, setIsFrequencyDropdownOpen] = useState(false);
  const [autoAmount, setAutoAmount] = useState('');
  const [isAutoDeduct, setIsAutoDeduct] = useState(true);

  const handleWalletTargetChange = (e) => setNewWalletTarget(formatInputNumber(e.target.value));
  const handleAutoAmountChange = (e) => setAutoAmount(formatInputNumber(e.target.value));

  const estimatedDate = useMemo(() => {
    const targetNum = parseInt(String(newWalletTarget).replace(/\D/g, '')) || 0;
    const recurringNum = parseInt(String(autoAmount).replace(/\D/g, '')) || 0;
    if (targetNum > 0 && recurringNum > 0) {
      const periods = Math.ceil(targetNum / recurringNum);
      const daysPerPeriod = autoFrequency === 'Hàng ngày' ? 1 : (autoFrequency === 'Hàng tháng' ? 30 : 7);
      const finalDate = new Date();
      finalDate.setDate(finalDate.getDate() + (periods * daysPerPeriod));
      return `${String(finalDate.getDate()).padStart(2, '0')}/${String(finalDate.getMonth() + 1).padStart(2, '0')}/${finalDate.getFullYear()}`;
    }
    return '...';
  }, [newWalletTarget, autoAmount, autoFrequency]);

  const handleOpenCreateModal = () => {
    setEditingWalletId(null);
    setNewWalletName(''); setNewWalletTarget(''); setNewWalletDate('');
    setSelectedColor('#094CB2'); setSelectedIcon('Wallet');
    setAutoFrequency('Hàng tuần'); setAutoAmount(''); setIsAutoDeduct(true);
    setIsModalOpen(true);
  };

  const handleEditWallet = (wallet) => {
    setEditingWalletId(wallet.id);
    setNewWalletName(wallet.title);
    setNewWalletTarget(formatInputNumber(extractNumber(wallet.target)));
    setNewWalletDate(wallet.deadline ? wallet.deadline.split('T')[0] : ''); 
    setSelectedColor(wallet.color || '#094CB2');
    setSelectedIcon(wallet.rawIconId || 'Wallet');
    setAutoFrequency(wallet.autoFrequency || 'Hàng tuần');
    setAutoAmount(wallet.autoAmount ? formatInputNumber(wallet.autoAmount) : '');
    setIsAutoDeduct(wallet.isAuto || false);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveWallet = async () => {
    if (!newWalletName.trim() || !newWalletTarget) {
      showError("Vui lòng nhập Tên mục tiêu và Số tiền mục tiêu!"); return;
    }
    try {
      setIsSubmitting(true);
      const targetNum = parseInt(String(newWalletTarget).replace(/\D/g, '')) || 0;
      
      const payload = {
        name: newWalletName,
        amount: targetNum,
        deadline: newWalletDate,
        icon: selectedIcon, 
        color: selectedColor,
        isAuto: isAutoDeduct,
        autoFrequency: autoFrequency,
        autoAmount: parseInt(String(autoAmount).replace(/\D/g, '')) || 0
      };

      if (editingWalletId) {
        await walletsApi.updateWallet(editingWalletId, payload);
        showSuccess('Cập nhật ví thành công!');
      } else {
        await walletsApi.createWallet(payload);
        showSuccess('Tạo ví tiết kiệm mới thành công!');
      }
      
      fetchData(); setIsModalOpen(false);
    } catch (err) { showError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu ví tiết kiệm!'); } 
    finally { setIsSubmitting(false); }
  };

  // ==========================================
  // 5. MODAL: NẠP TIỀN
  // ==========================================
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState('');
  const [depositNote, setDepositNote] = useState('');

  const handleDepositAmountChange = (e) => setDepositAmount(formatInputNumber(e.target.value));

  const handleOpenDeposit = (wallet) => {
    setSelectedWallet(wallet); setDepositDate(getTodayFormatted());
    setDepositAmount(''); setDepositNote(''); setIsDepositModalOpen(true);
  };

  const currentBalanceNum = selectedWallet ? extractNumber(selectedWallet.current) : 0;
  const depositAmountNum = parseInt(String(depositAmount).replace(/\D/g, '')) || 0;
  const newBalanceNum = currentBalanceNum + depositAmountNum;

  const handleConfirmDeposit = async () => {
    if (!depositAmount || depositAmountNum <= 0) { showError('Vui lòng nhập số tiền nạp hợp lệ!'); return; }
    try {
      setIsSubmitting(true);
      await walletsApi.deposit(selectedWallet.id, { amount: depositAmountNum, date: depositDate, note: depositNote });
      showSuccess('Nạp tiền vào ví thành công!');
      fetchData(); setIsDepositModalOpen(false);
    } catch (err) { showError(err.response?.data?.message || 'Có lỗi xảy ra khi nạp tiền!'); } 
    finally { setIsSubmitting(false); }
  };

  if (isLoading && wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#094CB2]"></div>
        <p className="font-sans text-[#737784]">Đang đồng bộ dữ liệu ví tiết kiệm...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-10 w-full max-w-[1152px] mx-auto px-4 lg:px-0 pb-10 relative">
      
      {/* THÔNG BÁO GLOBAL */}
      {globalError && (
        <div className="bg-[#FEF2F2] border border-[#F87171] text-[#991B1B] px-4 py-3 rounded-lg flex justify-between items-center shadow-sm animate-fade-in transition-all">
          <span className="font-sans text-[13px] lg:text-sm font-medium">{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"><X size={16} /></button>
        </div>
      )}
      {globalSuccess && (
        <div className="bg-[#F0FDF4] border border-[#4ADE80] text-[#166534] px-4 py-3 rounded-lg flex justify-between items-center shadow-sm animate-fade-in transition-all">
          <span className="font-sans text-[13px] lg:text-sm font-medium">{globalSuccess}</span>
          <button onClick={() => setGlobalSuccess(null)} className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"><X size={16} /></button>
        </div>
      )}

      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#094CB2] to-[#3366CC] rounded-2xl p-5 lg:p-8 shadow-sm w-full">
        <div className="absolute -right-16 -top-16 w-60 h-60 lg:w-80 lg:h-80 bg-white/5 blur-3xl rounded-full z-0 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-6 lg:gap-8">
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[12px] lg:text-[14px] text-white/90 uppercase tracking-[0.35px] font-medium">Tổng tài sản tiết kiệm</span>
            <h2 className="font-serif font-bold text-[28px] lg:text-[36px] text-white m-0">{totalCurrent.toLocaleString('vi-VN')} VNĐ</h2>
          </div>
          <div className="flex flex-col gap-2.5 lg:gap-3 w-full max-w-[672px]">
            <div className="flex justify-between items-end">
              <span className="font-sans text-[12px] lg:text-[14px] text-white">Tiến độ chu kỳ hiện tại</span>
              <span className="font-sans font-bold text-[12px] lg:text-[14px] text-white">{overallPercent}%</span>
            </div>
            <div className="w-full h-2.5 lg:h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-[#F9E37A] rounded-full transition-all duration-1000" style={{ width: `${overallPercent}%` }}></div>
            </div>
            <span className="font-sans text-[12px] lg:text-[14px] text-white/90 leading-tight">
              Bạn đã hoàn thành {overallPercent}% tổng mục tiêu của chu kỳ này. Cố lên nhé!
            </span>
          </div>
        </div>
      </div>

      {/* 2. DANH SÁCH VÍ TIẾT KIỆM */}
      <div className="flex flex-col gap-4 lg:gap-6 w-full">
        <div className="flex justify-between items-center w-full">
          <h3 className="font-serif font-bold text-[20px] lg:text-[24px] text-[#1B1C1D] m-0">Ví Tiết Kiệm</h3>
          <button className="font-sans font-medium text-[13px] lg:text-[14px] text-[#094CB2] hover:underline cursor-pointer min-h-[44px]">Xem tất cả</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
          {wallets.map((wallet) => {
            const IconComp = wallet.icon; 
            return (
              <div key={wallet.id} className="flex flex-col justify-between p-5 lg:p-6 bg-white border border-[#C3C6D5]/30 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-2xl min-h-[260px] lg:min-h-0 lg:h-[280px] animate-fade-in">
                <div className="flex justify-between items-start w-full relative">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: wallet.bgLight }}>
                    <IconComp size={20} color={wallet.color} />
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === wallet.id ? null : wallet.id)} className="text-[#434653] hover:bg-gray-100 p-1.5 lg:p-1 rounded-md cursor-pointer transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1.5 lg:mr-0">
                      <MoreVertical size={20} />
                    </button>
                    {openMenuId === wallet.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                        <div className="absolute right-0 mt-2 w-max min-w-[160px] bg-white border border-gray-100 shadow-[0px_8px_24px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden z-50 py-1.5 lg:py-2 animate-fade-in origin-top-right">
                          <button onClick={() => handleEditWallet(wallet)} className="w-full text-left px-4 py-3 lg:py-2 font-sans font-medium text-[13px] lg:text-[14px] text-[#434653] hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer">
                            <Edit2 size={14} /> Chỉnh sửa
                          </button>
                          <div className="h-px bg-gray-100 mx-2 my-0.5"></div>
                          <button onClick={() => handleDeleteWallet(wallet.id)} className="w-full text-left px-4 py-3 lg:py-2 font-sans font-medium text-[13px] lg:text-[14px] text-[#E11D48] hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer">
                            <Trash2 size={14} /> Xóa ví
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-3 lg:mt-4">
                  <h4 className="font-sans font-semibold text-[16px] lg:text-[18px] text-[#1B1C1D] m-0 truncate" title={wallet.title}>{wallet.title}</h4>
                  <div className="flex items-center gap-1 font-sans text-[13px] lg:text-[14px]">
                    <span className="text-[#434653] font-medium">{wallet.current}</span>
                    <span className="text-[#434653]/70 text-[11px] lg:text-[12px]">/ {wallet.target}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-auto">
                  <div className="flex flex-col gap-1.5 lg:gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-medium text-[11px] lg:text-[12px] text-[#434653]">Tiến độ</span>
                      <span className="font-sans font-bold text-[11px] lg:text-[12px]" style={{ color: wallet.color }}>{wallet.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 lg:h-2 bg-[#E9E8E9] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${wallet.percent}%`, backgroundColor: wallet.color }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      <Wallet size={14} className="text-[#434653]" />
                      <span className="font-sans font-medium text-[11px] lg:text-[12px] text-[#434653]">Tự động trích</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-sans font-bold text-[10px] uppercase tracking-[0.5px] hidden sm:block ${wallet.isAuto ? 'text-[#094CB2]' : 'text-[#434653]/60'}`}>
                        {wallet.isAuto ? 'Bật' : 'Tắt'}
                      </span>
                      <div onClick={() => toggleWalletAuto(wallet.id)} className={`w-10 h-5 lg:w-8 lg:h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${wallet.isAuto ? 'bg-[#094CB2] justify-end' : 'bg-[#E3E2E3] justify-start'}`}>
                        <div className="w-4 h-4 lg:w-3 lg:h-3 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => handleOpenDeposit(wallet)} className="w-full py-2.5 lg:py-2 bg-[#E9E8E9] hover:bg-gray-200 transition-colors rounded-lg font-sans font-medium text-[13px] lg:text-[14px] text-[#094CB2] mt-1 cursor-pointer min-h-[44px]">
                    Nạp tiền
                  </button>
                </div>
              </div>
            );
          })}

          <button onClick={handleOpenCreateModal} className="flex flex-col justify-center items-center gap-3 lg:gap-4 bg-[#FAF9FA] border-2 border-dashed border-[#C3C6D5]/40 rounded-2xl min-h-[260px] lg:h-[280px] cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-[#EFEDEE] rounded-2xl flex items-center justify-center"><Plus size={24} className="text-[#434653]" strokeWidth={2.5} /></div>
            <span className="font-sans font-medium text-[14px] lg:text-[16px] text-[#434653]">Tạo ví mục tiêu mới</span>
          </button>
        </div>
      </div>

      {/* 3. BẢNG LỊCH SỬ NẠP TIỀN -> CHUYỂN ĐỔI CARD VIEW TRÊN MOBILE */}
      <div className="flex flex-col w-full bg-transparent lg:bg-white lg:shadow-[0px_4px_24px_rgba(27,28,29,0.04)] rounded-none lg:rounded-2xl lg:border border-[#E3E2E3]/50 overflow-hidden mt-2 lg:mt-6">
        
        {/* Header Lịch sử */}
        <div className="flex justify-between items-center lg:px-6 py-4 lg:py-6 border-b border-[#E3E2E3]/50 relative">
          <h3 className="font-serif font-bold text-[18px] lg:text-[20px] text-[#1B1C1D] m-0">Lịch sử phân bổ tiền</h3>
          
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-1.5 lg:p-1 rounded-lg transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center bg-white border border-[#E3E2E3] lg:border-none lg:bg-transparent ${filterWalletId !== 'all' ? 'text-[#094CB2] border-[#094CB2]/30' : 'text-[#434653] hover:text-[#1B1C1D]'}`}
              title="Lọc theo ví"
            >
              <Filter size={18} strokeWidth={2} />
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-[220px] max-w-[85vw] bg-white border border-[#E3E2E3]/50 shadow-[0px_8px_24px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden z-[100] py-2 animate-fade-in origin-top-right">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <span className="font-sans font-bold text-[11px] text-[#737784] uppercase tracking-[0.5px]">Lọc theo ví nhận</span>
                  </div>
                  <button
                    onClick={() => { setFilterWalletId('all'); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-3 lg:py-2.5 font-sans text-[13px] lg:text-[14px] hover:bg-gray-50 transition-colors ${filterWalletId === 'all' ? 'font-bold text-[#094CB2] bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}
                  >
                    Tất cả các ví
                  </button>
                  <div className="h-px bg-gray-100 mx-2 my-0.5"></div>
                  <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                    {wallets.map(w => {
                      const WIcon = w.icon;
                      return (
                        <button
                          key={w.id}
                          onClick={() => { setFilterWalletId(w.id); setIsFilterOpen(false); }}
                          className={`w-full text-left px-4 py-3 lg:py-2.5 font-sans text-[13px] lg:text-[14px] hover:bg-gray-50 transition-colors flex items-center gap-3 ${filterWalletId === w.id ? 'font-bold text-[#094CB2] bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}
                        >
                          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: w.bgLight }}>
                            <WIcon size={12} color={w.color}/>
                          </div>
                          <span className="truncate">{w.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Nội dung Bảng */}
        <div className="w-full">
          <table className="w-full text-left border-collapse block lg:table">
            <thead className="hidden lg:table-header-group">
              <tr className="bg-[#FAF9FA] border-b border-[#E3E2E3]/50">
                <th className="px-6 py-4 font-sans font-semibold text-[11px] text-[#737784] uppercase tracking-[0.8px]">Ngày</th>
                <th className="px-6 py-4 font-sans font-semibold text-[11px] text-[#737784] uppercase tracking-[0.8px]">Giao dịch</th>
                <th className="px-6 py-4 font-sans font-semibold text-[11px] text-[#737784] uppercase tracking-[0.8px]">Ví nhận</th>
                <th className="px-6 py-4 font-sans font-semibold text-[11px] text-[#737784] uppercase tracking-[0.8px] text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="font-sans block lg:table-row-group">
              {displayHistory.length > 0 ? (
                displayHistory.map((item) => {
                  const HistIcon = item.icon ? getIconComponent(item.icon) : Wallet;
                  return (
                    <tr key={item.id} className="flex flex-col lg:table-row border border-[#E3E2E3]/60 lg:border-0 lg:border-b lg:border-[#E3E2E3]/30 rounded-xl lg:rounded-none mb-3 lg:mb-0 p-4 lg:p-0 bg-white lg:bg-transparent shadow-sm lg:shadow-none hover:bg-gray-50/50 transition-colors">
                      <td className="px-0 lg:px-6 py-1.5 lg:py-5 flex lg:table-cell justify-between items-center lg:whitespace-nowrap border-b lg:border-0 border-gray-100 pb-3 mb-2 lg:pb-5 lg:mb-0">
                        <span className="lg:hidden text-[#737784] font-medium text-[11px] uppercase tracking-[0.5px]">Ngày</span>
                        <span className="text-[13px] lg:text-[14px] text-[#434653] font-medium lg:font-normal">{item.date}</span>
                      </td>
                      <td className="px-0 lg:px-6 py-1.5 lg:py-5 flex lg:table-cell justify-between items-center">
                        <span className="lg:hidden text-[#737784] font-medium text-[11px] uppercase tracking-[0.5px]">Ghi chú</span>
                        <span className="font-medium text-[13px] lg:text-[14px] text-[#1B1C1D] text-right lg:text-left max-w-[180px] lg:max-w-none truncate">{item.desc || 'Nạp tiền'}</span>
                      </td>
                      <td className="px-0 lg:px-6 py-1.5 lg:py-5 flex lg:table-cell justify-between items-center">
                        <span className="lg:hidden text-[#737784] font-medium text-[11px] uppercase tracking-[0.5px]">Ví nhận</span>
                        <div className="inline-flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1 bg-[#EFEDEE] rounded-full whitespace-nowrap">
                          <HistIcon size={12} style={{ color: item.color || '#094CB2' }} />
                          <span className="font-medium text-[11px] lg:text-[12px] text-[#1B1C1D]">{item.walletName}</span>
                        </div>
                      </td>
                      <td className="px-0 lg:px-6 py-1.5 lg:py-5 flex lg:table-cell justify-between items-center">
                        <span className="lg:hidden text-[#737784] font-medium text-[11px] uppercase tracking-[0.5px]">Số tiền nạp</span>
                        <span className="font-bold text-[14px] text-[#16A34A] lg:text-right whitespace-nowrap">+{item.amount}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="block lg:table-row">
                  <td colSpan="4" className="px-4 py-8 lg:py-16 text-center block lg:table-cell bg-white rounded-xl shadow-sm lg:shadow-none border border-[#E3E2E3]/50 lg:border-none">
                    <span className="font-sans italic text-[13px] lg:text-[14px] text-[#434653]">Chưa có lịch sử giao dịch nào.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredHistory.length > 5 && (
          <div className="w-full flex justify-center py-4 border-t border-[#E3E2E3]/30">
            <button 
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="font-sans font-semibold text-[13px] lg:text-[14px] text-[#094CB2] hover:underline cursor-pointer transition-all min-h-[44px]"
            >
              {showAllHistory ? 'Thu gọn lịch sử' : `Xem toàn bộ lịch sử (${filteredHistory.length})`}
            </button>
          </div>
        )}
      </div>

      {/* 4. MODAL TẠO / SỬA VÍ TIẾT KIỆM (Responsive Layout) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[672px] max-h-[85vh] lg:max-h-[90vh] flex flex-col overflow-hidden animate-slide-up relative">
            <div className="flex justify-between items-center p-4 lg:p-6 border-b border-gray-100 relative shrink-0">
              <h2 className="font-serif font-bold text-[18px] lg:text-[24px] text-[#1B1C1D] m-0 pr-8">
                {editingWalletId ? 'Chỉnh sửa ví tiết kiệm' : 'Tạo ví tiết kiệm mới'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="absolute right-3 lg:right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center">
                <X size={20} className="text-[#1B1C1D]" />
              </button>
            </div>

            <div className="flex flex-col gap-5 lg:gap-8 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
              
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 lg:gap-6">
                <div className="flex flex-col gap-1.5 lg:gap-2">
                  <label className="font-sans font-semibold text-[12px] lg:text-[14px] text-[#434653]">Tên mục tiêu</label>
                  <input
                    type="text" value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="VD: Mua xe, Đám cưới..."
                    className="w-full h-[44px] lg:h-[48px] px-4 bg-[#FAF9FA] border border-[#C3C6D5]/40 rounded-lg font-sans text-[14px] text-[#1B1C1D] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2]"
                  />
                </div>
                <div className="flex flex-col gap-1.5 lg:gap-2">
                  <label className="font-sans font-semibold text-[12px] lg:text-[14px] text-[#434653]">Số tiền mục tiêu</label>
                  <div className="relative w-full">
                    <input
                      type="text" value={newWalletTarget} onChange={handleWalletTargetChange}
                      placeholder="0"
                      className="w-full h-[44px] lg:h-[48px] pl-4 pr-12 bg-[#FAF9FA] border border-[#C3C6D5]/40 rounded-lg font-sans text-[14px] text-[#1B1C1D] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-sans text-[12px] lg:text-[13px] font-medium text-[#434653]">VNĐ</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 lg:gap-6">
                <div className="flex flex-col gap-1.5 lg:gap-2">
                  <label className="font-sans font-semibold text-[12px] lg:text-[14px] text-[#434653]">Ngày dự kiến</label>
                  <div className="relative w-full">
                    <input
                      type="date" value={newWalletDate} onChange={(e) => setNewWalletDate(e.target.value)}
                      className="w-full h-[44px] lg:h-[48px] px-4 bg-[#FAF9FA] border border-[#C3C6D5]/40 rounded-lg font-sans text-[14px] text-[#1B1C1D] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 lg:gap-2">
                  <label className="font-sans font-semibold text-[12px] lg:text-[14px] text-[#434653]">Màu sắc đại diện</label>
                  <div className="flex items-center gap-3 h-[44px] lg:h-[48px]">
                    {colors.map((color) => (
                      <button
                        type="button" key={color} onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 lg:w-8 lg:h-8 rounded-full transition-transform cursor-pointer shrink-0 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-white ring-[#094CB2] scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 lg:gap-2 w-full">
                <label className="font-sans font-semibold text-[12px] lg:text-[14px] text-[#434653]">Biểu tượng ví</label>
                <div className="bg-white border border-[#C3C6D5]/30 rounded-xl p-3 lg:p-4 shadow-sm">
                  <div className="flex flex-wrap gap-2 lg:gap-x-2 lg:gap-y-4 justify-start sm:justify-center lg:grid lg:grid-cols-10">
                    {WALLET_ICONS.map(iconObj => {
                      const Icon = iconObj.comp;
                      const isSelected = selectedIcon === iconObj.id;
                      return (
                        <button
                          type="button" key={iconObj.id} onClick={() => setSelectedIcon(iconObj.id)}
                          className={`w-10 h-10 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${isSelected ? 'bg-[#094CB2] shadow-md' : 'bg-[#FAF9FA] hover:bg-gray-200'}`}
                        >
                          <Icon size={18} lg:size={20} className={isSelected ? 'text-white' : 'text-[#434653]'} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 lg:gap-6 mt-1 lg:mt-2">
                <div className="flex flex-col gap-1.5 lg:gap-2 relative">
                  <label className="font-sans font-semibold text-[11px] lg:text-[12px] text-[#434653] uppercase tracking-[0.5px]">Tần suất nạp</label>
                  <div className="relative w-full">
                    {/* Nút bấm Custom thay cho select */}
                    <button 
                      type="button"
                      onClick={() => setIsFrequencyDropdownOpen(!isFrequencyDropdownOpen)}
                      className="w-full h-[44px] lg:h-[48px] px-4 bg-[#FAF9FA] border border-[#C3C6D5]/40 rounded-lg font-sans text-[14px] text-[#1B1C1D] flex justify-between items-center focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2] cursor-pointer"
                    >
                      <span className="truncate pr-4">{autoFrequency}</span>
                      <ChevronDown size={20} className={`text-[#434653]/60 transition-transform shrink-0 ${isFrequencyDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Menu thả xuống tự thiết kế */}
                    {isFrequencyDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[1000]" onClick={() => setIsFrequencyDropdownOpen(false)}></div>
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E3E2E3]/50 shadow-[0_8px_24px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden z-[1010] py-1.5 animate-fade-in">
                          {['Hàng tuần', 'Hàng tháng', 'Hàng ngày'].map((freq) => (
                            <button
                              key={freq}
                              type="button"
                              onClick={() => {
                                setAutoFrequency(freq);
                                setIsFrequencyDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 font-sans text-[14px] hover:bg-gray-50 transition-colors ${autoFrequency === freq ? 'text-[#094CB2] font-bold bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}
                            >
                              {freq}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 lg:gap-2">
                  <label className="font-sans font-semibold text-[11px] lg:text-[12px] text-[#434653] uppercase tracking-[0.5px]">Số tiền mỗi kỳ</label>
                  <div className="relative w-full">
                    <input
                      type="text" value={autoAmount} onChange={handleAutoAmountChange}
                      placeholder="0"
                      className="w-full h-[44px] lg:h-[48px] pl-4 pr-12 bg-[#FAF9FA] border border-[#C3C6D5]/40 rounded-lg font-sans text-[14px] text-[#1B1C1D] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-sans text-[12px] lg:text-[13px] font-medium text-[#434653]">VNĐ</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#094CB2]/5 border border-[#094CB2]/10 rounded-lg px-4 py-3">
                <Info size={16} className="text-[#094CB2] shrink-0" />
                <span className="font-sans text-[12px] lg:text-[13px] text-[#434653] leading-snug">
                  Dự kiến hoàn thành: <span className="font-medium text-[#094CB2] block sm:inline">{estimatedDate}</span>
                </span>
              </div>

              <div className="flex justify-between items-center bg-[#FAF9FA] rounded-xl p-3 lg:p-5 border border-gray-200 mt-1 lg:mt-2">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-10 h-10 bg-[#094CB2] rounded-lg flex items-center justify-center shrink-0">
                    <Wallet size={18} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans font-semibold text-[13px] lg:text-[14px] text-[#1B1C1D]">Tự động trích tiền</span>
                    <span className="font-sans text-[11px] lg:text-[12px] text-[#434653]">Tiết kiệm kỷ luật hơn mỗi kỳ</span>
                  </div>
                </div>
                <div
                  onClick={() => setIsAutoDeduct(!isAutoDeduct)}
                  className={`w-12 h-6 lg:w-14 lg:h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 shrink-0 ${isAutoDeduct ? 'bg-[#094CB2]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 lg:w-5 lg:h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isAutoDeduct ? 'translate-x-6 lg:translate-x-7' : 'translate-x-0'}`}></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 p-4 lg:p-6 border-t border-gray-100 bg-white shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="w-full sm:flex-1 h-[44px] lg:h-[46px] border border-gray-300 hover:bg-gray-50 rounded-lg text-[14px] font-bold text-[#434653] transition-colors cursor-pointer">Hủy bỏ</button>
              <button type="button" onClick={handleSaveWallet} disabled={isSubmitting} className={`w-full sm:w-[180px] h-[44px] lg:h-[46px] rounded-lg text-[14px] font-bold text-white transition-colors cursor-pointer ${isSubmitting ? 'bg-gray-400' : 'bg-[#094CB2] hover:bg-blue-800'}`}>
                {isSubmitting ? 'Đang xử lý...' : (editingWalletId ? 'Cập nhật' : 'Tạo ví ngay')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL NẠP TIỀN (CHUẨN FORM MOBILE) */}
      {isDepositModalOpen && selectedWallet && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-2xl w-full max-w-[480px] flex flex-col p-5 sm:p-8 gap-5 lg:gap-6 animate-slide-up relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X size={20} className="text-[#1B1C1D]" />
            </button>
            
            <div className="flex flex-col gap-1 sm:gap-2 w-full pr-10">
              <h2 className="font-serif font-bold text-[22px] sm:text-[28px] text-[#1B1C1D] m-0">Nạp tiền vào ví</h2>
              <div className="flex items-center gap-2">
                <selectedWallet.icon size={16} style={{ color: selectedWallet.color }} />
                <span className="font-sans font-bold text-[13px] sm:text-[14px]" style={{ color: selectedWallet.color }}>
                  {selectedWallet.title}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-5 w-full">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className="font-sans font-bold text-[10px] sm:text-[11px] text-[#434653] uppercase tracking-[0.5px]">Số tiền nạp</label>
                <div className="relative w-full">
                  <input
                    type="text" value={depositAmount} onChange={handleDepositAmountChange}
                    placeholder="0"
                    className="w-full h-[48px] pl-4 pr-12 bg-[#F5F3F4] rounded-lg font-sans font-bold text-[15px] sm:text-[16px] text-[#1B1C1D] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-sans font-bold text-[13px] sm:text-[14px] text-[#434653]">VNĐ</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className="font-sans font-bold text-[10px] sm:text-[11px] text-[#434653] uppercase tracking-[0.5px]">Ngày giao dịch</label>
                <div className="relative w-full">
                  <input
                    type="date"
                    value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)}
                    className="w-full h-[48px] px-4 bg-[#F5F3F4] rounded-lg font-sans text-[14px] sm:text-[15px] text-[#1B1C1D] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className="font-sans font-bold text-[10px] sm:text-[11px] text-[#434653] uppercase tracking-[0.5px]">Ghi chú (Tùy chọn)</label>
                <textarea
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="Nhập ghi chú tại đây..."
                  className="w-full h-[70px] sm:h-[80px] p-3 sm:p-4 bg-[#F5F3F4] rounded-lg font-sans text-[14px] sm:text-[15px] text-[#1B1C1D] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2] resize-none"
                ></textarea>
              </div>

              <div className="flex flex-col p-4 sm:p-5 gap-2 sm:gap-3 bg-[#F5F3F4] rounded-xl mt-1">
                <div className="flex justify-between items-center w-full">
                  <span className="font-sans text-[12px] sm:text-[13px] text-[#434653]">Số dư hiện tại</span>
                  <span className="font-sans font-medium text-[12px] sm:text-[13px] text-[#1B1C1D]">
                    {currentBalanceNum.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center w-full pt-2 border-t border-[#C3C6D5]/30">
                  <span className="font-sans text-[12px] sm:text-[13px] text-[#434653]">Số dư sau khi nạp</span>
                  <span className="font-sans font-bold text-[13px] sm:text-[14px] text-[#094CB2]">
                    {newBalanceNum.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3 sm:gap-4 w-full mt-1 sm:mt-2">
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:flex-1 py-3 bg-white hover:bg-gray-50 border border-[#E3E2E3] rounded-lg font-sans font-bold text-[13px] sm:text-[14px] text-[#1B1C1D] transition-colors cursor-pointer min-h-[44px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeposit}
                disabled={isSubmitting}
                className={`w-full sm:flex-[1.5] py-3 rounded-lg font-sans font-bold text-[13px] sm:text-[14px] text-white transition-colors cursor-pointer min-h-[44px] ${isSubmitting ? 'bg-gray-400' : 'bg-[#094CB2] hover:bg-blue-800'}`}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận nạp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Savings;