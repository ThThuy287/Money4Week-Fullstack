import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet, Plus, Save, Building2, BookOpen, Laptop, ShieldCheck,
  ChevronDown, CalendarDays, CheckCircle2, X,
  Utensils, Banknote, BusFront, ShoppingBag,
  GraduationCap, Home, Plane, MoreHorizontal
} from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import transactionsApi from '../api/transactionsApi';
import remindersApi from '../api/remindersApi';

const getIconComponent = (iconName) => {
  if (!iconName) return MoreHorizontal;
  const icons = { Laptop, GraduationCap, Home, Plane, Building2, BookOpen, Utensils, Banknote, BusFront, ShoppingBag, Wallet };
  return icons[iconName] || MoreHorizontal;
};

const formatCompactK = (num) => {
  return Number(num).toLocaleString('vi-VN') + ' VNĐ';
};

const Input = () => {
  // ==========================================
  // KHỐI 1: STATE CHO FORM GIAO DỊCH (THU/CHI)
  // ==========================================
  const [transactionType, setTransactionType] = useState('expense');
  
  const getTodayFormatted = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [transactionDate, setTransactionDate] = useState(getTodayFormatted());
  const [transAmount, setTransAmount] = useState('');
  const [transNote, setTransNote] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(''); 
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false); // STATE MỚI CHO CUSTOM DROPDOWN

  const [apiCategories, setApiCategories] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isSubmittingTrans, setIsSubmittingTrans] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [transError, setTransError] = useState(null);
  const [transSuccess, setTransSuccess] = useState(null);

  const handleTransAmountChange = (e) => {
    let value = String(e.target.value).replace(/\D/g, '');
    if (value) value = parseInt(value, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setTransAmount(value);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await transactionsApi.getCategories(transactionType);
        setApiCategories(data || []);
        if (data && data.length > 0) setSelectedCatId(data[0].id);
        else setSelectedCatId('');
      } catch (err) { console.error('Lỗi tải danh mục:', err); }
    };
    fetchCategories();
  }, [transactionType]);

  const fetchRecentTransactions = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await transactionsApi.getTransactions({ limit: 5 });
      setRecentTransactions(res.data || []); 
    } catch (err) { console.error('Lỗi tải lịch sử:', err); } 
    finally { setIsLoadingHistory(false); }
  };

  useEffect(() => { fetchRecentTransactions(); }, []);

  const handleSaveTransaction = async () => {
    setTransError(null); setTransSuccess(null);
    if (!transAmount || !selectedCatId) return setTransError('Vui lòng nhập số tiền và chọn danh mục!');

    try {
      setIsSubmittingTrans(true);
      const rawAmount = parseInt(String(transAmount).replace(/\./g, ''), 10);
      
      await transactionsApi.createTransaction({
        category_id: isNaN(Number(selectedCatId)) ? selectedCatId : Number(selectedCatId),
        type: transactionType,
        amount: rawAmount,
        date: transactionDate, 
        transaction_date: transactionDate, 
        note: transNote
      });

      setTransSuccess('Thêm giao dịch thành công!');
      setTransAmount(''); setTransNote('');
      fetchRecentTransactions(); 
      setTimeout(() => setTransSuccess(null), 3000);
    } catch (err) {
      setTransError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally { setIsSubmittingTrans(false); }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'dd/mm/yyyy';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return 'dd/mm/yyyy';
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // ==========================================
  // KHỐI 2: LOGIC PHÂN TÍCH CHI TIẾT THU/CHI
  // ==========================================
  const [detailType, setDetailType] = useState('expense');
  const [groupedDetails, setGroupedDetails] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const accentColor = detailType === 'expense' ? '#BA1A1A' : '#16A34A';

  const [allCategories, setAllCategories] = useState([]);
  useEffect(() => {
    const fetchAllCat = async () => {
      try {
        const res = await transactionsApi.getCategories(); 
        setAllCategories(res || []);
      } catch (err) { console.error(err); }
    };
    fetchAllCat();
  }, []);

  useEffect(() => {
    const fetchAndAnalyzeDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        
        const lastDayNum = new Date(yyyy, today.getMonth() + 1, 0).getDate();
        const firstDay = `${yyyy}-${mm}-01`;
        const lastDay = `${yyyy}-${mm}-${lastDayNum}`;

        const res = await transactionsApi.getTransactions({ limit: 1000, type: detailType, startDate: firstDay, endDate: lastDay });
        
        const txs = res.data || [];
        let total = 0; const groups = {};
        
        txs.forEach(tx => {
          const catId = tx.category?.id || 'other';
          const catName = tx.category?.name || 'Khác';
          const catColor = tx.category?.color || accentColor; 
          const catLimit = tx.category?.limit || 0; 
          
          if (!groups[catId]) groups[catId] = { id: catId, name: catName, amount: 0, color: catColor, limit: catLimit };
          groups[catId].amount += tx.amount;
          total += tx.amount;
        });

        const formatted = Object.values(groups)
          .map(g => {
             const fallbackCat = allCategories.find(c => c.id === g.id);
             const finalLimit = Number(g.limit) || Number(fallbackCat?.limit_amount) || 0;

             return {
                id: g.id,
                category: g.name.toUpperCase(),
                rawAmount: g.amount,
                amount: Number(g.amount).toLocaleString('vi-VN'),
                width: total > 0 ? `${Math.round((g.amount / total) * 100)}%` : '0%',
                color: g.color,
                limit: finalLimit
             };
          })
          .sort((a, b) => b.rawAmount - a.rawAmount);
          
        setGroupedDetails(formatted);
      } catch (error) { console.error('Lỗi tải chi tiết:', error); } 
      finally { setIsLoadingDetails(false); }
    };
    fetchAndAnalyzeDetails();
  }, [detailType, recentTransactions, allCategories]); 

  const displayDetails = showAllDetails ? groupedDetails : groupedDetails.slice(0, 4);

  // ==========================================
  // KHỐI 3: STATE & LOGIC CHO REMINDERS / MỤC TIÊU
  // ==========================================
  const [goals, setGoals] = useState([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [goalGlobalError, setGoalGlobalError] = useState(null);
  const [goalGlobalSuccess, setGoalGlobalSuccess] = useState(null);
  
  // Create Goal Modal States
  const [showModal, setShowModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [selectedGoalCat, setSelectedGoalCat] = useState('');
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Deposit Goal Modal States
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(getTodayFormatted());
  const [depositNote, setDepositNote] = useState('');

  const fetchGoals = async () => {
    setIsLoadingGoals(true); setGoalGlobalError(null);
    try {
      const data = await remindersApi.getReminders();
      setGoals(data || []);
    } catch (err) { setGoalGlobalError('Không thể tải dữ liệu mục tiêu.'); } 
    finally { setIsLoadingGoals(false); }
  };
  useEffect(() => { fetchGoals(); }, []);

  const modalCategories = Array.isArray(apiCategories) ? apiCategories : [];

  const weeksRemaining = useMemo(() => {
    if (!goalDate) return 0;
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const target = new Date(goalDate); target.setHours(0, 0, 0, 0);
      if (target < today) return 0; 
      const diffDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays === 0 ? 1 : Math.ceil(diffDays / 7);
    } catch (e) { return 0; }
  }, [goalDate]);

  const weeklySaving = useMemo(() => {
    try {
      const amount = parseInt(String(goalAmount).replace(/\D/g, ''), 10) || 0;
      if (amount === 0) return 0;
      if (weeksRemaining === 0) return amount; 
      return Math.ceil(amount / weeksRemaining);
    } catch (e) { return 0; }
  }, [goalAmount, weeksRemaining]);

  const handleAmountChange = (e) => {
    let value = String(e.target.value).replace(/\D/g, '');
    if (value) value = parseInt(value, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setGoalAmount(value);
  };

  const handleSaveGoal = async () => {
    setModalError(null);
    if (!goalName.trim() || !goalAmount || !goalDate) { setModalError('Vui lòng điền đầy đủ Tên, Số tiền và Hạn chót!'); return; }
    try {
      setIsSubmittingGoal(true);
      const amount = parseInt(String(goalAmount).replace(/\D/g, ''), 10);
      
      await remindersApi.createReminder({
        name: goalName.trim(), 
        amount: amount, 
        deadline: goalDate, 
        due_date: goalDate, 
        category_id: selectedGoalCat ? (isNaN(Number(selectedGoalCat)) ? selectedGoalCat : Number(selectedGoalCat)) : null
      });

      setShowModal(false);
      setGoalName(''); setGoalAmount(''); setGoalDate(''); setSelectedGoalCat('');
      setGoalGlobalSuccess('Đã thêm mục tiêu mới thành công!');
      fetchGoals(); 
      setTimeout(() => setGoalGlobalSuccess(null), 3000);
    } catch (err) { setModalError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu mục tiêu!'); } 
    finally { setIsSubmittingGoal(false); }
  };

  const handleDeleteGoal = async (id) => {
    if(!window.confirm('Bạn có chắc chắn muốn xóa mục tiêu này?')) return;
    try {
      await remindersApi.deleteReminder(id);
      setGoalGlobalSuccess('Đã xóa mục tiêu!');
      fetchGoals();
      setTimeout(() => setGoalGlobalSuccess(null), 3000);
    } catch (err) { setGoalGlobalError('Không thể xóa mục tiêu!'); setTimeout(() => setGoalGlobalError(null), 3000); }
  };

  const handleCancel = () => {
    setShowModal(false); setModalError(null);
    setGoalName(''); setGoalAmount(''); setGoalDate(''); setSelectedGoalCat('');
  };

  // Các hàm xử lý Nạp tiền cho Mục tiêu
  const handleOpenDeposit = (goal) => {
    setSelectedGoalForDeposit(goal);
    setDepositDate(getTodayFormatted());
    setDepositAmount('');
    setDepositNote('');
    setIsDepositModalOpen(true);
  };

  const handleConfirmDeposit = async () => {
    const depositAmountNum = parseInt(String(depositAmount).replace(/\D/g, '')) || 0;
    if (!depositAmount || depositAmountNum <= 0) { 
      setGoalGlobalError('Vui lòng nhập số tiền nạp hợp lệ!'); 
      setTimeout(() => setGoalGlobalError(null), 3000);
      return; 
    }
    try {
      setIsSubmittingGoal(true);
      await remindersApi.deposit(selectedGoalForDeposit.id, { 
        amount: depositAmountNum, 
        date: depositDate, 
        note: depositNote 
      });
      setGoalGlobalSuccess('Nạp tiền vào mục tiêu thành công!');
      fetchGoals(); 
      setIsDepositModalOpen(false);
      setTimeout(() => setGoalGlobalSuccess(null), 3000);
    } catch (err) { 
      setGoalGlobalError(err.response?.data?.message || 'Có lỗi xảy ra khi nạp tiền!');
      setTimeout(() => setGoalGlobalError(null), 3000);
    } finally { setIsSubmittingGoal(false); }
  };

  const currentBalanceNum = selectedGoalForDeposit ? (selectedGoalForDeposit.current_amount || 0) : 0;
  const depositAmountNum = parseInt(String(depositAmount).replace(/\D/g, '')) || 0;
  const newBalanceNum = currentBalanceNum + depositAmountNum;

  const calculateGoalStats = (goal) => {
    if (!goal || (!goal.deadline && !goal.due_date)) return { weeksLeft: 0, weeklySaving: 0, isOverdue: false, targetAmt: 0, currentAmt: 0 };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadline = new Date(goal.deadline || goal.due_date); deadline.setHours(0, 0, 0, 0);
    const isOverdue = deadline < today;
    let weeksLeft = 0;
    if (!isOverdue) {
      const diffDays = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));
      weeksLeft = diffDays === 0 ? 1 : Math.ceil(diffDays / 7);
    }
    const targetAmt = Number(goal.target_amount || goal.amount || 0);
    const currentAmt = Number(goal.current_amount || 0);
    const remainingAmount = targetAmt - currentAmt;
    const weeklySaving = weeksLeft > 0 ? Math.ceil(remainingAmount / weeksLeft) : remainingAmount;
    return { weeksLeft, weeklySaving, isOverdue, targetAmt, currentAmt };
  };

  const getStatusInfo = (goal) => {
    const { weeksLeft, isOverdue } = calculateGoalStats(goal);
    if (goal.is_completed) return { label: 'Hoàn thành', bgColor: 'bg-[#E8F5E9]', borderColor: 'border-[#C8E6C9]', dotColor: 'bg-[#16A34A]', textColor: 'text-[#16A34A]' };
    if (isOverdue) return { label: 'Quá hạn', bgColor: 'bg-[#FFF0F0]', borderColor: 'border-[#FFDADA]', dotColor: 'bg-[#BA1A1A]', textColor: 'text-[#BA1A1A]' };
    if (weeksLeft <= 1) return { label: 'Sắp đến hạn', bgColor: 'bg-[#FFF8E6]', borderColor: 'border-[#FFE4B5]', dotColor: 'bg-[#EA580C]', textColor: 'text-[#EA580C]' };
    return { label: 'Đúng tiến độ', bgColor: 'bg-[#E8F5E9]', borderColor: 'border-[#C8E6C9]', dotColor: 'bg-[#16A34A]', textColor: 'text-[#16A34A]' };
  };

  return (
    <div className="flex flex-col gap-8 lg:gap-12 w-full max-w-[1280px] mx-auto animate-fade-in">
      
      {/* KHỐI 1: FORM NHẬP LIỆU GIAO DỊCH */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 w-full">
        {/* Box Nhập Liệu */}
        <div className="flex flex-col p-5 sm:p-6 lg:p-10 w-full bg-white shadow-sm lg:shadow-[0px_8px_32px_rgba(27,28,29,0.06)] rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#E9E8E9] rounded-xl flex items-center justify-center shrink-0">
              <Wallet size={20} className="text-[#094CB2]" />
            </div>
            <h2 className="font-sans font-bold text-[18px] lg:text-[24px] text-[#1B1C1D] m-0">Thêm khoản Thu / Chi</h2>
          </div>

          {transError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{transError}</div>}
          {transSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{transSuccess}</div>}

          {/* Buttons Toggle Thu/Chi */}
          <div className="flex p-1.5 bg-[#E9E8E9] rounded-xl mb-6 lg:mb-8 w-full min-h-[52px]">
            <button type="button" onClick={() => setTransactionType('income')} className={`flex-1 flex justify-center items-center rounded-lg text-[14px] lg:text-[16px] font-semibold transition-all min-h-[44px] ${transactionType === 'income' ? 'bg-white shadow-sm text-[#2E7D32]' : 'text-[#434653] hover:bg-gray-200/50'}`}>Khoản Thu</button>
            <button type="button" onClick={() => setTransactionType('expense')} className={`flex-1 flex justify-center items-center rounded-lg text-[14px] lg:text-[16px] font-semibold transition-all min-h-[44px] ${transactionType === 'expense' ? 'bg-white shadow-sm text-[#BA1A1A]' : 'text-[#434653] hover:bg-gray-200/50'}`}>Khoản Chi</button>
          </div>

          <div className="flex flex-col gap-4 lg:gap-6">
            {/* Amount */}
            <div className="flex flex-col gap-1.5 lg:gap-2">
              <label className="font-sans font-medium text-[12px] lg:text-[13px] text-[#434653] uppercase tracking-[0.6px]">Số tiền</label>
              <div className="relative w-full">
                <input type="text" value={transAmount} onChange={handleTransAmountChange} placeholder="0" className="w-full h-[50px] lg:h-[56px] px-4 lg:px-5 py-3 bg-white border border-[#C3C6D5]/60 rounded-xl font-sans text-[16px] lg:text-[18px] text-[#1B1C1D] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2]" />
                <span className="absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 font-sans font-semibold text-[14px] lg:text-[16px] text-[#434653]">VNĐ</span>
              </div>
            </div>

            {/* Date & Custom Category Dropdown (Responsive: Dọc trên mobile, Ngang trên desktop) */}
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
              <div className="flex flex-col gap-1.5 lg:gap-2 flex-1">
                <label className="font-sans font-medium text-[12px] lg:text-[13px] text-[#434653] uppercase tracking-[0.6px]">Ngày giao dịch</label>
                <div className="relative w-full">
                  <div className="w-full h-[50px] lg:h-[56px] pl-4 lg:pl-5 pr-10 lg:pr-12 py-3 bg-white border border-[#C3C6D5]/60 rounded-xl font-sans text-[14px] lg:text-[16px] text-[#1B1C1D] flex items-center focus-within:border-[#094CB2] focus-within:ring-1 focus-within:ring-[#094CB2]">{formatDisplayDate(transactionDate)}</div>
                  <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <CalendarDays size={20} className="absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 text-[#434653]/60 pointer-events-none" />
                </div>
              </div>
            
              <div className="flex flex-col gap-1.5 lg:gap-2 flex-1 relative">
                <label className="font-sans font-medium text-[12px] lg:text-[13px] text-[#434653] uppercase tracking-[0.6px]">Danh mục</label>
                <div className="relative w-full">
                  {/* Custom Dropdown Button */}
                  <button 
                    type="button"
                    onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                    className="w-full h-[50px] lg:h-[56px] px-4 lg:px-5 bg-white border border-[#C3C6D5]/60 rounded-xl font-sans text-[14px] lg:text-[16px] text-[#1B1C1D] flex justify-between items-center focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2] cursor-pointer"
                  >
                    <span className="truncate pr-4">
                      {apiCategories.length === 0 
                        ? "Chưa có danh mục" 
                        : (apiCategories.find(c => String(c.id) === String(selectedCatId))?.name || "Chọn danh mục")}
                    </span>
                    <ChevronDown size={20} className={`text-[#434653]/60 transition-transform shrink-0 ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Custom Dropdown Menu */}
                  {isCatDropdownOpen && (
                    <>
                      {/* Lớp nền tàng hình để click ra ngoài thì đóng menu */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsCatDropdownOpen(false)}></div>
                      
                      {/* Menu xổ xuống */}
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E3E2E3]/50 shadow-[0_8px_24px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden z-50 py-1.5 max-h-[220px] overflow-y-auto animate-fade-in custom-scrollbar">
                        {apiCategories.length === 0 ? (
                          <div className="px-4 py-3 text-[14px] text-[#737784] italic">Chưa có danh mục</div>
                        ) : (
                          apiCategories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedCatId(cat.id);
                                setIsCatDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 font-sans text-[14px] hover:bg-gray-50 transition-colors truncate ${String(selectedCatId) === String(cat.id) ? 'text-[#094CB2] font-bold bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}
                            >
                              {cat.name}
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1.5 lg:gap-2">
              <label className="font-sans font-medium text-[12px] lg:text-[13px] text-[#434653] uppercase tracking-[0.6px]">Ghi chú</label>
              <textarea value={transNote} onChange={(e) => setTransNote(e.target.value)} placeholder="VD: Mua sắm cuối tuần..." className="w-full h-[80px] lg:h-[100px] px-4 lg:px-5 py-3 lg:py-4 bg-white border border-[#C3C6D5]/60 rounded-xl font-sans text-[14px] lg:text-[16px] text-[#1B1C1D] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2] resize-none"></textarea>
            </div>
          </div>

          <button type="button" onClick={handleSaveTransaction} disabled={isSubmittingTrans} className={`mt-6 lg:mt-8 w-full h-[50px] lg:h-[56px] rounded-xl flex items-center justify-center gap-2 transition-opacity shadow-md ${isSubmittingTrans ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#094CB2] to-[#3366CC] hover:opacity-90'}`}>
            <Save size={18} className="text-white" />
            <span className="font-sans font-bold text-[14px] lg:text-[16px] text-white tracking-[0.7px]">{isSubmittingTrans ? 'Đang xử lý...' : 'Lưu giao dịch'}</span>
          </button>
        </div>

        {/* CỘT LỊCH SỬ BÊN PHẢI */}
        <div className="flex flex-col p-5 sm:p-6 lg:p-8 w-full bg-white shadow-sm lg:shadow-[0px_8px_32px_rgba(27,28,29,0.06)] rounded-2xl border border-gray-100 h-full">
          <div className="flex justify-between items-end border-b border-[#E3E2E3]/40 pb-3 lg:pb-4 mb-3 lg:mb-4">
            <h3 className="font-sans font-bold text-[16px] lg:text-[18px] text-[#1B1C1D] m-0">Lịch sử Gần đây</h3>
          </div>
          <div className="flex flex-col gap-1">
            {isLoadingHistory ? ( <div className="flex justify-center py-4 text-sm text-gray-500">Đang tải...</div> ) : recentTransactions.length === 0 ? ( <div className="flex justify-center py-4 text-sm text-gray-500 italic">Chưa có giao dịch</div> ) : (
              recentTransactions.map((item) => {
                const IconComp = item.type === 'income' ? Banknote : Utensils; 
                const colorHex = item.type === 'income' ? 'text-[#16A34A]' : 'text-[#BA1A1A]';
                const sign = item.type === 'income' ? '+' : '-';
                const dateStr = item.date || item.transaction_date || getTodayFormatted();
                const dateParts = dateStr.split('T')[0].split('-');

                return (
                  <div key={item.id} className="flex justify-between items-center py-3 rounded-lg hover:bg-gray-50 px-2 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <IconComp size={16} className={colorHex} />
                      <div className="flex flex-col">
                        <span className="font-sans font-medium text-[13px] lg:text-[14px] text-[#1B1C1D]">{item.category?.name || 'Khác'}</span>
                        <span className="font-sans italic text-[10px] lg:text-[11px] text-[#434653]">{`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`}</span>
                      </div>
                    </div>
                    <span className={`font-sans font-bold text-[13px] lg:text-[14px] ${colorHex}`}>{sign} {Number(item.amount).toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: CHI TIẾT THU/CHI */}
      <div className="flex flex-col gap-4 lg:gap-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#E3E2E3]/40 pb-4 gap-4 sm:gap-0">
          <div className="flex flex-col gap-1">
            <h3 className="font-sans font-bold text-[20px] lg:text-[24px] text-[#1B1C1D] m-0">Chi tiết thu/chi</h3>
            <span className="font-sans text-[11px] lg:text-[12px] text-[#434653] uppercase tracking-[0.6px]">Phân tích theo danh mục</span>
          </div>
          <div className="flex p-1 bg-[#E9E8E9] rounded-lg w-full sm:w-auto">
            <button type="button" onClick={() => { setDetailType('income'); setShowAllDetails(false); }} className={`flex-1 sm:flex-none px-4 lg:px-6 py-2.5 lg:py-2 min-h-[40px] rounded-md text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.6px] transition-all ${detailType === 'income' ? 'bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] text-[#16A34A]' : 'text-[#434653] hover:bg-gray-200/50'}`}>Khoản Thu</button>
            <button type="button" onClick={() => { setDetailType('expense'); setShowAllDetails(false); }} className={`flex-1 sm:flex-none px-4 lg:px-6 py-2.5 lg:py-2 min-h-[40px] rounded-md text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.6px] transition-all ${detailType === 'expense' ? 'bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] text-[#BA1A1A]' : 'text-[#434653] hover:bg-gray-200/50'}`}>Khoản Chi</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full min-h-[120px] lg:min-h-[140px]">
          {isLoadingDetails ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center justify-center text-[#434653] font-sans text-[13px] lg:text-[14px] py-8"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#094CB2] mr-3"></div>Đang phân tích dữ liệu...</div>
          ) : groupedDetails.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center justify-center text-[#434653] font-sans text-[13px] lg:text-[14px] italic py-8">Chưa có dữ liệu trong tháng này.</div>
          ) : (
            displayDetails.map((item, index) => {
              const isExpense = detailType === 'expense';
              const limitVal = item.limit || 0;
              const isOverLimit = limitVal > 0 && item.rawAmount > limitVal;
              const pct = limitVal > 0 ? Math.floor((item.rawAmount / limitVal) * 100) : 0;
              const remaining = limitVal > 0 ? limitVal - item.rawAmount : 0;

              return (
                <div key={index} className="bg-white border border-[#E3E2E3]/20 shadow-sm lg:shadow-[0px_4px_24px_rgba(27,28,29,0.04)] rounded-xl lg:rounded-2xl p-4 lg:p-6 flex flex-col justify-center animate-fade-in min-h-[120px] lg:min-h-[140px]">
                  {isExpense ? (
                    <div className="flex flex-col w-full h-full justify-between gap-2 lg:gap-3">
                      <span className="font-sans text-[12px] lg:text-[13px] text-[#434653] uppercase tracking-[0.5px]">
                        {item.category}
                      </span>
                      <div className="flex flex-row items-baseline gap-1 lg:gap-1.5 mt-0 lg:-mt-1">
                        <span className="font-sans font-bold text-[22px] lg:text-[28px] leading-none" style={{ color: isOverLimit ? '#BA1A1A' : item.color }}>
                          {item.amount} VNĐ
                        </span>
                        <span className="font-sans font-medium text-[11px] lg:text-[13px] text-[#434653]">
                          / {limitVal > 0 ? `${formatCompactK(limitVal)}` : 'Không giới hạn'}
                        </span>
                      </div>
                      <div className="w-full h-[6px] lg:h-[8px] bg-[#E9E8E9] rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${limitVal > 0 ? Math.min(pct, 100) : (item.rawAmount > 0 ? 100 : 0)}%`, 
                            backgroundColor: isOverLimit ? '#BA1A1A' : item.color 
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center w-full mt-1">
                        <span className="font-sans font-medium text-[10px] lg:text-[12px] text-[#434653]">
                          {limitVal > 0 ? `Đã dùng ${pct}%` : 'Sử dụng tự do'}
                        </span>
                        <span className={`font-sans font-medium text-[10px] lg:text-[12px] ${isOverLimit ? 'text-[#BA1A1A]' : ''}`} style={{ color: !isOverLimit ? item.color : undefined }}>
                          {limitVal > 0 ? (isOverLimit ? 'Vượt hạn mức!' : `Còn ${formatCompactK(remaining)}`) : ''}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col w-full h-full justify-center gap-3 lg:gap-4">
                      <div className="flex justify-between items-end w-full">
                        <span className="font-sans text-[12px] lg:text-[13px] text-[#434653] uppercase tracking-[0.5px] pb-1">
                          {item.category}
                        </span>
                        <span className="font-sans font-bold text-[18px] lg:text-[20px] leading-none" style={{ color: item.color }}>
                          {item.amount} VNĐ
                        </span>
                      </div>
                      <div className="w-full h-[6px] lg:h-[8px] bg-[#E9E8E9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: item.width, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        {groupedDetails.length > 4 && (
          <div className="flex justify-center mt-2 w-full">
            <button type="button" onClick={() => setShowAllDetails(!showAllDetails)} className="px-6 py-2.5 lg:py-2 bg-[#E9E8E9] text-[#434653] font-sans font-semibold text-[13px] lg:text-[14px] min-h-[44px] rounded-lg hover:bg-gray-300 transition-colors cursor-pointer">{showAllDetails ? 'Thu gọn bớt' : `Xem tất cả (${groupedDetails.length})`}</button>
          </div>
        )}
      </div>

      {/* SECTION 3: BẢNG KẾ HOẠCH CẦN ĐỂ DÀNH (Table to Cards on Mobile) */}
      <div className="flex flex-col gap-4 lg:gap-6 w-full">
        {goalGlobalError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm animate-fade-in">{goalGlobalError}</div>}
        {goalGlobalSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm animate-fade-in">{goalGlobalSuccess}</div>}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#E3E2E3]/40 pb-4 gap-4 sm:gap-0">
          <div className="flex flex-col gap-1">
            <h3 className="font-sans font-bold text-[20px] lg:text-[24px] text-[#1B1C1D] m-0">Bảng kế hoạch cần để dành</h3>
            <span className="font-sans text-[11px] lg:text-[12px] text-[#434653] uppercase tracking-[0.6px]">Tự động tính toán dựa trên mục tiêu</span>
          </div>
          <button type="button" onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 lg:py-2 w-full sm:w-auto min-h-[44px] border border-[#094CB2] rounded-lg hover:bg-[#094CB2]/5 transition-colors cursor-pointer" >
            <Plus size={16} className="text-[#094CB2]" strokeWidth={3} />
            <span className="font-sans font-bold text-[13px] lg:text-[12px] text-[#094CB2] uppercase tracking-[0.6px]">Thêm mục tiêu</span>
          </button>
        </div>

        <div className="w-full bg-transparent lg:bg-white lg:shadow-[0px_4px_24px_rgba(27,28,29,0.04)] lg:rounded-2xl lg:overflow-hidden lg:border lg:border-[#E3E2E3]/10">
          {/* Thay vì table, dùng block trên mobile, hiển thị table trên lg */}
          <table className="w-full text-left border-collapse block lg:table">
            <thead className="hidden lg:table-header-group">
              <tr className="bg-[#F5F3F4] border-b border-[#E3E2E3]/30">
                <th className="px-6 py-4 font-sans font-semibold text-[12px] text-[#434653] uppercase tracking-[0.6px]">Tên mục tiêu</th>
                <th className="px-6 py-4 font-sans font-semibold text-[12px] text-[#434653] uppercase tracking-[0.6px]">Tổng cần đóng</th>
                <th className="px-6 py-4 font-sans font-semibold text-[12px] text-[#434653] uppercase tracking-[0.6px]">Hạn chót</th>
                <th className="px-6 py-4 font-sans font-semibold text-[12px] text-[#434653] uppercase tracking-[0.6px]">Còn lại</th>
                <th className="px-6 py-4 font-sans font-semibold text-[12px] text-[#434653] uppercase tracking-[0.6px]">Cần để dành / Tuần</th>
                <th className="px-6 py-4 font-sans font-semibold text-[12px] text-[#434653] uppercase tracking-[0.6px]">Trạng thái</th>
                <th className="px-6 py-4 font-sans font-semibold text-[12px] text-[#434653] uppercase tracking-[0.6px]"></th>
              </tr>
            </thead>
            <tbody className="font-sans block lg:table-row-group">
              {isLoadingGoals ? (
                <tr className="block lg:table-row"><td colSpan="7" className="px-6 py-12 text-center text-[#434653] block lg:table-cell">Đang tải dữ liệu mục tiêu...</td></tr>
              ) : goals.length === 0 ? (
                <tr className="block lg:table-row">
                  <td colSpan="7" className="p-6 lg:px-6 lg:py-12 text-center block lg:table-cell bg-white rounded-xl shadow-sm border border-[#E3E2E3]/50 lg:border-0 lg:shadow-none lg:bg-transparent lg:rounded-none mt-4 lg:mt-0">
                    <p className="font-sans text-[13px] lg:text-[14px] text-[#434653] leading-relaxed m-0 max-w-[240px] lg:max-w-none mx-auto">
                      Chưa có mục tiêu nào.<br className="block sm:hidden" /> Hãy thêm mục tiêu mới!
                    </p>
                  </td>
                </tr>
              ) : (
                goals.map((goal) => {
                  const { weeksLeft, weeklySaving, targetAmt } = calculateGoalStats(goal);
                  const statusInfo = getStatusInfo(goal);
                  const IconComponent = getIconComponent(goal.category_icon);
                  const formatDeadline = (dateStr) => {
                    if (!dateStr) return '';
                    const parts = dateStr.split('T')[0].split('-');
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                  };

                  return (
                    // Convert row to card on mobile
                    <tr key={goal.id} className="flex flex-col lg:table-row border border-[#E3E2E3]/60 lg:border-0 lg:border-b lg:border-[#E3E2E3]/20 rounded-xl lg:rounded-none mb-4 lg:mb-0 p-4 lg:p-0 bg-white shadow-sm lg:shadow-none lg:hover:bg-gray-50/50">
                      {/* Name & Mobile Delete/Status */}
                      <td className="px-0 lg:px-6 py-2 lg:py-5 flex lg:table-cell justify-between items-center border-b lg:border-0 border-gray-100 pb-3 lg:pb-5 mb-2 lg:mb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#094CB2]/10 rounded-lg flex items-center justify-center">
                            <IconComponent size={16} className="text-[#094CB2]" />
                          </div>
                          <span className="font-semibold text-[14px] text-[#1B1C1D] truncate max-w-[200px] lg:max-w-none">{goal.name || goal.title}</span>
                        </div>
                        {/* Mobile right area */}
                        <div className="flex lg:hidden items-center gap-2">
                           <div className={`inline-flex items-center gap-1.5 px-2 py-1 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-full`}>
                              <div className={`w-[4px] h-[4px] rounded-full ${statusInfo.dotColor}`}></div>
                              <span className={`font-bold text-[9px] ${statusInfo.textColor} uppercase tracking-[0.5px]`}>{statusInfo.label}</span>
                            </div>
                           <button type="button" onClick={() => handleDeleteGoal(goal.id)} className="p-1 text-[#BA1A1A] hover:bg-red-50 rounded-md cursor-pointer"><X size={18} /></button>
                        </div>
                      </td>
                      
                      <td className="px-0 lg:px-6 py-2 lg:py-5 text-[13px] lg:text-[14px] text-[#434653] flex lg:table-cell justify-between items-center">
                        <span className="lg:hidden text-[#737784] font-medium text-[12px]">Tổng cần đóng</span>
                        <span className="font-semibold lg:font-normal text-[#1B1C1D] lg:text-[#434653]">{targetAmt ? Number(targetAmt).toLocaleString('vi-VN') : 0} VNĐ</span>
                      </td>
                      <td className="px-0 lg:px-6 py-2 lg:py-5 text-[13px] lg:text-[14px] text-[#434653] flex lg:table-cell justify-between items-center">
                        <span className="lg:hidden text-[#737784] font-medium text-[12px]">Hạn chót</span>
                        <span className="text-[#1B1C1D] lg:text-[#434653]">{formatDeadline(goal.deadline || goal.due_date)}</span>
                      </td>
                      <td className="px-0 lg:px-6 py-2 lg:py-5 text-[13px] lg:text-[14px] text-[#434653] flex lg:table-cell justify-between items-center">
                        <span className="lg:hidden text-[#737784] font-medium text-[12px]">Còn lại</span>
                        <span className="text-[#1B1C1D] lg:text-[#434653]">{weeksLeft} tuần</span>
                      </td>
                      <td className="px-0 lg:px-6 py-2 lg:py-5 text-[13px] lg:text-[14px] flex lg:table-cell justify-between items-center">
                        <span className="lg:hidden text-[#B45309] font-medium text-[12px]">Cần để dành/Tuần</span>
                        <span className="font-bold text-[#B45309]">{Number(weeklySaving).toLocaleString('vi-VN')} VNĐ</span>
                      </td>
                      
                      {/* Desktop Status & Delete */}
                      <td className="hidden lg:table-cell px-6 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-full`}>
                          <div className={`w-[6px] h-[6px] rounded-full ${statusInfo.dotColor}`}></div>
                          <span className={`font-bold text-[10px] ${statusInfo.textColor} uppercase tracking-[0.5px]`}>{statusInfo.label}</span>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-5">
                        <button type="button" onClick={() => handleDeleteGoal(goal.id)} className="text-[#BA1A1A] hover:text-[#991B1B] transition-colors cursor-pointer p-2"><X size={16} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: QUẢN LÝ VÍ CÓ NÚT NẠP TIỀN VÀ HIỂN THỊ CHI TIẾT SỐ TIỀN */}
      <div className="flex flex-col gap-4 lg:gap-6 w-full pb-10">
        <div className="flex flex-col gap-1 border-b border-[#E3E2E3]/40 pb-4">
          <h3 className="font-sans font-bold text-[20px] lg:text-[24px] text-[#1B1C1D] m-0">Quản lý Ví của bạn</h3>
          <span className="font-sans text-[11px] lg:text-[12px] text-[#434653] uppercase tracking-[0.6px]">Theo dõi tiến độ tích lũy thực tế</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
          {goals.map((goal, index) => {
            const IconComponent = getIconComponent(goal.category_icon);
            const targetAmt = Number(goal.target_amount || goal.amount || 0);
            const currentAmt = Number(goal.current_amount || 0);
            const colors = [
              { bg: 'bg-[#FFF7ED]', text: 'text-[#EA580C]', barBg: 'bg-[#EA580C]' },
              { bg: 'bg-[#094CB2]/10', text: 'text-[#094CB2]', barBg: 'bg-[#094CB2]' },
              { bg: 'bg-[#FAF5FF]', text: 'text-[#9333EA]', barBg: 'bg-[#9333EA]' },
              { bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]', barBg: 'bg-[#16A34A]' },
            ];
            const theme = colors[index % colors.length];
            const isCompleted = goal.is_completed || (currentAmt >= targetAmt && targetAmt > 0);
            const percentage = targetAmt > 0 ? Math.min(100, Math.floor((currentAmt / targetAmt) * 100)) : 0;

            return (
              <div key={goal.id} className={`${isCompleted ? 'bg-[#F0FDF4]/30' : 'bg-white'} border border-[#E3E2E3]/20 shadow-sm lg:shadow-[0px_4px_24px_rgba(27,28,29,0.04)] rounded-xl lg:rounded-2xl p-4 lg:p-5 flex flex-col justify-between min-h-[170px] lg:min-h-[190px] relative overflow-hidden`}>
                <div className="flex justify-between items-start z-10">
                  <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center`}>
                    <IconComponent size={20} className={theme.text} />
                  </div>
                  {isCompleted ? (
                    <div className="flex items-center gap-1">
                      <span className={`font-sans font-bold text-[16px] lg:text-[18px] ${theme.text}`}>100%</span>
                      <CheckCircle2 size={16} className={theme.text} fill="#16A34A" color="white" />
                    </div>
                  ) : (
                    <span className={`font-sans font-bold text-[16px] lg:text-[18px] ${theme.text}`}>{percentage}%</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 lg:gap-3 z-10 mt-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-sans font-semibold text-[14px] lg:text-[16px] text-[#1B1C1D] truncate" title={goal.name || goal.title}>{goal.name || goal.title}</span>
                    <span className="font-sans text-[11px] lg:text-[12px] text-[#434653]">
                      <strong className="text-[#1B1C1D]">{Number(currentAmt).toLocaleString('vi-VN')} VNĐ</strong> / {Number(targetAmt).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E9E8E9] rounded-full overflow-hidden mt-1">
                    <div className={`h-full ${theme.barBg} rounded-full`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
                
                <button onClick={() => handleOpenDeposit(goal)} className="w-full py-2.5 bg-[#E9E8E9] hover:bg-gray-200 transition-colors rounded-lg font-sans font-semibold text-[13px] text-[#094CB2] mt-4 cursor-pointer z-10 min-h-[44px]">
                  Nạp tiền
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: THÊM MỤC TIÊU TIẾT KIỆM MỚI */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-2 animate-fade-in">
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-[896px] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center px-5 lg:px-8 py-4 lg:py-6 border-b border-[#E3E2E3]/30 sticky top-0 bg-white z-10">
              <h2 className="font-sans font-bold text-[18px] lg:text-[24px] text-[#1B1C1D] m-0">Thêm mục tiêu tiết kiệm</h2>
              <button type="button" onClick={handleCancel} className="w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer -mr-2"><X size={20} className="text-[#434653]" /></button>
            </div>

            <div className="p-5 lg:p-8">
              {modalError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm w-full">{modalError}</div>}
              
              <div className="flex flex-col lg:grid lg:grid-cols-[1fr_328px] gap-6 lg:gap-8">
                {/* Cột trái: Input form */}
                <div className="flex flex-col gap-5 lg:gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-sans font-semibold text-[11px] lg:text-[12px] text-[#1B1C1D] uppercase tracking-[0.3px]">Tên mục tiêu</label>
                    <input type="text" value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="VD: Mua Laptop, Học phí..." className="w-full h-[48px] lg:h-[49px] px-4 py-3 bg-[#F5F3F4] border border-[#C3C6D5]/30 rounded-lg font-sans text-[14px] lg:text-[16px] text-[#1B1C1D] placeholder-[#6B7280] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2]" />
                  </div>

                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 lg:gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-sans font-semibold text-[11px] lg:text-[12px] text-[#1B1C1D] uppercase tracking-[0.3px]">Số tiền cần đạt</label>
                      <div className="relative">
                        <input type="text" value={goalAmount} onChange={handleAmountChange} placeholder="0" className="w-full h-[48px] lg:h-[50px] pl-4 pr-14 py-3 bg-[#F5F3F4] border border-[#C3C6D5]/30 rounded-lg font-sans text-[14px] lg:text-[16px] text-[#1B1C1D] placeholder-[#6B7280] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2]" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-sans font-medium text-[13px] lg:text-[14px] text-[#434653]">VNĐ</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-sans font-semibold text-[11px] lg:text-[12px] text-[#1B1C1D] uppercase tracking-[0.3px]">Ngày hoàn thành</label>
                      <div className="relative">
                        <input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} className="w-full h-[48px] lg:h-[50px] px-4 py-3 bg-[#F5F3F4] border border-[#C3C6D5]/30 rounded-lg font-sans text-[14px] lg:text-[16px] text-[#1B1C1D] focus:outline-none focus:border-[#094CB2] focus:ring-1 focus:ring-[#094CB2] cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:gap-4">
                    <label className="font-sans font-semibold text-[11px] lg:text-[12px] text-[#1B1C1D] uppercase tracking-[0.3px]">Danh mục</label>
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                      {modalCategories.map((cat) => {
                        const IconComponent = getIconComponent(cat.icon);
                        const isSelected = selectedGoalCat === cat.id;
                        return (
                          <button type="button" key={cat.id} onClick={() => setSelectedGoalCat(cat.id)} className={`flex flex-col items-center justify-center gap-1.5 px-2 py-2 lg:px-3 lg:py-3 rounded-lg border transition-all cursor-pointer shrink-0 ${isSelected ? 'bg-[#3366CC]/20 border-[#094CB2]' : 'bg-[#F5F3F4] border-[#C3C6D5]/30 hover:border-[#094CB2]/50'}`} style={{ minWidth: '80px', height: '64px' }}>
                            <IconComponent size={18} className="text-[#1B1C1D]" />
                            <span className="font-sans font-medium text-[10px] text-[#434653] leading-[14px] truncate w-full text-center">{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Cột phải: Summary & Nút lưu */}
                <div className="flex flex-col gap-5 lg:gap-6 border-t lg:border-t-0 border-[#E3E2E3]/50 pt-5 lg:pt-0">
                  <div className="bg-[#3366CC]/10 lg:bg-[#3366CC]/20 border border-[#094CB2]/10 rounded-xl lg:rounded-2xl p-5 lg:p-6 flex flex-col gap-1 relative overflow-hidden">
                    <h3 className="font-sans font-bold text-[11px] lg:text-[12px] text-[#094CB2] uppercase tracking-[0.6px]">Mức tiết kiệm cần thiết</h3>
                    <div className="flex items-end gap-1 py-1 lg:py-2">
                      <span className="font-sans font-bold text-[24px] lg:text-[30px] text-[#094CB2] leading-none lg:leading-[36px]">
                        {weeklySaving === 0 ? '0' : parseInt(weeklySaving, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                      </span>
                      <span className="font-sans font-bold text-[14px] lg:text-[18px] text-[#094CB2] leading-none lg:leading-[28px] mb-0.5">VNĐ</span>
                    </div>
                    <p className="font-sans text-[11px] lg:text-[12px] text-[#434653] leading-snug pb-2 lg:pb-3">mỗi tuần để đạt mục tiêu đúng hạn.</p>
                    <div className="border-t border-[#094CB2]/10 pt-3 lg:pt-4 flex justify-between items-center">
                      <span className="font-sans text-[11px] lg:text-[12px] text-[#434653]">Thời gian còn lại:</span>
                      <span className="font-sans font-bold text-[12px] text-[#094CB2]">{weeksRemaining} Tuần</span>
                    </div>
                    <div className="absolute -bottom-6 -right-4 opacity-[0.03] lg:opacity-5 pointer-events-none"><Wallet size={100} lg:size={75} className="text-[#1B1C1D]" /></div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button type="button" onClick={handleSaveGoal} disabled={isSubmittingGoal} className={`w-full min-h-[48px] lg:h-[52px] rounded-lg flex items-center justify-center shadow-md transition-opacity cursor-pointer ${isSubmittingGoal ? 'bg-gray-400' : 'bg-[#094CB2] hover:opacity-90'}`}>
                      <span className="font-sans font-bold text-[13px] lg:text-[14px] text-white uppercase tracking-[0.7px]">
                        {isSubmittingGoal ? 'Đang lưu...' : 'Lưu mục tiêu'}
                      </span>
                    </button>
                    <button type="button" onClick={handleCancel} disabled={isSubmittingGoal} className="w-full min-h-[48px] lg:h-[52px] bg-[#E9E8E9] rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer">
                      <span className="font-sans font-bold text-[13px] lg:text-[14px] text-[#1B1C1D] uppercase tracking-[0.7px]">Hủy bỏ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NẠP TIỀN CHO MỤC TIÊU */}
      {isDepositModalOpen && selectedGoalForDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] flex flex-col p-5 sm:p-8 gap-5 lg:gap-6 animate-slide-up relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X size={20} className="text-[#1B1C1D]" />
            </button>
            
            <div className="flex flex-col gap-1 sm:gap-2 w-full pr-10">
              <h2 className="font-serif font-bold text-[22px] sm:text-[28px] text-[#1B1C1D] m-0">Nạp tiền mục tiêu</h2>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-[13px] sm:text-[14px] text-[#094CB2] line-clamp-2">
                  {selectedGoalForDeposit.name || selectedGoalForDeposit.title}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-5 w-full">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className="font-sans font-bold text-[10px] sm:text-[11px] text-[#434653] uppercase tracking-[0.5px]">Số tiền nạp</label>
                <div className="relative w-full">
                  <NumericFormat
                    value={depositAmount}
                    onValueChange={(values) => setDepositAmount(values.value)}
                    valueIsNumericString={true}
                    thousandSeparator="."
                    decimalSeparator=","
                    allowNegative={false}
                    placeholder="0"
                    className="w-full h-[48px] px-4 bg-[#F5F3F4] rounded-md font-sans font-bold text-[15px] sm:text-[16px] text-[#1B1C1D] focus:outline-none focus:ring-1 focus:ring-[#094CB2]"
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
                    className="w-full h-[48px] px-4 bg-[#F5F3F4] rounded-md font-sans text-[14px] sm:text-[15px] text-[#1B1C1D] focus:outline-none focus:ring-1 focus:ring-[#094CB2] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className="font-sans font-bold text-[10px] sm:text-[11px] text-[#434653] uppercase tracking-[0.5px]">Ghi chú (Tùy chọn)</label>
                <textarea
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="Nhập ghi chú tại đây..."
                  className="w-full h-[70px] sm:h-[80px] p-3 sm:p-4 bg-[#F5F3F4] rounded-md font-sans text-[14px] sm:text-[15px] text-[#1B1C1D] focus:outline-none focus:ring-1 focus:ring-[#094CB2] resize-none"
                ></textarea>
              </div>

              <div className="flex flex-col p-3 sm:p-4 gap-2 sm:gap-3 bg-[#F5F3F4] rounded-md mt-1">
                <div className="flex justify-between items-center w-full">
                  <span className="font-sans text-[12px] sm:text-[13px] text-[#434653]">Số dư hiện tại</span>
                  <span className="font-sans font-medium text-[12px] sm:text-[13px] text-[#1B1C1D]">
                    {currentBalanceNum.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center w-full">
                  <span className="font-sans text-[12px] sm:text-[13px] text-[#434653]">Số dư sau nạp</span>
                  <span className="font-sans font-bold text-[12px] sm:text-[13px] text-[#094CB2]">
                    {newBalanceNum.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-row justify-center gap-3 sm:gap-4 w-full mt-1 sm:mt-2">
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(false)}
                disabled={isSubmittingGoal}
                className="flex-1 py-3 bg-white hover:bg-gray-50 border border-[#E3E2E3] rounded-md font-sans font-bold text-[13px] sm:text-[14px] text-[#1B1C1D] transition-colors cursor-pointer min-h-[44px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeposit}
                disabled={isSubmittingGoal}
                className={`flex-[1.5] sm:flex-1 py-3 rounded-md font-sans font-bold text-[13px] sm:text-[14px] text-white transition-colors cursor-pointer min-h-[44px] ${isSubmittingGoal ? 'bg-gray-400' : 'bg-[#094CB2] hover:bg-blue-800'}`}
              >
                {isSubmittingGoal ? 'Đang xử lý...' : 'Xác nhận nạp'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Input;