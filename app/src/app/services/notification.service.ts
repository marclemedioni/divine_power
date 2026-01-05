import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  toasts = signal<Toast[]>([]);
  permission = signal<NotificationPermission>('default');

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission.set(Notification.permission);
    }
  }

  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const result = await Notification.requestPermission();
    this.permission.set(result);
    return result;
  }

  show(title: string, message: string, type: Toast['type'] = 'info') {
    // 1. Show in-app toast
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, title, message };
    
    this.toasts.update(current => [...current, toast]);

    // Auto remove after duration
    setTimeout(() => {
      this.remove(id);
    }, 5000);

    // 2. Show browser notification if allowed
    if (this.permission() === 'granted' && typeof window !== 'undefined') {
      new Notification(title, {
        body: message,
        icon: '/assets/icon.png', // Fallback if no icon
        silent: false,
      });
    }
  }

  remove(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
