export interface Transaction {
  id: string;
  title: string;
  category: 'stonks' | 'food' | 'drip' | 'flex' | 'rent' | 'general';
  amount: number;
  type: 'incoming' | 'outgoing';
  timestamp: string;
  slangComment?: string;
  bank?: string; // Stored bank name, e.g. "ICICI", "HDFC"
  date?: number; // Day of the month (1-31)
  month?: number; // Month of the year (1-12)
  year?: number; // Year (four digits)
}

export interface BankAccount {
  name: string;
  startingBalance: number;
}

export interface UserProfile {
  name: string;
  avatarId: string; // Preset ID or "custom"
  customAvatarData?: string; // Base64 data if custom uploaded
  balance: number;
  savingsGoal: number;
  savingsGoalName: string;
  experiencePoints: number; // For gamifying the fintech experience ("Rizz level", "Level 69 Money Master")
  currencyCode?: string; // USD, INR, EUR, etc.
  banks?: BankAccount[];
}

export interface PresetAvatar {
  id: string;
  emoji: string;
  name: string;
  colorClass: string;
  tagline: string;
}
