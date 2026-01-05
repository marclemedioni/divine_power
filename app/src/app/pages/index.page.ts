import { Component, inject, signal, resource } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { trpc } from '../trpc-client';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-black tracking-tight text-gradient">Cockpit</h1>
          <p class="text-zinc-500 font-medium">Welcome to your POE2 Trading Control Center.</p>
        </div>
        <div class="flex gap-3">
          <button (click)="syncData()" 
                  class="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-accent/20 font-bold uppercase tracking-widest text-xs">
            <span class="w-4 h-4 text-sm">🔄</span>
            Sync Market
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="glass p-6 rounded-2xl premium-border group hover:border-accent/30 transition-all duration-500">
          <div class="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1">Total Net Worth</div>
          <div class="text-3xl font-black text-zinc-100 group-hover:text-accent transition-colors">{{ netWorthResource.value()?.netWorth | number:'1.2-2' }} DIV</div>
          <div class="mt-2 text-xs text-zinc-500 font-medium">
            Across all currencies & items
          </div>
        </div>

        <div class="glass p-6 rounded-2xl premium-border group hover:border-accent/30 transition-all duration-500">
          <div class="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1">Total Vault Items</div>
          <div class="text-3xl font-black text-accent">{{ vaultResource.value()?.totalItems | number }}</div>
          <div class="mt-2 text-xs text-zinc-500 font-medium">
            Current trading inventory
          </div>
        </div>

        <div class="glass p-6 rounded-2xl premium-border group hover:border-accent/30 transition-all duration-500">
          <div class="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1">Pending Orders</div>
          <div class="text-3xl font-black text-yellow-500">{{ ordersResource.value()?.pending }}</div>
          <div class="mt-2 text-xs text-zinc-500 font-medium">
            Waiting for target price
          </div>
        </div>

        <div class="glass p-6 rounded-2xl premium-border group hover:border-accent/30 transition-all duration-500">
          <div class="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1 text-center">Market Sentiment</div>
          <div class="text-3xl font-black text-center" 
               [class.text-green-500]="marketResource.value()?.marketSentiment === 'BULLISH'"
               [class.text-red-500]="marketResource.value()?.marketSentiment === 'BEARISH'">
            {{ marketResource.value()?.marketSentiment }}
          </div>
          <div class="mt-2 text-xs text-zinc-500 font-medium text-center">
            Based on recent price moves
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Net Worth Breakdown -->
        <div class="lg:col-span-1 glass p-8 rounded-3xl premium-border h-full">
          <h2 class="text-xl font-bold mb-6 flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_12px_rgba(59,130,246,0.6)]"></span>
            Breakdown
          </h2>
          <div class="space-y-6">
            <div *ngFor="let item of netWorthResource.value()?.breakdown" class="flex items-center justify-between group">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 glass rounded-xl flex items-center justify-center font-black text-zinc-500 group-hover:text-accent transition-colors">
                  {{ item.currency[0] }}
                </div>
                <div>
                  <div class="text-sm font-bold text-zinc-200 uppercase tracking-wide">{{ item.currency }}</div>
                  <div class="text-xs text-zinc-500 font-mono">{{ item.balance | number:'1.2-2' }} units</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-black text-zinc-300 group-hover:text-zinc-100 transition-colors">{{ item.balance | number:'1.2-2' }}</div>
                <div class="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                  {{ (item.balance / (netWorthResource.value()?.netWorth || 1) * 100) | number:'1.1-1' }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Market Movers -->
        <div class="lg:col-span-2 glass p-8 rounded-3xl premium-border h-full">
          <h2 class="text-xl font-bold mb-6 flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]"></span>
            Strongest Movers
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Top Gainers -->
            <div class="space-y-4">
              <div class="text-[10px] font-black text-green-500 uppercase tracking-[0.2em] px-2 mb-2">Top Gainers</div>
              <div *ngFor="let m of marketResource.value()?.topGainers" class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5 hover:border-green-500/30 transition-all group">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 glass rounded-lg p-2 flex items-center justify-center overflow-hidden">
                    <img [src]="m.imageUrl" class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" *ngIf="m.imageUrl">
                  </div>
                  <div class="text-sm font-bold truncate max-w-[120px] group-hover:text-zinc-100 transition-colors">{{ m.name }}</div>
                </div>
                <div class="text-right font-mono font-black text-sm text-green-500 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">+{{ m.change }}%</div>
              </div>
            </div>
            <!-- Top Losers -->
            <div class="space-y-4">
              <div class="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] px-2 mb-2">Top Losers</div>
              <div *ngFor="let m of marketResource.value()?.topLosers" class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 glass rounded-lg p-2 flex items-center justify-center overflow-hidden">
                    <img [src]="m.imageUrl" class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" *ngIf="m.imageUrl">
                  </div>
                  <div class="text-sm font-bold truncate max-w-[120px] group-hover:text-zinc-100 transition-colors">{{ m.name }}</div>
                </div>
                <div class="text-right font-mono font-black text-sm text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">{{ m.change }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export default class IndexPage {
  public netWorthResource = resource({
    loader: () => trpc.wallet.getNetWorth.query(),
  });

  public vaultResource = resource({
    loader: () => trpc.vault.getStats.query(),
  });

  public ordersResource = resource({
    loader: () => trpc.orders.getStats.query(),
  });

  public marketResource = resource({
    loader: () => trpc.oracle.getMarketOverview.query(),
  });

  async syncData() {
    try {
      await trpc.market.syncNow.mutate();
      window.location.reload();
    } catch (e) {
      console.error('Sync failed', e);
    }
  }
}
