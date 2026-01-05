import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="bg-glow"></div>
    
    <div class="flex h-screen overflow-hidden bg-transparent">
      <!-- Sidebar -->
      <aside class="w-64 flex-shrink-0 border-r border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl flex flex-col">
        <div class="p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
               <span class="text-white font-black text-xl">DP</span>
            </div>
            <div>
              <div class="text-xs font-black text-blue-500 uppercase tracking-widest">Divine</div>
              <div class="text-lg font-bold text-zinc-100 -mt-1 uppercase tracking-tight">Power</div>
            </div>
          </div>
        </div>

        <nav class="flex-1 px-4 space-y-1">
          <a routerLink="/" routerLinkActive="bg-blue-600/10 text-blue-400 border-blue-500/50" [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all border border-transparent group">
            <span class="w-5 h-5 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">🕹️</span>
            <span class="text-sm font-semibold uppercase tracking-wider">Cockpit</span>
          </a>

          <a routerLink="/market" routerLinkActive="bg-blue-600/10 text-blue-400 border-blue-500/50"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all border border-transparent group">
            <span class="w-5 h-5 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">📊</span>
            <span class="text-sm font-semibold uppercase tracking-wider">Market</span>
          </a>

          <a routerLink="/oracle" routerLinkActive="bg-blue-600/10 text-blue-400 border-blue-500/50"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all border border-transparent group">
            <span class="w-5 h-5 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">🔮</span>
            <span class="text-sm font-semibold uppercase tracking-wider">Oracle</span>
          </a>

          <a routerLink="/vault" routerLinkActive="bg-blue-600/10 text-blue-400 border-blue-500/50"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all border border-transparent group">
            <span class="w-5 h-5 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">📦</span>
            <span class="text-sm font-semibold uppercase tracking-wider">Vault</span>
          </a>

          <a routerLink="/wallet" routerLinkActive="bg-blue-600/10 text-blue-400 border-blue-500/50"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all border border-transparent group">
            <span class="w-5 h-5 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">💰</span>
            <span class="text-sm font-semibold uppercase tracking-wider">Wallet</span>
          </a>

          <a routerLink="/orders" routerLinkActive="bg-blue-600/10 text-blue-400 border-blue-500/50"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all border border-transparent group">
            <span class="w-5 h-5 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">📝</span>
            <span class="text-sm font-semibold uppercase tracking-wider">Orders</span>
          </a>
        </nav>

        <div class="p-6 border-t border-zinc-800/50 bg-zinc-950/20">
          <div class="flex items-center gap-3 text-zinc-500">
            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span class="text-[10px] font-black uppercase tracking-widest">Network Live</span>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-8 relative">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AppComponent {}
