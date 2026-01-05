import { Component, signal, resource } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trpc } from '../trpc-client';
import { TransactionModalComponent } from '../components/transaction-modal.component';
import { ActiveOrdersComponent } from '../components/active-orders.component';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule, TransactionModalComponent, ActiveOrdersComponent],
  template: `
    <div class="p-8 space-y-8 max-w-7xl mx-auto">
      
      <!-- Header Section -->
      <div class="flex items-end justify-between">
        <div>
          <h1 class="text-4xl font-black text-white tracking-tight mb-2 uppercase">Wallet</h1>
          <p class="text-zinc-400 font-medium">Manage your currency holdings and net worth</p>
        </div>
        
        <!-- Net Worth Card -->
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl shadow-2xl flex items-center gap-6">
          <div>
            <div class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Estimated Net Worth</div>
            <div class="text-3xl font-black text-white tracking-tight font-mono">
              <span class="text-zinc-500 mr-1">≈</span>
              {{ netWorthResource.value()?.netWorth | number:'1.0-0' }} 
              <span class="text-lg text-amber-500 ml-1">DIVINE</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Currency Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div *ngFor="let item of netWorthResource.value()?.breakdown" 
             class="group relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl p-6 transition-all hover:border-zinc-700 hover:shadow-xl hover:shadow-black/50">
          
          <!-- Background Decoration -->
          <div class="absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl group-hover:from-white/10 transition-colors"></div>

          <!-- Card Content -->
          <div class="relative z-10 flex flex-col h-full justify-between">
            <div class="flex justify-between items-start mb-4">
              <div class="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                <!-- Icon Placeholder or Image -->
                <div class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                  {{ item.currency[0] }}
                </div>
              </div>
               <!-- Update Button (Icon) -->
               <button 
                (click)="openTransaction(item.currency, item.balance)"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                title="Update Balance"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
            </div>

            <div>
              <div class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{{ item.currency }}</div>
              <div class="text-3xl font-black text-white font-mono tracking-tight">{{ item.balance | number:'1.0-2' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Orders Section -->
      <div class="mt-8 border-t border-zinc-800 pt-8">
        <app-active-orders></app-active-orders>
      </div>

      <!-- Modals -->
      <app-transaction-modal 
        *ngIf="transactionState()" 
        [currency]="transactionState()!.currency"
        [currentBalance]="transactionState()!.currentBalance"
        (close)="transactionState.set(null)"
        (confirm)="handleTransaction($event)"
      ></app-transaction-modal>

    </div>
  `,
})
export default class WalletPage {
  public netWorthResource = resource({
    loader: () => trpc.wallet.getNetWorth.query(),
  });

  // Modal States
  transactionState = signal<{ currency: string, currentBalance: number } | null>(null);

  openTransaction(currency: string, userBalance: number) {
    // Only support 'update' mode as requested
    this.transactionState.set({ currency, currentBalance: userBalance });
  }

  async handleTransaction(amount: number) {
    if (!this.transactionState()) return;

    try {
      await trpc.wallet.updateBalance.mutate({
        currency: this.transactionState()!.currency as any,
        balance: amount,
      });
      this.transactionState.set(null);
      this.netWorthResource.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to update balance');
    }
  }
}
