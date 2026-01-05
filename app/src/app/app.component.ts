import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <!-- Global Background -->
    <div class="fixed inset-0 bg-[#050505] z-[-2]"></div>
    <div class="fixed inset-0 bg-noise z-[-1] opacity-20 mix-blend-overlay"></div>
    <div class="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505] z-[-2]"></div>
    
    <div class="flex h-screen overflow-hidden text-zinc-300 font-sans selection:bg-blue-500/30">
      <!-- Sidebar -->
      <aside class="w-[280px] flex-shrink-0 flex flex-col border-r border-white/5 bg-[#050505]/80 backdrop-blur-xl relative z-50">
        <!-- Logo Area -->
        <div class="h-20 flex items-center px-6 border-b border-white/5">
          <div class="flex items-center gap-3">
            <div class="relative w-8 h-8 flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-lg border border-white/10 shadow-inner">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                  <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd" />
               </svg>
            </div>
            <div class="flex flex-col">
               <span class="text-sm font-bold text-white tracking-tight leading-none">Divine Power</span>
               <span class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Trading Suite</span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          
          <div class="px-3 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Dashboards</div>

          <!-- Cockpit -->
          <a routerLink="/" routerLinkActive="bg-white/5 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border-white/10" [routerLinkActiveOptions]="{exact: true}"
             class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all border border-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors group-[.router-link-active]:text-blue-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            Cockpit
          </a>

          <!-- Market -->
          <a routerLink="/market" routerLinkActive="bg-white/5 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border-white/10"
             class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all border border-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors group-[.router-link-active]:text-amber-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
            Market
          </a>

          <!-- Oracle -->
          <a routerLink="/oracle" routerLinkActive="bg-white/5 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border-white/10"
             class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all border border-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors group-[.router-link-active]:text-purple-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
            </svg>
            Oracle
            <span class="ml-auto text-[10px] font-bold bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">AI</span>
          </a>

          <div class="px-3 mt-6 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Assets & Trading</div>

          <!-- Vault -->
          <a routerLink="/vault" routerLinkActive="bg-white/5 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border-white/10"
             class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all border border-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-zinc-500 group-hover:text-orange-400 transition-colors group-[.router-link-active]:text-orange-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3.75h3.75M3.75 7.5h16.5V4.5m0 0A2.25 2.25 0 0 0 18 4.5H6a2.25 2.25 0 0 0-2.25 2.25V7.5m16.5 0W12 11.25 3.75 7.5" />
            </svg>
            Vault
          </a>

          <!-- Wallet -->
          <a routerLink="/wallet" routerLinkActive="bg-white/5 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border-white/10"
             class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all border border-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-zinc-500 group-hover:text-green-400 transition-colors group-[.router-link-active]:text-green-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 0 1 9 14.437V9.564Z" />
            </svg>
            Wallet
          </a>

          <!-- Orders -->
          <a routerLink="/orders" routerLinkActive="bg-white/5 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border-white/10"
             class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all border border-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors group-[.router-link-active]:text-red-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Orders
          </a>
        </nav>
        
        <!-- User Area -->
        <div class="p-4 border-t border-white/5">
           <button class="w-full p-2 rounded-lg hover:bg-white/5 flex items-center gap-3 transition-colors text-left group">
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 border border-white/10 flex items-center justify-center shadow-lg">
                 <span class="text-xs font-bold text-white">DE</span>
              </div>
              <div class="flex-1 min-w-0">
                 <div class="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">Divine Exile</div>
                 <div class="text-[0.65rem] text-zinc-500">Standard League</div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
              </svg>
           </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto relative scroll-smooth selection:text-white">
        <router-outlet></router-outlet>
      </main>

      <!-- Toasts Overlay -->
      <div class="fixed top-6 right-6 z-[100] space-y-3 pointer-events-none">
        <div *ngFor="let t of notify.toasts()" 
             class="pointer-events-auto rich-panel p-4 rounded-xl flex items-start gap-3 w-80 animate-in slide-in-from-right fade-in duration-300 ring-1 ring-white/10">
          <div class="mt-0.5">
            <span *ngIf="t.type === 'success'" class="text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
            </span>
            <span *ngIf="t.type === 'warning'" class="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" /></svg>
            </span>
            <span *ngIf="t.type === 'error'" class="text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
            </span>
            <span *ngIf="t.type === 'info'" class="text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
            </span>
          </div>
          <div>
            <div class="text-sm font-bold text-white tracking-wide">{{ t.title }}</div>
            <div class="text-xs text-zinc-400 mt-1 font-medium leading-relaxed">{{ t.message }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AppComponent {
  private notifiedOrders = new Set<string>();

  constructor(
    public notify: NotificationService, 
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.startPolling();
      this.notify.requestPermission();
    }
  }

  startPolling() {
    
  }
}
