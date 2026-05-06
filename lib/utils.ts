import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CryptoJS from 'crypto-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hashIP(ip: string): string {
  return CryptoJS.SHA256(ip).toString();
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(6)}`;
}

export function formatDOGE(amount: number): string {
  return `${amount.toFixed(8)} DOGE`;
}

export function usdToDOGE(usd: number, rate: number = 0.15): number {
  return usd / rate;
}

export function dogeToUSD(doge: number, rate: number = 0.15): number {
  return doge * rate;
}

export function getTimeRemaining(targetTime: number): {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = Date.now();
  const remaining = targetTime - now;
  const isExpired = remaining <= 0;
  
  if (isExpired) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds, isExpired };
}

export function calculateDailyBonus(streakDays: number): number {
  const { DAILY_BONUS_START_USD, DAILY_BONUS_INCREMENT_USD, DAILY_BONUS_MAX_USD } = 
    require('./constants').FAUCET_CONFIG;
  
  const bonus = DAILY_BONUS_START_USD + (streakDays - 1) * DAILY_BONUS_INCREMENT_USD;
  return Math.min(bonus, DAILY_BONUS_MAX_USD);
}
