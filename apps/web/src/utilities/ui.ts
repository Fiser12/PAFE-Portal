/**
 * Utility functions for UI components - updated for MUI usage.
 * No longer uses Tailwind merge since we migrated to MUI.
 */

import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
