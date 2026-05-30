import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, ArrowRight, ShieldCheck, Landmark, Check, HelpCircle } from 'lucide-react';
import { BankAccount } from '../types';

interface LinkBanksProps {
  initialBanks: BankAccount[];
  onSave: (banks: BankAccount[]) => void;
  onBack?: () => void;
  isOnboarding: boolean;
}

const PRESET_BANKS = [
  'SBI',
  'HDFC',
  'ICICI',
  'Axis',
  'Kotak',
  'PNB',
  'Paytm Bank',
  'Google Pay / GPay'
];

export default function LinkBanks({ initialBanks, onSave, onBack, isOnboarding }: LinkBanksProps) {
  const [banks, setBanks] = useState<BankAccount[]>(initialBanks || []);
  const [newBankName, setNewBankName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddBank = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    if (banks.some(b => b.name.toLowerCase() === cleanName.toLowerCase())) {
      setErrorMsg(`"${cleanName.toUpperCase()}" is already linked, homie! 🏦`);
      return;
    }

    setErrorMsg(null);
    setBanks([...banks, { name: cleanName, startingBalance: 0 }]);
    setNewBankName('');
  };

  const handleDeleteBank = (name: string) => {
    setBanks(banks.filter(b => b.name !== name));
  };

  const handleTogglePreset = (preset: string) => {
    const exists = banks.some(b => b.name.toLowerCase() === preset.toLowerCase());
    if (exists) {
      handleDeleteBank(preset);
    } else {
      handleAddBank(preset);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (banks.length === 0) {
      setErrorMsg("Link at least one bank account to track your money bags! 💰");
      return;
    }
    onSave(banks);
  };

  return (
    <div id="link_banks_page_container" className="w-full max-w-lg mx-auto bg-white border-4 border-black p-6 sm:p-8 relative overflow-hidden shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black">
      
      {/* Dynamic Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-full bg-latte/30 border-2 border-black flex items-center justify-center font-bold text-lg select-none">
            2
          </span>
          <span className="font-mono text-xs font-black uppercase tracking-widest text-espresso/60">
            Onboarding Phase 02
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-espresso mb-1">
          Link Your <span className="bg-espresso text-white px-2 py-0.5 inline-block transform -skew-x-6 border border-black">Bank Accounts</span>
        </h1>
        <p className="text-espresso font-extrabold text-[11px] uppercase tracking-wider max-w-md mx-auto bg-latte/15 px-3 py-1 border border-espresso/10 inline-block mt-2">
          Select or add all banks you hold accounts in to sync live ledger analytics!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preset Bank quick badges */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-widest text-espresso mb-2.5">
            ⚡ Quick Click Presets (Tap to Link/Unlink)
          </label>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
            {PRESET_BANKS.map((preset) => {
              const isSelected = banks.some(b => b.name.toLowerCase() === preset.toLowerCase());
              return (
                <button
                  id={`preset_bank_toggle_${preset.replace(/\s+/g, '_')}`}
                  key={preset}
                  type="button"
                  onClick={() => handleTogglePreset(preset)}
                  className={`py-2 px-1 relative overflow-hidden border-2 border-black font-black uppercase text-[10px] tracking-tight transition-all cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? 'bg-espresso text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:bg-milk text-espresso shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isSelected && <Check size={11} strokeWidth={3} className="text-emerald-400" />}
                    <span>{preset}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input to mention banks */}
        <div className="space-y-2">
          <label htmlFor="custom_bank_input_field" className="block text-[11px] font-black uppercase tracking-widest text-espresso">
            ✍️ Mention your bank name manually
          </label>
          <div className="flex gap-2">
            <input
              id="custom_bank_input_field"
              type="text"
              placeholder="e.g. Kotak Mahindra Bank"
              value={newBankName}
              onChange={(e) => {
                setNewBankName(e.target.value);
                setErrorMsg(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBank(newBankName);
                }
              }}
              className="flex-1 bg-white border-3 border-black px-3 py-2 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none uppercase placeholder:text-zinc-400"
            />
            <button
              id="add_bank_manual_btn"
              type="button"
              onClick={() => handleAddBank(newBankName)}
              className="py-2.5 px-4 bg-latte text-espresso border-3 border-black hover:bg-espresso hover:text-white font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Add</span>
            </button>
          </div>
          {errorMsg && (
            <p className="text-red-700 font-mono font-black text-[11px] uppercase mt-1">
              ⚠️ {errorMsg}
            </p>
          )}
        </div>

        {/* List of currently linked customer accounts */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-espresso">
              💼 Your Linked Bank Accounts ({banks.length})
            </span>
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">
              All these banks will be considered
            </span>
          </div>

          {banks.length === 0 ? (
            <div className="border-2 border-dashed border-zinc-300 py-6 text-center text-zinc-400 uppercase font-mono text-xs">
              No bank names linked yet. Tap presets above or type a name! 🏦
            </div>
          ) : (
            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
              {banks.map((b) => (
                <div
                  id={`linked_bank_row_${b.name.replace(/\s+/g, '_')}`}
                  key={b.name}
                  className="flex items-center justify-between bg-zinc-50 border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-espresso font-black text-xs uppercase">
                    <Landmark size={14} className="text-espresso shrink-0" />
                    <span>{b.name}</span>
                  </div>
                  <button
                    id={`delete_linked_bank_btn_${b.name.replace(/\s+/g, '_')}`}
                    type="button"
                    onClick={() => handleDeleteBank(b.name)}
                    className="p-1 px-2 border-2 border-transparent hover:border-black hover:bg-rose-50 text-rose-600 hover:text-red-700 transition-all cursor-pointer"
                    title={`Delete account ${b.name}`}
                  >
                    <Trash2 size={13} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Shield Notice */}
        <div className="bg-emerald-50 border-2 border-emerald-800 p-3 flex gap-2 items-start">
          <ShieldCheck size={16} className="text-emerald-800 shrink-0 mt-0.5" />
          <div className="text-[9px] uppercase font-black tracking-tight text-emerald-900 leading-tight">
            DECENTRALIZED ENCRYPTION LOGIC ACTIVE. NO TRADING OF SENSITIVE USER BANK CREDENTIALS OCCURS. ALL LEDGER TRANSACTIONS PERSIST PRIVATELY LOCALLY!
          </div>
        </div>

        {/* Footer Navigation bar */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t-2 border-black/10">
          {!isOnboarding && onBack && (
            <button
              id="back_to_dashboard_from_banks_btn"
              type="button"
              onClick={onBack}
              className="py-3 px-5 border-3 border-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer active:scale-95 bg-white text-espresso shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-milk"
            >
              ⬅ Cancel
            </button>
          )}

          <button
            id="banks_submit_next_btn"
            type="submit"
            className="flex-1 py-3 px-5 bg-espresso text-white border-3 border-black hover:bg-latte hover:text-espresso font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none"
          >
            <span>{isOnboarding ? "Save & Proceed to Dash 🚀" : "Save changes & Back 💾"}</span>
            <ArrowRight size={15} strokeWidth={3} />
          </button>
        </div>
      </form>
    </div>
  );
}
