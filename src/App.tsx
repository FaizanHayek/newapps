import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from './types';
import { INITIAL_TRANSACTIONS } from './constants';
import LoginOnboarding from './components/LoginOnboarding';
import Dashboard from './components/Dashboard';
import { Sparkles, Terminal, Heart } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from local storage directly upon mounting
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('gareebnomore_profile');
      const storedTransactions = localStorage.getItem('gareebnomore_txs');

      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      } else {
        // Fallback to presets for a beautiful loaded look
        setTransactions(INITIAL_TRANSACTIONS);
      }
    } catch (err) {
      console.error('Error reading LocalStorage values:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save changes to local storage whenever profile or transactions are updated
  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('gareebnomore_profile', JSON.stringify(newProfile));
  };

  const handleUpdateTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem('gareebnomore_txs', JSON.stringify(newTransactions));
  };

  const handleLogout = () => {
    localStorage.removeItem('gareebnomore_profile');
    localStorage.removeItem('gareebnomore_txs');
    setProfile(null);
    setTransactions(INITIAL_TRANSACTIONS);
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
    <div className="min-h-screen bg-milk text-black flex flex-col justify-between font-sans relative antialiased selection:bg-latte selection:text-black">
      
      {/* 1. Dark Espresso Brutalist Header */}
      <header className="h-20 border-b-4 border-black bg-espresso sticky top-0 z-50 flex items-center shadow-[0_4px_0px_0px_rgba(0,0,0,0.15)]">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-4 border-black bg-white text-espresso flex items-center justify-center font-black text-xl hover:rotate-6 transition-transform select-none">
              ₹
            </div>
            <span className="font-heading font-black text-2xl sm:text-3xl italic uppercase tracking-tighter text-white">
              Gareeb<span className="bg-latte text-espresso px-2 py-0.5 ml-1 inline-block transform -skew-x-6">NoMore</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main content area with warm cream background */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative">
        <AnimatePresence mode="wait">
          {!profile ? (
            <motion.div
              id="onboarding_screen_container"
              key="onboarding"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center"
            >
              <LoginOnboarding onLoginSuccess={handleUpdateProfile} />
            </motion.div>
          ) : (
            <motion.div
              id="dashboard_screen_container"
              key="dashboard"
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

