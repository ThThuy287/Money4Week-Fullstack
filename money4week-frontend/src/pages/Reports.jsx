import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import reportsApi from '../api/reportsApi';
import transactionsApi from '../api/transactionsApi'; 
import usersApi from '../api/usersApi'; 
import walletsApi from '../api/walletsApi'; 
import remindersApi from '../api/remindersApi';
import categoryApi from '../api/categoryApi';
import { 
  X, Wallet, Plus, Save, Building2, BookOpen, Laptop, ShieldCheck,
  ChevronDown, CalendarDays, CheckCircle2,
  Utensils, Banknote, BusFront, ShoppingBag,
  GraduationCap, Home, Plane, MoreHorizontal, Edit2, Trash2,
  ShoppingCart, Coffee, Briefcase, Dumbbell, PartyPopper, Cat, Film,
  Car, Luggage, PiggyBank, Zap, Droplet, Wifi, Smartphone,
  TrendingUp, CreditCard, Heart, Book, Music, Gift, Monitor, Shirt, Scissors, Baby,
  Gamepad2, Wrench, Leaf, Bus, Train, Fuel, Camera, Shield, Activity, Landmark,
  Umbrella, Tv, Stethoscope, Sofa, Ticket, Palmtree, Pizza, Building, Glasses, Star
} from 'lucide-react';

const COLORS = ["#F97316", "#3B82F6", "#EAB308", "#A855F7", "#16A34A", "#EC4899", "#06B6D4"];

const getIconComponent = (iconName) => {
  if (!iconName) return MoreHorizontal;
  const icons = { 
    Laptop, GraduationCap, Home, Plane, Building2, BookOpen, 
    Utensils, Banknote, BusFront, ShoppingBag, Wallet,
    ShoppingCart, Coffee, Briefcase, Dumbbell, PartyPopper, Cat, Film,
    Car, Luggage, PiggyBank, Zap, Droplet, Wifi, Smartphone,
    TrendingUp, CreditCard, Heart, Book, Music, Gift, Monitor, Shirt, Scissors, Baby,
    Gamepad2, Wrench, Leaf, Bus, Train, Fuel, Camera, Shield, Activity, Landmark,
    Umbrella, Tv, Stethoscope, Sofa, Ticket, Palmtree, Pizza, Building, Glasses, Star
  };
  return icons[iconName] || MoreHorizontal;
};

const initCycle = () => {
  return { weekOptions: [], startDate: '', endDate: '' };
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

const Reports = () => {
  const navigate = useNavigate();

  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null });
  const [timeFilter, setTimeFilter] = useState('all'); 
  const [catFilter, setCatFilter] = useState('all');   
  const [sortType, setSortType] = useState('default'); 
  const [activeDropdown, setActiveDropdown] = useState(null); 

  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false); 
  const [globalError, setGlobalError] = useState(null);
  const [globalSuccess, setGlobalSuccess] = useState(null); 
  
  const [rawTransactions, setRawTransactions] = useState([]);
  const [rawSavings, setRawSavings] = useState([]); 
  const [rawTargets, setRawTargets] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  
  const [cycleInfo, setCycleInfo] = useState(initCycle());
  const { weekOptions, startDate, endDate } = cycleInfo;

  useEffect(() => {
    const handleClickOutside = () => {
      setTooltip((prev) => ({ ...prev, show: false }));
      setActiveDropdown(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const showSuccess = (msg) => { setGlobalSuccess(msg); setTimeout(() => setGlobalSuccess(null), 3000); };
  const showError = (msg) => { setGlobalError(msg); setTimeout(() => setGlobalError(null), 4000); };

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const profile = await usersApi.getProfile().catch(() => null);
      
      const cycleType = localStorage.getItem('userCycleType') || profile?.cycle_type || '4_weeks';
      const anchorDateStr = localStorage.getItem('userCycleAnchor') || profile?.cycle_anchor_date;

      const today = new Date();
      today.setHours(0,0,0,0);

      let start = new Date();
      start.setHours(0,0,0,0);

      let anchor = anchorDateStr ? parseSafeDate(anchorDateStr) : new Date();
      anchor.setHours(0,0,0,0);
      if (isNaN(anchor.getTime())) anchor = new Date();

      if (cycleType === '4_weeks') {
        const diffDays = Math.floor((start.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
        const cyclesPassed = Math.floor(diffDays / 28);
        start = new Date(anchor);
        start.setDate(anchor.getDate() + (cyclesPassed * 28));
      } else if (cycleType === '30_days') {
        const diffDays = Math.floor((start.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
        const cyclesPassed = Math.floor(diffDays / 30);
        start = new Date(anchor);
        start.setDate(anchor.getDate() + (cyclesPassed * 30));
      } else if (cycleType === '1_month') {
        start = new Date(start.getFullYear(), start.getMonth(), anchor.getDate());
        if (new Date().getTime() < start.getTime()) {
            start.setMonth(start.getMonth() - 1);
        }
      }

      let end = new Date(start);
      if (cycleType === '4_weeks') end.setDate(start.getDate() + 27);
      else if (cycleType === '30_days') end.setDate(start.getDate() + 29);
      else if (cycleType === '1_month') {
          end.setMonth(start.getMonth() + 1);
          end.setDate(start.getDate() - 1);
      }
      end.setHours(23, 59, 59, 999);

      const fmtDateStr = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      const fmtYMD = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const totalDays = Math.round((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1;
      const chunk = Math.floor(totalDays / 4);
      
      const ranges = [];
      let tempStart = new Date(start);
      for (let i = 0; i < 4; i++) {
        const ws = new Date(tempStart);
        const we = new Date(ws);
        if (i === 3) we.setTime(end.getTime());
        else we.setDate(ws.getDate() + chunk - 1);
        we.setHours(23, 59, 59, 999);
        
        ranges.push({ id: `w${i+1}`, name: `Tuần ${i+1}`, range: `${fmtDateStr(ws)} - ${fmtDateStr(we)}`, startObj: ws, endObj: we });
        
        tempStart = new Date(we);
        tempStart.setDate(tempStart.getDate() + 1);
        tempStart.setHours(0,0,0,0);
      }

      const exactStart = fmtYMD(start);
      const exactEnd = fmtYMD(end);
      setCycleInfo({ weekOptions: ranges, startDate: exactStart, endDate: exactEnd });

      const [transRes, catRes, savingsRes, targetsRes] = await Promise.all([
        reportsApi.getReportData(exactStart, exactEnd).catch(() => []),
        categoryApi.getCategories().catch(() => []),
        walletsApi.getHistory().catch(() => []),
        remindersApi.getReminders().catch(() => []) 
      ]);
      
      setRawTransactions(Array.isArray(transRes) ? transRes : (transRes?.data || []));
      setDbCategories(Array.isArray(catRes) ? catRes : (catRes?.data || []));
      setRawSavings(Array.isArray(savingsRes) ? savingsRes : (savingsRes?.data || [])); 
      setRawTargets(Array.isArray(targetsRes) ? targetsRes : (targetsRes?.data || [])); 

    } catch (err) {
      showError("Không thể lấy dữ liệu báo cáo. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReportData(); }, []);

  const handleResetCycle = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn dọn dẹp toàn bộ dữ liệu Thu/Chi để bắt đầu một chu kỳ mới?\n\nLưu ý: Các ví tiết kiệm và danh mục vẫn sẽ được giữ nguyên.")) return;
    try {
      setIsResetting(true);
      await transactionsApi.resetTransactions();
      showSuccess("Đã khởi tạo chu kỳ mới thành công!");
      fetchReportData(); 
    } catch (err) { showError("Có lỗi xảy ra khi bắt đầu chu kỳ mới."); } 
    finally { setIsResetting(false); }
  };

  const filterCategories = useMemo(() => {
    return dbCategories.map((c, idx) => ({
      id: c.id, 
      name: c.name, 
      color: c.color_hex || c.color || COLORS[idx % COLORS.length],
      icon: c.icon
    }));
  }, [dbCategories]);

  const { weeklyData, rawExpenses, rawIncomes } = useMemo(() => {
    if (!weekOptions || weekOptions.length === 0) return { weeklyData: [], rawExpenses: [], rawIncomes: [] };

    const wData = [
      { id: 'w1', week: weekOptions[0].name, thu: 0, chi: 0, saving: 0 },
      { id: 'w2', week: weekOptions[1].name, thu: 0, chi: 0, saving: 0 },
      { id: 'w3', week: weekOptions[2].name, thu: 0, chi: 0, saving: 0 },
      { id: 'w4', week: weekOptions[3].name, thu: 0, chi: 0, saving: 0 },
    ];
    
    const expenses = [];
    const incomes = []; 
    const catWeeklyTotals = {};

    rawTransactions.forEach(tx => {
      const txDate = parseSafeDate(tx.date || tx.transaction_date);
      const amount = Number(tx.amount) || 0;
      let targetWeekId = null;

      // Map chuẩn logic: Nạp tiết kiệm -> Chi, Rút tiết kiệm -> Thu
      const actualType = tx.type === 'saving' ? 'expense' : (tx.type === 'withdraw' ? 'income' : tx.type);

      for (let i = 0; i < weekOptions.length; i++) {
        if (txDate >= weekOptions[i].startObj && txDate <= weekOptions[i].endObj) {
          targetWeekId = weekOptions[i].id;
          
          if (actualType === 'income') wData[i].thu += amount;
          else if (actualType === 'expense') wData[i].chi += amount;
          break;
        }
      }

      if (targetWeekId) {
        if (actualType === 'income') {
          let catId = tx.category?.id || 'other_income';
          let catName = tx.category?.name || 'Thu nhập khác';
          const catFallback = filterCategories.find(c => String(c.id) === String(catId));
          let catColor = tx.category?.color_hex || tx.category?.color || catFallback?.color || "#16A34A";
          let catIcon = tx.category?.icon || catFallback?.icon || 'Banknote';
          
          // --- HACK FIX CHUYÊN BIỆT CHO VÍ TIẾT KIỆM ---
          if (tx.note && (tx.note.includes('Rút tiền từ ví:') || tx.note.includes('[Rút ví]'))) {
             const matchedSaving = rawSavings.find(sv => tx.note.includes(sv.walletName));
             if (matchedSaving) {
                 catId = 'wallet_wit_' + matchedSaving.walletId;
                 catName = matchedSaving.walletName;
                 catColor = matchedSaving.color || '#EAB308';
                 catIcon = matchedSaving.icon || 'Wallet';
             } else {
                 catName = tx.note.includes('Rút tiền từ ví:') ? tx.note.split('Rút tiền từ ví: ')[1] : tx.note.replace('[Rút ví] ', '').trim();
                 catId = 'wallet_wit_' + catName;
                 catColor = '#EAB308';
                 catIcon = 'Wallet';
             }
          }

          incomes.push({
            id: tx.id || Math.random().toString(),
            weekId: targetWeekId, catId: catId, category: catName, detail: tx.note || "Giao dịch thu nhập",
            amount: amount, color: catColor, icon: catIcon, iconBg: `bg-[${catColor}20]`, iconColor: `text-[${catColor}]`
          });
        } else if (actualType === 'expense') {
          let catId = tx.category?.id || 'other';
          let catName = tx.category?.name || 'Khác';
          const catFallback = filterCategories.find(c => String(c.id) === String(catId));
          let catColor = tx.category?.color_hex || tx.category?.color || catFallback?.color || "#3B82F6";
          let catIcon = tx.category?.icon || catFallback?.icon || 'Wallet';
          
          // --- HACK FIX CHUYÊN BIỆT CHO VÍ TIẾT KIỆM ---
          if (tx.note && (tx.note.includes('Nạp tiền vào ví:') || tx.note.includes('[Nạp ví]'))) {
             const matchedSaving = rawSavings.find(sv => tx.note.includes(sv.walletName));
             if (matchedSaving) {
                 catId = 'wallet_dep_' + matchedSaving.walletId;
                 catName = matchedSaving.walletName;
                 catColor = matchedSaving.color || '#094CB2';
                 catIcon = matchedSaving.icon || 'PiggyBank';
             } else {
                 catName = tx.note.includes('Nạp tiền vào ví:') ? tx.note.split('Nạp tiền vào ví: ')[1] : tx.note.replace('[Nạp ví] ', '').trim();
                 catId = 'wallet_dep_' + catName;
                 catColor = '#094CB2';
                 catIcon = 'PiggyBank';
             }
          }

          if (!catWeeklyTotals[catId]) catWeeklyTotals[catId] = { w1: 0, w2: 0, w3: 0, w4: 0 };
          catWeeklyTotals[catId][targetWeekId] += amount;

          expenses.push({
            id: tx.id || Math.random().toString(),
            weekId: targetWeekId, catId: catId, category: catName, detail: tx.note || "Giao dịch chi tiêu",
            amount: amount, color: catColor, icon: catIcon, iconBg: `bg-[${catColor}20]`, iconColor: `text-[${catColor}]`
          });
        }
      } 
    });

    rawTargets.forEach(item => {
      const dueDate = parseSafeDate(item.due_date || item.deadline || item.date);
      const amount = Number(item.amount || item.target_amount || 0);
      
      if (isNaN(dueDate.getTime()) || amount === 0) return;

      let targetWeekId = null;
      for (let i = 0; i < weekOptions.length; i++) {
        if (dueDate >= weekOptions[i].startObj && dueDate <= weekOptions[i].endObj) {
          targetWeekId = weekOptions[i].id;
          wData[i].chi += amount;
          break;
        }
      }

      if (targetWeekId) {
        const catId = 'target_expense';
        const catName = 'Mục tiêu tới hạn';
        const catColor = '#8B5CF6'; 
        
        if (!catWeeklyTotals[catId]) catWeeklyTotals[catId] = { w1: 0, w2: 0, w3: 0, w4: 0 };
        catWeeklyTotals[catId][targetWeekId] += amount;

        expenses.push({
          id: item.id || `target-${Math.random()}`,
          weekId: targetWeekId, 
          catId: catId, 
          category: catName, 
          detail: item.name || item.note || "Đóng tiền mục tiêu",
          amount: amount, 
          color: catColor, 
          icon: 'Landmark',
          iconBg: `bg-[${catColor}20]`, 
          iconColor: `text-[${catColor}]`
        });
      }
    });

    rawSavings.forEach(sv => {
      const svDate = parseSafeDate(sv.date || sv.created_at || sv.transaction_date);
      
      // Xử lý thông minh: Nhận diện cả số nguyên, số thập phân DB và chuỗi định dạng
      let rawAmtStr = String(sv.amount || '0').trim();
      if (rawAmtStr.includes('.')) {
          const parts = rawAmtStr.split('.');
          if (parts[parts.length - 1] === '00') {
              rawAmtStr = parts[0]; // Bỏ phần thập phân .00 nếu là dữ liệu SQL
          }
      }
      const amount = parseInt(rawAmtStr.replace(/\D/g, ''), 10) || 0;
      
      if (isNaN(svDate.getTime()) || amount === 0) return;

      for (let i = 0; i < weekOptions.length; i++) {
        if (svDate >= weekOptions[i].startObj && svDate <= weekOptions[i].endObj) {
          if (sv.type === 'withdraw' || sv.desc?.toLowerCase().includes('rút')) {
            wData[i].saving -= amount; 
          } else {
            wData[i].saving += amount;
          }
          break;
        }
      }
    });

    expenses.forEach(e => {
      const weekIndex = parseInt(e.weekId.replace('w', '')) - 1; 
      if (weekIndex === 0) {
        e.compare = "Không đổi"; e.compareColor = "text-[#737784]"; e.compareIcon = null;
      } else {
        const prevWeekId = `w${weekIndex}`;
        const prevAmount = catWeeklyTotals[e.catId]?.[prevWeekId] || 0;
        const currentAmount = catWeeklyTotals[e.catId]?.[e.weekId] || 0;
        
        if (prevAmount === 0) {
          e.compare = "+100%"; e.compareColor = "text-[#BA1A1A]"; e.compareIcon = "↗";
        } else {
          const diff = ((currentAmount - prevAmount) / prevAmount) * 100;
          if (diff === 0) {
            e.compare = "Không đổi"; e.compareColor = "text-[#737784]"; e.compareIcon = null;
          } else if (diff > 0) {
            e.compare = `+${diff.toFixed(0)}%`; e.compareColor = "text-[#BA1A1A]"; e.compareIcon = "↗";
          } else {
            e.compare = `${diff.toFixed(0)}%`; e.compareColor = "text-[#16A34A]"; e.compareIcon = "↘";
          }
        }
      }
    });

    return { weeklyData: wData, rawExpenses: expenses, rawIncomes: incomes };
  }, [rawTransactions, rawSavings, weekOptions, filterCategories, rawTargets]);

  const fmt = (n) => (Number(n) || 0).toLocaleString("vi-VN").replace(/,/g, ".") + " VNĐ";

  const summaryData = useMemo(() => {
    let thu = 0, chi = 0, cycleSaved = 0;
    if (timeFilter === 'all') {
      weeklyData.forEach(w => { thu += w.thu; chi += w.chi; cycleSaved += w.saving; });
    } else {
      const week = weeklyData.find(w => w.id === timeFilter);
      if (week) { thu = week.thu; chi = week.chi; cycleSaved = week.saving; }
    }
    const rate = thu > 0 ? Math.floor((cycleSaved / thu) * 100) : 0;
    return { thu, chi, cycleSaved, rate };
  }, [timeFilter, weeklyData]);

  const isNegativeSaving = summaryData.cycleSaved < 0;

  const { donutExpense, donutIncome } = useMemo(() => {
    const filteredExps = timeFilter === 'all' ? rawExpenses : rawExpenses.filter(e => e.weekId === timeFilter);
    const groupedExps = {};
    let totalChi = 0;

    filteredExps.forEach(e => {
      if (!groupedExps[e.catId]) groupedExps[e.catId] = { name: e.category, amount: 0, color: e.color };
      groupedExps[e.catId].amount += e.amount;
      totalChi += e.amount;
    });

    const expCategories = Object.values(groupedExps).map(cat => ({
      ...cat, pct: totalChi > 0 ? Math.round((cat.amount / totalChi) * 100) : 0
    })).sort((a,b) => b.amount - a.amount);

    const filteredIncs = timeFilter === 'all' ? rawIncomes : rawIncomes.filter(e => e.weekId === timeFilter);
    const groupedIncs = {};
    let totalThu = 0;

    filteredIncs.forEach(e => {
      if (!groupedIncs[e.catId]) groupedIncs[e.catId] = { name: e.category, amount: 0, color: e.color };
      groupedIncs[e.catId].amount += e.amount;
      totalThu += e.amount;
    });

    const incCategories = Object.values(groupedIncs).map(cat => ({
      ...cat, pct: totalThu > 0 ? Math.round((cat.amount / totalThu) * 100) : 0
    })).sort((a,b) => b.amount - a.amount);

    return { 
      donutExpense: { categories: expCategories, total: totalChi }, 
      donutIncome: { categories: incCategories, total: totalThu } 
    };
  }, [timeFilter, rawExpenses, rawIncomes]);

  const tableData = useMemo(() => {
    let combined = [
      ...rawExpenses.map(e => ({ ...e, isIncome: false })), 
      ...rawIncomes.map(e => ({ ...e, isIncome: true }))
    ];
    
    let filtered = combined;
    if (timeFilter !== 'all') filtered = filtered.filter(e => e.weekId === timeFilter);
    if (catFilter !== 'all') filtered = filtered.filter(e => e.catId === catFilter);

    const totalExp = filtered.filter(e => !e.isIncome).reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const totalInc = filtered.filter(e => e.isIncome).reduce((sum, e) => sum + Math.abs(e.amount), 0);
    
    let result = filtered.map(e => {
      const targetTotal = e.isIncome ? totalInc : totalExp;
      
      return {
        ...e, 
        pctDisplay: targetTotal > 0 ? ((Math.abs(e.amount) / targetTotal) * 100).toFixed(1) + '%' : '0%'
      };
    });

    const parseCompare = (val) => val === "Không đổi" ? 0 : parseFloat(String(val).replace('%', '').replace('+', '')) || 0;
    switch (sortType) {
      case 'amount_desc': return result.sort((a, b) => b.amount - a.amount);
      case 'amount_asc': return result.sort((a, b) => a.amount - b.amount);
      case 'change_desc': return result.sort((a, b) => parseCompare(b.compare) - parseCompare(a.compare));
      case 'change_asc': return result.sort((a, b) => parseCompare(a.compare) - parseCompare(b.compare));
      default: return result;
    }
  }, [timeFilter, catFilter, sortType, rawExpenses, rawIncomes]);

  const handleChartClick = (e, content) => {
    e.stopPropagation();
    setTooltip({ show: true, x: e.clientX, y: e.clientY, content });
  };

  const DonutChart = ({ data, label }) => {
    const size = 192;
    const r = 80;
    const c = 2 * Math.PI * r;
    let offset = 0;
    
    return (
      <div className="relative flex items-center justify-center shrink-0 mx-auto lg:mx-0" style={{ width: size, height: size }}>
        {data.total === 0 ? (
          <div className="w-full h-full rounded-full border-[16px] border-[#F5F3F4] flex items-center justify-center">
            <span className="font-sans text-[12px] text-[#737784] italic">Trống</span>
          </div>
        ) : (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
            {data.categories.map((cat, i) => {
              const len = (cat.pct / 100) * c;
              const el = (
                <circle
                  key={i} cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke={cat.color} strokeWidth={16}
                  strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} strokeLinecap="round"
                  className="cursor-pointer transition-opacity duration-200 hover:opacity-70"
                  onClick={(e) => handleChartClick(e, (
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: cat.color }}>{cat.name}</span>
                      <span className="font-sans text-[16px] font-bold text-[#1B1C1D]">{fmt(cat.amount)}</span>
                      <span className="font-sans text-[12px] text-[#434653]">Chiếm {cat.pct}% {label.toLowerCase()}</span>
                    </div>
                  ))}
                />
              );
              offset += len;
              return el;
            })}
          </svg>
        )}
        <div className="absolute text-center pointer-events-none">
          <p className={`font-serif text-[20px] lg:text-[24px] font-bold m-0 ${label === 'Tổng thu' ? 'text-[#16A34A]' : 'text-[#1B1C1D]'}`}>{fmt(data.total)}</p>
          <p className="font-sans text-[10px] lg:text-[12px] text-[#434653] uppercase tracking-[0.5px]">{label}</p>
        </div>
      </div>
    );
  };

  if (isLoading || weekOptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-transparent gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#094CB2]"></div>
        <p className="font-sans text-[14px] text-[#737784]">Đang tổng hợp báo cáo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-4 lg:px-8 lg:py-8 gap-4 lg:gap-8 w-full min-h-screen relative animate-fade-in mx-auto">
      <div className="fixed top-4 right-4 lg:top-8 lg:right-8 z-[60] flex flex-col gap-2">
        {globalError && (
          <div className="bg-[#FEF2F2] border border-[#F87171] text-[#991B1B] px-4 py-3 rounded-lg flex justify-between items-center shadow-md animate-fade-in min-w-[280px] lg:min-w-[300px]">
            <span className="font-sans text-sm font-medium pr-4">{globalError}</span>
            <button onClick={() => setGlobalError(null)} className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -mr-3"><X size={16} /></button>
          </div>
        )}
        {globalSuccess && (
          <div className="bg-[#F0FDF4] border border-[#4ADE80] text-[#166534] px-4 py-3 rounded-lg flex justify-between items-center shadow-md animate-fade-in min-w-[280px] lg:min-w-[300px]">
            <span className="font-sans text-sm font-medium pr-4">{globalSuccess}</span>
            <button onClick={() => setGlobalSuccess(null)} className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -mr-3"><X size={16} /></button>
          </div>
        )}
      </div>

      {tooltip.show && (
        <div onClick={(e) => e.stopPropagation()} className="fixed z-[60] px-4 py-3 bg-white border border-[#E3E2E3] rounded-xl shadow-lg transform -translate-x-1/2 -translate-y-[120%] animate-fade-in" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.content}
        </div>
      )}

      {/* Thông tin chu kỳ */}
      <div className="w-full max-w-[1152px] flex flex-col gap-2 pt-2">
        <div className="flex items-center gap-2 text-[#434653]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#094CB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="font-sans text-[13px] lg:text-[14px] font-medium">
            Chu kỳ hiện tại: <span className="text-[#094CB2] font-bold">
              {weekOptions[0]?.range?.substring(0,5) || '...'} - {weekOptions[3]?.range?.slice(-5) || '...'}
            </span>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="w-full max-w-[1152px] flex flex-col lg:flex-row items-start lg:items-center p-4 gap-4 bg-white border border-[#E3E2E3]/50 rounded-2xl shadow-[0px_4px_24px_rgba(27,28,29,0.04)] relative z-20">
        
        <div className="flex justify-between items-center w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M0 1h18M4 6h10M7 11h4" stroke="#434653" strokeWidth="2" strokeLinecap="round" /></svg>
            <span className="font-sans text-[14px] font-semibold text-[#1B1C1D]">Bộ lọc:</span>
          </div>

          <div className="flex lg:hidden items-center gap-3">
            <button onClick={() => { setTimeFilter('all'); setCatFilter('all'); setSortType('default'); }} className={`font-sans text-[12px] font-medium transition-all duration-300 cursor-pointer ${(timeFilter !== 'all' || catFilter !== 'all' || sortType !== 'default') ? 'text-[#BA1A1A] underline' : 'hidden'}`}>
              Xóa lọc
            </button>
            <button onClick={() => navigate('/reports/preview')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFEDEE] rounded-lg font-sans text-[12px] font-bold text-[#094CB2] hover:bg-gray-200 transition-colors cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><rect x="2" y="2" width="11" height="11" rx="1" stroke="#094CB2" strokeWidth="1.5" /><path d="M5 7h5M7 5v4" stroke="#094CB2" strokeWidth="1.5" strokeLinecap="round" /></svg>
              Xuất PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:flex lg:flex-row gap-3 w-full lg:w-auto flex-1 lg:ml-2">
          {/* Filter: Thời gian */}
          <div className="relative w-full">
            <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'time' ? null : 'time'); }} className={`w-full justify-between lg:justify-start px-3 py-2.5 font-sans text-[12px] sm:text-[13px] rounded-lg cursor-pointer transition-colors flex items-center gap-2 min-h-[44px] ${timeFilter !== 'all' ? 'bg-[#094CB2]/10 text-[#094CB2] font-bold' : 'bg-[#EFEDEE] text-[#434653] hover:bg-gray-200'}`}>
              <span className="truncate">{timeFilter === 'all' ? 'Toàn thời gian' : weekOptions.find(w => w.id === timeFilter)?.name || 'Đã chọn'}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`shrink-0 transition-transform ${activeDropdown === 'time' ? 'rotate-180' : ''}`}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {activeDropdown === 'time' && (
              <div className="absolute top-full left-0 mt-2 w-max min-w-[240px] lg:w-56 bg-white border border-[#E3E2E3]/50 shadow-lg rounded-xl overflow-hidden py-2 z-30 animate-fade-in">
                <button onClick={() => {setTimeFilter('all'); setActiveDropdown(null);}} className={`w-full text-left px-4 py-3 lg:py-2.5 font-sans text-[14px] whitespace-nowrap hover:bg-gray-50 transition-colors ${timeFilter === 'all' ? 'text-[#094CB2] font-bold bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}>Tất cả thời gian</button>
                {weekOptions.map(wk => (
                  <button key={wk.id} onClick={() => {setTimeFilter(wk.id); setActiveDropdown(null);}} className={`w-full text-left px-4 py-3 lg:py-2.5 font-sans text-[14px] hover:bg-gray-50 transition-colors flex justify-between items-center gap-4 ${timeFilter === wk.id ? 'text-[#094CB2] font-bold bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}>
                    <span className="whitespace-nowrap">{wk.name}</span><span className="text-[12px] text-[#737784] font-normal whitespace-nowrap">{wk.range}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter: Danh mục */}
          <div className="relative w-full">
            <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'cat' ? null : 'cat'); }} className={`w-full justify-between lg:justify-start px-3 py-2.5 font-sans text-[12px] sm:text-[13px] rounded-lg cursor-pointer transition-colors flex items-center gap-2 min-h-[44px] ${catFilter !== 'all' ? 'bg-[#094CB2]/10 text-[#094CB2] font-bold' : 'bg-[#EFEDEE] text-[#434653] hover:bg-gray-200'}`}>
              <span className="truncate">{catFilter === 'all' ? 'Tất cả danh mục' : filterCategories.find(c => c.id === catFilter)?.name || 'Đã chọn'}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`shrink-0 transition-transform ${activeDropdown === 'cat' ? 'rotate-180' : ''}`}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {activeDropdown === 'cat' && (
              <div className="absolute top-full right-0 lg:left-0 mt-2 w-max min-w-[200px] lg:w-48 max-h-[300px] overflow-y-auto bg-white border border-[#E3E2E3]/50 shadow-lg rounded-xl py-2 z-30 animate-fade-in custom-scrollbar">
                <button onClick={() => {setCatFilter('all'); setActiveDropdown(null);}} className={`w-full text-left px-4 py-3 lg:py-2.5 font-sans text-[14px] whitespace-nowrap hover:bg-gray-50 transition-colors ${catFilter === 'all' ? 'text-[#094CB2] font-bold bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}>Tất cả danh mục</button>
                {filterCategories.map(cat => (
                  <button key={cat.id} onClick={() => {setCatFilter(cat.id); setActiveDropdown(null);}} className={`w-full text-left px-4 py-3 lg:py-2.5 font-sans text-[14px] hover:bg-gray-50 transition-colors flex items-center gap-3 ${catFilter === cat.id ? 'text-[#094CB2] font-bold bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span><span className="whitespace-nowrap">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-end w-full lg:w-auto gap-4">
          <button onClick={() => { setTimeFilter('all'); setCatFilter('all'); setSortType('default'); }} className={`font-sans text-[14px] min-h-[44px] font-medium transition-all duration-300 cursor-pointer ${(timeFilter !== 'all' || catFilter !== 'all' || sortType !== 'default') ? 'text-[#BA1A1A] hover:underline opacity-100' : 'opacity-0 pointer-events-none w-0 overflow-hidden'}`}>Xóa bộ lọc</button>
          <button onClick={() => navigate('/reports/preview')} className="flex items-center gap-2 px-4 py-2 bg-[#EFEDEE] rounded-lg font-sans text-[14px] font-bold text-[#094CB2] hover:bg-gray-200 transition-colors cursor-pointer min-h-[44px]">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="2" width="11" height="11" rx="1" stroke="#094CB2" strokeWidth="1.5" /><path d="M5 7h5M7 5v4" stroke="#094CB2" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Xuất PDF
          </button>
        </div>
      </div>

      {/* Thẻ chúc mừng / Cảnh báo động */}
      <div className={`w-full max-w-[1152px] flex flex-row justify-between items-center p-3 lg:p-6 rounded-2xl border relative overflow-hidden transition-colors duration-300 ${
        isNegativeSaving 
          ? 'bg-gradient-to-r from-[rgba(186,26,26,0.1)] to-[rgba(255,200,200,0.3)] border-[rgba(186,26,26,0.2)]' 
          : 'bg-gradient-to-r from-[rgba(109,94,0,0.2)] to-[rgba(249,227,122,0.4)] border-[rgba(109,94,0,0.1)]'
      }`}>
        <div className="flex items-center gap-3 lg:gap-4 relative z-10">
          <div className="w-9 h-9 lg:w-12 lg:h-12 flex items-center justify-center bg-white rounded-xl shadow-sm shrink-0">
            <span className="text-lg lg:text-2xl">{isNegativeSaving ? '⚠️' : '🎉'}</span>
          </div>
          <div className="flex flex-col gap-0.5 lg:gap-1">
            <h3 className={`font-sans font-bold text-[14px] sm:text-[15px] lg:text-[18px] m-0 ${isNegativeSaving ? 'text-[#BA1A1A]' : 'text-[#4A3F00]'}`}>
              {isNegativeSaving ? 'Chú ý mức tiết kiệm!' : 'Chúc mừng!'}
            </h3>
            <p className={`font-sans text-[11.5px] sm:text-[12px] lg:text-[14px] m-0 leading-tight ${isNegativeSaving ? 'text-[#BA1A1A]/90' : 'text-[#4A3F00]/80'}`}>
              {isNegativeSaving 
                ? (timeFilter === 'all' ? 'Bạn đang rút từ ví tiết kiệm nhiều hơn số tiền nạp vào trong toàn chu kỳ.' : `Bạn đang bị thâm hụt quỹ tiết kiệm trong ${weekOptions.find(w => w.id === timeFilter)?.name || ''}.`)
                : (timeFilter === 'all' ? 'Tỷ lệ tiết kiệm chu kỳ này' : `Tỷ lệ tiết kiệm ${weekOptions.find(w => w.id === timeFilter)?.name || ''}`) + ` của bạn đạt `
              }
              {!isNegativeSaving && <strong>{summaryData.rate}%</strong>}
            </p>
          </div>
        </div>
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/40 rounded-full blur-2xl z-0" />
      </div>

      {/* Summary Stats Grid */}
      <div className="w-full max-w-[1152px] flex flex-col lg:flex-row gap-4 lg:gap-6 mt-4 lg:mt-0">
        <div className={`flex-1 flex flex-row lg:flex-col justify-start items-center lg:items-start p-4 lg:p-6 gap-4 border rounded-2xl shadow-[0px_4px_24px_rgba(27,28,29,0.04)] relative overflow-hidden transition-all w-full ${
          isNegativeSaving 
            ? 'bg-[rgba(186,26,26,0.05)] border-[rgba(186,26,26,0.2)]' 
            : 'bg-[rgba(109,94,0,0.05)] border-[rgba(109,94,0,0.2)]'
        }`}>
          <div className={`absolute w-24 h-24 rounded-full blur-xl -right-4 -top-4 ${isNegativeSaving ? 'bg-[rgba(186,26,26,0.1)]' : 'bg-[rgba(109,94,0,0.1)]'}`} />
          <div className={`w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center rounded-xl shrink-0 relative z-10 ${isNegativeSaving ? 'bg-[rgba(186,26,26,0.1)]' : 'bg-[rgba(109,94,0,0.2)]'}`}>
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none"><path d="M6 1l3 3H3z" fill={isNegativeSaving ? '#BA1A1A' : '#6D5E00'} /></svg>
          </div>
          <div className="flex flex-col items-start lg:w-full relative z-10 flex-1">
            <span className={`font-sans text-[11px] lg:text-[14px] font-medium uppercase lg:capitalize mb-0.5 ${isNegativeSaving ? 'text-[#BA1A1A]' : 'text-[#4A3F00]'}`}>
              {timeFilter === 'all' ? 'Biến động tiết kiệm' : `Biến động ${weekOptions.find(w => w.id === timeFilter)?.name || ''}`}
            </span>
            <p className={`font-serif text-[18px] lg:text-[30px] font-bold m-0 leading-tight ${isNegativeSaving ? 'text-[#BA1A1A]' : 'text-[#4A3F00]'}`}>
              {isNegativeSaving ? '-' : ''}{fmt(Math.abs(summaryData.cycleSaved))}
            </p>
            <div className="flex items-center gap-1 mt-1 lg:mt-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <circle cx="6" cy="6" r="5.5" stroke={isNegativeSaving ? '#BA1A1A' : '#6D5E00'} strokeWidth="1" />
                <path d={isNegativeSaving ? "M4 4l4 4M8 4l-4 4" : "M4 6l1.5 1.5L8 4.5"} stroke={isNegativeSaving ? '#BA1A1A' : '#6D5E00'} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={`font-sans text-[11px] lg:text-[12px] font-medium ${isNegativeSaving ? 'text-[#BA1A1A]' : 'text-[#6D5E00]'}`}>
                {isNegativeSaving 
                  ? 'Đang thâm hụt so với gốc' 
                  : (summaryData.rate >= 100 ? 'Đạt 100% mục tiêu' : `Đạt ${summaryData.rate}% tỷ lệ`)
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="w-full max-w-[1152px] flex flex-col lg:flex-row gap-4 lg:gap-6 mt-4 lg:mt-6">
        
        {/* Donut Chart - TỔNG CHI */}
        <div className="w-full flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-white border border-[#E3E2E3]/50 rounded-2xl shadow-[0px_4px_24px_rgba(27,28,29,0.04)]">
          <h3 className="font-serif text-[18px] lg:text-[20px] font-bold text-[#1B1C1D] m-0">Cơ cấu chi tiêu</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-8">
            <DonutChart data={donutExpense} label="Tổng chi" />
            <div className="flex flex-col gap-3 lg:gap-4 max-h-[192px] overflow-y-auto pr-2 custom-scrollbar w-full mt-2 sm:mt-0">
              {donutExpense.categories.length === 0 ? (
                 <span className="font-sans text-[13px] italic text-[#737784] text-center sm:text-left">Chưa có chi tiêu nào</span>
              ) : (
                donutExpense.categories.map((cat) => (
                  <div key={cat.name} className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-sans text-[13px] lg:text-[14px] font-medium text-[#1B1C1D] w-[80px] lg:w-[60px] truncate" title={cat.name}>{cat.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-sans text-[13px] lg:text-[14px] font-bold text-[#1B1C1D]">{fmt(cat.amount)}</span>
                      <span className="font-sans text-[11px] text-[#434653]">{cat.pct}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Donut Chart - TỔNG THU */}
        <div className="w-full flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 bg-white border border-[#E3E2E3]/50 rounded-2xl shadow-[0px_4px_24px_rgba(27,28,29,0.04)]">
          <h3 className="font-serif text-[18px] lg:text-[20px] font-bold text-[#1B1C1D] m-0">Cơ cấu thu nhập</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-8">
            <DonutChart data={donutIncome} label="Tổng thu" />
            <div className="flex flex-col gap-3 lg:gap-4 max-h-[192px] overflow-y-auto pr-2 custom-scrollbar w-full mt-2 sm:mt-0">
              {donutIncome.categories.length === 0 ? (
                 <span className="font-sans text-[13px] italic text-[#737784] text-center sm:text-left">Chưa có thu nhập nào</span>
              ) : (
                donutIncome.categories.map((cat) => (
                  <div key={cat.name} className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-sans text-[13px] lg:text-[14px] font-medium text-[#1B1C1D] w-[80px] lg:w-[60px] truncate" title={cat.name}>{cat.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-sans text-[13px] lg:text-[14px] font-bold text-[#16A34A]">{fmt(cat.amount)}</span>
                      <span className="font-sans text-[11px] text-[#434653]">{cat.pct}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
      
      {/* Data Table -> List Card on Mobile */}
      <div className="w-full max-w-[1152px] flex flex-col p-4 lg:p-6 bg-white border border-[#E3E2E3]/50 rounded-2xl shadow-[0px_4px_24px_rgba(27,28,29,0.04)] relative z-10">
        <div className="flex justify-between items-center w-full mb-4 lg:mb-6">
          <h3 className="font-serif text-[18px] lg:text-[20px] font-bold text-[#1B1C1D] m-0">Danh mục chi tiết</h3>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'sort' ? null : 'sort'); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 hover:bg-gray-200 rounded-lg font-sans text-[12px] lg:text-[14px] min-h-[36px] lg:min-h-[40px] font-medium transition-colors cursor-pointer ${sortType !== 'default' ? 'text-[#094CB2] bg-[#094CB2]/10' : 'text-[#434653] bg-[#EFEDEE]'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
              Sắp xếp
            </button>
            {activeDropdown === 'sort' && (
              <div className="absolute right-0 top-full mt-1 w-[170px] lg:w-56 bg-white border border-[#E3E2E3]/50 shadow-[0_8px_24px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden z-[100] py-1 lg:py-2 animate-fade-in origin-top-right">
                <button onClick={() => {setSortType('default'); setActiveDropdown(null);}} className={`w-full text-left px-3 lg:px-4 py-2.5 lg:py-3 font-sans text-[12px] lg:text-[14px] hover:bg-gray-50 transition-colors ${sortType === 'default' ? 'font-bold text-[#094CB2] bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}>Mặc định</button>
                <div className="h-px bg-gray-100 my-0.5 mx-2"></div>
                <button onClick={() => {setSortType('amount_desc'); setActiveDropdown(null);}} className={`w-full text-left px-3 lg:px-4 py-2.5 lg:py-3 font-sans text-[12px] lg:text-[14px] hover:bg-gray-50 transition-colors ${sortType === 'amount_desc' ? 'font-bold text-[#094CB2] bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}>Số tiền: Cao đến thấp</button>
                <button onClick={() => {setSortType('amount_asc'); setActiveDropdown(null);}} className={`w-full text-left px-3 lg:px-4 py-2.5 lg:py-3 font-sans text-[12px] lg:text-[14px] hover:bg-gray-50 transition-colors ${sortType === 'amount_asc' ? 'font-bold text-[#094CB2] bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}>Số tiền: Thấp đến cao</button>
                <div className="h-px bg-gray-100 my-0.5 mx-2"></div>
                <button onClick={() => {setSortType('change_desc'); setActiveDropdown(null);}} className={`w-full text-left px-3 lg:px-4 py-2.5 lg:py-3 font-sans text-[12px] lg:text-[14px] hover:bg-gray-50 transition-colors ${sortType === 'change_desc' ? 'font-bold text-[#094CB2] bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}>Đổi: Tăng nhiều nhất</button>
                <button onClick={() => {setSortType('change_asc'); setActiveDropdown(null);}} className={`w-full text-left px-3 lg:px-4 py-2.5 lg:py-3 font-sans text-[12px] lg:text-[14px] hover:bg-gray-50 transition-colors ${sortType === 'change_asc' ? 'font-bold text-[#094CB2] bg-[#094CB2]/5' : 'text-[#1B1C1D]'}`}>Đổi: Giảm nhiều nhất</button>
              </div>
            )}
          </div>
        </div>

        {/* Header của bảng chỉ hiện trên Desktop */}
        <div className="hidden lg:flex justify-between items-center border-b border-[#E3E2E3]/50 pb-3 px-2">
          <span className="font-sans font-semibold text-[11px] text-[#737784] uppercase tracking-[0.8px] w-[45%]">Danh mục / Chi tiết</span>
          <span className="font-sans font-semibold text-[11px] text-[#737784] uppercase tracking-[0.8px] w-[15%] text-right">Số tiền</span>
          <span className="font-sans font-semibold text-[11px] text-[#737784] uppercase tracking-[0.8px] w-[12%] text-right">Tỷ lệ</span>
          <span className="font-sans font-semibold text-[11px] text-[#737784] uppercase tracking-[0.8px] w-[20%] text-right">So với kỳ trước</span>
        </div>

        <div className="max-h-[500px] lg:max-h-[400px] overflow-y-auto lg:pr-2 custom-scrollbar">
          {tableData.length > 0 ? (
            tableData.map((row) => (
              <div key={row.id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-[#E3E2E3]/30 py-4 px-1 lg:px-2 hover:bg-gray-50/50 transition-colors duration-200 gap-3 lg:gap-0">
                <div className="flex justify-between items-start w-full lg:w-[45%]">
                  <div className="flex items-center gap-3">
                    
                    {/* Phần Icon đã được sửa để hiển thị đúng biểu tượng */}
                    {(() => {
                      const IconComp = getIconComponent(row.icon);
                      return (
                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0`} style={{ backgroundColor: `${row.color}20` }}>
                          <IconComp size={20} style={{ color: row.color }} />
                        </div>
                      );
                    })()}

                    <div className="flex flex-col gap-0.5">
                      <p className="font-sans text-[14px] font-semibold text-[#1B1C1D] m-0">{row.category}</p>
                      <p className="font-sans text-[12px] text-[#434653] m-0 truncate max-w-[180px] lg:max-w-[200px]">{row.detail}</p>
                    </div>
                  </div>
                  {/* Số tiền trên Mobile */}
                  <span className={`font-sans text-[14px] font-bold block lg:hidden ${row.isIncome ? 'text-[#16A34A]' : 'text-[#1B1C1D]'}`}>{fmt(row.amount)}</span>
                </div>
                
                {/* Số tiền trên Desktop */}
                <span className={`hidden lg:block font-sans text-[14px] font-bold w-[15%] text-right ${row.isIncome ? 'text-[#16A34A]' : 'text-[#1B1C1D]'}`}>{fmt(row.amount)}</span>
                
                {/* Khu vực Tỷ lệ & So sánh */}
                <div className="flex flex-row lg:w-[32%] w-full justify-between lg:justify-end items-center gap-4 lg:gap-0">
                  <div className="lg:w-[37.5%] flex justify-start lg:justify-end">
                    <span className="font-sans text-[11px] lg:text-[12px] font-medium px-2 py-1 bg-[#EFEDEE] rounded-md text-[#1B1C1D]">
                      <span className="lg:hidden text-[#737784] font-normal mr-1">Tỷ lệ:</span>
                      {row.pctDisplay}
                    </span>
                  </div>
                  <span className={`font-sans text-[12px] lg:text-[13px] font-medium flex items-center gap-1 lg:w-[62.5%] justify-end ${row.compareColor}`}>
                    {row.compareIcon && <span>{row.compareIcon}</span>}
                    {row.compare}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center w-full"><span className="font-sans text-[14px] text-[#434653] italic">Không có giao dịch nào phù hợp với bộ lọc.</span></div>
          )}
        </div>
      </div>

      {/* Nút reset */}
      <div className="flex flex-col items-center py-6 lg:py-12 gap-4 lg:gap-6 w-full max-w-[672px]">
        <p className="font-sans text-[14px] lg:text-[16px] text-center text-[#434653] leading-relaxed m-0 px-4">
          Bạn đã làm rất tốt! Hãy tiếp tục duy trì thói quen quản lý tài chính này nhé.
        </p>
        <button onClick={handleResetCycle} disabled={isResetting} className={`flex items-center justify-center gap-3 w-full sm:w-auto px-6 lg:px-8 py-3.5 lg:py-4 rounded-xl shadow-[0px_8px_16px_rgba(9,76,178,0.2)] transition-all group cursor-pointer ${isResetting ? 'bg-gray-400' : 'bg-[#094CB2] hover:bg-blue-800 lg:hover:-translate-y-1'}`}>
          <span className={`text-xl ${!isResetting && 'lg:group-hover:animate-bounce'}`}>🚀</span>
          <span className="font-sans text-[14px] lg:text-[16px] font-bold text-white uppercase tracking-[0.5px]">
            {isResetting ? 'Đang thiết lập lại...' : 'Bắt đầu chu kỳ mới'}
          </span>
        </button>
      </div>

    </div>
  );
};

export default Reports;