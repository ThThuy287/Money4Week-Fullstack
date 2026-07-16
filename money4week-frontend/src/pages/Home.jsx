import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, TrendingUp, TrendingDown, Target, ShieldCheck, ChevronLeft, ChevronRight, Plus, Zap, X } from 'lucide-react';
import analyticsApi from '../api/analyticsApi';
import remindersApi from '../api/remindersApi'; 
import usersApi from '../api/usersApi'; 
import reportsApi from '../api/reportsApi'; 

const formatVND = (amount) => new Intl.NumberFormat('vi-VN').format(amount || 0);
const formatCompact = (num) => {
  const absNum = Math.abs(num);
  if (absNum >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (absNum >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  return num.toString();
};
const parseSafeDate = (rawDate) => {
  if (!rawDate) return new Date(NaN);
  const dateStr = String(rawDate).split('T')[0];
  if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
      return new Date(parts[2], parts[1] - 1, parts[0]);
  } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts[2].length === 4) return new Date(parts[2], parts[1] - 1, parts[0]);
      return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(rawDate);
};

const Home = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [totalWeeklyTarget, setTotalWeeklyTarget] = useState(0); 
  const [currentIncome, setCurrentIncome] = useState(0);
  const [currentExpense, setCurrentExpense] = useState(0);
  const [dynamicChart, setDynamicChart] = useState([]);
  const [cycleName, setCycleName] = useState('4 Tuần');
  const [incomeChange, setIncomeChange] = useState({ percent: 0, isIncrease: true });
  const [expenseChange, setExpenseChange] = useState({ percent: 0, isIncrease: true });
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // [Giữ nguyên logic UseEffect API]
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true); setApiError(null);
        const [data, remindersRes, profileRes] = await Promise.all([
          analyticsApi.getDashboard().catch(() => null),
          remindersApi.getReminders().catch(() => []),
          usersApi.getProfile().catch(() => null)
        ]);

        let remindersList = [];
        if (Array.isArray(remindersRes)) remindersList = remindersRes;
        else if (Array.isArray(remindersRes?.data)) remindersList = remindersRes.data;
        else if (Array.isArray(remindersRes?.reminders)) remindersList = remindersRes.reminders;
        if (remindersList.length === 0 && Array.isArray(data?.upcoming_reminders)) remindersList = data.upcoming_reminders;

        const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
        const computedEvents = [];

        remindersList.forEach(r => {
          let deadline = new Date(r.deadline || r.due_date || r.date);
          if (isNaN(deadline.getTime())) return;
          deadline.setHours(0, 0, 0, 0);

          let hasShifted = false;
          while (deadline < todayDate) {
            deadline.setMonth(deadline.getMonth() + 1);
            hasShifted = true;
          }

          if (hasShifted) {
            r.current_amount = 0;
            r.saved = 0;
            r.is_completed = false;
          }

          const fmtDate = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')}`;
          r.due_date = fmtDate;
          r.deadline = fmtDate;
          r.date = fmtDate;

          computedEvents.push(fmtDate);
        });

        if (data) {
          data.upcoming_reminders = [...remindersList].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
          data.calendar_events = Array.from(new Set([...(data.calendar_events || []), ...computedEvents]));
        }

        setDashboardData(data); setNotes(data?.user_notes || []);

        const now = new Date(); now.setHours(0, 0, 0, 0); 
        let sumWeekly = 0;
        remindersList.forEach(item => {
          const targetAmount = Number(item.amount || item.target_amount || 0);
          const currentSaved = Number(item.current_amount || item.saved || 0);
          const remainingAmount = targetAmount - currentSaved;
          if (remainingAmount > 0) {
            const dueDate = parseSafeDate(item.due_date || item.deadline || item.date);
            if (isNaN(dueDate.getTime())) return;
            dueDate.setHours(0, 0, 0, 0); 
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysLeft = Math.floor(timeDiff / (1000 * 3600 * 24));
            if (daysLeft >= 0) {
              let weeksLeft = daysLeft === 0 ? 1 : Math.ceil(daysLeft / 7);
              sumWeekly += (remainingAmount / weeksLeft);
            } else { sumWeekly += remainingAmount; }
          }
        });
        setTotalWeeklyTarget(Math.round(sumWeekly));

        // Thay đổi thành:
const cycleType = localStorage.getItem('userCycleType') || profileRes?.cycle_type || '4_weeks';
const anchorDateStr = localStorage.getItem('userCycleAnchor') || profileRes?.cycle_anchor_date;
        if (cycleType === '1_month') setCycleName('Tháng này');
        else if (cycleType === '30_days') setCycleName('30 Ngày');
        else setCycleName('4 Tuần');

        let currentStart = new Date(); currentStart.setHours(0,0,0,0);
        let anchor = anchorDateStr ? parseSafeDate(anchorDateStr) : new Date();
        anchor.setHours(0,0,0,0);
        if (isNaN(anchor.getTime())) anchor = new Date();

        if (cycleType === '4_weeks') {
          const diffDays = Math.floor((currentStart.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
          const cyclesPassed = Math.floor(diffDays / 28);
          currentStart = new Date(anchor);
          currentStart.setDate(anchor.getDate() + (cyclesPassed * 28));
        } else if (cycleType === '30_days') {
          const diffDays = Math.floor((currentStart.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
          const cyclesPassed = Math.floor(diffDays / 30);
          currentStart = new Date(anchor);
          currentStart.setDate(anchor.getDate() + (cyclesPassed * 30));
        } else if (cycleType === '1_month') {
          currentStart = new Date(currentStart.getFullYear(), currentStart.getMonth(), anchor.getDate());
          if (new Date().getTime() < currentStart.getTime()) currentStart.setMonth(currentStart.getMonth() - 1);
        }

        let currentEnd = new Date(currentStart);
        if (cycleType === '4_weeks') currentEnd.setDate(currentStart.getDate() + 27);
        else if (cycleType === '30_days') currentEnd.setDate(currentStart.getDate() + 29);
        else if (cycleType === '1_month') {
            currentEnd.setMonth(currentStart.getMonth() + 1);
            currentEnd.setDate(currentStart.getDate() - 1);
        }
        currentEnd.setHours(23, 59, 59, 999);

        let prevStart = new Date(currentStart);
        let prevEnd = new Date(currentStart);
        if (cycleType === '4_weeks') { prevStart.setDate(currentStart.getDate() - 28); prevEnd.setDate(currentStart.getDate() - 1); } 
        else if (cycleType === '30_days') { prevStart.setDate(currentStart.getDate() - 30); prevEnd.setDate(currentStart.getDate() - 1); } 
        else if (cycleType === '1_month') { prevStart.setMonth(currentStart.getMonth() - 1); prevEnd.setMonth(currentStart.getMonth()); prevEnd.setDate(currentStart.getDate() - 1); }
        prevStart.setHours(0,0,0,0); prevEnd.setHours(23,59,59,999);

        const fmtYMD = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const [currTransRes, prevTransRes] = await Promise.all([
            reportsApi.getReportData(fmtYMD(currentStart), fmtYMD(currentEnd)).catch(() => ({ data: [] })),
            reportsApi.getReportData(fmtYMD(prevStart), fmtYMD(prevEnd)).catch(() => ({ data: [] }))
        ]);

        const currTxs = Array.isArray(currTransRes) ? currTransRes : (currTransRes?.data || []);
        const prevTxs = Array.isArray(prevTransRes) ? prevTransRes : (prevTransRes?.data || []);

        const totalDays = Math.round((currentEnd.getTime() - currentStart.getTime()) / (1000*60*60*24)) + 1;
        const chunk = Math.floor(totalDays / 4);
        
        let chartData = [
          { week: "Tuần 1", income: 0, expense: 0, start: null, end: null },
          { week: "Tuần 2", income: 0, expense: 0, start: null, end: null },
          { week: "Tuần 3", income: 0, expense: 0, start: null, end: null },
          { week: "Tuần 4", income: 0, expense: 0, start: null, end: null }
        ];

        let tempStart = new Date(currentStart);
        for(let i=0; i<4; i++) {
            chartData[i].start = new Date(tempStart);
            let tempEnd = new Date(tempStart);
            if (i===3) tempEnd.setTime(currentEnd.getTime());
            else tempEnd.setDate(tempEnd.getDate() + chunk - 1);
            tempEnd.setHours(23,59,59,999);
            chartData[i].end = tempEnd;
            tempStart = new Date(tempEnd);
            tempStart.setDate(tempStart.getDate() + 1);
            tempStart.setHours(0,0,0,0);
        }

        let cIncome = 0; let cExpense = 0;
        currTxs.forEach(tx => {
            const amt = Number(tx.amount || 0);
            const txDate = parseSafeDate(tx.date || tx.transaction_date);
            
            if (tx.type === 'income') cIncome += amt;
            else if (tx.type === 'expense' || tx.type === 'saving') cExpense += amt;
            
            for(let i=0; i<4; i++) {
                if (txDate >= chartData[i].start && txDate <= chartData[i].end) {
                    if (tx.type === 'income') chartData[i].income += amt;
                    else if (tx.type === 'expense' || tx.type === 'saving') chartData[i].expense += amt;
                    break;
                }
            }
        });

        let pIncome = 0; let pExpense = 0;
        prevTxs.forEach(tx => {
            const amt = Number(tx.amount || 0);
            
            if (tx.type === 'income') pIncome += amt;
            else if (tx.type === 'expense' || tx.type === 'saving') pExpense += amt;
        });

        if (pIncome === 0) setIncomeChange({ percent: cIncome > 0 ? 100 : 0, isIncrease: cIncome >= pIncome });
        else { const diff = ((cIncome - pIncome) / pIncome) * 100; setIncomeChange({ percent: Math.abs(Math.round(diff)), isIncrease: diff >= 0 }); }
        if (pExpense === 0) setExpenseChange({ percent: cExpense > 0 ? 100 : 0, isIncrease: cExpense >= pExpense });
        else { const diff = ((cExpense - pExpense) / pExpense) * 100; setExpenseChange({ percent: Math.abs(Math.round(diff)), isIncrease: diff >= 0 }); }
      } catch (err) { setApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc tải lại trang.'); } finally { setIsLoading(false); }
    };
    fetchDashboardData();
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(null); 
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const calendarGrid = [];
  for (let i = 0; i < startOffset; i++) calendarGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push(i);

  const isTodayReal = (day) => { return day === today.getDate() && month === today.getMonth() && year === today.getFullYear(); };
  const checkIsDue = (day) => {
    if (!dashboardData?.calendar_events) return false;
    const dateStr = [ year, String(month + 1).padStart(2, '0'), String(day).padStart(2, '0') ].join('-');
    return dashboardData.calendar_events.includes(dateStr);
  };
  const handleReminderClick = (rawDate) => {
    const dateObj = parseSafeDate(rawDate);
    if (!isNaN(dateObj.getTime())) {
        setCurrentDate(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1));
        setSelectedDate(new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
    }
  };

  const [notes, setNotes] = useState([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  const toggleNote = async (id) => {
    setNotes(notes.map(note => note.id === id ? { ...note, completed: !note.completed } : note));
    try { await analyticsApi.toggleNote(id); } catch (err) { console.error(err); }
  };
  const handleAddNoteKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = newNoteText.trim();
      if (text !== '') {
        const tempId = Date.now();
        setNotes([...notes, { id: tempId, text: text, completed: false }]);
        setNewNoteText(''); setIsAddingNote(false);
        try {
          const newNote = await analyticsApi.addNote(text); 
          setNotes(prev => prev.map(n => n.id === tempId ? newNote : n)); 
        } catch (err) { setNotes(prev => prev.filter(n => n.id !== tempId)); }
      } else { setIsAddingNote(false); }
    } else if (e.key === 'Escape') { setNewNoteText(''); setIsAddingNote(false); }
  };
  const deleteNote = async (id) => {
    setNotes(notes.filter(note => note.id !== id)); 
    try { await analyticsApi.deleteNote(id); } catch (err) { console.error(err); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#094CB2]"></div>
        <p className="font-sans text-[#737784]">Đang đồng bộ dữ liệu tài chính...</p>
      </div>
    );
  }
  if (apiError) {
    return (
      <div className="w-full max-w-[1280px] p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="font-sans text-red-600 font-medium text-center">{apiError}</p>
      </div>
    );
  }

  const overview = dashboardData?.overview || { current_balance: 0 };

  return (
    <div className="flex flex-col gap-4 lg:gap-8 w-full max-w-[1280px] animate-fade-in mx-auto">
      
      {dashboardData?.overview?.smart_alert && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-3 lg:gap-4 bg-[#FFDAD6]/50 border border-[#BA1A1A]/20 rounded-lg animate-fade-in">
          <div className="flex flex-row items-start lg:items-center gap-3">
            <AlertCircle size={20} className="text-[#BA1A1A] fill-[#BA1A1A] text-white shrink-0 mt-0.5 lg:mt-0" />
            <p className="font-sans font-bold text-[14px] lg:text-[16px] leading-5 lg:leading-6 text-[#BA1A1A] m-0">
              Cảnh báo thông minh: Sắp đến hạn {dashboardData.overview.smart_alert.title}. 
              Còn {dashboardData.overview.smart_alert.days_left} ngày đóng. 
              Cần bổ sung: {formatVND(dashboardData.overview.smart_alert.amount_needed)} VNĐ.
            </p>
          </div>
          <button className="flex justify-center items-center px-4 py-2 w-full sm:w-auto border border-[#BA1A1A] rounded text-[#BA1A1A] font-sans font-semibold text-[14px] hover:bg-[#BA1A1A]/10 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]">
            Bổ sung tiền
          </button>
        </div>
      )}

      {/* Grid thẻ thống kê: Mobile 1 cột, Tablet 2, Laptop 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
        <div className="flex flex-col items-start p-4 lg:p-6 gap-1 lg:gap-2 bg-white border border-brand-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <span className="font-sans font-normal text-[12px] leading-4 tracking-[0.3px] uppercase text-brand-text">Tổng thu ({cycleName})</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-serif font-bold text-[24px] lg:text-[30px] leading-8 lg:leading-9 text-[#1B1C1D]">{formatVND(currentIncome)}</span>
            <span className="font-serif font-normal text-[14px] lg:text-[18px] text-brand-text">VNĐ</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {incomeChange.isIncrease ? <TrendingUp size={14} className="text-[#2E7D32]" strokeWidth={3} /> : <TrendingDown size={14} className="text-[#BA1A1A]" strokeWidth={3} />}
            <span className={`font-sans font-medium text-[12px] leading-4 ${incomeChange.isIncrease ? 'text-[#2E7D32]' : 'text-[#BA1A1A]'}`}>
              {incomeChange.isIncrease ? '+' : '-'}{incomeChange.percent}%
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start p-4 lg:p-6 gap-1 lg:gap-2 bg-white border border-brand-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <span className="font-sans font-normal text-[12px] leading-4 tracking-[0.3px] uppercase text-brand-text">Tổng chi ({cycleName})</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-serif font-bold text-[24px] lg:text-[30px] leading-8 lg:leading-9 text-[#1B1C1D]">{formatVND(currentExpense)}</span>
            <span className="font-serif font-normal text-[14px] lg:text-[18px] text-brand-text">VNĐ</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {expenseChange.isIncrease ? <TrendingUp size={14} className="text-[#BA1A1A]" strokeWidth={3} /> : <TrendingDown size={14} className="text-[#2E7D32]" strokeWidth={3} />}
            <span className={`font-sans font-medium text-[12px] leading-4 ${expenseChange.isIncrease ? 'text-[#BA1A1A]' : 'text-[#2E7D32]'}`}>
              {expenseChange.isIncrease ? '+' : '-'}{expenseChange.percent}%
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start p-4 lg:p-6 gap-1 lg:gap-2 bg-white border border-[#EAB308]/40 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute w-[96px] h-[96px] right-[-23px] top-[-23px] bg-[#EAB308]/10 blur-[20px] rounded-xl z-0"></div>
          <span className="font-sans font-semibold text-[12px] leading-4 tracking-[0.3px] uppercase text-[#A16207] z-10">Cần để dành tuần này</span>
          <div className="flex items-baseline gap-1 mt-1 z-10">
            <span className="font-serif font-bold text-[24px] lg:text-[30px] leading-8 lg:leading-9 text-[#854D0E]">{formatVND(totalWeeklyTarget)}</span>
            <span className="font-serif font-normal text-[14px] lg:text-[18px] text-[#A16207]/80">VNĐ</span>
          </div>
        </div>

        <div className="flex flex-col items-start p-4 lg:p-6 gap-1 lg:gap-2 bg-white border border-[#094CB2]/20 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute w-[96px] h-[96px] right-[-23px] top-[-23px] bg-[#094CB2]/5 blur-[20px] rounded-xl z-0"></div>
          <span className="font-sans font-semibold text-[12px] leading-4 tracking-[0.3px] uppercase text-[#B1C5FF] z-10">Số dư hiện tại</span>
          <div className="flex items-baseline gap-1 mt-1 z-10">
            <span className="font-serif font-bold text-[24px] lg:text-[30px] leading-8 lg:leading-9 text-[#094CB2]">{formatVND(overview.current_balance)}</span>
            <span className="font-serif font-normal text-[14px] lg:text-[18px] text-[#094CB2]/70">VNĐ</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Mobile xếp dọc, Desktop 2 cột (Chart vs Calendar) */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-4 lg:gap-8 w-full items-start">
        
        <div className="flex flex-col gap-4 lg:gap-8 w-full">
          <div className="flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-white border border-brand-border rounded-lg shadow-sm w-full overflow-hidden">
            {(() => {
              const maxDataValue = Math.max(...dynamicChart.flatMap(w => [Number(w.income), Number(w.expense)]));
              let yAxisMax = 4000; 
              if (maxDataValue > 0) {
                const magnitude = Math.pow(10, Math.floor(Math.log10(maxDataValue)) - 1); 
                const step = Math.ceil(maxDataValue / 4 / magnitude) * magnitude;
                yAxisMax = step * 4;
              }
              const yLabels = [yAxisMax, yAxisMax * 0.75, yAxisMax * 0.5, yAxisMax * 0.25];
              const balance = overview.current_balance || 0;
              const balanceStr = balance > 0 ? `+${formatCompact(balance)}` : formatCompact(balance);
              const balanceColor = balance >= 0 ? 'text-[#094CB2]' : 'text-[#BA1A1A]';
              const getHeight = (amount) => { if (!amount || yAxisMax === 0) return '0%'; return `${(amount / yAxisMax) * 100}%`; };

              return (
                <>
                  <div className="flex justify-between items-center w-full">
                    <h2 className="font-serif font-semibold text-[16px] lg:text-[20px] leading-7 text-[#1B1C1D] m-0">Thu - Chi theo tuần</h2>
                    <div className="bg-[#E9E8E9] rounded-full px-3 py-1 flex items-center justify-center">
                      <span className={`font-sans font-semibold text-[11px] lg:text-[12px] leading-4 ${balanceColor}`}>Còn dư: {balanceStr}</span>
                    </div>
                  </div>

                  {/* BIỂU ĐỒ: Xóa overflow-x-auto, dùng flex-1 và justify-between để tự ép vừa 100% màn hình */}
                  <div className="w-full pb-2 mt-4">
                    <div className="flex flex-row items-end pt-4 pb-6 pl-8 pr-1 lg:px-8 justify-between h-[200px] lg:h-[256px] border-b border-brand-border/30 relative w-full">
                      
                      {/* Trục Y: Ép cứng width để không lấn sang cột biểu đồ */}
                      <div className="absolute left-0 top-0 bottom-[24px] flex flex-col justify-between items-start text-[10px] lg:text-[12px] text-brand-text/50 font-sans w-8">
                        {yLabels.map((val, idx) => (<span key={idx}>{formatCompact(val)}</span>))}
                      </div>

                      {/* Các cột dữ liệu: Dùng flex-1 chia đều */}
                      {dynamicChart.map((weekData, index) => (
                        <div key={index} className="flex flex-row items-end gap-1 sm:gap-1.5 lg:gap-2 h-full relative flex-1 justify-center group">
                          
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1B1C1D] text-white text-[11px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none shadow-lg">
                            Thu: {formatVND(weekData.income)}<br/>Chi: {formatVND(weekData.expense)}
                          </div>
                          
                          {/* Width thanh bar thu nhỏ gọn gàng trên Mobile (w-3 sm:w-5) */}
                          <div className="w-3 sm:w-5 lg:w-8 bg-[#2E7D32]/80 rounded-t-sm transition-all duration-700 ease-out" style={{ height: getHeight(weekData.income) }}></div>
                          <div className="w-3 sm:w-5 lg:w-8 bg-[#BA1A1A]/80 rounded-t-sm transition-all duration-700 ease-out" style={{ height: getHeight(weekData.expense) }}></div>
                          
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] lg:text-[12px] text-brand-text font-sans w-max">{weekData.week}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center items-center gap-6 mt-1">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#2E7D32] rounded-full"></div><span className="font-sans text-[11px] lg:text-[12px] text-brand-text">Thu</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#BA1A1A] rounded-full"></div><span className="font-sans text-[11px] lg:text-[12px] text-brand-text">Chi</span></div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* 3 THẺ THỐNG KÊ NHỎ: Rút gọn text, căn giữa, tự động xuống dòng (line-clamp) thay vì cắt chữ */}
          {(() => {
            const savingRate = dashboardData?.overview?.saving_rate || 0;
            const highestExpense = dashboardData?.overview?.highest_expense;
            // Chữ "Chưa có dữ liệu" quá dài, rút gọn thành "Chưa có"
            const highestExpenseText = highestExpense ? `${highestExpense.name}` : "Chưa có"; 
            const savingRateText = savingRate > 0 ? `${savingRate}%` : "0%";
            
            let healthText = "Chưa có"; let healthColor = "text-[#1B1C1D]";
            if (currentIncome > 0) {
              if (savingRate >= 20) { healthText = "Rất tốt"; healthColor = "text-[#094CB2]"; } 
              else if (savingRate >= 10) { healthText = "Tốt"; healthColor = "text-[#2E7D32]"; } 
              else if (savingRate >= 0) { healthText = "T.Bình"; healthColor = "text-[#F59E0B]"; } 
              else { healthText = "Yếu"; healthColor = "text-[#BA1A1A]"; }
            } else if (currentExpense > 0) { healthText = "Yếu"; healthColor = "text-[#BA1A1A]"; }

            return (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-6 w-full mt-2">
                <div className="bg-[#F5F3F4] border border-brand-border rounded-lg p-2 lg:p-5 flex flex-col gap-1 items-center lg:items-start text-center lg:text-left justify-center">
                  <span className="font-sans text-[9px] sm:text-[10px] lg:text-[12px] text-brand-text uppercase tracking-[0.3px] line-clamp-1">Chi tiêu top 1</span>
                  <span className={`font-serif font-semibold text-[12px] sm:text-[14px] lg:text-[18px] leading-tight line-clamp-2 ${highestExpense ? 'text-[#1B1C1D]' : 'text-brand-text'}`}>{highestExpenseText}</span>
                </div>
                <div className="bg-[#F5F3F4] border border-brand-border rounded-lg p-2 lg:p-5 flex flex-col gap-1 items-center lg:items-start text-center lg:text-left justify-center">
                  <span className="font-sans text-[9px] sm:text-[10px] lg:text-[12px] text-brand-text uppercase tracking-[0.3px] line-clamp-1">Sức khỏe</span>
                  <span className={`font-serif font-semibold text-[12px] sm:text-[14px] lg:text-[18px] leading-tight line-clamp-2 ${healthColor}`}>{healthText}</span>
                </div>
                <div className="bg-[#F5F3F4] border border-brand-border rounded-lg p-2 lg:p-5 flex flex-col gap-1 items-center lg:items-start text-center lg:text-left justify-center">
                  <span className="font-sans text-[9px] sm:text-[10px] lg:text-[12px] text-brand-text uppercase tracking-[0.3px] line-clamp-1">Tỷ lệ gửi</span>
                  <span className="font-serif font-semibold text-[12px] sm:text-[14px] lg:text-[18px] leading-tight text-[#6D5E00]">{savingRateText}</span>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex flex-col gap-4 lg:gap-8 w-full">
          <div className="bg-white border border-brand-border rounded-lg p-4 lg:p-6 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center w-full mb-1">
              <h3 className="font-serif font-semibold text-[16px] lg:text-[18px] text-[#1B1C1D] m-0">Tháng {month + 1} - {year}</h3>
              <div className="flex gap-1">
                <button onClick={handlePrevMonth} className="p-2 lg:p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[40px] min-h-[40px] lg:min-w-0 lg:min-h-0 flex items-center justify-center"><ChevronLeft size={20} className="text-brand-text" /></button>
                <button onClick={handleNextMonth} className="p-2 lg:p-1 hover:bg-gray-100 rounded cursor-pointer min-w-[40px] min-h-[40px] lg:min-w-0 lg:min-h-0 flex items-center justify-center"><ChevronRight size={20} className="text-brand-text" /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-2 lg:gap-y-3 mt-1 lg:mt-2 text-center font-sans text-[12px]">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (<div key={d} className="text-[10px] text-brand-text/50 uppercase">{d}</div>))}
              {calendarGrid.map((day, index) => {
                if (!day) return <div key={`empty-${index}`}></div>;
                const isCurrent = isTodayReal(day); 
                const isDue = checkIsDue(day); 
                const isSelected = selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

                return (
                  <div key={day} onClick={() => setSelectedDate(new Date(year, month, day))}
                    className="flex justify-center items-center h-10 lg:h-8 relative cursor-pointer hover:bg-gray-50 rounded-sm"
                  >
                    <div className={`w-8 h-8 lg:w-7 lg:h-7 flex items-center justify-center rounded-sm transition-colors ${
                      isCurrent ? 'bg-[#D9E2FF] text-[#094CB2] font-medium' : isSelected ? 'bg-[#F5F3F4] text-[#1B1C1D] font-bold shadow-sm' : isDue ? 'text-[#1B1C1D] font-medium' : 'text-brand-text/60'
                    }`}>
                      {day}
                    </div>
                    {isDue && <div className="absolute bottom-1 lg:bottom-0 left-1/2 -translate-x-1/2 w-[4px] h-[4px] bg-[#BA1A1A] rounded-full"></div>}
                  </div>
                );
              })}
            </div>

            <span className="font-sans text-[10px] lg:text-[12px] text-brand-text uppercase tracking-[0.3px] mt-2 lg:mt-4">Sắp tới hạn</span>
            <div className="flex flex-col gap-2 lg:gap-3">
              {!dashboardData?.upcoming_reminders || dashboardData.upcoming_reminders.length === 0 ? (
                <div className="text-center text-[12px] lg:text-[13px] text-brand-text py-4 lg:py-6 italic bg-[#F5F3F4] rounded-lg">Không có dữ liệu</div>
              ) : (
                dashboardData.upcoming_reminders.map((reminder, idx) => {
                  const dateObj = parseSafeDate(reminder.due_date || reminder.deadline || reminder.date);
                  const displayDate = !isNaN(dateObj.getTime()) ? `${dateObj.getDate()} Thg ${dateObj.getMonth() + 1}` : '...';
                  return (
                    <div key={idx} onClick={() => handleReminderClick(reminder.due_date || reminder.deadline || reminder.date)} className="flex justify-between items-center bg-[#F5F3F4] rounded p-3 lg:p-2 transition-all hover:bg-[#E9E8E9] cursor-pointer">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#BA1A1A]/10 flex items-center justify-center shrink-0"><Zap size={16} className="text-[#BA1A1A]" /></div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-sans font-medium text-[13px] lg:text-[14px] text-[#1B1C1D] truncate">{reminder.title || reminder.name}</span>
                          <span className="font-sans text-[10px] text-brand-text">{displayDate}</span>
                        </div>
                      </div>
                      <span className="font-sans font-semibold text-[13px] lg:text-[14px] text-[#BA1A1A] shrink-0 ml-2">- {formatVND(reminder.amount || reminder.target_amount)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-lg p-4 lg:p-6 shadow-sm flex flex-col gap-3 lg:gap-4">
            <div className="flex justify-between items-center w-full">
              <h3 className="font-serif font-semibold text-[16px] lg:text-[18px] text-[#1B1C1D] m-0">Ghi chú</h3>
              {/* Button min 44x44 on mobile */}
              <button onClick={() => setIsAddingNote(true)} className="w-10 h-10 lg:w-8 lg:h-8 bg-[#094CB2] shadow-sm rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                <Plus size={20} lg:size={16} className="text-white" strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 lg:gap-3">
              {notes.map(note => (
                <div key={note.id} className="flex items-center justify-between gap-3 group bg-[#F5F3F4] lg:bg-transparent p-2 lg:p-0 rounded-lg lg:rounded-none">
                  <label className="flex items-start gap-3 cursor-pointer flex-1 min-h-[32px] lg:min-h-0 items-center lg:items-start">
                    <input type="checkbox" checked={note.completed} onChange={() => toggleNote(note.id)} className="w-5 h-5 lg:w-4 lg:h-4 rounded-sm border-[#C3C6D5] accent-[#094CB2] cursor-pointer shrink-0" />
                    <span className={`font-sans text-[13px] lg:text-[14px] transition-all duration-200 mt-0.5 lg:mt-0 ${note.completed ? 'text-brand-text line-through' : 'text-[#1B1C1D]'}`}>{note.text}</span>
                  </label>
                  {/* Luôn hiện nút xóa trên mobile, hover trên desktop */}
                  <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity text-[#BA1A1A] lg:text-gray-400 lg:hover:text-[#BA1A1A] p-2 lg:p-1 rounded-md cursor-pointer shrink-0"><X size={18} lg:size={14} strokeWidth={2.5} /></button>
                </div>
              ))}

              {isAddingNote && (
                <div className="flex items-start gap-3 animate-fade-in p-2 lg:p-0">
                  <div className="w-5 h-5 lg:w-4 lg:h-4 mt-[2px] rounded-sm border border-[#C3C6D5] opacity-50 shrink-0"></div>
                  <input type="text" autoFocus value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} onKeyDown={handleAddNoteKeyDown} onBlur={() => { if (newNoteText.trim() !== '') { setNotes([...notes, { id: Date.now(), text: newNoteText, completed: false }]); } setNewNoteText(''); setIsAddingNote(false); }} placeholder="Nhập & Enter..." className="font-sans text-[13px] lg:text-[14px] text-[#1B1C1D] outline-none border-b border-[#094CB2] bg-transparent w-full pb-1 focus:border-[2px]" />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;