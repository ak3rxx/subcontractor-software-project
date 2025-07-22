
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe math utility functions for analytics
export const safeDiv = (numerator: number, denominator: number, fallback: number = 0): number => {
  if (typeof numerator !== 'number' || typeof denominator !== 'number') return fallback;
  if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator)) return fallback;
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
};

export const safePercent = (numerator: number, denominator: number): number => {
  return Math.round(safeDiv(numerator, denominator, 0) * 100);
};

export const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
};

export const sanitizeNumber = (value: number, fallback: number = 0): number => {
  return isValidNumber(value) ? value : fallback;
};
