import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')} VND`;
}

export function formatVND(value: number) {
  return `${value.toLocaleString('vi-VN')} ₫`;
}

export function formatDate(date: Date) {
  return format(date, 'dd/MM/yyyy HH:mm');
}

export function formatRelativeTime(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: vi });
}
