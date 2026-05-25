import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Camera, Sparkles, Wand2, ShieldAlert } from 'lucide-react';
import { PresetAvatar, UserProfile } from '../types';
import { PRESET_AVATARS } from '../constants';

interface LoginOnboardingProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function LoginOnboarding({ onLoginSuccess }: LoginOnboardingProps) {
  const [name, setName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('chad');
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setUploadError('File size too big, absolute max 2MB of pure vibe!');
        return;
      }
      setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatar(reader.result as string);
        setSelectedAvatarId('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (id: string) => {
    setSelectedAvatarId(id);
  };

  const handleRandomizeName = () => {
    const firstNames = ['Gareeb', 'Pappu', 'Crypto', 'Sigma', 'Hustler', 'Boba', 'Stonks', 'Vibe', 'Rizz', 'Cheetah'];
    const lastNames = ['Chaser', 'Lord', 'Whale', 'Enjoyer', 'TaxEvader', 'Maximalist', 'Paisa', 'GigaChad', 'Mogger'];
    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    setName(`${randomFirst} ${randomLast}`);
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initialProfile: UserProfile = {
      name: name.trim(),
      avatarId: selectedAvatarId,
      customAvatarData: selectedAvatarId === 'custom' ? (customAvatar || undefined) : undefined,
      balance: 0, // Fresh starting balance at 0 level
      savingsGoal: 50000,
      savingsGoalName: 'Drip VIP Sneaker Drop 👟',
      experiencePoints: 0, // Fresh start at 0 XP
      currencyCode: 'INR',
      banks: [
        { name: 'ICICI', startingBalance: 0 },
        { name: 'HDFC', startingBalance: 0 }
      ]
    };

    onLoginSuccess(initialProfile);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white border-4 border-black p-6 sm:p-8 relative overflow-hidden shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black">
      
      {/* Brand title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-espresso mb-2">
          Gareeb<span className="text-white select-all bg-espresso px-2.5 py-1.5 ml-1.5 inline-block transform -skew-x-6 border-2 border-black">NoMore</span>
        </h1>
        <p className="text-espresso font-extrabold text-[12px] uppercase tracking-wider max-w-sm mx-auto font-sans bg-latte/20 px-3.5 py-1.5 border border-espresso/15 inline-block">
          Your freaking awesome budget tracking app ✨
        </p>
      </div>

      <form onSubmit={handleProceed} className="space-y-6">
        {/* Name input section */}
        <div>
          <div className="mb-2">
            <label className="text-xs font-black uppercase tracking-widest text-espresso">
              Vibe Name *
            </label>
          </div>
          <div className="relative">
            <input
              id="user_name_input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GareebKing"
              maxLength={25}
              className="w-full bg-white border-4 border-black px-4 py-3.5 text-black font-sans text-xl font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Avatar/Profile Pic Selector */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-espresso mb-3">
            Profile Sauce
          </label>

          {/* Combined Image preview / Custom Upload Box */}
          <div className="flex items-center gap-5 bg-milk p-4.5 border-4 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] mb-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full border-4 border-black bg-latte flex items-center justify-center overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                {selectedAvatarId === 'custom' && customAvatar ? (
                  <img
                    id="user_custom_avatar_preview"
                    src={customAvatar}
                    alt="Custom Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-4xl">
                    {PRESET_AVATARS.find(a => a.id === selectedAvatarId)?.emoji || '👀'}
                  </span>
                )}
              </div>
              <button
                id="camera_trigger_btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-espresso border-2 border-black text-white p-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-90 transition-transform"
                title="Upload customizable profile picture"
              >
                <Camera className="w-4 h-4 text-latte" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-espresso text-base font-black truncate uppercase tracking-tight">
                {selectedAvatarId === 'custom' ? 'Custom Upload Card' : PRESET_AVATARS.find(a => a.id === selectedAvatarId)?.name}
              </p>
              <p className="text-espresso/70 text-xs truncate italic font-semibold">
                {selectedAvatarId === 'custom' ? 'Ready to flex custom photo ⚡' : PRESET_AVATARS.find(a => a.id === selectedAvatarId)?.tagline}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Quick Preset Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            {PRESET_AVATARS.map((avatar) => (
              <button
                id={`preset_avatar_${avatar.id}`}
                key={avatar.id}
                type="button"
                onClick={() => handlePresetSelect(avatar.id)}
                className={`group py-3.5 rounded-xl border-3 transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden ${
                  selectedAvatarId === avatar.id
                    ? 'border-black bg-latte shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold scale-[1.03]'
                    : 'border-black bg-white hover:bg-milk shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <span className="text-2xl mb-1 filter drop-shadow-sm group-hover:scale-110 transition-transform">
                  {avatar.emoji}
                </span>
                <span className="text-[10px] font-mono text-espresso font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[90%] uppercase tracking-tight">
                  {avatar.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
          {uploadError && (
            <p className="text-red-700 text-xs mt-2.5 font-mono flex items-center gap-1 font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" /> {uploadError}
            </p>
          )}
        </div>

        {/* Proceed Button */}
        <button
          id="proceed_to_app_btn"
          type="submit"
          disabled={!name.trim()}
          className={`w-full h-18 border-4 border-black text-2xl font-black uppercase transition-all duration-200 flex items-center justify-center gap-2 outline-none ${
            name.trim()
              ? 'bg-espresso text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-latte hover:text-espresso hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer'
              : 'bg-zinc-200 text-zinc-500 border-zinc-400 cursor-not-allowed shadow-none'
          }`}
        >
          Let's Gooo! 🚀
        </button>
      </form>
    </div>
  );
}
