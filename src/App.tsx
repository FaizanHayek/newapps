import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from './types';
import { INITIAL_TRANSACTIONS } from './constants';
import LoginOnboarding from './components/LoginOnboarding';
import LinkBanks from './components/LinkBanks';
import Dashboard from './components/Dashboard';
import { Sparkles, Terminal, Heart, Sun, Moon } from 'lucide-react';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$'
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Four-page Routing: 'login' | 'link-banks' | 'dashboard' | 'charts'
  const [currentPage, setCurrentPage] = useState<'login' | 'link-banks' | 'dashboard' | 'charts'>('login');

  // Night Mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('gareebnomore_dark') === 'true';
  });

  // Sync Dark/Night Mode selection with root document elements
  useEffect(() => {
    localStorage.setItem('gareebnomore_dark', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load from local storage directly upon mounting
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('gareebnomore_profile');
      const storedTransactions = localStorage.getItem('gareebnomore_txs');

      let initialPage: 'login' | 'link-banks' | 'dashboard' | 'charts' = 'login';
      let loadedProfile: UserProfile | null = null;

      if (storedProfile) {
        loadedProfile = JSON.parse(storedProfile);
        setProfile(loadedProfile);
        initialPage = 'dashboard';
      }

      // Restore session history page value if present
      if (window.history.state && window.history.state.page) {
        const hs = window.history.state.page;
        if (loadedProfile && (hs === 'dashboard' || hs === 'charts' || hs === 'link-banks')) {
          initialPage = hs;
        } else if (!loadedProfile && (hs === 'login' || hs === 'link-banks')) {
          initialPage = hs;
        }
      }

      setCurrentPage(initialPage);
      window.history.replaceState({ page: initialPage }, '');

      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
      }
    } catch (err) {
      console.error('Error reading LocalStorage values:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for browser popstate / back-gesture events
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        const popPg = event.state.page;
        if (profile) {
          if (popPg === 'dashboard' || popPg === 'charts' || popPg === 'link-banks') {
            setCurrentPage(popPg);
          }
        } else {
          if (popPg === 'login' || popPg === 'link-banks') {
            setCurrentPage(popPg);
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [profile]);

  // Navigation transition trigger with pushState history tracking
  const navigateTo = (targetPage: 'login' | 'link-banks' | 'dashboard' | 'charts') => {
    if (currentPage !== targetPage) {
      window.history.pushState({ page: targetPage }, '');
      setCurrentPage(targetPage);
    }
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('gareebnomore_profile', JSON.stringify(newProfile));
  };

  const handleUpdateTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem('gareebnomore_txs', JSON.stringify(newTransactions));
  };

  const handleProceedFromLogin = (draftProfile: UserProfile) => {
    setTempProfile(draftProfile);
    navigateTo('link-banks');
  };

  const handleLogout = () => {
    localStorage.removeItem('gareebnomore_profile');
    localStorage.removeItem('gareebnomore_txs');
    setProfile(null);
    setTempProfile(null);
    setTransactions(INITIAL_TRANSACTIONS);
    navigateTo('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-espresso flex flex-col items-center justify-center font-mono text-xs text-latte">
        <div className="w-8 h-8 rounded-full border-2 border-latte border-t-transparent animate-spin mb-3" />
        <span>BOOTING GAREEB_NO_MORE.EXE...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-milk text-black flex flex-col justify-between font-sans relative antialiased selection:bg-latte selection:text-black transition-colors duration-200">
      
      {/* 1. Dark Espresso Brutalist Header */}
      <header className="h-20 border-b-4 border-black bg-espresso sticky top-0 z-50 flex items-center shadow-[0_4px_0px_0px_rgba(0,0,0,0.15)] select-none">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-4 border-black bg-white text-espresso flex items-center justify-center font-black text-xl hover:rotate-6 transition-transform">
              {profile?.currencyCode ? (CURRENCY_SYMBOLS[profile.currencyCode] || '₹') : '₹'}
            </div>
            <span className="font-heading font-black text-2xl sm:text-3xl italic uppercase tracking-tighter text-white">
              Gareeb<span className="bg-latte text-espresso px-2 py-0.5 ml-1 inline-block transform -skew-x-6 border border-black">NoMore</span>
            </span>
          </div>

          {/* Interactive Day/Night Mode Toggle */}
          <button
            id="app_night_mode_toggle_btn"
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="py-2 px-3 sm:py-2.5 sm:px-4 bg-white hover:bg-[#F2EAE5] text-espresso border-3 border-black font-black uppercase text-[10px] tracking-wide rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-0.5px] hover:translate-y-[0.5px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            title="Toggle Day/Night Mode Style"
          >
            {darkMode ? (
              <>
                <Sun size={14} strokeWidth={3} className="text-amber-500 animate-[spin_10s_linear_infinite]" />
                <span className="hidden xs:inline">Day Mode</span>
              </>
            ) : (
              <>
                <Moon size={14} strokeWidth={3} className="text-zinc-700" />
                <span className="hidden xs:inline">Night Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main content area with transitions */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative transition-colors duration-200">
        <AnimatePresence mode="wait">
          
          {/* Page 1: Login Onboarding */}
          {currentPage === 'login' && !profile && (
            <motion.div
              id="onboarding_screen_container"
              key="login-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center"
            >
              <LoginOnboarding onLoginSuccess={handleProceedFromLogin} />
            </motion.div>
          )}

          {/* Page 2: Link Bank Accounts Onboarding/Management screen */}
          {currentPage === 'link-banks' && (
            <motion.div
              id="link_banks_screen_container"
              key="link-banks-page"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center"
            >
              <LinkBanks
                initialBanks={profile ? (profile.banks || []) : (tempProfile?.banks || [])}
                isOnboarding={!profile}
                onBack={() => {
                  if (profile) {
                    navigateTo('dashboard');
                  } else {
                    navigateTo('login');
                  }
                }}
                onSave={(newBanks) => {
                  if (profile) {
                    const updated = { ...profile, banks: newBanks };
                    handleUpdateProfile(updated);
                    navigateTo('dashboard');
                  } else if (tempProfile) {
                    const finalProfile = { ...tempProfile, banks: newBanks };
                    handleUpdateProfile(finalProfile);
                    navigateTo('dashboard');
                  }
                }}
              />
            </motion.div>
          )}

          {/* Page 3 & Page 4: Main Dashboard / Ledger / Live Vault & Charts view */}
          {profile && (currentPage === 'dashboard' || currentPage === 'charts') && (
            <motion.div
              id="dashboard_screen_container"
              key="dashboard-page"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-5xl mx-auto"
            >
              <Dashboard
                profile={profile}
                transactions={transactions}
                onUpdateProfile={handleUpdateProfile}
                onUpdateTransactions={handleUpdateTransactions}
                onLogout={handleLogout}
                viewMode={currentPage === 'charts' ? 'charts' : 'normal'}
                onViewModeChange={(mode) => {
                  navigateTo(mode === 'charts' ? 'charts' : 'dashboard');
                }}
                onNavigateToPage={(target) => navigateTo(target)}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 3. High Contrast Brutalist Footer */}
      <footer className="border-t-4 border-black bg-espresso py-4 text-center text-latte font-mono">
        <div className="max-w-7xl mx-auto px-4 text-xs font-bold uppercase tracking-wider">
          © 2026 GareebNoMore
        </div>
      </footer>

    </div>
  );
}
