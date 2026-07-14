import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import reportsApi from '../api/reportsApi';
import usersApi from '../api/usersApi';
import walletsApi from '../api/walletsApi'; 

const COLORS = ['#3366CC', '#BA1A1A', '#DCC661', '#5A5F63', '#16A34A', '#A855F7', '#F97316'];

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

const PDFPreview = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [userName, setUserName] = useState('Thanh Thủy');
  
  const [currTransactions, setCurrTransactions] = useState([]);
  const [prevTransactions, setPrevTransactions] = useState([]);
  const [rawSavings, setRawSavings] = useState([]);
  const [dateString, setDateString] = useState('');
  const [cycleDates, setCycleDates] = useState({ currStart: null, currEnd: null, prevStart: null, prevEnd: null });

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      setGlobalError(null);
      try {
        const profile = await usersApi.getProfile().catch(() => null);
        
        if (profile) {
          setUserName(profile.name || profile.full_name || 'Thanh Thủy');
        }

        // Thay đổi thành:
const cycleType = localStorage.getItem('userCycleType') || profile?.cycle_type || '4_weeks';
const anchorDateStr = localStorage.getItem('userCycleAnchor') || profile?.cycle_anchor_date;

        let currentStart = new Date();
        currentStart.setHours(0,0,0,0);

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
        if (cycleType === '4_weeks') {
            currentEnd.setDate(currentStart.getDate() + 27);
        } else if (cycleType === '30_days') {
            currentEnd.setDate(currentStart.getDate() + 29);
        } else {
            currentEnd.setMonth(currentStart.getMonth() + 1);
            currentEnd.setDate(currentStart.getDate() - 1);
        }
        currentEnd.setHours(23,59,59,999);

        let prevStart = new Date(currentStart);
        let prevEnd = new Date(currentStart);

        if (cycleType === '4_weeks') {
          prevStart.setDate(currentStart.getDate() - 28);
          prevEnd.setDate(currentStart.getDate() - 1);
        } else if (cycleType === '30_days') {
          prevStart.setDate(currentStart.getDate() - 30);
          prevEnd.setDate(currentStart.getDate() - 1);
        } else {
          prevStart.setMonth(currentStart.getMonth() - 1);
          prevEnd.setMonth(currentStart.getMonth());
          prevEnd.setDate(currentStart.getDate() - 1);
        }
        prevStart.setHours(0,0,0,0);
        prevEnd.setHours(23,59,59,999);

        const fmtYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const fmtDMY = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        
        setDateString(`${fmtDMY(currentStart)} - ${fmtDMY(currentEnd)}`);
        setCycleDates({ currStart: currentStart, currEnd: currentEnd, prevStart: prevStart, prevEnd: prevEnd });

        const [currRes, prevRes, savingsRes] = await Promise.all([
          reportsApi.getReportData(fmtYMD(currentStart), fmtYMD(currentEnd)).catch(() => ({ data: [] })),
          reportsApi.getReportData(fmtYMD(prevStart), fmtYMD(prevEnd)).catch(() => ({ data: [] })),
          walletsApi.getHistory().catch(() => []) 
        ]);

        setCurrTransactions(Array.isArray(currRes) ? currRes : (currRes?.data || []));
        setPrevTransactions(Array.isArray(prevRes) ? prevRes : (prevRes?.data || []));
        setRawSavings(Array.isArray(savingsRes) ? savingsRes : (savingsRes?.data || []));

      } catch (err) {
        setGlobalError("Không thể tạo báo cáo chi tiết do lỗi kết nối.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportData();
  }, []);

  const reportData = useMemo(() => {
    let currThu = 0, currChi = 0, currSaved = 0;
    let prevThu = 0, prevChi = 0, prevSaved = 0;
    const currIncomeGroups = {};
    const currExpenseGroups = {};
    const currentTxsList = []; 

    const { currStart, currEnd, prevStart, prevEnd } = cycleDates;

    currTransactions.forEach(tx => {
      const amt = parseInt(String(tx.amount || 0).replace(/\D/g, ''), 10) || 0;
      const isSaving = tx.type === 'saving' || tx.category?.name?.toLowerCase().includes('tiết kiệm');
      
      if (tx.type === 'income') {
        currThu += amt;
        const catName = tx.category?.name || 'Khác';
        currIncomeGroups[catName] = (currIncomeGroups[catName] || 0) + amt;
      } else if (!isSaving && tx.type === 'expense') {
        currChi += amt;
        const catName = tx.category?.name || 'Khác';
        currExpenseGroups[catName] = (currExpenseGroups[catName] || 0) + amt;
      }

      if (!isSaving) {
        currentTxsList.push(tx); 
      }
    });

    prevTransactions.forEach(tx => {
      const amt = parseInt(String(tx.amount || 0).replace(/\D/g, ''), 10) || 0;
      const isSaving = tx.type === 'saving' || tx.category?.name?.toLowerCase().includes('tiết kiệm');
      
      if (tx.type === 'income') prevThu += amt;
      else if (!isSaving && tx.type === 'expense') prevChi += amt;
    });

    rawSavings.forEach(sv => {
      if (sv.type === 'withdraw' || sv.desc?.toLowerCase().includes('rút')) return; 
      
      const amt = parseInt(String(sv.amount || 0).replace(/\D/g, ''), 10) || 0;
      let svDate = parseSafeDate(sv.date || sv.created_at || sv.transaction_date);

      if (currStart && currEnd && svDate >= currStart && svDate <= currEnd) {
          currSaved += amt;
      } else if (prevStart && prevEnd && svDate >= prevStart && svDate <= prevEnd) {
          prevSaved += amt;
      }
    });

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const mapToChartData = (groupsObj) => {
      const total = Object.values(groupsObj).reduce((a, b) => a + b, 0);
      return Object.keys(groupsObj).map((key, index) => ({
        name: key,
        amount: groupsObj[key],
        pct: total > 0 ? Math.round((groupsObj[key] / total) * 100) : 0,
        color: COLORS[index % COLORS.length]
      })).sort((a, b) => b.pct - a.pct);
    };

    const getEmoji = (catName, type) => {
      if (type === 'income') return '💰';
      if (catName.toLowerCase().includes('phòng') || catName.toLowerCase().includes('nhà')) return '🏠';
      if (catName.toLowerCase().includes('ăn')) return '🍽️';
      if (catName.toLowerCase().includes('di chuyển') || catName.toLowerCase().includes('xe')) return '🛵';
      return '💸';
    };

    const groupedTxsMap = {};
    currentTxsList.forEach(tx => {
      const catName = tx.category?.name || 'Khác';
      const type = tx.type;
      const key = `${catName}_${type}`;
      const amt = parseInt(String(tx.amount || 0).replace(/\D/g, ''), 10) || 0;
      const txDate = parseSafeDate(tx.date || tx.transaction_date);

      if (!groupedTxsMap[key]) {
        groupedTxsMap[key] = {
          category: catName,
          type: type === 'income' ? 'Thu' : 'Chi',
          rawType: type,
          amount: 0,
          latestDate: txDate
        };
      }
      groupedTxsMap[key].amount += amt;
      
      if (!isNaN(txDate.getTime()) && txDate > groupedTxsMap[key].latestDate) {
        groupedTxsMap[key].latestDate = txDate;
      }
    });

    const formattedTransactions = Object.values(groupedTxsMap)
      .sort((a, b) => {
         if (a.rawType !== b.rawType) return a.rawType === 'income' ? -1 : 1;
         return b.amount - a.amount;
      })
      .map(group => {
        const d = group.latestDate;
        const dateStr = !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '...';
        return {
          date: dateStr,
          category: group.category,
          type: group.type,
          amount: `${group.amount.toLocaleString('vi-VN')} VNĐ`,
          icon: getEmoji(group.category, group.rawType)
        };
      });

    return {
      thu: currThu, chi: currChi, saved: currSaved,
      thuChange: calcChange(currThu, prevThu),
      chiChange: calcChange(currChi, prevChi),
      savedChange: calcChange(currSaved, prevSaved),
      incomeData: mapToChartData(currIncomeGroups),
      expenseData: mapToChartData(currExpenseGroups),
      recentTransactions: formattedTransactions
    };
  }, [currTransactions, prevTransactions, rawSavings, cycleDates]);

  const fmt = (n) => (Number(n) || 0).toLocaleString("vi-VN").replace(/,/g, ".") + " VNĐ";

  const DonutChart = ({ data, centerText }) => {
    const size = 96;
    const r = 36;
    const c = 2 * Math.PI * r;
    let offset = 0;

    return (
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        {data.length === 0 ? (
          <div className="w-full h-full rounded-full border-[11.52px] border-[#E3E2E3] flex items-center justify-center">
            <span className="text-[10px] text-gray-400">Trống</span>
          </div>
        ) : (
          <>
            <svg width={size} height={size} className="-rotate-90 absolute">
              <circle cx={size/2} cy={size/2} r={r} fill="transparent" stroke="#E3E2E3" strokeWidth="11.52" />
              {data.map((item, i) => {
                const len = (item.pct / 100) * c;
                const el = (
                  <circle
                    key={i} cx={size/2} cy={size/2} r={r} fill="transparent" stroke={item.color} strokeWidth="11.52"
                    strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
                  />
                );
                offset += len;
                return el;
              })}
            </svg>
            <div className="absolute text-center z-10">
              <span className="font-serif font-black text-sm text-[#1B1C1D]">{centerText}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  const ChangeBadge = ({ value, isPositiveGood = true }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    const isGood = isPositiveGood ? isPositive : !isPositive;
    const colorClass = isGood ? 'text-[#16A34A]' : 'text-[#DC2626]';
    const bgClass = isGood ? 'border-[#DCFCE7]' : 'border-[#FEE2E2]';
    const strokeColor = isGood ? '#16A34A' : '#DC2626';
    
    return (
      <div className={`absolute top-3 right-3 lg:top-4 lg:right-4 flex items-center gap-1 px-1.5 py-0.5 lg:px-2 lg:py-1 bg-white/80 border ${bgClass} rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)]`}>
        <svg width="10" height="6" viewBox="0 0 12 7" fill="none" className={!isPositive ? 'rotate-180' : ''}>
          <path d="M1 6l4-4 3 3 3-4" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={`text-[10px] lg:text-xs font-bold ${colorClass}`}>
          {isPositive ? '+' : ''}{value.toFixed(0)}%
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3F4] lg:bg-[#DBDADB] print:hidden">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3366CC]"></div>
        <p className="mt-4 text-[#434653] font-medium text-sm lg:text-base">Đang khởi tạo tài liệu PDF...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F3F4] lg:bg-gradient-to-b lg:from-[#DBDADB] lg:to-[#DBDADB] print:bg-none print:bg-white">
      
      {/* ====== TOP TOOLBAR (Responsive) ====== */}
      <header className="sticky top-0 z-20 flex justify-between items-center px-4 lg:px-6 py-3 lg:py-4 bg-white shadow-sm print:hidden border-b border-[#E3E2E3]/50">
        <div className="flex flex-col">
          <h1 className="font-serif font-bold text-[14px] sm:text-base text-[#1B1C1D] flex items-center gap-2 m-0">
            Xem trước báo cáo
            {globalError && <span className="text-[10px] lg:text-sm font-normal text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 hidden sm:inline-block">{globalError}</span>}
          </h1>
          <span className="font-sans text-[11px] text-[#737784] lg:hidden">Chu kỳ hiện tại</span>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
          <button onClick={() => window.print()} className="flex items-center justify-center gap-2 w-9 h-9 lg:w-auto lg:h-auto lg:px-4 lg:py-2 bg-[#E9E8E9] rounded-lg lg:rounded-sm hover:bg-gray-300 transition cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M7 9l-3-3M7 9l3-3M2 11v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="#3366CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="hidden sm:inline text-sm font-semibold text-[#3366CC]">Tải PDF</span>
          </button>
          <button onClick={() => window.print()} className="flex items-center justify-center gap-2 w-9 h-9 lg:w-auto lg:h-auto lg:px-4 lg:py-2 bg-[#E9E8E9] rounded-lg lg:rounded-sm hover:bg-gray-300 transition cursor-pointer">
            <svg width="16" height="15" viewBox="0 0 16 15" fill="none"><path d="M4 5V1h8v4M4 11H2a1 1 0 01-1-1V6a1 1 0 011-1h12a1 1 0 011 1v4a1 1 0 01-1 1h-2M4 11v3h8v-3" stroke="#3366CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="hidden sm:inline text-sm font-semibold text-[#3366CC]">In</span>
          </button>
          <button onClick={() => navigate('/reports')} className="flex items-center justify-center gap-2 w-9 h-9 lg:w-auto lg:h-auto lg:px-4 lg:py-2 bg-[#3366CC] rounded-lg lg:rounded-sm shadow-sm hover:bg-blue-700 transition cursor-pointer ml-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            <span className="hidden sm:inline text-sm font-semibold text-white">Đóng</span>
          </button>
        </div>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        
        {/* LEFT SIDEBAR - Thumbnails (Ẩn trên Mobile) */}
        <aside className="hidden lg:flex w-64 flex-col p-4 gap-6 bg-[#F5F3F4] border-r border-[#C3C6D5]/15 overflow-y-auto print:hidden">
          <div className="flex flex-col items-center gap-2">
            <div onClick={() => setActivePage(1)} className={`w-32 h-40 bg-white rounded-sm cursor-pointer p-2 flex flex-col gap-1 transition-all ${activePage === 1 ? 'shadow-[0_0_0_2px_#3366CC,0_1px_2px_rgba(0,0,0,0.05)]' : 'border border-[#C3C6D5]'}`}>
              <div className="w-full h-2 bg-[#E3E2E3] rounded-sm" />
              <div className="w-3/4 h-1 bg-[#E3E2E3] rounded-sm" />
              <div className="flex gap-1 mt-1">
                <div className="w-1/3 h-4 bg-[#E3E2E3] rounded-sm" />
                <div className="w-1/3 h-4 bg-[#E3E2E3] rounded-sm" />
                <div className="w-1/3 h-4 bg-[#E3E2E3] rounded-sm" />
              </div>
              <div className="w-full h-12 bg-[#E3E2E3] rounded-sm mt-1" />
              <div className="w-full h-12 bg-[#E3E2E3] rounded-sm" />
            </div>
            <span className={`text-xs font-bold ${activePage === 1 ? 'text-[#3366CC]' : 'text-[#434653]'}`}>Trang 1</span>
          </div>
        </aside>

        {/* DOCUMENT VIEWER */}
        <div className="flex-1 flex justify-center p-2 sm:p-4 lg:p-8 overflow-y-auto print:p-0 print:overflow-visible print:block">
          
          {/* Tờ giấy A4 (Responsive w-full trên Mobile) */}
          <div className="w-full max-w-[800px] h-max bg-white shadow-sm lg:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1),0_0_20px_rgba(0,0,0,0.05)] rounded-lg lg:rounded-sm relative print:w-full print:max-w-full print:shadow-none print:m-0 print:rounded-none">
            
            {/* Watermark (Chữ mờ phía sau) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden print:fixed print:inset-0">
              <span className="font-serif font-black text-[48px] sm:text-[80px] lg:text-[128px] text-black/[0.03] -rotate-45 whitespace-nowrap">
                MONEY4WEEK
              </span>
            </div>

            {/* Nội dung báo cáo (Padding nhỏ trên Mobile, giữ nguyên khi Print) */}
            <div className="relative z-10 p-4 sm:p-6 lg:px-12 lg:py-12 flex flex-col min-h-full print:p-8">
              
              {/* HEADER TỜ GIẤY */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-4 lg:pb-6 border-b border-[#C3C6D5]/15 gap-3 lg:gap-0">
                <div className="flex flex-col gap-1 lg:gap-2">
                  <h2 className="font-serif font-black text-[22px] lg:text-[30px] leading-tight lg:leading-9 tracking-[-0.75px] uppercase text-[#1B1C1D] m-0">
                    Báo cáo Tổng kết Tài chính
                  </h2>
                  <p className="text-[11px] lg:text-sm tracking-[1.4px] uppercase text-[#434653] m-0">
                    Báo cáo định kỳ
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1">
                  <span className="font-serif font-bold text-[18px] lg:text-2xl text-[#3366CC]">Money4Week</span>
                  <span className="text-[10px] lg:text-xs text-[#434653]">Bảo mật & Lưu trữ Thông minh</span>
                </div>
              </div>

              {/* TÓM TẮT THÔNG TIN */}
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-8 mt-4 lg:mt-8 mb-6 lg:mb-10">
                <div className="flex-1 p-3 lg:p-4 bg-[#FAF9FA] border border-[#C3C6D5]/15 rounded-md lg:rounded-sm">
                  <p className="text-[10px] lg:text-xs tracking-[0.6px] uppercase text-[#5A5F63] mb-1 m-0">Họ và tên</p>
                  <p className="font-serif font-bold text-[15px] lg:text-lg text-[#1B1C1D] m-0">{userName}</p>
                </div>
                <div className="flex-1 p-3 lg:p-4 bg-[#FAF9FA] border border-[#C3C6D5]/15 rounded-md lg:rounded-sm">
                  <p className="text-[10px] lg:text-xs tracking-[0.6px] uppercase text-[#5A5F63] mb-1 m-0">Thời gian thống kê</p>
                  <p className="font-sans font-medium text-[14px] lg:text-base text-[#1B1C1D] m-0">{dateString}</p>
                </div>
              </div>

              {/* 3 CỘT SỐ LIỆU (Mobile xếp dọc, Desktop xếp ngang) */}
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-6 mb-6 lg:mb-12">
                <div className="flex-1 p-3 lg:p-4 bg-[rgba(51,102,204,0.05)] border-t-[3px] lg:border-t-4 border-[#3366CC] rounded-md lg:rounded relative">
                  <div className="flex items-center gap-2 mb-1 lg:mb-2">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 9l4-4H1z" fill="#3366CC" /></svg>
                    <span className="text-[12px] lg:text-sm text-[#5A5F63]">Tổng thu nhập</span>
                  </div>
                  <p className="font-serif font-bold text-[20px] lg:text-2xl text-[#3366CC] m-0">
                    {fmt(reportData.thu)} <span className="text-[11px] lg:text-sm font-normal">VNĐ</span>
                  </p>
                  <ChangeBadge value={reportData.thuChange} isPositiveGood={true} />
                </div>

                <div className="flex-1 p-3 lg:p-4 bg-[rgba(186,26,26,0.05)] border-t-[3px] lg:border-t-4 border-[#BA1A1A] rounded-md lg:rounded relative">
                  <div className="flex items-center gap-2 mb-1 lg:mb-2">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1l4 4H1z" fill="#BA1A1A" /></svg>
                    <span className="text-[12px] lg:text-sm text-[#5A5F63]">Tổng chi tiêu</span>
                  </div>
                  <p className="font-serif font-bold text-[20px] lg:text-2xl text-[#BA1A1A] m-0">
                    {fmt(reportData.chi)} <span className="text-[11px] lg:text-sm font-normal">VNĐ</span>
                  </p>
                  <ChangeBadge value={reportData.chiChange} isPositiveGood={false} />
                </div>

                <div className="flex-1 p-3 lg:p-4 bg-[rgba(109,94,0,0.05)] border-t-[3px] lg:border-t-4 border-[#6D5E00] rounded-md lg:rounded relative">
                  <div className="flex items-center gap-2 mb-1 lg:mb-2">
                    <svg width="12" height="11" viewBox="0 0 12 11" fill="none"><path d="M6 1l3 3H3z" fill="#6D5E00" /></svg>
                    <span className="text-[12px] lg:text-sm text-[#5A5F63]">Tiết kiệm</span>
                  </div>
                  <p className="font-serif font-bold text-[20px] lg:text-2xl text-[#6D5E00] m-0">
                    {fmt(reportData.saved)} <span className="text-[11px] lg:text-sm font-normal">VNĐ</span>
                  </p>
                  <ChangeBadge value={reportData.savedChange} isPositiveGood={true} />
                </div>
              </div>

              {/* BIỂU ĐỒ TRÒN (Mobile xếp dọc, Desktop xếp ngang) */}
              <div className="mb-8 lg:mb-10">
                <h3 className="font-serif font-bold text-[16px] lg:text-lg text-[#1B1C1D] mb-4 lg:mb-6">
                  Cơ cấu Thu & Chi
                </h3>
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                  <div className="flex-1 p-4 bg-[#FAF9FA] border border-[#C3C6D5]/15 rounded-md lg:rounded-sm">
                    <h4 className="font-serif font-bold text-[13px] lg:text-sm text-center text-[#1B1C1D] mb-4">Cơ cấu Thu nhập</h4>
                    <div className="flex items-center gap-4">
                      <DonutChart data={reportData.incomeData} centerText="100%" />
                      <div className="flex flex-col gap-2 w-full">
                        {reportData.incomeData.length === 0 && <span className="text-xs italic text-gray-500">Chưa có thu nhập</span>}
                        {reportData.incomeData.slice(0, 4).map((item) => (
                          <div key={item.name} className="flex items-center gap-2 w-full">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-[11px] lg:text-xs text-[#1B1C1D] truncate flex-1" title={item.name}>{item.name}</span>
                            <span className="text-[11px] lg:text-xs font-bold text-[#1B1C1D]">({item.pct}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-4 bg-[#FAF9FA] border border-[#C3C6D5]/15 rounded-md lg:rounded-sm">
                    <h4 className="font-serif font-bold text-[13px] lg:text-sm text-center text-[#1B1C1D] mb-4">Cơ cấu Chi tiêu</h4>
                    <div className="flex items-center gap-4">
                      <DonutChart data={reportData.expenseData} centerText="100%" />
                      <div className="flex flex-col gap-2 w-full">
                        {reportData.expenseData.length === 0 && <span className="text-xs italic text-gray-500">Chưa có chi tiêu</span>}
                        {reportData.expenseData.slice(0, 4).map((item) => (
                          <div key={item.name} className="flex items-center gap-2 w-full">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-[11px] lg:text-xs text-[#1B1C1D] truncate flex-1" title={item.name}>{item.name}</span>
                            <span className="text-[11px] lg:text-xs font-bold text-[#1B1C1D]">({item.pct}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BẢNG GIAO DỊCH (Có Scroll ngang trên Mobile để bảo vệ cấu trúc In) */}
              <div className="mb-6 lg:mb-8">
                <h3 className="font-serif font-bold text-[16px] lg:text-lg text-[#1B1C1D] mb-3 lg:mb-4">
                  Tổng hợp giao dịch theo danh mục
                </h3>
                <div className="bg-[#FAF9FA] border border-[#C3C6D5]/15 rounded-md lg:rounded-sm overflow-x-auto print:overflow-visible">
                  {/* min-w-[500px] đảm bảo bảng không bị bóp méo chữ trên màn hình nhỏ */}
                  <table className="w-full min-w-[500px] lg:min-w-full print:min-w-full">
                    <thead>
                      <tr className="bg-[#F5F3F4] border-b border-[#C3C6D5]/15">
                        <th className="text-left px-3 lg:px-4 py-2 lg:py-3 text-[11px] lg:text-xs font-bold tracking-[0.6px] uppercase text-[#5A5F63]">Ngày</th>
                        <th className="text-left px-3 lg:px-4 py-2 lg:py-3 text-[11px] lg:text-xs font-bold tracking-[0.6px] uppercase text-[#5A5F63]">Danh mục</th>
                        <th className="text-left px-3 lg:px-4 py-2 lg:py-3 text-[11px] lg:text-xs font-bold tracking-[0.6px] uppercase text-[#5A5F63]">Loại</th>
                        <th className="text-right px-3 lg:px-4 py-2 lg:py-3 text-[11px] lg:text-xs font-bold tracking-[0.6px] uppercase text-[#5A5F63]">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.recentTransactions.length === 0 && (
                        <tr><td colSpan="4" className="text-center py-4 text-xs lg:text-sm text-gray-500">Không có giao dịch nào trong chu kỳ này</td></tr>
                      )}
                      {reportData.recentTransactions.map((tx, i) => (
                        <tr key={i} className="border-b border-[#C3C6D5]/15">
                          <td className="px-3 lg:px-4 py-2 lg:py-3 text-[12px] lg:text-sm text-[#1B1C1D]">{tx.date}</td>
                          <td className="px-3 lg:px-4 py-2 lg:py-3 text-[12px] lg:text-sm text-[#1B1C1D] flex items-center gap-2">
                            <span>{tx.icon}</span>
                            {tx.category}
                          </td>
                          <td className={`px-3 lg:px-4 py-2 lg:py-3 text-[12px] lg:text-sm font-medium ${tx.type === 'Chi' ? 'text-[#BA1A1A]' : 'text-[#3366CC]'}`}>
                            {tx.type}
                          </td>
                          <td className={`px-3 lg:px-4 py-2 lg:py-3 text-[12px] lg:text-sm font-medium text-right ${tx.type === 'Chi' ? 'text-[#BA1A1A]' : 'text-[#3366CC]'}`}>
                            {tx.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[rgba(51,102,204,0.05)] border-t-2 border-[rgba(51,102,204,0.3)]">
                        <td colSpan="3" className="px-3 lg:px-4 py-3 font-serif font-bold text-[12px] lg:text-sm tracking-[0.7px] uppercase text-[#3366CC]">
                          Số dư chu kỳ
                        </td>
                        <td className="px-3 lg:px-4 py-3 font-serif font-black text-[13px] lg:text-sm text-right text-[#3366CC]">
                          {fmt(reportData.thu - reportData.chi)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* FOOTER TỜ GIẤY */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 lg:pt-6 border-t border-[#C3C6D5]/15 mt-auto gap-2 sm:gap-0">
                <span className="text-[10px] lg:text-xs text-[#434653] text-center sm:text-left">@2026.Money4Week. Quản lý tài chính cá nhân. Được xuất bởi: {userName}</span>
                <span className="text-[10px] lg:text-xs text-[#434653]">Trang 1/1</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;