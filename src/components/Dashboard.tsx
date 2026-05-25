import React, { useState } from 'react';
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
  Area 
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
}

export default function Dashboard({
  profile,
  transactions,
  onUpdateProfile,
  onUpdateTransactions,
  onLogout
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
  const [viewMode, setViewMode] = useState<'normal' | 'charts'>('normal');
  const [chartType, setChartType] = useState<'pie' | 'donut' | 'bar' | 'line'>('pie');
  const [analyticsDuration, setAnalyticsDuration] = useState<'day' | 'month' | 'year'>('month');
  const [analyticsSelectedBank, setAnalyticsSelectedBank] = useState<string>('all');
  const [analyticsType, setAnalyticsType] = useState<'expense' | 'inflow' | 'combined'>('combined');
  const [chartSelectedDay, setChartSelectedDay] = useState<string>('all');
  const [chartSelectedMonth, setChartSelectedMonth] = useState<string>('all');
  const [chartSelectedYear, setChartSelectedYear] = useState<string>('all');
  const [breakdownView, setBreakdownView] = useState<'reason' | 'category'>('reason');
  const [barGroupBy, setBarGroupBy] = useState<'category' | 'time' | 'bank'>('category');

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
      const totalInflowForPie = inflowTxs.reduce((sum, t) => sum + t.amount, 0);
      const totalOutflowForPie = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
      if (totalInflowForPie > 0 || totalOutflowForPie > 0) {
        pieData = [
          { name: '📥 Inflows (Earned)', value: parseFloat(totalInflowForPie.toFixed(2)), color: '#10B981' },
          { name: '📤 Outflows (Spent)', value: parseFloat(totalOutflowForPie.toFixed(2)), color: '#F43F5E' }
        ];
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
    if (barGroupBy === 'category') {
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
        <div className="bg-white border-4 border-black p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                id="back_to_dashboard_btn"
                type="button"
                onClick={() => {
                  setViewMode('normal');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center justify-center w-10 h-10 bg-white hover:bg-espresso text-espresso hover:text-white border-3 border-black text-sm font-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none shrink-0 animate-fade-in"
                title="Go Back"
              >
                ⬅️
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black flex items-center gap-2 font-heading">
                  <span>📊 GareebNoMore Insights Center</span>
                  <span className="text-[10px] bg-red-400 border border-black text-black font-mono font-bold uppercase py-0.5 px-2">
                    Live
                  </span>
                </h2>
                <p className="text-espresso/60 font-bold text-xs uppercase tracking-tight">
                  State-of-the-art interactive financials & savage visual telemetry.
                </p>
              </div>
            </div>

            <button
              id="header_back_cta_btn"
              type="button"
              onClick={() => {
                setViewMode('normal');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-espresso hover:bg-latte text-white hover:text-espresso border-3 border-black font-semibold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all cursor-pointer select-none"
            >
              Back to original dashboard
            </button>
          </div>
        </div>

        {/* Global Chart Filters Grid */}
        <div className="bg-latte/40 border-4 border-black p-5 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-espresso animate-fade-in">
          <div className="border-b-2 border-black pb-2 flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h3 className="text-sm font-black uppercase tracking-tight font-heading">Active Analytics Scope Filters</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. SELECT BANK FOR CHARTS */}
            <div className="space-y-1.5">
              <label htmlFor="charts_bank_dropdown" className="block text-[10px] font-black uppercase tracking-wider text-espresso">
                🏦 Select Bank:
              </label>
              <div className="relative">
                <select
                  id="charts_bank_dropdown"
                  value={analyticsSelectedBank}
                  onChange={(e) => setAnalyticsSelectedBank(e.target.value)}
                  className="w-full bg-white border-3 border-black rounded-none px-3 py-2.5 text-xs font-black uppercase tracking-wider text-espresso focus:outline-none cursor-pointer appearance-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none hover:translate-x-[-1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <option value="all">🌟 ALL BANKS COMBINED</option>
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

            {/* 2. SWITCH VISUALIZATION TYPE */}
            <div className="space-y-1.5">
              <label htmlFor="charts_flow_dropdown" className="block text-[10px] font-black uppercase tracking-wider text-espresso">
                💸 Flows Filter:
              </label>
              <div className="relative">
                <select
                  id="charts_flow_dropdown"
                  value={analyticsType}
                  onChange={(e) => setAnalyticsType(e.target.value as any)}
                  className="w-full bg-white border-3 border-black rounded-none px-3 py-2.5 text-xs font-black uppercase tracking-wider text-espresso focus:outline-none cursor-pointer appearance-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none hover:translate-x-[-1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <option value="combined">🌟 COMBINED CASH IN/OUT</option>
                  <option value="expense">⚠️ EXPENSES ONLY</option>
                  <option value="inflow">💰 INFLOWS ONLY</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-black font-bold">
                  ▼
                </div>
              </div>
            </div>

            {/* 3. SWITCH DURATION */}
            <div className="space-y-1.5">
              <label htmlFor="charts_duration_dropdown" className="block text-[10px] font-black uppercase tracking-wider text-espresso">
                ⏳ Duration Filter:
              </label>
              <div className="relative">
                <select
                  id="charts_duration_dropdown"
                  value={analyticsDuration}
                  onChange={(e) => setAnalyticsDuration(e.target.value as any)}
                  className="w-full bg-white border-3 border-black rounded-none px-3 py-2.5 text-xs font-black uppercase tracking-wider text-espresso focus:outline-none cursor-pointer appearance-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none hover:translate-x-[-1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <option value="day">📅 DAY-WISE ANALYSIS</option>
                  <option value="month">📂 MONTH-WISE ANALYSIS</option>
                  <option value="year">🗓️ YEAR-WISE ANALYSIS</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-black font-bold">
                  ▼
                </div>
              </div>
            </div>

            {/* 4. SUB RANGE CORRESPONDING SELECTION */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black uppercase tracking-wider text-espresso">
                {analyticsDuration === 'day' ? '📆 Select Specific Day:' : analyticsDuration === 'month' ? '📁 Select Specific Month:' : '🗓️ Select Specific Year:'}
              </span>
              <div className="relative">
                {analyticsDuration === 'day' && (
                  <select
                    id="charts_sub_day_dropdown"
                    value={chartSelectedDay}
                    onChange={(e) => setChartSelectedDay(e.target.value)}
                    className="w-full bg-white border-3 border-black rounded-none px-3 py-2.5 text-xs font-black uppercase tracking-wider text-espresso focus:outline-none cursor-pointer appearance-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none"
                  >
                    <option value="all">🌟 ALL KNOWN DAYS</option>
                    {chartUniqueDays.map(d => (
                      <option key={d} value={d}>{d.toUpperCase()}</option>
                    ))}
                  </select>
                )}
                {analyticsDuration === 'month' && (
                  <select
                    id="charts_sub_month_dropdown"
                    value={chartSelectedMonth}
                    onChange={(e) => setChartSelectedMonth(e.target.value)}
                    className="w-full bg-white border-3 border-black rounded-none px-3 py-2.5 text-xs font-black uppercase tracking-wider text-espresso focus:outline-none cursor-pointer appearance-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none"
                  >
                    <option value="all">🌟 ALL KNOWN MONTHS</option>
                    {chartUniqueMonths.map(m => (
                      <option key={m} value={m}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                )}
                {analyticsDuration === 'year' && (
                  <select
                    id="charts_sub_year_dropdown"
                    value={chartSelectedYear}
                    onChange={(e) => setChartSelectedYear(e.target.value)}
                    className="w-full bg-white border-3 border-black rounded-none px-3 py-2.5 text-xs font-black uppercase tracking-wider text-espresso focus:outline-none cursor-pointer appearance-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none"
                  >
                    <option value="all">🌟 ALL KNOWN YEARS</option>
                    {chartUniqueYears.map(y => (
                      <option key={y} value={y}>{y.toUpperCase()}</option>
                    ))}
                  </select>
                )}
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-black font-bold">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Display of active sum in beautiful cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[10px] font-black uppercase text-emerald-800">📥 Dynamic Inflows Sum</div>
            <div className="text-3xl font-heading font-black mt-1 text-espresso">
              {symbol}{totalFilteredIn.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
            </div>
            <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase mt-0.5">Sourced on selected scope</div>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[10px] font-black uppercase text-rose-500">📤 Dynamic Outflows Sum</div>
            <div className="text-3xl font-heading font-black mt-1 text-espresso">
              {symbol}{totalFilteredOut.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
            </div>
            <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase mt-0.5">Spent on selected scope</div>
          </div>

          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[10px] font-black uppercase text-espresso">📈 Dynamic Net Savings</div>
            <div className={`text-3xl font-heading font-black mt-1 ${netFilteredSavings >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
              {netFilteredSavings >= 0 ? '+' : ''}{symbol}{netFilteredSavings.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
            </div>
            <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase mt-0.5">Capital expansion/deficit</div>
          </div>
        </div>

        {/* Main Chart Card */}
        <div className="bg-white border-4 border-black p-5 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
          
          {/* Chart Tabs System */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-3 border-black pb-4 font-heading">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-espresso flex items-center gap-2">
                <span>📈 Visual Telemetry Feed</span>
              </h3>
              <p className="text-xs uppercase text-zinc-400 font-bold tracking-tight">
                Switch chart engines live instantly
              </p>
            </div>

            {/* Selection tab-grid */}
            <div className="flex items-center gap-1 bg-milk border-3 border-black p-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {(['pie', 'donut', 'bar', 'line'] as const).map((type) => {
                const label = type === 'pie' ? '🍕 Pie' : type === 'donut' ? '🍩 Donut' : type === 'bar' ? '📊 Bar' : '📈 Line';
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setChartType(type)}
                    className={`py-1.5 px-3.5 text-2xs sm:text-xs font-black uppercase tracking-wide select-none transition-all cursor-pointer ${
                      chartType === type 
                        ? 'bg-espresso text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                        : 'text-espresso hover:bg-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub Controls specific to the chart type */}
          {chartType === 'bar' && (
            <div className="flex items-center gap-2 flex-wrap text-2xs uppercase font-mono font-bold text-espresso">
              <span>🗂️ Group Bars by:</span>
              {(['category', 'time', 'bank'] as const).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setBarGroupBy(group)}
                  className={`px-2.5 py-1 border-2 border-black tracking-wider transition-all cursor-pointer ${
                    barGroupBy === group ? 'bg-black text-white' : 'bg-milk text-black hover:bg-zinc-100'
                  }`}
                >
                  {group === 'category' ? '📁 Category' : group === 'time' ? '⏰ Time Units' : '🏦 Linked Banks'}
                </button>
              ))}
            </div>
          )}

          {(chartType === 'pie' || chartType === 'donut') && analyticsType !== 'combined' && (
            <div className="flex items-center gap-2 flex-wrap text-2xs uppercase font-mono font-bold text-espresso">
              <span>🧩 Slices Representing:</span>
              {(['reason', 'category'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBreakdownView(mode)}
                  className={`px-2.5 py-1 border-2 border-black tracking-wider transition-all cursor-pointer ${
                    breakdownView === mode ? 'bg-black text-white' : 'bg-milk text-black hover:bg-zinc-100'
                  }`}
                >
                  {mode === 'reason' ? '⚡ User custom reason' : '📁 General category'}
                </button>
              ))}
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
                        label={({ name, percent, value }) => `${name}: ${symbol}${value.toLocaleString()} (${percent}%)`}
                        outerRadius={100}
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
                        formatter={(value: any) => [`${symbol}${parseFloat(value).toLocaleString('en-IN')}`, 'Weighted amount']}
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
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        labelLine={true}
                        label={({ name, percent, value }) => `${name}: ${symbol}${value.toLocaleString()} (${percent}%)`}
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
                        formatter={(value: any) => [`${symbol}${parseFloat(value).toLocaleString('en-IN')}`, 'Weighted amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'bar' && (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
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
                      <Legend 
                        wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 'bold' }}
                      />
                      {analyticsType !== 'expense' && (
                        <Bar 
                          dataKey="Inflow" 
                          fill="#10B981" 
                          stroke="#000000" 
                          strokeWidth={2.5} 
                          radius={[4, 4, 0, 0]} 
                        />
                      )}
                      {analyticsType !== 'inflow' && (
                        <Bar 
                          dataKey="Expense" 
                          fill="#F43F5E" 
                          stroke="#000000" 
                          strokeWidth={2.5} 
                          radius={[4, 4, 0, 0]} 
                        />
                      )}
                      {analyticsType === 'combined' && (
                        <Bar 
                          dataKey="Net" 
                          fill="#FFD93D" 
                          stroke="#000000" 
                          strokeWidth={2.5} 
                          radius={[4, 4, 0, 0]} 
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'line' && (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={lineData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
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
                        />
                      )}
                      {analyticsType !== 'inflow' && (
                        <Area 
                          type="monotone" 
                          dataKey="Expense" 
                          stroke="#F43F5E" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorExpense)" 
                        />
                      )}
                      {analyticsType === 'combined' && (
                        <Line 
                          type="monotone" 
                          dataKey="Net" 
                          stroke="#FFD93D" 
                          strokeWidth={4} 
                          dot={{ stroke: '#000000', strokeWidth: 2, r: 4 }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
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
                💡 Intelligent Smart Summary & insights
              </h3>
            </div>
            <span className="bg-white text-espresso border-2 border-black font-mono font-black uppercase text-[8px] px-2 py-0.5 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
              AI CHOMU ALGORITHM v1.02
            </span>
          </div>

          {/* Savage Financial Roast Word-Art Statement */}
          <div className="bg-white/5 border-2 border-dashed border-latte/20 p-4 font-mono text-xs text-center border-spacing-2 select-text relative mb-6">
            <span className="absolute -top-2.5 left-3 px-1.5 py-0.5 bg-espresso text-[8px] text-latte font-bold uppercase tracking-wider">
              FINANCIAL AUDIT
            </span>
            <p className="text-white font-black text-sm leading-relaxed mb-1 italic">
              "{trendHumor}"
            </p>
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
      {/* 1. Trimmed Down Header Banner */}
      <div className="bg-white border-3 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            {/* Trimmed Avatar Area */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full border-3 border-black bg-latte p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                {profile.avatarId === 'custom' && profile.customAvatarData ? (
                  <img
                    id="dashboard_user_avatar"
                    src={profile.customAvatarData}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xl">
                    {profile.avatarId === 'custom' ? '🗿' : (profile.avatarId === 'fox' ? '🦊' : (profile.avatarId === 'stonks' ? '💸' : (profile.avatarId === 'nails' ? '💅' : (profile.avatarId === 'arcade' ? '👾' : (profile.avatarId === 'alien' ? '🛸' : (profile.avatarId === 'boss' ? '👑' : (profile.avatarId === 'beast' ? '🦁' : '🗿')))))))}
                  </span>
                )}
              </div>
              
              {/* Compact XP Badge */}
              <div className="absolute -bottom-1 -right-1 bg-espresso border border-black text-latte text-[8px] font-black px-1 py-0.5 rounded-none font-mono flex items-center gap-0.5 shadow-sm">
                <Star className="w-2 h-2 fill-latte" />
                <span>{profile.experiencePoints}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 id="dashboard_welcome_name" className="text-lg sm:text-xl font-black uppercase tracking-tight text-black">
                  Yo, {profile.name}!
                </h2>
              </div>
              
              {/* Ultra Mini Quote */}
              <div className="text-[10px] font-bold text-black/75 flex items-center gap-1.5 mt-0.5 leading-none">
                <span>"{randomQuote}"</span>
                <button
                  id="cycle_quote_btn"
                  onClick={handleCycleQuote}
                  className="bg-latte border border-black text-espresso p-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-espresso hover:text-white transition-colors cursor-pointer rounded-sm"
                  title="Get inspiration"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Compact Header Actions */}
          <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto">
            <button
              id="wipe_ledger_btn"
              onClick={handleWipeLedger}
              className={`flex items-center gap-1 px-2.5 py-1.5 border-2 border-black font-mono font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer select-none ${
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
              className="flex items-center gap-1 px-2.5 py-1.5 bg-espresso hover:bg-latte border-2 border-black text-white hover:text-espresso font-mono font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer select-none"
            >
              <LogOut className="w-3 h-3" />
              <span>Reset Setup</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1.5 Mini Currency Selection Block */}
      <div className="bg-white border-2 border-black rounded-lg py-1 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2 text-espresso text-[11px] font-mono select-none">
        <div className="flex items-center gap-1.5">
          <span>💱</span>
          <span className="font-extrabold uppercase tracking-tight text-[10px] text-espresso/80">Currency:</span>
          <span className="bg-espresso text-milk px-1.5 py-0.5 rounded font-black text-[9px] uppercase">
            {profile.currencyCode || 'INR'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <select
              id="compact_currency_dropdown"
              value={profile.currencyCode || 'INR'}
              onChange={(e) => onUpdateProfile({ ...profile, currencyCode: e.target.value })}
              className="bg-milk/60 hover:bg-milk border border-black rounded px-1.5 py-0.5 text-[10px] font-black uppercase text-espresso focus:outline-none cursor-pointer"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code} className="font-sans font-bold">
                  {curr.symbol} {curr.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Record Expense (Moved directly below the Header) */}
      <div className="bg-milk border-4 border-black p-5 sm:p-6 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
        <div className="border-b-2 border-black pb-2">
          <h3 className="text-xl font-black uppercase tracking-tight text-espresso flex items-center gap-2">
            <span>✍️ Record Expense</span>
          </h3>
          <p className="text-espresso/70 font-bold text-xs mt-1 uppercase tracking-tight">
            Log outflows with instant bank selection, amount and reason controls.
          </p>
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
              ➕ Add Custom Dropdown Option
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

      {/* 2.5 Record Inflow (Directly below Record Expense) */}
      <div className="bg-white border-4 border-black p-5 sm:p-6 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
        <div className="border-b-2 border-black pb-2">
          <h3 className="text-xl font-black uppercase tracking-tight text-espresso flex items-center gap-2">
            <span>📈 Record Inflow</span>
          </h3>
          <p className="text-espresso/70 font-bold text-xs mt-1 uppercase tracking-tight">
            Log financial gains and income sources with instant bank categorization.
          </p>
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

          {/* Custom option adder section for Inflows */}
          <div className="bg-white/45 border-3 border-dashed border-black/20 p-3 space-y-2 mt-5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-espresso">
              ➕ Add Custom Inflow Dropdown Option
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
            Record Inflow
          </button>
        </form>
      </div>

      {/* 3. Live Vibe Ledger Section */}
      <div className="bg-white border-4 border-black p-5 sm:p-6 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
        <div className="flex flex-col gap-3 pb-3 border-b-2 border-black">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-xl font-black uppercase tracking-tight text-espresso flex items-center gap-2">
              <span>🗂️ Live Vibe Ledger</span>
              <span className="text-xs bg-latte text-espresso border-2 border-black px-2.5 py-0.5 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                {filteredTransactions.length} of {transactions.length} MOVE(S)
              </span>
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

      {/* 4. Direct Live Vault Section (Moved directly below Live Vibe Ledger) */}
      <div className="bg-latte border-4 border-black p-6 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-espresso flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-espresso font-black uppercase tracking-widest text-xs">
              <Wallet className="w-4.5 h-4.5 text-espresso" />
              <span>🏦 Direct Live Vault</span>
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

                  {/* Toggle Add Bank Action Button */}
                  <button
                    id="toggle_add_bank_form_btn"
                    type="button"
                    onClick={() => setIsAddingBank(!isAddingBank)}
                    className="py-2 px-4 bg-white hover:bg-espresso text-espresso hover:text-white border-2 border-black font-black uppercase text-[10px] tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer active:scale-95"
                  >
                    {isAddingBank ? '✖ Close Form' : '➕ Link Bank Account'}
                  </button>
                </div>

                {/* Dynamic inline container form to add banks */}
                <AnimatePresence>
                  {isAddingBank && (
                    <motion.form
                      id="vault_add_bank_form"
                      onSubmit={handleAddBankSubmit}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white/60 border-2 border-dashed border-espresso/35 p-4 space-y-3 rounded-none mb-4 overflow-hidden"
                    >
                      <div className="text-xs font-black uppercase tracking-wider text-espresso">
                        ➕ Link Dynamic Bank Account
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-black uppercase tracking-widest text-espresso/80 mb-1">
                            Bank Name (e.g. SBI, Axis) *
                          </label>
                          <input
                            id="new_bank_name_input"
                            type="text"
                            required
                            placeholder="e.g. Axis"
                            value={newBankName}
                            onChange={(e) => setNewBankName(e.target.value)}
                            className="w-full bg-white border-2 border-black px-2.5 py-1.5 text-xs font-bold focus:outline-none placeholder:text-zinc-400 uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase tracking-widest text-espresso/80 mb-1">
                            Starting Balance *
                          </label>
                          <input
                            id="new_bank_balance_input"
                            type="number"
                            required
                            min="0"
                            step="any"
                            placeholder="e.g. 10000"
                            value={newBankStartingBalance}
                            onChange={(e) => setNewBankStartingBalance(e.target.value)}
                            className="w-full bg-white border-2 border-black px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none placeholder:text-zinc-400"
                          />
                        </div>
                      </div>
                      <button
                        id="confirm_link_bank_btn"
                        type="submit"
                        className="w-full py-2 bg-espresso text-white hover:bg-white hover:text-espresso border-2 border-black text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                      >
                        Verify and Link Account ⚡
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Sourced In (Monthly sum) vs Transferred Out (Monthly sum) */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t-2 border-black/15">
                  <div className="bg-white/80 p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      📥 Sourced In (Monthly)
                    </div>
                    <div className="text-xl font-black text-espresso mt-1 font-mono">
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
                    <div className="text-xl font-black text-espresso mt-1 font-mono">
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
              setViewMode('charts');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full py-5 bg-espresso border-4 border-black text-white hover:bg-latte hover:text-espresso font-heading font-black text-xl md:text-2xl uppercase tracking-wider shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-3 select-none"
          >
            <span>📈 Open Charts & Telemetry Analytics</span>
            <span className="bg-white text-espresso px-2.5 py-0.5 text-xs font-mono font-black border-2 border-black transform rotate-2">
              GO! 📊
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
