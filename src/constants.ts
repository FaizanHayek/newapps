import { PresetAvatar, Transaction } from './types';

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'chad', emoji: '🗿', name: 'Chad Chief', colorClass: 'from-zinc-700 to-zinc-900', tagline: 'Unbothered. Moisturized. Level 99 Rizz.' },
  { id: 'stonks', emoji: '💸', name: 'Stonks Enthusiast', colorClass: 'from-emerald-400 to-emerald-600', tagline: 'Buy high, sell low. Built different.' },
  { id: 'fox', emoji: '🦊', name: 'Sly Flexer', colorClass: 'from-orange-400 to-amber-500', tagline: 'Main character energy only.' },
  { id: 'nails', emoji: '💅', name: 'Slay Queen', colorClass: 'from-pink-400 to-rose-600', tagline: 'Budgeting? Literally such a Capricorn vibe.' },
  { id: 'arcade', emoji: '👾', name: 'Gamer Whale', colorClass: 'from-purple-500 to-indigo-600', tagline: 'Min-maxing my real life cashflow.' },
  { id: 'alien', emoji: '🛸', name: 'Crypto Hermit', colorClass: 'from-cyan-400 to-teal-500', tagline: 'WebX was so yesterday, we in Web9.' },
  { id: 'boss', emoji: '👑', name: 'Vibe Capitalist', colorClass: 'from-amber-400 to-orange-500', tagline: 'No cap, generational wealth loading.' },
  { id: 'beast', emoji: '🦁', name: 'Hustle Sigma', colorClass: 'from-red-500 to-rose-700', tagline: 'Running 8 side-hustles, sleeping is a scam.' }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  stonks: { bg: 'bg-latte/20 hover:bg-latte/30', text: 'text-espresso', label: '📈 Stonks' },
  food: { bg: 'bg-espresso/15 hover:bg-espresso/25', text: 'text-espresso', label: '🍔 Munchies' },
  drip: { bg: 'bg-latte/20 hover:bg-latte/30', text: 'text-espresso', label: '💅 Drip/Style' },
  flex: { bg: 'bg-espresso/15 hover:bg-espresso/25', text: 'text-espresso', label: '🔥 High Flex' },
  rent: { bg: 'bg-latte/20 hover:bg-latte/30', text: 'text-espresso', label: '🏠 Matrix Tax' },
  general: { bg: 'bg-espresso/15 hover:bg-espresso/25', text: 'text-espresso', label: '📦 Misc Vibe' }
};

export const FUN_QUOTES = [
  "No cap, your net worth is looking kinda aesthetic today.",
  "Financial freedom means never having to say sorry for Boba purchases.",
  "Stop looking at the price tag, just manifest the wealth.",
  "Bro, literal money masterclass right here.",
  "Inflation is temporary, drip is forever.",
  "Rizzing up your bank account one transaction at a time.",
  "You spent 300 on vibes? Honestly, valid.",
  "Securing the bag is step 1. Flexing is step 2."
];
