import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Plus, Minus, TrendingUp, TrendingDown, Wallet, 
  Target, Sparkles, Check, Flame, PlusCircle, ArrowUpRight, 
  ArrowDownLeft, HelpCircle, RefreshCw, Star,
  ArrowLeft, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, Activity, Calendar, Building2, Tag, ChevronDown
} from 'lucide-react';
import { UserProfile, Transaction } from '../types';
import { CATEGORY_COLORS, FUN_QUOTES } from '../constants';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart, 
  Line, 
  Legend, 
  AreaChart, 
  Area,
  LabelList
} from 'recharts';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'INR (₹)' },
  { code: 'USD', symbol: '$', name: 'USD ($)' },
  { code: 'EUR', symbol: '€', name: 'EUR (€)' },
  { code: 'GBP', symbol: '£', name: 'GBP (£)' },
  { code: 'JPY', symbol: '¥', name: 'JPY (¥)' },
  { code: 'CAD', symbol: 'C$', name: 'CAD (C$)' }
];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface FormattedTx extends Transaction {
  txDate: number;
  txMonth: number;
  txYear: number;
}

function getFormattedTx(tx: Transaction): FormattedTx {
  let d = tx.date;
  let m = tx.month;
  let y = tx.year;

  if (!d || !m || !y) {
    if (tx.id === 'tx-1') {
      d = 20; m = 5; y = 2026;
    } else if (tx.id === 'tx-2') {
      d = 19; m = 5; y = 2026;
    } else if (tx.id === 'tx-3') {
      d = 18; m = 5; y = 2026;
    } else if (tx.id === 'tx-4') {
      d = 17; m = 5; y = 2026;
    } else if (tx.id === 'tx-5') {
      d = 16; m = 5; y = 2026;
    } else {
      const now = new Date();
      d = now.getDate();
      m = now.getMonth() + 1;
      y = now.getFullYear();
    }
  }

  return {
    ...tx,
    txDate: d,
    txMonth: m,
    txYear: y
  };
}

function getCurrencySymbol(code?: string): string {
  const match = CURRENCIES.find(c => c.code === (code || 'INR'));
  return match ? match.symbol : '₹';
}

interface DashboardProps {
  profile: UserProfile;
  transactions: Transaction[];
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onUpdateTransactions: (updatedTxs: Transaction[]) => void;
  onLogout: () => void;
  viewMode: 'normal' | 'charts';
  onViewModeChange: (mode: 'normal' | 'charts') => void;
  onNavigateToPage: (page: 'login' | 'link-banks' | 'dashboard' | 'charts') => void;
}

export default function Dashboard({
  profile,
  transactions,
  onUpdateProfile,
  onUpdateTransactions,
  onLogout,
  viewMode,
  onViewModeChange,
  onNavigateToPage
}: DashboardProps) {
  const symbol = getCurrencySymbol(profile.currencyCode);

  // Derived/fallback bank accounts
  const bankAccounts = profile.banks && profile.banks.length > 0
    ? profile.banks
    : [
        { name: 'ICICI', startingBalance: 0 },
        { name: 'HDFC', startingBalance: 0 }
      ];

  // Bank states
  const [vaultSelectedBank, setVaultSelectedBank] = useState<string>('all');
  const [ledgerSelectedBank, setLedgerSelectedBank] = useState<string>('all');
  const [expenseBank, setExpenseBank] = useState<string>(bankAccounts[0]?.name || 'ICICI');
  const [inflowBank, setInflowBank] = useState<string>(bankAccounts[0]?.name || 'ICICI');

  // Addition of dynamic bank account states
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankStartingBalance, setNewBankStartingBalance] = useState('');

  // Simplified Side-by-Side Expense tracker states
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('food');
  const [customReasonInput, setCustomReasonInput] = useState('');
  
  // Ledger filter states
  const [filterMode, setFilterMode] = useState<'day' | 'month' | 'year'>('day');
  const [selectedDayStr, setSelectedDayStr] = useState<string>('all');
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>('all');
  const [selectedYearStr, setSelectedYearStr] = useState<string>('all');

  const [reasons, setReasons] = useState<string[]>(() => {
    const stored = localStorage.getItem('chomupaisa_reasons');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return ['food', 'electricity', 'water', 'shopping', 'girlfriend'];
  });

  // Simplified Side-by-Side Inflow tracker states
  const [inflowAmount, setInflowAmount] = useState('');
  const [inflowReason, setInflowReason] = useState('Salary');
  const [customInflowInput, setCustomInflowInput] = useState('');
  const [inflowReasons, setInflowReasons] = useState<string[]>(() => {
    const stored = localStorage.getItem('chomupaisa_inflow_reasons');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return ['Salary', 'Incentive', 'Bonus', 'Refund', 'Investment Return', 'Other'];
  });

  // Savings Goal edit states
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState(profile.savingsGoalName);
  const [newGoalAmount, setNewGoalAmount] = useState(profile.savingsGoal.toString());

  const [confirmWipe, setConfirmWipe] = useState(false);

  const handleWipeLedger = () => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }
    
    // Clear transactions
    onUpdateTransactions([]);
    
    // Reset bank balances
    const resetBanks = bankAccounts.map(b => ({ ...b, startingBalance: 0 }));
    onUpdateProfile({
      ...profile,
      balance: 0,
      banks: resetBanks,
      experiencePoints: 0
    });
    
    setConfirmWipe(false);
  };

  // Interactive Analytics & Charts state declarations
  const [chartType, setChartType] = useState<'pie' | 'donut' | 'bar' | 'line' | 'wordart' | 'table'>('pie');
  const [analyticsDuration, setAnalyticsDuration] = useState<'day' | 'month' | 'year'>('month');
  const [analyticsSelectedBank, setAnalyticsSelectedBank] = useState<string>('all');
  const [analyticsType, setAnalyticsType] = useState<'expense' | 'inflow' | 'combined'>('expense');
  const [chartSelectedDay, setChartSelectedDay] = useState<string>('all');
  const [chartSelectedMonth, setChartSelectedMonth] = useState<string>('all');
  const [chartSelectedYear, setChartSelectedYear] = useState<string>('all');
  const [breakdownView, setBreakdownView] = useState<'reason' | 'category'>('reason');
  const [barGroupBy, setBarGroupBy] = useState<'category' | 'time' | 'bank' | 'reason'>('reason');
  const [specialSelectedBank, setSpecialSelectedBank] = useState<string>('all');
  const [specialChartOption, setSpecialChartOption] = useState<'top5' | 'basics_vs_bullshits'>('top5');
  const [hoveredSection, setHoveredSection] = useState<'basics' | 'bullshits' | null>(null);

  // Random quotes
  const [randomQuote, setRandomQuote] = useState(FUN_QUOTES[0]);

  const handleCycleQuote = () => {
    const currentIndex = FUN_QUOTES.indexOf(randomQuote);
    let nextIndex = Math.floor(Math.random() * FUN_QUOTES.length);
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * FUN_QUOTES.length);
    }
    setRandomQuote(FUN_QUOTES[nextIndex]);
  };

  const handleAddReasonOption = () => {
    const cleaned = customReasonInput.trim().toLowerCase();
    if (!cleaned) return;
    if (reasons.includes(cleaned)) {
      setExpenseReason(cleaned);
      setCustomReasonInput('');
      return;
    }
    const updated = [...reasons, cleaned];
    setReasons(updated);
    setExpenseReason(cleaned);
    setCustomReasonInput('');
    localStorage.setItem('chomupaisa_reasons', JSON.stringify(updated));
  };

  // Dynamically calculate bank balance based on starting balance and transaction logs
  const getBankBalance = (bankName: string) => {
    const bankInfo = bankAccounts.find(b => b.name === bankName);
    const starting = bankInfo ? bankInfo.startingBalance : 0;
    
    const bankTxs = transactions.filter(t => {
      const txBank = t.bank || bankAccounts[0]?.name || 'ICICI';
      return txBank.toLowerCase() === bankName.toLowerCase();
    });

    const inflows = bankTxs.filter(t => t.type === 'incoming').reduce((sum, t) => sum + t.amount, 0);
    const outflows = bankTxs.filter(t => t.type === 'outgoing').reduce((sum, t) => sum + t.amount, 0);
    
    return starting + inflows - outflows;
  };

  const totalCombinedBalance = bankAccounts.reduce((sum, b) => sum + getBankBalance(b.name), 0);

  // Flow to add user bank accounts dynamically
  const handleAddBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bankNameCleaned = newBankName.trim();
    if (!bankNameCleaned) return;

    // Check if bank already exists
    const exists = bankAccounts.some(b => b.name.toLowerCase() === bankNameCleaned.toLowerCase());
    if (exists) {
      alert(`Bank account "${bankNameCleaned}" already added!`);
      return;
    }

    const startBal = parseFloat(newBankStartingBalance) || 0;
    const updatedBanks = [...bankAccounts, { name: bankNameCleaned, startingBalance: startBal }];
    
    // Total balance matches combined banks balance
    const updatedTotalBalance = totalCombinedBalance + startBal;

    onUpdateProfile({
      ...profile,
      banks: updatedBanks,
      balance: parseFloat(updatedTotalBalance.toFixed(2)),
      experiencePoints: profile.experiencePoints + 25 // bonus XP for adding bank!
    });

    // Reset fields and close form
    setNewBankName('');
    setNewBankStartingBalance('');
    setIsAddingBank(false);

    // Auto select newly created bank
    setExpenseBank(bankNameCleaned);
    setInflowBank(bankNameCleaned);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expenseAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    // Decide category dynamically or assign to 'general' / appropriate one
    let mappedCategory: 'stonks' | 'food' | 'drip' | 'flex' | 'rent' | 'general' = 'general';
    const reasonLower = expenseReason.toLowerCase();
    if (reasonLower.includes('food') || reasonLower.includes('munchies') || reasonLower.includes('boba') || reasonLower.includes('lunch') || reasonLower.includes('dinner')) {
      mappedCategory = 'food';
    } else if (reasonLower.includes('shopping') || reasonLower.includes('drip') || reasonLower.includes('girlfriend') || reasonLower.includes('gift')) {
      mappedCategory = 'drip';
    } else if (reasonLower.includes('rent') || reasonLower.includes('electricity') || reasonLower.includes('water') || reasonLower.includes('tax') || reasonLower.includes('bills')) {
      mappedCategory = 'rent';
    }

    const finalAmount = Math.abs(parsedAmount);

    const slangComments = [
      'Absolute necessary spend fr 💸',
      'Finance level: Super Sane 🧠',
      'Paid the matrix fee 💀',
      'Valid cost, no cap ⚡',
      'Slayed that cost fr 💅',
      'Stretching the bag further'
    ];
    const randomSlang = slangComments[Math.floor(Math.random() * slangComments.length)];

    const now = new Date();
    const dateNum = now.getDate();
    const monthNum = now.getMonth() + 1;
    const yearNum = now.getFullYear();
    const hrs = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const dispHrs = (hrs % 12 || 12).toString().padStart(2, '0');
    const timeStr = `${dispHrs}:${mins} ${ampm}`;
    const timestampStr = `${dateNum} ${MONTH_NAMES[monthNum - 1]} ${yearNum} • ${timeStr}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: `Spent on ${expenseReason}`,
      category: mappedCategory,
      amount: finalAmount,
      type: 'outgoing',
      timestamp: timestampStr,
      slangComment: randomSlang,
      bank: expenseBank,
      date: dateNum,
      month: monthNum,
      year: yearNum
    };

    onUpdateTransactions([newTx, ...transactions]);

    const updatedTotalBalance = totalCombinedBalance - finalAmount;
    onUpdateProfile({
      ...profile,
      balance: parseFloat(updatedTotalBalance.toFixed(2)),
      banks: bankAccounts,
      experiencePoints: profile.experiencePoints + 15
    });

    setExpenseAmount('');
  };

  const handleAddInflowReasonOption = () => {
    const cleaned = customInflowInput.trim();
    if (!cleaned) return;
    const exists = inflowReasons.some(r => r.toLowerCase() === cleaned.toLowerCase());
    if (exists) {
      const matched = inflowReasons.find(r => r.toLowerCase() === cleaned.toLowerCase()) || cleaned;
      setInflowReason(matched);
      setCustomInflowInput('');
      return;
    }
    const updated = [...inflowReasons, cleaned];
    setInflowReasons(updated);
    setInflowReason(cleaned);
    setCustomInflowInput('');
    localStorage.setItem('chomupaisa_inflow_reasons', JSON.stringify(updated));
  };

  const handleInflowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(inflowAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    let mappedCategory: 'stonks' | 'food' | 'drip' | 'flex' | 'rent' | 'general' = 'stonks';
    const reasonLower = inflowReason.toLowerCase();
    if (reasonLower.includes('salary') || reasonLower.includes('bonus') || reasonLower.includes('incentive') || reasonLower.includes('investment') || reasonLower.includes('return') || reasonLower.includes('stonks')) {
      mappedCategory = 'stonks';
    } else {
      mappedCategory = 'general';
    }

    const finalAmount = Math.abs(parsedAmount);

    const slangComments = [
      'Gains secured, king behavior 📈',
      'Stonks are looking up 🚀',
      'Secure the bag, clean hustle 💰',
      'Finance level: Ultra Rich 🧠',
      'Liquid reserves expanded ⚡'
    ];
    const randomSlang = slangComments[Math.floor(Math.random() * slangComments.length)];

    const now = new Date();
    const dateNum = now.getDate();
    const monthNum = now.getMonth() + 1;
    const yearNum = now.getFullYear();
    const hrs = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const dispHrs = (hrs % 12 || 12).toString().padStart(2, '0');
    const timeStr = `${dispHrs}:${mins} ${ampm}`;
    const timestampStr = `${dateNum} ${MONTH_NAMES[monthNum - 1]} ${yearNum} • ${timeStr}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: `Earned from ${inflowReason}`,
      category: mappedCategory,
      amount: finalAmount,
      type: 'incoming',
      timestamp: timestampStr,
      slangComment: randomSlang,
      bank: inflowBank,
      date: dateNum,
      month: monthNum,
      year: yearNum
    };

    onUpdateTransactions([newTx, ...transactions]);

    const updatedTotalBalance = totalCombinedBalance + finalAmount;
    onUpdateProfile({
      ...profile,
      balance: parseFloat(updatedTotalBalance.toFixed(2)),
      banks: bankAccounts,
      experiencePoints: profile.experiencePoints + 15
    });

    setInflowAmount('');
  };



  // Save changes to Saving Goal
  const handleSaveGoal = () => {
    const parsedAmount = parseFloat(newGoalAmount);
    if (!newGoalName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onUpdateProfile({
      ...profile,
      savingsGoalName: newGoalName.trim(),
      savingsGoal: parsedAmount
    });
    setIsEditingGoal(false);
  };

  // Compute stats
  const totalIn = transactions
    .filter(t => t.type === 'incoming')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOut = transactions
    .filter(t => t.type === 'outgoing')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const savingsProgressPercent = Math.min(
    Math.round((profile.balance / profile.savingsGoal) * 100),
    100
  );

  // Process existing transaction dates safely
  const formattedTxs = transactions.map(getFormattedTx);

  // Grouping options
  const uniqueDays = Array.from(new Set(formattedTxs.map(t => `${t.txDate} ${MONTH_NAMES[t.txMonth-1]} ${t.txYear}`)));
  const uniqueMonths = Array.from(new Set(formattedTxs.map(t => `${MONTH_NAMES[t.txMonth-1]} ${t.txYear}`)));
  const uniqueYears = Array.from(new Set(formattedTxs.map(t => `${t.txYear}`)));

  const filteredTransactions = formattedTxs.filter((tx) => {
    // 1. Filter by Bank
    if (ledgerSelectedBank !== 'all') {
      const txBank = tx.bank || bankAccounts[0]?.name || 'ICICI';
      if (txBank.toLowerCase() !== ledgerSelectedBank.toLowerCase()) return false;
    }

    // 2. Filter by Date/Month/Year
    const dayStr = `${tx.txDate} ${MONTH_NAMES[tx.txMonth-1]} ${tx.txYear}`;
    const monthStr = `${MONTH_NAMES[tx.txMonth-1]} ${tx.txYear}`;
    const yearStr = `${tx.txYear}`;

    if (filterMode === 'day') {
      if (selectedDayStr === 'all') return true;
      return dayStr === selectedDayStr;
    } else if (filterMode === 'month') {
      if (selectedMonthStr === 'all') return true;
      return monthStr === selectedMonthStr;
    } else {
      if (selectedYearStr === 'all') return true;
      return yearStr === selectedYearStr;
    }
  });

  // Helper to extract clean reason from title
  const getTransactionLabel = (tx: Transaction): string => {
    if (tx.title.startsWith('Spent on ')) {
      return tx.title.replace('Spent on ', '');
    } else if (tx.title.startsWith('Earned from ')) {
      return tx.title.replace('Earned from ', '');
    }
    return tx.title;
  };

  // Render the Charts and Analytics Section
  const renderChartsPage = () => {
    // Helper to render customized compact stacked labels for Pie/Donut charts on mobile screens
    const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent }: any) => {
      const RADIAN = Math.PI / 180;
      // Smaller radius calculation so it fits beautifully next to our compact donut and pie
      const radius = outerRadius + 8;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      const pct = typeof percent === 'number' ? (percent * 100).toFixed(1) : '0.0';
      const textAnchor = x > cx ? 'start' : 'end';

      return (
        <text
          x={x}
          y={y}
          fill="#000000"
          textAnchor={textAnchor}
          dominantBaseline="central"
          className="select-none"
          style={{ fontFamily: 'JetBrains Mono, sans-serif', fontSize: '8px', fontWeight: '900' }}
        >
          <tspan x={x} dy="-0.5em" className="tracking-tight">{name}</tspan>
          <tspan x={x} dy="1.1em" className="fill-zinc-500 font-bold">{symbol}{value.toLocaleString('en-IN')} ({pct}%)</tspan>
        </text>
      );
    };

    // 1. Compile formatted transactions for charts dynamically
    const formattedTxsForCharts = transactions.map(getFormattedTx);

    // 2. Options list for dynamic selection
    const chartUniqueDays = Array.from(new Set(formattedTxsForCharts.map(t => `${t.txDate} ${MONTH_NAMES[t.txMonth-1]} ${t.txYear}`)));
    const chartUniqueMonths = Array.from(new Set(formattedTxsForCharts.map(t => `${MONTH_NAMES[t.txMonth-1]} ${t.txYear}`)));
    const chartUniqueYears = Array.from(new Set(formattedTxsForCharts.map(t => `${t.txYear}`)));

    // 3. Filter transactions dynamically based on bank and sub-durations
    const chartFilteredTxs = formattedTxsForCharts.filter(tx => {
      // Filter by bank
      if (analyticsSelectedBank !== 'all') {
        const txBank = tx.bank || bankAccounts[0]?.name || 'ICICI';
        if (txBank.toLowerCase() !== analyticsSelectedBank.toLowerCase()) return false;
      }

      // Filter by durational selectors
      const dayStr = `${tx.txDate} ${MONTH_NAMES[tx.txMonth-1]} ${tx.txYear}`;
      const monthStr = `${MONTH_NAMES[tx.txMonth-1]} ${tx.txYear}`;
      const yearStr = `${tx.txYear}`;

      if (analyticsDuration === 'day') {
        if (chartSelectedDay !== 'all') {
          return dayStr === chartSelectedDay;
        }
      } else if (analyticsDuration === 'month') {
        if (chartSelectedMonth !== 'all') {
          return monthStr === chartSelectedMonth;
        }
      } else if (analyticsDuration === 'year') {
        if (chartSelectedYear !== 'all') {
          return yearStr === chartSelectedYear;
        }
      }
      return true;
    });

    const expenseTxs = chartFilteredTxs.filter(t => t.type === 'outgoing');
    const inflowTxs = chartFilteredTxs.filter(t => t.type === 'incoming');

    // 4. Construct Pie/Donut Chart data
    let pieData: { name: string; value: number; percent?: number; color?: string }[] = [];
    if (analyticsType === 'combined') {
      if (breakdownView === 'reason') {
        const groupingMap: Record<string, number> = {};
        const colorMap: Record<string, string> = {};
        chartFilteredTxs.forEach(tx => {
          const rawLabel = getTransactionLabel(tx);
          const cleanLabel = rawLabel ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1) : 'Other';
          const label = (tx.type === 'incoming' ? '📥 ' : '📤 ') + cleanLabel;
          groupingMap[label] = (groupingMap[label] || 0) + tx.amount;
          colorMap[label] = tx.type === 'incoming' ? '#10B981' : '#F43F5E';
        });
        pieData = Object.entries(groupingMap).map(([name, val]) => ({
          name,
          value: parseFloat(val.toFixed(2)),
          color: colorMap[name]
        })).sort((a, b) => b.value - a.value);
      } else if (breakdownView === 'category') {
        const groupingMap: Record<string, number> = {};
        const colorMap: Record<string, string> = {};
        chartFilteredTxs.forEach(tx => {
          const label = (tx.type === 'incoming' ? '📥 ' : '📤 ') + tx.category.toUpperCase();
          groupingMap[label] = (groupingMap[label] || 0) + tx.amount;
          colorMap[label] = tx.type === 'incoming' ? '#059669' : '#DC2626';
        });
        pieData = Object.entries(groupingMap).map(([name, val]) => ({
          name,
          value: parseFloat(val.toFixed(2)),
          color: colorMap[name]
        })).sort((a, b) => b.value - a.value);
      } else {
        const totalInflowForPie = inflowTxs.reduce((sum, t) => sum + t.amount, 0);
        const totalOutflowForPie = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
        if (totalInflowForPie > 0 || totalOutflowForPie > 0) {
          pieData = [
            { name: '📥 Inflows (Earned)', value: parseFloat(totalInflowForPie.toFixed(2)), color: '#10B981' },
            { name: '📤 Outflows (Spent)', value: parseFloat(totalOutflowForPie.toFixed(2)), color: '#F43F5E' }
          ];
        }
      }
    } else {
      const isExpense = analyticsType === 'expense';
      const subset = isExpense ? expenseTxs : inflowTxs;
      const groupingMap: Record<string, number> = {};
      
      subset.forEach(tx => {
        let label = '';
        if (breakdownView === 'category') {
          label = tx.category.toUpperCase();
        } else {
          label = getTransactionLabel(tx);
          if (label) {
            label = label.charAt(0).toUpperCase() + label.slice(1);
          } else {
            label = 'Other';
          }
        }
        groupingMap[label] = (groupingMap[label] || 0) + tx.amount;
      });

      pieData = Object.entries(groupingMap).map(([name, val]) => ({
        name,
        value: parseFloat(val.toFixed(2))
      })).sort((a, b) => b.value - a.value);
    }

    const totalPieValue = pieData.reduce((sum, d) => sum + d.value, 0);
    if (totalPieValue > 0) {
      pieData = pieData.map(d => ({
        ...d,
        percent: parseFloat(((d.value / totalPieValue) * 100).toFixed(1))
      }));
    }

    // 5. Construct Bar Chart data
    let barData: any[] = [];
    if (barGroupBy === 'reason') {
      const reasonMap: Record<string, { Inflow: number; Expense: number }> = {};
      chartFilteredTxs.forEach(tx => {
        const rawLabel = getTransactionLabel(tx);
        const label = rawLabel ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1) : 'Other';
        if (!reasonMap[label]) reasonMap[label] = { Inflow: 0, Expense: 0 };
        if (tx.type === 'incoming') {
          reasonMap[label].Inflow += tx.amount;
        } else {
          reasonMap[label].Expense += tx.amount;
        }
      });
      barData = Object.entries(reasonMap).map(([name, val]) => ({
        name,
        Inflow: parseFloat(val.Inflow.toFixed(2)),
        Expense: parseFloat(val.Expense.toFixed(2)),
        Net: parseFloat((val.Inflow - val.Expense).toFixed(2))
      })).sort((a, b) => (b.Inflow + b.Expense) - (a.Inflow + a.Expense));
    } else if (barGroupBy === 'category') {
      const categoriesList = ['stonks', 'food', 'drip', 'flex', 'rent', 'general'];
      barData = categoriesList.map(cat => {
        const catTxs = chartFilteredTxs.filter(t => t.category === cat);
        const inflow = catTxs.filter(t => t.type === 'incoming').reduce((sum, t) => sum + t.amount, 0);
        const expense = catTxs.filter(t => t.type === 'outgoing').reduce((sum, t) => sum + t.amount, 0);
        return {
          name: cat.toUpperCase(),
          Inflow: parseFloat(inflow.toFixed(2)),
          Expense: parseFloat(expense.toFixed(2)),
          Net: parseFloat((inflow - expense).toFixed(2))
        };
      }).filter(d => d.Inflow > 0 || d.Expense > 0);
    } else if (barGroupBy === 'bank') {
      barData = bankAccounts.map(b => {
        const bankTxs = chartFilteredTxs.filter(t => {
          const txBank = t.bank || bankAccounts[0]?.name || 'ICICI';
          return txBank.toLowerCase() === b.name.toLowerCase();
        });
        const inflow = bankTxs.filter(t => t.type === 'incoming').reduce((sum, t) => sum + t.amount, 0);
        const expense = bankTxs.filter(t => t.type === 'outgoing').reduce((sum, t) => sum + t.amount, 0);
        return {
          name: b.name.toUpperCase(),
          Inflow: parseFloat(inflow.toFixed(2)),
          Expense: parseFloat(expense.toFixed(2)),
          Net: parseFloat((inflow - expense).toFixed(2))
        };
      });
    } else {
      // Time wise grouping
      if (analyticsDuration === 'day') {
        const dayMap: Record<string, { Inflow: number; Expense: number }> = {};
        chartFilteredTxs.forEach(tx => {
          const key = `${tx.txDate} ${MONTH_NAMES[tx.txMonth - 1]}`;
          if (!dayMap[key]) dayMap[key] = { Inflow: 0, Expense: 0 };
          if (tx.type === 'incoming') dayMap[key].Inflow += tx.amount;
          else dayMap[key].Expense += tx.amount;
        });
        barData = Object.entries(dayMap).map(([name, val]) => ({
          name,
          Inflow: parseFloat(val.Inflow.toFixed(2)),
          Expense: parseFloat(val.Expense.toFixed(2)),
          Net: parseFloat((val.Inflow - val.Expense).toFixed(2))
        }));
      } else if (analyticsDuration === 'month') {
        const monthMap: Record<string, { Inflow: number; Expense: number }> = {};
        chartFilteredTxs.forEach(tx => {
          const key = `${MONTH_NAMES[tx.txMonth - 1]} ${tx.txYear}`;
          if (!monthMap[key]) monthMap[key] = { Inflow: 0, Expense: 0 };
          if (tx.type === 'incoming') monthMap[key].Inflow += tx.amount;
          else monthMap[key].Expense += tx.amount;
        });
        barData = Object.entries(monthMap).map(([name, val]) => ({
          name,
          Inflow: parseFloat(val.Inflow.toFixed(2)),
          Expense: parseFloat(val.Expense.toFixed(2)),
          Net: parseFloat((val.Inflow - val.Expense).toFixed(2))
        }));
      } else {
        const yearMap: Record<string, { Inflow: number; Expense: number }> = {};
        chartFilteredTxs.forEach(tx => {
          const key = `${tx.txYear}`;
          if (!yearMap[key]) yearMap[key] = { Inflow: 0, Expense: 0 };
          if (tx.type === 'incoming') yearMap[key].Inflow += tx.amount;
          else yearMap[key].Expense += tx.amount;
        });
        barData = Object.entries(yearMap).map(([name, val]) => ({
          name,
          Inflow: parseFloat(val.Inflow.toFixed(2)),
          Expense: parseFloat(val.Expense.toFixed(2)),
          Net: parseFloat((val.Inflow - val.Expense).toFixed(2))
        }));
      }
    }

    // 6. Construct Line / Trend data
    let lineData: any[] = [];
    if (barGroupBy === 'reason') {
      const reasonMap: Record<string, { Inflow: number; Expense: number }> = {};
      chartFilteredTxs.forEach(tx => {
        const rawLabel = getTransactionLabel(tx);
        const label = rawLabel ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1) : 'Other';
        if (!reasonMap[label]) reasonMap[label] = { Inflow: 0, Expense: 0 };
        if (tx.type === 'incoming') {
          reasonMap[label].Inflow += tx.amount;
        } else {
          reasonMap[label].Expense += tx.amount;
        }
      });
      lineData = Object.entries(reasonMap).map(([name, val]) => ({
        name,
        Inflow: parseFloat(val.Inflow.toFixed(2)),
        Expense: parseFloat(val.Expense.toFixed(2)),
        Net: parseFloat((val.Inflow - val.Expense).toFixed(2))
      })).sort((a, b) => (b.Inflow + b.Expense) - (a.Inflow + a.Expense));
    } else if (barGroupBy === 'category') {
      const categoriesList = ['stonks', 'food', 'drip', 'flex', 'rent', 'general'];
      lineData = categoriesList.map(cat => {
        const catTxs = chartFilteredTxs.filter(t => t.category === cat);
        const inflow = catTxs.filter(t => t.type === 'incoming').reduce((sum, t) => sum + t.amount, 0);
        const expense = catTxs.filter(t => t.type === 'outgoing').reduce((sum, t) => sum + t.amount, 0);
        return {
          name: cat.toUpperCase(),
          Inflow: parseFloat(inflow.toFixed(2)),
          Expense: parseFloat(expense.toFixed(2)),
          Net: parseFloat((inflow - expense).toFixed(2))
        };
      }).filter(d => d.Inflow > 0 || d.Expense > 0);
    } else if (barGroupBy === 'bank') {
      lineData = bankAccounts.map(b => {
        const bankTxs = chartFilteredTxs.filter(t => {
          const txBank = t.bank || bankAccounts[0]?.name || 'ICICI';
          return txBank.toLowerCase() === b.name.toLowerCase();
        });
        const inflow = bankTxs.filter(t => t.type === 'incoming').reduce((sum, t) => sum + t.amount, 0);
        const expense = bankTxs.filter(t => t.type === 'outgoing').reduce((sum, t) => sum + t.amount, 0);
        return {
          name: b.name.toUpperCase(),
          Inflow: parseFloat(inflow.toFixed(2)),
          Expense: parseFloat(expense.toFixed(2)),
          Net: parseFloat((inflow - expense).toFixed(2))
        };
      });
    } else {
      if (analyticsDuration === 'day') {
        const dayMap: Record<string, { Inflow: number; Expense: number; tempDate: Date }> = {};
        chartFilteredTxs.forEach(tx => {
          const key = `${tx.txDate} ${MONTH_NAMES[tx.txMonth - 1]}`;
          const refDate = new Date(tx.txYear || 2026, (tx.txMonth || 1) - 1, tx.txDate || 1);
          if (!dayMap[key]) dayMap[key] = { Inflow: 0, Expense: 0, tempDate: refDate };
          if (tx.type === 'incoming') dayMap[key].Inflow += tx.amount;
          else dayMap[key].Expense += tx.amount;
        });
        lineData = Object.entries(dayMap).map(([name, vals]) => ({
          name,
          Inflow: parseFloat(vals.Inflow.toFixed(2)),
          Expense: parseFloat(vals.Expense.toFixed(2)),
          Net: parseFloat((vals.Inflow - vals.Expense).toFixed(2)),
          tempDate: vals.tempDate
        })).sort((a, b) => a.tempDate.getTime() - b.tempDate.getTime());
      } else if (analyticsDuration === 'month') {
        const monthMap: Record<string, { Inflow: number; Expense: number; tempDate: Date }> = {};
        chartFilteredTxs.forEach(tx => {
          const key = `${MONTH_NAMES[tx.txMonth - 1]} ${tx.txYear}`;
          const refDate = new Date(tx.txYear || 2026, (tx.txMonth || 1) - 1, 1);
          if (!monthMap[key]) monthMap[key] = { Inflow: 0, Expense: 0, tempDate: refDate };
          if (tx.type === 'incoming') monthMap[key].Inflow += tx.amount;
          else monthMap[key].Expense += tx.amount;
        });
        lineData = Object.entries(monthMap).map(([name, vals]) => ({
          name,
          Inflow: parseFloat(vals.Inflow.toFixed(2)),
          Expense: parseFloat(vals.Expense.toFixed(2)),
          Net: parseFloat((vals.Inflow - vals.Expense).toFixed(2)),
          tempDate: vals.tempDate
        })).sort((a, b) => a.tempDate.getTime() - b.tempDate.getTime());
      } else {
        const yearMap: Record<string, { Inflow: number; Expense: number }> = {};
        chartFilteredTxs.forEach(tx => {
          const key = `${tx.txYear}`;
          if (!yearMap[key]) yearMap[key] = { Inflow: 0, Expense: 0 };
          if (tx.type === 'incoming') yearMap[key].Inflow += tx.amount;
          else yearMap[key].Expense += tx.amount;
        });
        lineData = Object.entries(yearMap).map(([name, vals]) => ({
          name,
          Inflow: parseFloat(vals.Inflow.toFixed(2)),
          Expense: parseFloat(vals.Expense.toFixed(2)),
          Net: parseFloat((vals.Inflow - vals.Expense).toFixed(2))
        })).sort((a, b) => parseInt(a.name) - parseInt(b.name));
      }
    }

    // 7. Calculate Smart Summary Insights
    const categoryOutflowMap: Record<string, number> = {};
    expenseTxs.forEach(tx => {
      categoryOutflowMap[tx.category] = (categoryOutflowMap[tx.category] || 0) + tx.amount;
    });
    let highestSpendingCategory = 'None Yet';
    let maxCatOut = 0;
    Object.entries(categoryOutflowMap).forEach(([cat, val]) => {
      if (val > maxCatOut) {
        maxCatOut = val;
        highestSpendingCategory = cat.toUpperCase();
      }
    });

    const reasonOutflowMap: Record<string, number> = {};
    expenseTxs.forEach(tx => {
      const cleanLabel = getTransactionLabel(tx);
      reasonOutflowMap[cleanLabel] = (reasonOutflowMap[cleanLabel] || 0) + tx.amount;
    });
    let highestSpendingReason = 'None';
    let maxReasonOut = 0;
    Object.entries(reasonOutflowMap).forEach(([reason, val]) => {
      if (val > maxReasonOut) {
        maxReasonOut = val;
        highestSpendingReason = reason;
      }
    });

    const reasonFrequencyMap: Record<string, number> = {};
    expenseTxs.forEach(tx => {
      const clean = getTransactionLabel(tx);
      reasonFrequencyMap[clean] = (reasonFrequencyMap[clean] || 0) + 1;
    });
    let mostFrequentReason = 'None';
    let maxReasonFreq = 0;
    Object.entries(reasonFrequencyMap).forEach(([reason, freq]) => {
      if (freq > maxReasonFreq) {
        maxReasonFreq = freq;
        mostFrequentReason = reason;
      }
    });

    const inflowSourceMap: Record<string, number> = {};
    inflowTxs.forEach(tx => {
      const clean = getTransactionLabel(tx);
      inflowSourceMap[clean] = (inflowSourceMap[clean] || 0) + tx.amount;
    });
    let largestInflowSource = 'None';
    let maxInflowVal = 0;
    Object.entries(inflowSourceMap).forEach(([src, val]) => {
      if (val > maxInflowVal) {
        maxInflowVal = val;
        largestInflowSource = src;
      }
    });

    const dailyOutflowMap: Record<string, number> = {};
    expenseTxs.forEach(tx => {
      const dayKey = `${tx.txDate} ${MONTH_NAMES[tx.txMonth - 1]} ${tx.txYear}`;
      dailyOutflowMap[dayKey] = (dailyOutflowMap[dayKey] || 0) + tx.amount;
    });
    let topSpendingDay = 'None';
    let maxDailyOut = 0;
    Object.entries(dailyOutflowMap).forEach(([day, val]) => {
      if (val > maxDailyOut) {
        maxDailyOut = val;
        topSpendingDay = day;
      }
    });

    const bankActivityMap: Record<string, number> = {};
    chartFilteredTxs.forEach(tx => {
      const txBank = tx.bank || bankAccounts[0]?.name || 'ICICI';
      bankActivityMap[txBank] = (bankActivityMap[txBank] || 0) + 1;
    });
    let mostActiveBank = 'None';
    let maxBankAct = 0;
    Object.entries(bankActivityMap).forEach(([bName, count]) => {
      if (count > maxBankAct) {
        maxBankAct = count;
        mostActiveBank = bName.toUpperCase();
      }
    });

    const totalFilteredIn = inflowTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalFilteredOut = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
    const netFilteredSavings = totalFilteredIn - totalFilteredOut;

    let trendHumor = '';
    if (totalFilteredOut === 0 && totalFilteredIn === 0) {
      trendHumor = "No transactions logged in this filter context. Your pockets are exceptionally quiet. Go spend on something useless or secure some bags! 🗿";
    } else if (totalFilteredOut > totalFilteredIn) {
      trendHumor = "Negative burn rate! Homie, your pocket is leaking fr. Time to delete the food apps and pause all random subscriptions immediately. 💸";
    } else {
      trendHumor = "Gains secured! Savings rate is positive. GareebNoMore capital is expanding, high-vibe financial discipline is being practiced! 🚀";
    }

    const NEO_PALETTE = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#9B5DE5', '#F15BB5', '#00F5D4', '#EE9B00', '#00B4D8'];

    return (
      <div className="w-full space-y-8 text-black animate-fade-in pb-12">
        {/* Top Header Controls with Navigation Back */}
        <div className="bg-white border-2 border-black p-2.5 sm:p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                id="back_to_dashboard_btn"
                type="button"
                onClick={() => {
                  onViewModeChange('normal');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center justify-center w-7 h-7 bg-white hover:bg-espresso text-espresso hover:text-white border-2 border-black text-xs font-black transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] select-none shrink-0 animate-fade-in"
                title="Go Back"
              >
                ⬅️
              </button>
              <div>
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-tighter text-black flex items-center gap-1 font-heading">
                  <span>📊 Charts</span>
                  <span className="text-[8px] bg-red-400 border border-black text-black font-mono font-bold uppercase py-0 px-1">
                    Live
                  </span>
                </h2>
              </div>
            </div>

            <button
              id="header_back_cta_btn"
              type="button"
              onClick={() => {
                onViewModeChange('normal');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2 py-1 bg-espresso hover:bg-latte text-white hover:text-espresso border-2 border-black font-semibold text-[10px] uppercase tracking-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all cursor-pointer select-none"
            >
              Back to original dashboard
            </button>
          </div>
        </div>

        {/* Dynamic Display of active sum in beautiful cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border-2 border-black py-2 sm:py-3.5 px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center items-center text-center">
            <div className="text-[10px] sm:text-xs font-black uppercase text-emerald-800 tracking-tight leading-none">📥 Inflows</div>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg font-heading font-black mt-1.5 text-espresso truncate max-w-full font-mono">
              {symbol}{totalFilteredIn.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
            </div>
          </div>

          <div className="bg-white border-2 border-black py-2 sm:py-3.5 px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center items-center text-center">
            <div className="text-[10px] sm:text-xs font-black uppercase text-rose-500 tracking-tight leading-none">📤 Outflows</div>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg font-heading font-black mt-1.5 text-espresso truncate max-w-full font-mono">
              {symbol}{totalFilteredOut.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
            </div>
          </div>

          <div className="bg-white border-2 border-black py-2 sm:py-3.5 px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center items-center text-center">
            <div className="text-[10px] sm:text-xs font-black uppercase text-espresso tracking-tight leading-none">📈 Net Saved</div>
            <div className={`text-xs sm:text-sm md:text-base lg:text-lg font-heading font-black mt-1.5 truncate max-w-full font-mono ${netFilteredSavings >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
              {netFilteredSavings >= 0 ? '+' : ''}{symbol}{netFilteredSavings.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
            </div>
          </div>
        </div>

        {/* Main Chart Card */}
        <div className="bg-white border-4 border-black p-5 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
          
          {/* Chart Header */}
          <div className="flex items-center justify-between border-b-3 border-black pb-2 font-heading">
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-espresso flex items-center gap-2">
                <span>📈 CHARTS</span>
              </h3>
            </div>
          </div>

          {/* Compact Dropdown Control Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 p-2 sm:p-3 border-2 border-black">
            {/* Dropdown 1: Bank */}
            <div className="space-y-1 font-heading">
              <label htmlFor="charts_bank_select" className="block text-[10px] font-black uppercase tracking-tight text-espresso">
                🏦 Bank
              </label>
              <div className="relative">
                <select
                  id="charts_bank_select"
                  value={analyticsSelectedBank}
                  onChange={(e) => setAnalyticsSelectedBank(e.target.value)}
                  className="w-full bg-white border-2 border-black rounded-none py-1.5 px-2 text-xs font-black uppercase tracking-wide text-espresso focus:outline-none appearance-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none hover:translate-x-[-0.5px] hover:translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <option value="all">All Banks Combined</option>
                  {bankAccounts.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-black font-bold">
                  <ChevronDown size={14} strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Dropdown 2: Flows */}
            <div className="space-y-1 font-heading">
              <label htmlFor="charts_flows_select" className="block text-[10px] font-black uppercase tracking-tight text-espresso">
                💸 Flows
              </label>
              <div className="relative">
                <select
                  id="charts_flows_select"
                  value={analyticsType}
                  onChange={(e) => setAnalyticsType(e.target.value as any)}
                  className="w-full bg-white border-2 border-black rounded-none py-1.5 px-2 text-xs font-black uppercase tracking-wide text-espresso focus:outline-none appearance-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none hover:translate-x-[-0.5px] hover:translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <option value="expense">Expenses Only</option>
                  <option value="inflow">Inflows Only</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-black font-bold">
                  <ChevronDown size={14} strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Dropdown 3: Analysis */}
            <div className="space-y-1 font-heading">
              <label htmlFor="charts_analysis_select" className="block text-[10px] font-black uppercase tracking-tight text-espresso">
                ⏳ Analysis
              </label>
              <div className="relative">
                <select
                  id="charts_analysis_select"
                  value={analyticsDuration}
                  onChange={(e) => setAnalyticsDuration(e.target.value as any)}
                  className="w-full bg-white border-2 border-black rounded-none py-1.5 px-2 text-xs font-black uppercase tracking-wide text-espresso focus:outline-none appearance-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none hover:translate-x-[-0.5px] hover:translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <option value="day">Date Wise Analysis</option>
                  <option value="month">Month Wise Analysis</option>
                  <option value="year">Year Wise Analysis</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-black font-bold">
                  <ChevronDown size={14} strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Dropdown 4: Charts */}
            <div className="space-y-1 font-heading">
              <label htmlFor="charts_type_select" className="block text-[10px] font-black uppercase tracking-tight text-espresso">
                📊 Charts
              </label>
              <div className="relative">
                <select
                  id="charts_type_select"
                  value={chartType === 'table' ? 'pie' : chartType}
                  onChange={(e) => setChartType(e.target.value as any)}
                  className="w-full bg-white border-2 border-black rounded-none py-1.5 px-2 text-xs font-black uppercase tracking-wide text-espresso focus:outline-none appearance-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none hover:translate-x-[-0.5px] hover:translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <option value="pie">Pie Chart</option>
                  <option value="donut">Doughnut Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="wordart">Word Art</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-black font-bold">
                  <ChevronDown size={14} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>

          {/* Sub Controls specific to the chart type */}
          {(chartType === 'bar' || chartType === 'line') && (
            <div className="flex items-center gap-2 flex-wrap text-2xs uppercase font-mono font-bold text-espresso">
              <span>🗂️ Group X-axis elements by:</span>
              {(['time', 'bank', 'reason'] as const).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setBarGroupBy(group)}
                  className={`px-2.5 py-1 border-2 border-black tracking-wider transition-all cursor-pointer ${
                    barGroupBy === group ? 'bg-black text-white' : 'bg-milk text-black hover:bg-zinc-100'
                  }`}
                >
                  {group === 'time' ? '⏰ Time Units' : group === 'bank' ? '🏦 Linked Banks' : '⚡ Reason / Source'}
                </button>
              ))}
            </div>
          )}

          {(chartType === 'pie' || chartType === 'donut') && (
            <div className="flex items-center gap-2 flex-wrap text-2xs uppercase font-mono font-bold text-espresso">
              <span>🧩 Slices Representing:</span>
              <button
                type="button"
                onClick={() => setBreakdownView('reason')}
                className="px-2.5 py-1 border-2 border-black tracking-wider transition-all cursor-pointer bg-black text-white"
              >
                ⚡ User custom reason
              </button>
            </div>
          )}

          {/* Real-time Graph Box container */}
          <div className="min-h-[340px] bg-milk/25 border-3 border-dashed border-black p-4 flex items-center justify-center relative overflow-hidden">
            {chartFilteredTxs.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-4xl text-black">🕸️</div>
                <p className="text-sm font-heading font-black text-espresso uppercase">No transactions found matching scope!</p>
                <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Write some moves in ledger or change filters to boot telemetry.</p>
              </div>
            ) : (chartType === 'pie' || chartType === 'donut') && pieData.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-4xl text-black">🍽️</div>
                <p className="text-sm font-heading font-black text-espresso uppercase">Proportion slice totals are zero!</p>
                <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Hint: Switch flows filter to combined / select another category class!</p>
              </div>
            ) : (
              <div className="w-full">
                {chartType === 'pie' && (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={renderCustomizedPieLabel}
                        outerRadius={75}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color || NEO_PALETTE[index % NEO_PALETTE.length]} 
                            stroke="#000000"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '3px solid #000000', 
                          borderRadius: '0px', 
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 'bold'
                        }}
                        formatter={(value: any, name: any) => {
                          const amount = parseFloat(value);
                          const percentage = totalPieValue > 0 ? ((amount / totalPieValue) * 100).toFixed(1) : '0';
                          return [`${symbol}${amount.toLocaleString('en-IN')} (${percentage}%)`, name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'donut' && (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        labelLine={true}
                        label={renderCustomizedPieLabel}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color || NEO_PALETTE[index % NEO_PALETTE.length]} 
                            stroke="#000000"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '3px solid #000000', 
                          borderRadius: '0px', 
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 'bold'
                        }}
                        formatter={(value: any, name: any) => {
                          const amount = parseFloat(value);
                          const percentage = totalPieValue > 0 ? ((amount / totalPieValue) * 100).toFixed(1) : '0';
                          return [`${symbol}${amount.toLocaleString('en-IN')} (${percentage}%)`, name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'bar' && (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#271E1B" opacity={0.1} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#271E1B" 
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={55}
                        tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        stroke="#271E1B" 
                        tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 'black' }}
                        tickFormatter={(val) => `${symbol}${val}`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '3px solid #000000', 
                          fontFamily: 'JetBrains Mono', 
                          fontWeight: 'bold' 
                        }}
                        formatter={(value: any) => `${symbol}${parseFloat(value).toLocaleString('en-IN')}`}
                      />
                      <Legend 
                        wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 'bold' }}
                      />
                      {analyticsType !== 'expense' && (
                        <Bar 
                          dataKey="Inflow" 
                          fill="#10B981" 
                          stroke="#000000" 
                          strokeWidth={2.5} 
                          barSize={40}
                          radius={[4, 4, 0, 0]} 
                        >
                          <LabelList 
                            dataKey="Inflow" 
                            position="top" 
                            style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 'bold', fill: '#000000' }} 
                            formatter={(v: any) => v > 0 ? `${symbol}${v}` : ''}
                          />
                        </Bar>
                      )}
                      {analyticsType !== 'inflow' && (
                        <Bar 
                          dataKey="Expense" 
                          fill="#F43F5E" 
                          stroke="#000000" 
                          strokeWidth={2.5} 
                          barSize={40}
                          radius={[4, 4, 0, 0]} 
                        >
                          <LabelList 
                            dataKey="Expense" 
                            position="top" 
                            style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 'bold', fill: '#000000' }} 
                            formatter={(v: any) => v > 0 ? `${symbol}${v}` : ''}
                          />
                        </Bar>
                      )}
                      {analyticsType === 'combined' && (
                        <Bar 
                          dataKey="Net" 
                          fill="#FFD93D" 
                          stroke="#000000" 
                          strokeWidth={2.5} 
                          barSize={40}
                          radius={[4, 4, 0, 0]} 
                        >
                          <LabelList 
                            dataKey="Net" 
                            position="top" 
                            style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 'bold', fill: '#000000' }} 
                            formatter={(v: any) => `${symbol}${v}`}
                          />
                        </Bar>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'line' && (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={lineData} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#271E1B" opacity={0.1} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#271E1B" 
                        tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        stroke="#271E1B" 
                        tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 'black' }}
                        tickFormatter={(val) => `${symbol}${val}`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '3px solid #000000', 
                          fontFamily: 'JetBrains Mono', 
                          fontWeight: 'bold' 
                        }}
                        formatter={(value: any) => `${symbol}${parseFloat(value).toLocaleString('en-IN')}`}
                      />
                      <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 'bold' }} />
                      {analyticsType !== 'expense' && (
                        <Area 
                          type="monotone" 
                          dataKey="Inflow" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorInflow)" 
                        >
                          <LabelList 
                            dataKey="Inflow" 
                            position="top" 
                            style={{ fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 'bold', fill: '#047857' }} 
                            formatter={(v: any) => v > 0 ? `${symbol}${v}` : ''}
                          />
                        </Area>
                      )}
                      {analyticsType !== 'inflow' && (
                        <Area 
                          type="monotone" 
                          dataKey="Expense" 
                          stroke="#F43F5E" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorExpense)" 
                        >
                          <LabelList 
                            dataKey="Expense" 
                            position="top" 
                            style={{ fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 'bold', fill: '#BE123C' }} 
                            formatter={(v: any) => v > 0 ? `${symbol}${v}` : ''}
                          />
                        </Area>
                      )}
                      {analyticsType === 'combined' && (
                        <Line 
                          type="monotone" 
                          dataKey="Net" 
                          stroke="#FFD93D" 
                          strokeWidth={4} 
                          dot={{ stroke: '#000000', strokeWidth: 2, r: 4 }}
                        >
                          <LabelList 
                            dataKey="Net" 
                            position="top" 
                            style={{ fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 'bold', fill: '#000000' }} 
                            formatter={(v: any) => `${symbol}${v}`}
                          />
                        </Line>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'wordart' && (
                  <div className="py-6 px-4 w-full">
                    <div className="text-center mb-6">
                      <h4 className="text-sm font-black uppercase text-espresso tracking-tight">
                        💭 WORD ART DATA BUBBLES
                      </h4>
                      <p className="text-[11px] font-mono text-zinc-500 uppercase">
                        Bubble sizes correspond visually to {analyticsType === 'combined' ? 'Transaction scale' : analyticsType === 'expense' ? 'Outflow reasons' : 'Inflow reasons'}
                      </p>
                    </div>

                    {(() => {
                      const bubbleMap: Record<string, { amount: number; type: 'incoming' | 'outgoing'; category: string }> = {};
                      const matchedTxs = analyticsType === 'combined' 
                        ? chartFilteredTxs 
                        : analyticsType === 'expense' 
                          ? expenseTxs 
                          : inflowTxs;

                      matchedTxs.forEach(tx => {
                        const rawLabel = getTransactionLabel(tx);
                        const label = rawLabel ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1) : 'Other';
                        const key = (tx.type === 'incoming' ? '📥 ' : '📤 ') + label;
                        if (!bubbleMap[key]) {
                          bubbleMap[key] = { amount: 0, type: tx.type, category: tx.category };
                        }
                        bubbleMap[key].amount += tx.amount;
                      });

                      const bubbles = Object.entries(bubbleMap).map(([keyWithEmoji, data]) => {
                        const cleanLabel = keyWithEmoji.substring(2);
                        return {
                          label: cleanLabel,
                          keyName: keyWithEmoji,
                          amount: parseFloat(data.amount.toFixed(2)),
                          type: data.type,
                          category: data.category
                        };
                      }).sort((a, b) => b.amount - a.amount);

                      if (bubbles.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-xs uppercase font-mono font-bold text-zinc-400">
                              No flow entries to display Word-Art Bubbles for this range!
                            </p>
                          </div>
                        );
                      }

                      const maxVal = Math.max(...bubbles.map(b => b.amount));

                      return (
                        <div className="flex flex-wrap items-center justify-center gap-6 p-4">
                          {bubbles.map((bub, idx) => {
                            // Calculate dynamic bubble size
                            const minD = 100;
                            const maxD = 210;
                            const diameter = maxVal > 0 
                              ? minD + (bub.amount / maxVal) * (maxD - minD) 
                              : minD;

                            // Color mapping with distinct palette options
                            let bgClass = "bg-[#FFE8CC]"; 
                            let borderClass = "border-black";

                            if (bub.type === 'incoming') {
                              bgClass = idx === 0 ? "bg-[#D1FAE5]" : "bg-[#ECFDF5]";
                            } else {
                              if (idx === 0) {
                                bgClass = "bg-[#FFE4E6]"; 
                              } else if (idx === 1) {
                                bgClass = "bg-[#FEF3C7]"; 
                              } else if (idx === 2) {
                                bgClass = "bg-[#FFEDD5]"; 
                              } else {
                                bgClass = "bg-[#F3F4F6]";
                              }
                            }

                            return (
                              <div
                                key={bub.keyName}
                                className={`rounded-full border-4 ${borderClass} ${bgClass} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center p-3 transition-transform hover:scale-110 relative cursor-pointer group`}
                                style={{
                                  width: `${diameter}px`,
                                  height: `${diameter}px`,
                                }}
                              >
                                {idx === 0 && (
                                  <span className="absolute -top-2 bg-black text-[#FFD93D] border-2 border-black text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wide shadow-sm rotate-[-3deg]">
                                    👑 LARGEST
                                  </span>
                                )}
                                {idx === 1 && (
                                  <span className="absolute -top-1 bg-black text-white border-2 border-black text-[8px] font-black px-1 py-0.5 uppercase tracking-wide shadow-sm rotate-[2deg]">
                                    🥈 SECOND
                                  </span>
                                )}
                                {idx === 2 && (
                                  <span className="absolute -top-1 bg-zinc-800 text-white border border-black text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wide shadow-sm">
                                    🥉 THIRD
                                  </span>
                                )}

                                <p className="text-[9px] uppercase font-mono tracking-tight font-black text-neutral-400">
                                  {bub.type === 'incoming' ? '📥 INFLOW' : '📤 OUTFLOW'}
                                </p>
                                
                                <p className="text-xs sm:text-sm font-black font-heading leading-tight uppercase text-espresso drop-shadow-sm break-all truncate px-1 max-w-full">
                                  {bub.label}
                                </p>

                                <div className="mt-1 bg-black text-white font-mono text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-none border border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,0.25)]">
                                  {symbol}{bub.amount.toLocaleString('en-IN')}
                                </div>
                                
                                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[9px] font-mono p-1.5 border border-white -bottom-8 z-10 pointer-events-none uppercase whitespace-nowrap">
                                  {bub.label} ({((bub.amount / (totalPieValue || 1)) * 100).toFixed(1)}%)
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Special Charts Card */}
        <div id="special-charts" className="bg-white border-4 border-black p-5 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
          {/* Special Charts Header */}
          <div className="flex items-center justify-between border-b-3 border-black pb-2 font-heading">
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-espresso flex items-center gap-2">
                <span>🌟 SPECIAL CHARTS</span>
              </h3>
            </div>
          </div>

          {/* Compact Dropdown Control Row */}
          <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-2 sm:p-3 border-2 border-black">
            {/* Dropdown 1: Bank */}
            <div className="space-y-1 font-heading">
              <label htmlFor="special_bank_select" className="block text-[10px] font-black uppercase tracking-tight text-espresso">
                🏦 Bank
              </label>
              <div className="relative">
                <select
                  id="special_bank_select"
                  value={specialSelectedBank}
                  onChange={(e) => setSpecialSelectedBank(e.target.value)}
                  className="w-full bg-white border-2 border-black rounded-none py-1.5 px-2 text-xs font-black uppercase tracking-wide text-espresso focus:outline-none appearance-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none hover:translate-x-[-0.5px] hover:translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <option value="all">All Banks Combined</option>
                  {bankAccounts.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-black font-bold">
                  <ChevronDown size={14} strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Dropdown 2: Special Charts Select (Top 5 Expenses or Basics vs. Bullshits) */}
            <div className="space-y-1 font-heading">
              <label htmlFor="special_type_select" className="block text-[10px] font-black uppercase tracking-tight text-espresso">
                📊 Special Charts
              </label>
              <div className="relative">
                <select
                  id="special_type_select"
                  value={specialChartOption}
                  onChange={(e) => setSpecialChartOption(e.target.value as any)}
                  className="w-full bg-white border-2 border-black rounded-none py-1.5 px-2 text-xs font-black uppercase tracking-wide text-espresso focus:outline-none appearance-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none hover:translate-x-[-0.5px] hover:translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <option value="top5">Top 5 Expenses</option>
                  <option value="basics_vs_bullshits">Basics vs. Bullshits</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-black font-bold">
                  <ChevronDown size={14} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>

          {/* Special Chart Presentation Container */}
          <div className="relative min-h-[300px] bg-milk/25 border-3 border-dashed border-black p-4 flex flex-col items-center justify-center overflow-hidden">
            {specialChartOption === 'top5' ? (() => {
              // 1. Extract special filtered transactions for outgoing type
              const specialTxs = formattedTxs.filter(tx => 
                tx.type === 'outgoing' && 
                (specialSelectedBank === 'all' || (tx.bank && tx.bank.toLowerCase() === specialSelectedBank.toLowerCase()))
              );

              // 2. Map to format month names nicely
              const FULL_MONTH_NAMES: Record<string, string> = {
                'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
                'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
                'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
              };

              // 3. We want to list unique months in reverse chronological order:
              const seenSpecialMonths = new Set<string>();
              const specialMonthsList: { month: number; year: number; label: string }[] = [];

              // Sort all transactions to find month list
              const sortedAllTxs = [...formattedTxs].sort((a, b) => {
                const scoreA = a.txYear * 12 + a.txMonth;
                const scoreB = b.txYear * 12 + b.txMonth;
                return scoreB - scoreA;
              });

              sortedAllTxs.forEach(tx => {
                const shortMonth = MONTH_NAMES[tx.txMonth - 1];
                const fullMonth = FULL_MONTH_NAMES[shortMonth] || shortMonth;
                const label = `${fullMonth} ${tx.txYear}`;
                const key = `${tx.txYear}-${tx.txMonth}`;
                if (!seenSpecialMonths.has(key)) {
                  seenSpecialMonths.add(key);
                  specialMonthsList.push({
                    month: tx.txMonth,
                    year: tx.txYear,
                    label
                  });
                }
              });

              // Fallback to defaults if no months registered
              if (specialMonthsList.length === 0) {
                specialMonthsList.push(
                  { month: 5, year: 2026, label: 'May 2026' },
                  { month: 4, year: 2026, label: 'April 2026' },
                  { month: 3, year: 2026, label: 'March 2026' }
                );
              }

              // Take at most latest 5 months to prevent table stretching too wide
              const displayedMonths = specialMonthsList.slice(0, 5);

              // 4. Calculate Top 5 per month
              const monthlyTopExpenses = displayedMonths.map(m => {
                const monthlyOutgoing = specialTxs.filter(tx => tx.txMonth === m.month && tx.txYear === m.year);
                
                const reasonMap: Record<string, number> = {};
                monthlyOutgoing.forEach(tx => {
                  const rawLabel = getTransactionLabel(tx);
                  const label = rawLabel ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1) : 'Other';
                  reasonMap[label] = (reasonMap[label] || 0) + tx.amount;
                });

                const sorted = Object.entries(reasonMap)
                  .map(([reason, amount]) => ({ reason, amount }))
                  .sort((a, b) => b.amount - a.amount);

                const top5: { reason: string; amount: number }[] = [];
                for (let i = 0; i < 5; i++) {
                  if (i < sorted.length) {
                    top5.push(sorted[i]);
                  } else {
                    top5.push({ reason: '-', amount: 0 });
                  }
                }

                const top5Total = top5.reduce((sum, item) => sum + item.amount, 0);

                return {
                  ...m,
                  top5,
                  top5Total
                };
              });

              return (
                <div className="w-full space-y-4">
                  <div className="text-center">
                    <h4 className="text-xs sm:text-sm font-heading font-black uppercase text-espresso tracking-tight">
                      📸 MONTHLY SNAPSHOT TABLE
                    </h4>
                    <p className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase">
                      Top Outflows distribution comparison
                    </p>
                  </div>

                  <div className="w-full overflow-x-auto border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <table className="w-full border-collapse text-left font-mono text-xs">
                      <thead>
                        <tr className="bg-espresso text-white border-b-3 border-black">
                          <th className="p-3 uppercase tracking-wider font-heading font-black border-r-2 border-black sticky left-0 bg-espresso z-10 w-[70px] text-center">
                            🏆 RANK
                          </th>
                          {monthlyTopExpenses.map(item => (
                            <th key={item.label} className="p-3 uppercase tracking-wider font-heading font-black text-center border-r-2 last:border-r-0 border-black min-w-[180px]">
                              📅 {item.label.toUpperCase()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 5 }).map((_, rankIdx) => (
                          <tr key={rankIdx} className="border-b-2 border-black last:border-b-0 hover:bg-zinc-50 transition-colors">
                            <td className="p-3 text-center font-black border-r-2 border-black bg-zinc-50 text-espresso font-heading text-sm sticky left-0 z-10 shadow-[2px_0_0_0_rgba(0,0,0,0.1)]">
                              {rankIdx + 1}
                            </td>
                            {monthlyTopExpenses.map(item => {
                              const exp = item.top5[rankIdx];
                              return (
                                <td key={item.label} className="p-3 border-r-2 last:border-r-0 border-black whitespace-nowrap text-center">
                                  {exp.reason !== '-' ? (
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      <span className="font-heading font-black text-xs text-espresso uppercase truncate max-w-[130px]" title={exp.reason}>
                                        ⚡ {exp.reason}
                                      </span>
                                      <span className="text-[10px] font-mono font-bold text-[#F43F5E] bg-rose-50 px-2 py-0.5 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        -{symbol}{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-center text-zinc-300 font-mono">-</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {/* Aggregated Total Row */}
                        <tr className="bg-zinc-100 font-heading border-t-4 border-black font-black text-espresso">
                          <td className="p-3 text-center uppercase tracking-wider font-heading font-black border-r-2 border-black bg-zinc-200">
                            TOTAL
                          </td>
                          {monthlyTopExpenses.map(item => (
                            <td key={item.label} className="p-3 text-center border-r-2 last:border-r-0 border-black">
                              <span className="font-mono text-xs font-black text-rose-600 bg-white px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {symbol}{item.top5Total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                              </span>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })() : (() => {
              // Basics vs Bullshits
              const specialTxs = formattedTxs.filter(tx => 
                tx.type === 'outgoing' && 
                (specialSelectedBank === 'all' || (tx.bank && tx.bank.toLowerCase() === specialSelectedBank.toLowerCase()))
              );

              const BASICS_LIST = ['food', 'electricity', 'water', 'rent', 'daily commute', 'wi-fi / data', 'wifi / data', 'data', 'wi-fi', 'wifi', 'utility', 'utilities', 'bills', 'bill'];

              const isBasics = (tx: Transaction): boolean => {
                const label = getTransactionLabel(tx).toLowerCase().trim();
                const category = tx.category.toLowerCase().trim();
                
                if (
                  label === 'food' || label === 'electricity' || label === 'water' || label === 'rent' || 
                  label === 'daily commute' || label === 'wi-fi / data' || label === 'wifi' || label === 'wi-fi' ||
                  label === 'commute' || label === 'data' || label === 'internet'
                ) {
                  return true;
                }
                
                return BASICS_LIST.includes(category) || BASICS_LIST.includes(label);
              };

              const BASICS_DISPLAY_ITEMS = [
                { term: 'Food', matchPatterns: ['food'] },
                { term: 'Electricity', matchPatterns: ['electricity', 'electric', 'power'] },
                { term: 'Water', matchPatterns: ['water'] },
                { term: 'Rent', matchPatterns: ['rent'] },
                { term: 'Daily Commute', matchPatterns: ['daily commute', 'commute', 'travel', 'bus', 'train', 'metro', 'cab', 'taxi', 'fuel', 'petrol'] },
                { term: 'Wi-Fi / Data', matchPatterns: ['wi-fi / data', 'wifi / data', 'wifi', 'wi-fi', 'data', 'internet', 'broadband'] }
              ];

              const basicsItemsCalculated = BASICS_DISPLAY_ITEMS.map(item => {
                const total = specialTxs.filter(tx => {
                  const label = getTransactionLabel(tx).toLowerCase();
                  const cat = tx.category.toLowerCase();
                  return item.matchPatterns.some(pat => label.includes(pat) || cat.includes(pat));
                }).reduce((sum, tx) => sum + tx.amount, 0);

                return { name: item.term, amount: total };
              });

              const basicsTotalAmount = specialTxs.filter(tx => isBasics(tx)).reduce((sum, tx) => sum + tx.amount, 0);

              const bullshitsItemsMap: Record<string, number> = {};
              specialTxs.filter(tx => !isBasics(tx)).forEach(tx => {
                const rawLabel = getTransactionLabel(tx);
                const label = rawLabel ? rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1) : 'Other';
                bullshitsItemsMap[label] = (bullshitsItemsMap[label] || 0) + tx.amount;
              });

              const bullshitsItemsCalculated = Object.entries(bullshitsItemsMap)
                .map(([name, amount]) => ({ name, amount }))
                .sort((a, b) => b.amount - a.amount);

              const bullshitsTotalAmount = bullshitsItemsCalculated.reduce((sum, item) => sum + item.amount, 0);

              const basicsAndBullshitsPieData = [
                { name: 'Basics 🟢', value: basicsTotalAmount, color: '#10B981' },
                { name: 'Bullshits 🔴', value: bullshitsTotalAmount, color: '#F43F5E' }
              ];

              const totalBasicsVsBullshitsVal = basicsTotalAmount + bullshitsTotalAmount;

              return (
                <div className="w-full relative space-y-4">
                  <div className="text-center">
                    <h4 className="text-xs sm:text-sm font-heading font-black uppercase text-espresso tracking-tight">
                      🍕 BASICS VS. BULLSHITS PIE
                    </h4>
                    <p className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase">
                      Necessities vs. Discretionary flows
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="relative">
                      {totalBasicsVsBullshitsVal === 0 ? (
                        <div className="text-center py-10 font-mono text-xs text-zinc-400 uppercase">
                          No expenses found in this scope to compute proportions!
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie
                              data={basicsAndBullshitsPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={75}
                              fill="#8884d8"
                              dataKey="value"
                              onMouseEnter={(_, index) => {
                                setHoveredSection(index === 0 ? 'basics' : 'bullshits');
                              }}
                              onMouseLeave={() => setHoveredSection(null)}
                            >
                              {basicsAndBullshitsPieData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.color} 
                                  stroke="#000000"
                                  strokeWidth={3}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: '#FFFFFF', 
                                border: '3px solid #000000', 
                                borderRadius: '0px', 
                                fontFamily: 'JetBrains Mono',
                                fontWeight: 'bold'
                              }}
                              formatter={(value: any, name: any) => {
                                const amount = parseFloat(value);
                                const percent = totalBasicsVsBullshitsVal > 0 ? ((amount / totalBasicsVsBullshitsVal) * 100).toFixed(1) : '0';
                                return [`${symbol}${amount.toLocaleString('en-IN')} (${percent}%)`, name];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}

                      {/* Fallback Buttons for Touch Screens / Mobile */}
                      <div className="flex items-center justify-center gap-2 font-heading mt-2">
                        <button
                          type="button"
                          onMouseEnter={() => setHoveredSection('basics')}
                          onMouseLeave={() => setHoveredSection(null)}
                          onClick={() => setHoveredSection(hoveredSection === 'basics' ? null : 'basics')}
                          className="px-2.5 py-1 bg-[#10B981] text-black border-2 border-black font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all select-none cursor-pointer"
                        >
                          🟢 INSPECT BASICS
                        </button>
                        <button
                          type="button"
                          onMouseEnter={() => setHoveredSection('bullshits')}
                          onMouseLeave={() => setHoveredSection(null)}
                          onClick={() => setHoveredSection(hoveredSection === 'bullshits' ? null : 'bullshits')}
                          className="px-2.5 py-1 bg-[#F43F5E] text-black border-2 border-black font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all select-none cursor-pointer"
                        >
                          🔴 INSPECT BULLSHITS
                        </button>
                      </div>
                    </div>

                    {/* Side/Hover Popup info */}
                    <div className="relative border-4 border-black p-4 bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[180px] flex flex-col justify-center">
                      <div className="absolute top-[-10px] left-3 bg-black text-yellow-300 border-2 border-black text-[8px] font-black px-1.5 py-0.5 uppercase tracking-wider rotate-[-1deg]">
                        Live Breakdown
                      </div>

                      {hoveredSection ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b-2 border-black pb-1">
                            <h5 className="font-heading font-black text-2xs uppercase text-espresso">
                              {hoveredSection === 'basics' ? '🟢 Basics Necessity' : '🔴 Discretionary Bullshits'}
                            </h5>
                            <span className="text-[10px] bg-black text-white px-1.5 py-0.5 font-mono font-bold">
                              {hoveredSection === 'basics' 
                                ? `${((basicsTotalAmount / (totalBasicsVsBullshitsVal || 1)) * 100).toFixed(1)}%` 
                                : `${((bullshitsTotalAmount / (totalBasicsVsBullshitsVal || 1)) * 100).toFixed(1)}%`
                              }
                            </span>
                          </div>

                          {hoveredSection === 'basics' ? (
                            <ul className="space-y-1 text-[11px] font-mono font-bold leading-tight">
                              {basicsItemsCalculated.map(item => (
                                <li key={item.name} className="flex justify-between items-center border-b border-dashed border-black/15 pb-0.5">
                                  <span>📍 {item.name}</span>
                                  <span className="text-zinc-600 font-black">{symbol}{item.amount.toLocaleString('en-IN')}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="space-y-1 text-[11px] font-mono font-bold leading-tight">
                              {bullshitsItemsCalculated.length === 0 ? (
                                <p className="text-zinc-500 uppercase text-center py-4">No lifestyle expenses found!</p>
                              ) : (
                                <div className="max-h-[120px] overflow-y-auto pr-1 space-y-1">
                                  {bullshitsItemsCalculated.map(item => (
                                    <div key={item.name} className="flex justify-between items-center border-b border-dashed border-black/15 pb-0.5">
                                      <span className="truncate max-w-[130px]" title={item.name}>🚫 {item.name}</span>
                                      <span className="text-[#F43F5E] font-black">{symbol}{item.amount.toLocaleString('en-IN')}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center font-heading py-4 space-y-1 text-espresso">
                          <p className="font-black text-xs uppercase">🔍 Telemetry Inspector</p>
                          <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                            Hover or click segment options to trigger classification insights
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Smart Summary Word-Art Analytics Section */}
        <div className="bg-espresso border-4 border-black p-5 sm:p-6 text-latte shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-7xl text-white/5 font-black uppercase tracking-tighter select-none font-heading pointer-events-none">
            TELEMETRY
          </div>

          <div className="border-b border-latte/15 pb-2.5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin animate-once" />
              <h3 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                💡 CRAZY INSIGHTS
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs text-white">
            <div className="bg-white/5 p-4 border border-zinc-700 hover:border-latte transition-all">
              <div className="text-[10px] text-zinc-400 font-extrabold uppercase mb-1">🔥 Top Outflow Reason</div>
              <div className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                <span>💸</span> {highestSpendingReason.toUpperCase()}
              </div>
              {maxReasonOut > 0 && (
                <div className="text-[10px] text-latte/70 font-semibold mt-1">
                  Absolute sum: {symbol}{maxReasonOut.toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div className="bg-white/5 p-4 border border-zinc-700 hover:border-latte transition-all">
              <div className="text-[10px] text-zinc-400 font-extrabold uppercase mb-1">📋 Max Freq Expense</div>
              <div className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                <span>🔄</span> {mostFrequentReason.toUpperCase()}
              </div>
              {maxReasonFreq > 0 && (
                <div className="text-[10px] text-latte/70 font-semibold mt-1">
                  Logged {maxReasonFreq} separate times
                </div>
              )}
            </div>

            <div className="bg-white/5 p-4 border border-zinc-700 hover:border-latte transition-all">
              <div className="text-[10px] text-zinc-400 font-extrabold uppercase mb-1">📥 Top Inflow Source</div>
              <div className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                <span>📈</span> {largestInflowSource.toUpperCase()}
              </div>
              {maxInflowVal > 0 && (
                <div className="text-[10px] text-latte/70 font-semibold mt-1">
                  Absolute sum: {symbol}{maxInflowVal.toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div className="bg-white/5 p-4 border border-zinc-700 hover:border-latte transition-all">
              <div className="text-[10px] text-zinc-400 font-extrabold uppercase mb-1">🏦 Most Active Bank</div>
              <div className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                <span>🏦</span> {mostActiveBank}
              </div>
              <div className="text-[10px] text-latte/70 font-semibold mt-1">
                Highest dynamic traffic observed
              </div>
            </div>

            <div className="bg-white/5 p-4 border border-zinc-700 hover:border-latte transition-all">
              <div className="text-[10px] text-zinc-400 font-extrabold uppercase mb-1">📅 Top Outflow Date</div>
              <div className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                <span>📆</span> {topSpendingDay.toUpperCase()}
              </div>
              {maxDailyOut > 0 && (
                <div className="text-[10px] text-latte/70 font-semibold mt-1">
                  Hit-value: {symbol}{maxDailyOut.toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div className="bg-white/5 p-4 border border-zinc-700 hover:border-latte transition-all">
              <div className="text-[10px] text-zinc-400 font-extrabold uppercase mb-1">🚀 Focus Category</div>
              <div className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                <span>🎯</span> {highestSpendingCategory}
              </div>
              <div className="text-[10px] text-latte/70 font-semibold mt-1">
                Dominates active outflows
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (viewMode === 'charts') {
    return renderChartsPage();
  }

  return (
    <div className="w-full space-y-5 text-black animate-fade-in animate-once">
      {/* 1. Minimal Header Options Row */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 text-xs font-mono select-none flex-nowrap w-full overflow-x-auto">
        {/* Tiny option of zero out and reset setup at the top left corner */}
        <div className="flex items-center gap-1 sm:gap-2 flex-nowrap shrink-0">
          <button
            id="wipe_ledger_btn"
            onClick={handleWipeLedger}
            className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 border-2 border-black font-mono font-black text-[9px] sm:text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer select-none ${
              confirmWipe 
                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                : 'bg-amber-400 hover:bg-amber-500 text-black'
            }`}
          >
            <span>{confirmWipe ? '⚠️ Confirm' : '🧹 Zero Out'}</span>
          </button>
          <button
            id="logout_action_btn"
            onClick={onLogout}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-espresso hover:bg-latte border-2 border-black text-white hover:text-espresso font-mono font-black text-[9px] sm:text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer select-none"
          >
            <LogOut className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>Reset Setup</span>
          </button>
        </div>

        {/* Currency selection at the top right corner */}
        <div className="flex items-center gap-1 bg-white border-2 border-black px-2 py-1 sm:px-2.5 sm:py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
          <span className="font-black uppercase text-[8px] sm:text-[10px] text-espresso/80">Currency:</span>
          <select
            id="compact_currency_dropdown"
            value={profile.currencyCode || 'INR'}
            onChange={(e) => onUpdateProfile({ ...profile, currencyCode: e.target.value })}
            className="bg-transparent border-none text-[8px] sm:text-[10px] font-black uppercase text-espresso focus:outline-none cursor-pointer p-0"
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code} className="font-sans font-bold bg-white text-black text-xs">
                {curr.symbol} {curr.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Record Expense (Moved directly below the Header) */}
      <div className="bg-milk border-4 border-black p-5 sm:p-6 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
        <div className="border-b-2 border-black pb-2">
          <h3 className="text-xl font-black uppercase tracking-tight text-espresso flex items-center gap-2">
            <span>✍️ Record Expense</span>
          </h3>
        </div>

        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          {/* Bank, Amount and Reason - Side by side sequence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-espresso mb-1.5">
                1. Select Bank *
              </label>
              <div className="relative">
                <select
                  id="expense_bank_select"
                  required
                  value={expenseBank}
                  onChange={(e) => setExpenseBank(e.target.value)}
                  className="w-full bg-white border-3 border-black px-3.5 py-3.5 text-black text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer appearance-none uppercase text-left"
                  style={{ padding: '12px' }}
                >
                  {bankAccounts.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-black font-bold">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-espresso mb-1.5">
                2. Amount ({symbol}) *
              </label>
              <input
                id="expense_amount_input"
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="e.g. 3000"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full bg-white border-3 border-black px-3.5 py-3 text-black text-sm font-mono font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] placeholder:text-zinc-400 focus:outline-none"
                style={{ height: '50px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-espresso mb-1.5">
                3. Reason *
              </label>
              <div className="relative">
                <select
                  id="expense_reason_select"
                  required
                  value={expenseReason}
                  onChange={(e) => setExpenseReason(e.target.value)}
                  className="w-full bg-white border-3 border-black px-3.5 py-3.5 text-black text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer appearance-none uppercase text-left"
                  style={{ padding: '12px' }}
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-black font-bold">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Custom option adder section */}
          <div className="bg-white/45 border-3 border-dashed border-black/20 p-3 space-y-2 mt-5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-espresso">
              ➕ Add Custom Reason
            </label>
            <div className="flex gap-2">
              <input
                id="custom_reason_name_input"
                type="text"
                placeholder="e.g. girlfriend, bills"
                value={customReasonInput}
                onChange={(e) => setCustomReasonInput(e.target.value)}
                className="flex-1 bg-white border-2 border-black max-h-9 px-2.5 py-1.5 text-xs font-bold focus:outline-none placeholder:text-zinc-400 uppercase"
              />
              <button
                id="add_reason_option_btn"
                type="button"
                onClick={handleAddReasonOption}
                className="bg-espresso hover:bg-latte text-white hover:text-espresso font-black uppercase text-[10px] tracking-wider px-3 border-2 border-black cursor-pointer transition-all active:scale-95 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
              >
                Add Option
              </button>
            </div>
          </div>

          <button
            id="submit_expense_btn"
            type="submit"
            className="w-full py-4 bg-espresso border-4 border-black text-white hover:bg-latte hover:text-espresso font-black text-sm uppercase tracking-wider shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer mt-3"
          >
            Record Expense 💸
          </button>
        </form>
      </div>

      {/* 2.5 Record Income (Directly below Record Expense) */}
      <div className="bg-white border-4 border-black p-5 sm:p-6 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
        <div className="border-b-2 border-black pb-2">
          <h3 className="text-xl font-black uppercase tracking-tight text-espresso flex items-center gap-2">
            <span>📈 Record Income</span>
          </h3>
        </div>

        <form onSubmit={handleInflowSubmit} className="space-y-4">
          {/* Bank, Amount and Reason - Side by side sequence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-espresso mb-1.5">
                1. Select Bank *
              </label>
              <div className="relative">
                <select
                  id="inflow_bank_select"
                  required
                  value={inflowBank}
                  onChange={(e) => setInflowBank(e.target.value)}
                  className="w-full bg-white border-3 border-black px-3.5 py-3.5 text-black text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer appearance-none uppercase text-left"
                  style={{ padding: '12px' }}
                >
                  {bankAccounts.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-black font-bold">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-espresso mb-1.5">
                2. Amount ({symbol}) *
              </label>
              <input
                id="inflow_amount_input"
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="e.g. 50000"
                value={inflowAmount}
                onChange={(e) => setInflowAmount(e.target.value)}
                className="w-full bg-white border-3 border-black px-3.5 py-3 text-black text-sm font-mono font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] placeholder:text-zinc-400 focus:outline-none"
                style={{ height: '50px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-espresso mb-1.5">
                3. Reason *
              </label>
              <div className="relative">
                <select
                  id="inflow_reason_select"
                  required
                  value={inflowReason}
                  onChange={(e) => setInflowReason(e.target.value)}
                  className="w-full bg-white border-3 border-black px-3.5 py-3.5 text-black text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer appearance-none uppercase text-left"
                  style={{ padding: '12px' }}
                >
                  {inflowReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-black font-bold">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Custom option adder section for Income */}
          <div className="bg-white/45 border-3 border-dashed border-black/20 p-3 space-y-2 mt-5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-espresso">
              ➕ Add Custom Reason
            </label>
            <div className="flex gap-2">
              <input
                id="custom_inflow_name_input"
                type="text"
                placeholder="e.g. freelance, crypto"
                value={customInflowInput}
                onChange={(e) => setCustomInflowInput(e.target.value)}
                className="flex-1 bg-white border-2 border-black max-h-9 px-2.5 py-1.5 text-xs font-bold focus:outline-none placeholder:text-zinc-400 uppercase"
              />
              <button
                id="add_inflow_option_btn"
                type="button"
                onClick={handleAddInflowReasonOption}
                className="bg-espresso hover:bg-latte text-white hover:text-espresso font-black uppercase text-[10px] tracking-wider px-3 border-2 border-black cursor-pointer transition-all active:scale-95 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
              >
                Add Option
              </button>
            </div>
          </div>

          <button
            id="submit_inflow_btn"
            type="submit"
            className="w-full py-4 bg-espresso border-4 border-black text-white hover:bg-latte hover:text-espresso font-black text-sm uppercase tracking-wider shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer mt-3"
          >
            Record Income
          </button>
        </form>
      </div>

      {/* 3. Live Vibe Ledger Section */}
      <div className="bg-white border-4 border-black p-5 sm:p-6 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
        <div className="flex flex-col gap-3 pb-3 border-b-2 border-black">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-xl font-black uppercase tracking-tight text-espresso flex items-center gap-2">
              <span>🗂️ Live Ledger</span>
            </h3>
          </div>

          {/* Filter Controls */}
          <div className="bg-milk/60 border-3 border-black p-3.5 space-y-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-espresso mt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-espresso">
                🔍 Filtering viewing mode:
              </span>
              <div className="grid grid-cols-3 bg-white border-2 border-black p-0.5 text-center font-black text-[10px] relative">
                <button
                  type="button"
                  id="filter_mode_day_btn"
                  onClick={() => { setFilterMode('day'); }}
                  className={`py-1.5 px-2 rounded-none font-black uppercase transition-all tracking-wider cursor-pointer ${
                    filterMode === 'day' 
                      ? 'bg-espresso text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                      : 'text-zinc-500 hover:text-espresso hover:bg-zinc-100'
                  }`}
                >
                  📅 Day-wise
                </button>
                <button
                  type="button"
                  id="filter_mode_month_btn"
                  onClick={() => { setFilterMode('month'); }}
                  className={`py-1.5 px-2 rounded-none font-black uppercase transition-all tracking-wider cursor-pointer ${
                    filterMode === 'month' 
                      ? 'bg-espresso text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                      : 'text-zinc-500 hover:text-espresso hover:bg-zinc-100'
                  }`}
                >
                  📁 Month-wise
                </button>
                <button
                  type="button"
                  id="filter_mode_year_btn"
                  onClick={() => { setFilterMode('year'); }}
                  className={`py-1.5 px-2 rounded-none font-black uppercase transition-all tracking-wider cursor-pointer ${
                    filterMode === 'year' 
                      ? 'bg-espresso text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                      : 'text-zinc-500 hover:text-espresso hover:bg-zinc-100'
                  }`}
                >
                  🗓️ Year-wise
                </button>
              </div>
            </div>

            {/* Sub-selector Dropdown */}
            <div className="flex items-center gap-2.5 bg-white border-2 border-black p-2 rounded-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-espresso/85 shrink-0 select-none">
                {filterMode === 'day' ? 'Select Date:' : filterMode === 'month' ? 'Select Month:' : 'Select Year:'}
              </span>
              <div className="relative flex-1">
                {filterMode === 'day' && (
                  <select
                    id="ledger_day_filter_dropdown"
                    value={selectedDayStr}
                    onChange={(e) => setSelectedDayStr(e.target.value)}
                    className="w-full bg-transparent font-black text-xs text-espresso focus:outline-none cursor-pointer uppercase py-1 select-none border-none outline-none"
                  >
                    <option value="all">🌟 ALL DAYS</option>
                    {uniqueDays.map((day) => (
                      <option key={day} value={day}>{day.toUpperCase()}</option>
                    ))}
                  </select>
                )}
                {filterMode === 'month' && (
                  <select
                    id="ledger_month_filter_dropdown"
                    value={selectedMonthStr}
                    onChange={(e) => setSelectedMonthStr(e.target.value)}
                    className="w-full bg-transparent font-black text-xs text-espresso focus:outline-none cursor-pointer uppercase py-1 select-none border-none outline-none"
                  >
                    <option value="all">🌟 ALL MONTHS</option>
                    {uniqueMonths.map((mo) => (
                      <option key={mo} value={mo}>{mo.toUpperCase()}</option>
                    ))}
                  </select>
                )}
                {filterMode === 'year' && (
                  <select
                    id="ledger_year_filter_dropdown"
                    value={selectedYearStr}
                    onChange={(e) => setSelectedYearStr(e.target.value)}
                    className="w-full bg-transparent font-black text-xs text-espresso focus:outline-none cursor-pointer uppercase py-1 select-none border-none outline-none"
                  >
                    <option value="all">🌟 ALL YEARS</option>
                    {uniqueYears.map((yr) => (
                      <option key={yr} value={yr}>{yr.toUpperCase()}</option>
                    ))}
                  </select>
                )}
                <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-xs text-black font-bold">
                  ▼
                </div>
              </div>
            </div>

            {/* Select Bank Dropdown inside Ledger Filtering Area */}
            <div className="flex items-center gap-2.5 bg-white border-2 border-black p-2 rounded-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-espresso/85 shrink-0 select-none">
                🏦 Filter Bank:
              </span>
              <div className="relative flex-1">
                <select
                  id="ledger_bank_filter_dropdown"
                  value={ledgerSelectedBank}
                  onChange={(e) => setLedgerSelectedBank(e.target.value)}
                  className="w-full bg-transparent font-black text-xs text-espresso focus:outline-none cursor-pointer uppercase py-1 select-none border-none outline-none"
                >
                  <option value="all">🌟 ALL BANKS COMBINED</option>
                  {bankAccounts.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-xs text-black font-bold">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact, slim styled rows with tight spacing and minimal height */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 border-3 border-dashed border-black bg-milk p-6">
                <p className="text-black/60 font-mono text-xs font-bold uppercase">No records found matching filters.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const timeStrOnly = tx.timestamp.includes('•') ? tx.timestamp.split('•')[1].trim() : tx.timestamp;
                return (
                  <motion.div
                    id={`tx_item_${tx.id}`}
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white hover:bg-milk/30 border-2 border-black p-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col gap-1.5 text-left"
                  >
                    {/* Top Row: [Sign] [Amount] on left, [Reason/Category] on right */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1 font-mono text-sm sm:text-base font-black whitespace-nowrap">
                        <span className={tx.type === 'incoming' ? 'text-green-600' : 'text-red-500'}>
                          {tx.type === 'incoming' ? '+' : '−'}
                        </span>
                        <span className="text-espresso">
                          {symbol}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                        </span>
                      </div>

                      {/* Selected reason/category aligned on the right side */}
                      <span className="text-xs font-black uppercase text-espresso tracking-tight truncate max-w-[150px] sm:max-w-[260px]">
                        {tx.title.startsWith('Spent on ') 
                          ? tx.title.replace('Spent on ', '') 
                          : tx.title.startsWith('Earned from ') 
                            ? tx.title.replace('Earned from ', '') 
                            : tx.title}
                      </span>
                    </div>

                    {/* Bottom Row: Date and time displayed below the entry in compact format with subtle bank name */}
                    <div className="flex items-center justify-between gap-2 border-t border-dashed border-zinc-100 pt-1 text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span>📆 {tx.txDate} {MONTH_NAMES[tx.txMonth - 1]} {tx.txYear}</span>
                        <span className="text-espresso/25 font-sans">|</span>
                        <span className="text-espresso font-extrabold uppercase">🏦 {tx.bank || bankAccounts[0]?.name || 'ICICI'}</span>
                      </div>
                      <span>⏰ {timeStrOnly.toUpperCase()}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. Live Vault Section (Moved directly below Live Vibe Ledger) */}
      <div className="bg-latte border-4 border-black p-6 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-espresso flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-espresso font-black uppercase tracking-widest text-xs">
              <Wallet className="w-4.5 h-4.5 text-espresso" />
              <span>🏦 Live Vault</span>
            </div>

            {/* Selector Dropdown to switch display context */}
            <div className="flex items-center gap-2">
              <label htmlFor="vault_bank_filter" className="text-[10px] font-black uppercase tracking-wider text-espresso select-none">
                Active Bank:
              </label>
              <div className="relative">
                <select
                  id="vault_bank_filter"
                  value={vaultSelectedBank}
                  onChange={(e) => setVaultSelectedBank(e.target.value)}
                  className="bg-white border-2 border-black rounded-xl pl-3 pr-8 py-1.5 text-xs font-black uppercase tracking-wider text-espresso focus:outline-none cursor-pointer appearance-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <option value="all">🌟 ALL BANKS COMBINED</option>
                  {bankAccounts.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[10px] text-espresso font-bold">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Huge Balance Figure dynamically sourced or aggregated */}
          {(() => {
            const currentMonthNow = new Date().getMonth() + 1;
            const currentYearNow = new Date().getFullYear();

            // Filter transactions based on selected vault bank
            const vaultBankTxs = transactions.filter(t => {
              if (vaultSelectedBank === 'all') return true;
              const txBank = t.bank || bankAccounts[0]?.name || 'ICICI';
              return txBank.toLowerCase() === vaultSelectedBank.toLowerCase();
            });

            // Calculate monthly inflow/outflow totals for the current month
            const monthlyInflowTotal = vaultBankTxs
              .filter(t => t.type === 'incoming' && t.month === currentMonthNow && t.year === currentYearNow)
              .reduce((sum, t) => sum + t.amount, 0);

            const monthlyOutflowTotal = vaultBankTxs
              .filter(t => t.type === 'outgoing' && t.month === currentMonthNow && t.year === currentYearNow)
              .reduce((sum, t) => sum + t.amount, 0);

            // Dynamic vault balance to display
            const displayVaultBalance = vaultSelectedBank === 'all'
              ? totalCombinedBalance
              : getBankBalance(vaultSelectedBank);

            return (
              <>
                <div className="my-4 font-heading flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                  <div>
                    <span className="text-espresso font-black text-4xl mr-1 select-none font-sans">{symbol}</span>
                    <span className="font-heading font-black text-5xl sm:text-7xl text-espresso tracking-tighter underline decoration-espresso decoration-6">
                      {displayVaultBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="text-[10px] uppercase font-black tracking-wider text-espresso/60 mt-2">
                      {vaultSelectedBank === 'all' ? 'Combined Net Asset Vault Value' : `${vaultSelectedBank.toUpperCase()} Net Live Value`}
                    </div>
                  </div>

                  {/* New Manage Bank Accounts Navigation Button */}
                  <button
                    id="manage_banks_navigation_btn"
                    type="button"
                    onClick={() => onNavigateToPage('link-banks')}
                    className="py-2.5 px-4 bg-espresso text-white hover:bg-latte hover:text-espresso border-2 border-black font-black uppercase text-[10px] tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <span>🏦 MANAGE BANKS</span>
                    <span className="bg-white text-espresso px-1.5 py-0.5 text-[8px] font-mono font-black border border-black transform rotate-1 rounded">
                      EDIT 🔗
                    </span>
                  </button>
                </div>

                {/* Sourced In (Monthly sum) vs Transferred Out (Monthly sum) */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t-2 border-black/15">
                  <div className="bg-white/80 p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      📥 Sourced In (Monthly)
                    </div>
                    <div className="text-sm sm:text-base font-black text-espresso mt-1 font-mono">
                      {symbol}{monthlyInflowTotal.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                    </div>
                    <div className="text-[8px] uppercase tracking-wide font-black text-espresso/45 mt-0.5">
                      Current month inflows
                    </div>
                  </div>

                  <div className="bg-white/80 p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1">
                      📤 Transferred Out (Monthly)
                    </div>
                    <div className="text-sm sm:text-base font-black text-espresso mt-1 font-mono">
                      {symbol}{monthlyOutflowTotal.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                    </div>
                    <div className="text-[8px] uppercase tracking-wide font-black text-espresso/45 mt-0.5">
                      Current month outflows
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* 5. Big Primary Call-to-Action for Interactive Charts & Live Telemetry */}
        <div className="pt-2">
          <button
            id="navigate_to_charts_btn"
            type="button"
            onClick={() => {
              onViewModeChange('charts');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full py-5 bg-espresso border-4 border-black text-white hover:bg-latte hover:text-espresso font-heading font-black text-xl md:text-2xl uppercase tracking-wider shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-3 select-none"
          >
            <span>📈 CHARTS & ANALYTICS</span>
            <span className="bg-white text-espresso px-2.5 py-0.5 text-xs font-mono font-black border-2 border-black transform rotate-2">
              GO! 📊
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
