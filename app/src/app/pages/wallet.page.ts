import { Component, inject, resource, signal, computed, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TRPC_CLIENT } from '../trpc.token';
import { Currency } from '@prisma/client';
import { DialogComponent } from '../components/ui/dialog.component';

@Component({
  selector: 'app-wallet-page',
  standalone: true,
  imports: [FormsModule, DialogComponent, CommonModule],
  template: `
    <div class="h-full p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <header class="mb-12 flex items-end justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white tracking-tight mb-2">Portfolio Overview</h1>
            <p class="text-zinc-500 text-sm">Track your wealth distribution across major currencies.</p>
          </div>
          <div class="flex items-center gap-2">
             <div class="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Live Sync
             </div>
          </div>
        </header>
        
        <!-- Main Content -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Summary Card (placeholder for future total value) -->
          <div class="rich-panel md:col-span-3 p-8 rounded-2xl flex items-center justify-between mb-2">
             <div class="relative z-10">
                <div class="text-zinc-400 text-sm font-medium mb-1 uppercase tracking-wider">Total Network Wealth</div>
                <div class="text-5xl font-mono font-medium text-white tracking-tighter">
                   <span class="text-zinc-600">$</span>{{ divineAmount() + (chaosAmount() / 150) | number:'1.0-2' }} <span class="text-lg text-zinc-500 font-sans font-normal ml-2">est. Divines</span>
                </div>
             </div>
             <!-- Decorative Chart Line -->
             <div class="h-16 w-48 opacity-20 relative z-10">
                <svg viewBox="0 0 100 20" class="w-full h-full stroke-blue-500 fill-none stroke-2">
                   <path d="M0 10 Q 10 15, 20 10 T 40 10 T 60 5 T 80 12 T 100 8" />
                </svg>
             </div>
          </div>

          <!-- Divine Card -->
          <div class="rich-panel p-6 rounded-2xl group transition-all hover:border-amber-500/30">
             <div class="relative z-10 flex flex-col h-full justify-between">
               <div class="flex justify-between items-start mb-6">
                  <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center border border-amber-500/20">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-amber-500">
                           <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>
                        </svg>
                     </div>
                     <div>
                        <div class="text-white font-bold">Divine Orb</div>
                        <div class="text-xs text-zinc-500">Tier 1 Currency</div>
                     </div>
                  </div>
                  <button (click)="openEditModal('DIVINE', divineAmount())" class="btn-ghost text-xs">Edit</button>
               </div>
               
               <div>
                  <div class="text-4xl font-mono font-medium text-white tracking-tight">{{ divineAmount() }}</div>
                  <div class="text-xs text-green-400 mt-2 flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" /></svg>
                     High Value
                  </div>
               </div>
             </div>
          </div>

          <!-- Chaos Card -->
          <div class="rich-panel p-6 rounded-2xl group transition-all hover:border-blue-500/30">
             <div class="relative z-10 flex flex-col h-full justify-between">
               <div class="flex justify-between items-start mb-6">
                  <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center border border-blue-500/20">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-blue-500">
                           <circle cx="12" cy="12" r="10" />
                        </svg>
                     </div>
                     <div>
                        <div class="text-white font-bold">Chaos Orb</div>
                        <div class="text-xs text-zinc-500">Standard Trading</div>
                     </div>
                  </div>
                  <button (click)="openEditModal('CHAOS', chaosAmount())" class="btn-ghost text-xs">Edit</button>
               </div>
               
               <div>
                  <div class="text-4xl font-mono font-medium text-white tracking-tight">{{ chaosAmount() }}</div>
                  <div class="text-xs text-zinc-500 mt-2">Core reserve</div>
               </div>
             </div>
          </div>

          <!-- Exalted Card -->
          <div class="rich-panel p-6 rounded-2xl group transition-all hover:border-zinc-500/30">
             <div class="relative z-10 flex flex-col h-full justify-between">
               <div class="flex justify-between items-start mb-6">
                  <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-500/20 to-zinc-600/5 flex items-center justify-center border border-zinc-500/20">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-zinc-400">
                           <rect x="4" y="4" width="16" height="16" rx="2" />
                        </svg>
                     </div>
                     <div>
                        <div class="text-white font-bold">Exalted Orb</div>
                        <div class="text-xs text-zinc-500">Legacy High-Tier</div>
                     </div>
                  </div>
                  <button (click)="openEditModal('EXALTED', exaltedAmount())" class="btn-ghost text-xs">Edit</button>
               </div>
               
               <div>
                  <div class="text-4xl font-mono font-medium text-white tracking-tight">{{ exaltedAmount() }}</div>
                  <div class="text-xs text-zinc-500 mt-2">Stable asset</div>
               </div>
             </div>
          </div>
        </div>
        
        <app-dialog [title]="'Update ' + editingCurrency()" #editDialog>
          <div class="flex flex-col gap-6">
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">New Balance</label>
              <div class="relative group">
                <input 
                  type="number" 
                  [ngModel]="editAmount()"
                  (ngModelChange)="editAmount.set($event)"
                  class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 text-white font-mono text-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all placeholder:text-zinc-700"
                  placeholder="0"
                  (keydown.enter)="saveUpdate()"
                >
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button (click)="editDialog.close()" class="btn-ghost text-sm">Cancel</button>
              <button (click)="saveUpdate()" class="btn-primary text-sm">
                Save Changes
              </button>
            </div>
          </div>
        </app-dialog>
      </div>
    </div>
  `
})
export default class WalletPage {
  private trpc = inject(TRPC_CLIENT);

  walletResource = resource({
    loader: () => this.trpc.wallet.getWallet.query()
  });

  @ViewChild('editDialog') editDialog!: DialogComponent;

  // Computed signals
  divineAmount = computed(() => this.getBalance(Currency.DIVINE));
  chaosAmount = computed(() => this.getBalance(Currency.CHAOS));
  exaltedAmount = computed(() => this.getBalance(Currency.EXALTED));

  // Edit State
  editingCurrency = signal<string>('');
  editAmount = signal<number>(0);

  private getBalance(currency: Currency): number {
    const wallet = this.walletResource.value();
    return wallet?.balances.find(b => b.currency === currency)?.amount ?? 0;
  }

  openEditModal(currency: string, currentAmount: number) {
    this.editingCurrency.set(currency);
    this.editAmount.set(currentAmount);
    this.editDialog.open();
  }

  async saveUpdate() {
    const currency = this.editingCurrency();
    const amount = this.editAmount();
    
    if (!currency || amount === null || isNaN(amount)) return;

    try {
      await this.trpc.wallet.updateBalance.mutate({
        currency: currency as Currency,
        amount: Number(amount)
      });
      this.walletResource.reload();
      this.editDialog.close();
    } catch (err) {
      console.error('Failed to update balance', err);
    }
  }
}
