import { Component, signal, inject, PLATFORM_ID, OnInit, resource } from '@angular/core';
import { isPlatformBrowser, CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trpc } from '../trpc-client';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-black tracking-tight text-gradient">Wallet</h1>
          <p class="text-zinc-500 font-medium">Manage your currency balances and exchange rates.</p>
        </div>
        <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
          <div class="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center mb-1">Estimated Net Worth</div>
          <div class="text-3xl font-black text-blue-400 text-center">{{ netWorthResource.value()?.netWorth | number:'1.2-2' }} DIV</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Balances -->
        <div class="lg:col-span-2 space-y-4">
          <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <h2 class="font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Currency Holdings
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let item of netWorthResource.value()?.breakdown" 
                   class="p-4 bg-zinc-800/40 rounded-xl border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center font-bold text-zinc-500 group-hover:text-blue-400">
                    {{ item.currency[0] }}
                  </div>
                  <div>
                    <div class="text-sm font-bold text-zinc-200">{{ item.currency }}</div>
                    <div class="text-xs font-mono text-zinc-500">{{ item.balance | number:'1.2-2' }} Units</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-mono font-bold text-zinc-300">{{ item.balance | number:'1.2-2' }}</div>
                  <button (click)="openUpdateModal(item.currency, item.balance)" class="text-[10px] text-zinc-600 hover:text-blue-400 uppercase font-black tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="p-6 bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-800 rounded-2xl shadow-xl">
             <h2 class="font-bold text-zinc-100 mb-6 flex items-center gap-2 text-center items-center justify-center">
               <span>⚡</span>
               Quick Actions
             </h2>
             <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <button class="p-4 bg-zinc-800/50 hover:bg-blue-600/10 border border-zinc-700 hover:border-blue-500/50 rounded-xl transition-all group">
                 <div class="text-xl mb-2 grayscale group-hover:grayscale-0">📥</div>
                 <div class="text-xs font-bold uppercase tracking-widest">Deposit</div>
               </button>
               <button class="p-4 bg-zinc-800/50 hover:bg-purple-600/10 border border-zinc-700 hover:border-purple-500/50 rounded-xl transition-all group">
                 <div class="text-xl mb-2 grayscale group-hover:grayscale-0">📤</div>
                 <div class="text-xs font-bold uppercase tracking-widest">Withdraw</div>
               </button>
               <button class="p-4 bg-zinc-800/50 hover:bg-green-600/10 border border-zinc-700 hover:border-green-500/50 rounded-xl transition-all group">
                 <div class="text-xl mb-2 grayscale group-hover:grayscale-0">💱</div>
                 <div class="text-xs font-bold uppercase tracking-widest">Exchange</div>
               </button>
             </div>
          </div>
        </div>

        <!-- Exchange Rates & Market Info -->
        <div class="space-y-6">
          <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <h2 class="font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <span class="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
              Live Rates
            </h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-zinc-800/20 rounded-lg border border-zinc-800/50">
                <div class="text-sm font-medium text-zinc-400">Chaos / Divine</div>
                <div class="text-sm font-mono font-bold text-zinc-100">{{ netWorthResource.value()?.exchangeRates?.chaosPerDivine | number:'1.2-2' }}</div>
              </div>
              <div class="flex items-center justify-between p-3 bg-zinc-800/20 rounded-lg border border-zinc-800/50">
                <div class="text-sm font-medium text-zinc-400">Exalted / Divine</div>
                <div class="text-sm font-mono font-bold text-zinc-100">{{ netWorthResource.value()?.exchangeRates?.exaltedPerDivine | number:'1.2-2' }}</div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-zinc-800 flex justify-center flex-col items-center">
               <div class="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Prices updated</div>
               <div class="text-xs text-zinc-500">Every 4 hours</div>
            </div>
          </div>

          <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-center items-center justify-center flex flex-col">
            <h2 class="font-bold text-zinc-100 mb-2">Portfolio Alpha</h2>
            <p class="text-xs text-zinc-500 leading-relaxed font-bold">
               Your net worth is calculated using current divine-equivalent values for all holdings.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export default class WalletPage {
  public netWorthResource = resource({
    loader: () => trpc.wallet.getNetWorth.query(),
  });

  async openUpdateModal(currency: string, current: number) {
    const amount = prompt(`Enter new amount for ${currency}:`, current.toString());
    if (amount !== null) {
      const val = parseFloat(amount);
      if (!isNaN(val)) {
        await trpc.wallet.updateBalance.mutate({ currency: currency as any, balance: val });
        this.netWorthResource.reload();
      }
    }
  }
}
