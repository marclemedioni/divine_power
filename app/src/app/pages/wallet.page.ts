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
    <div class="h-full p-8 animate-in fade-in duration-700">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <header class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-white tracking-tight mb-2">Wallet</h1>
            <p class="text-zinc-500 text-sm">Track your wealth distribution across major currencies.</p>
          </div>
        </header>
        
        <!-- Main Content -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Summary Card -->
          <div class="rich-panel md:col-span-3 p-8 rounded-2xl flex items-center justify-between mb-2 relative overflow-hidden">
             <!-- Background Glow -->
             <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-amber-500/5"></div>

             <div class="relative z-10">
                <div class="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Total Network Wealth</div>
                <div class="flex items-center gap-4">
                    <div class="text-5xl font-mono font-medium text-white tracking-tighter flex items-baseline gap-2">
                       {{ totalWealthInDivines() | number:'1.0-2' }} 
                       <img src="/assets/poe-ninja/divine-orb.png" alt="Divine Orb" class="w-8 h-8 object-contain">
                    </div>
                </div>
                <div class="text-zinc-500 text-xs mt-2 font-mono flex items-center gap-1.5">
                    ≈ {{ totalWealthInChaos() | number:'1.0-0' }} 
                    <img src="/assets/poe-ninja/chaos-orb.png" alt="Chaos Orb" class="w-4 h-4 object-contain grayscale opacity-70">
                </div>
             </div>
             
             <!-- Decorative Chart Line -->
             <div class="h-24 w-64 opacity-20 relative z-10 hidden md:block">
                <svg viewBox="0 0 100 25" class="w-full h-full stroke-blue-500 fill-none stroke-2">
                   <path d="M0 20 Q 20 25, 40 15 T 70 10 T 100 5" />
                </svg>
             </div>
          </div>

          <!-- Divine Card -->
          <div class="rich-panel p-6 rounded-2xl group transition-all hover:border-amber-500/30">
             <div class="relative z-10 flex flex-col h-full justify-between">
               <div class="flex justify-between items-start mb-6">
                  <div class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 p-2 flex items-center justify-center shadow-inner">
                        <img src="/assets/poe-ninja/divine-orb.png" alt="Divine Orb" class="w-full h-full object-contain">
                     </div>
                     <div>
                        <div class="text-white font-bold text-lg">Divine Orb</div>
                        <div class="text-xs text-zinc-500 font-mono">1.00 div</div>
                     </div>
                  </div>
                  <button (click)="openEditModal('DIVINE', divineAmount())" class="btn-ghost text-xs">Edit</button>
               </div>
               
               <div>
                  <div class="text-4xl font-mono font-medium text-white tracking-tight">{{ divineAmount() | number:'1.0-0' }}</div>
                  <div class="text-xs text-amber-500/80 mt-2 flex items-center gap-1 font-medium">
                     <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                     Primary Currency
                  </div>
               </div>
             </div>
          </div>

          <!-- Chaos Card -->
          <div class="rich-panel p-6 rounded-2xl group transition-all hover:border-blue-500/30">
             <div class="relative z-10 flex flex-col h-full justify-between">
               <div class="flex justify-between items-start mb-6">
                  <div class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 p-2 flex items-center justify-center shadow-inner">
                        <img src="/assets/poe-ninja/chaos-orb.png" alt="Chaos Orb" class="w-full h-full object-contain">
                     </div>
                     <div>
                        <div class="text-white font-bold text-lg">Chaos Orb</div>
                         @if (chaosPrice(); as price) {
                             <div class="text-xs text-zinc-500 font-mono">1 div = {{ (1 / price) | number:'1.0-0' }}c</div>
                         } @else {
                             <div class="text-xs text-zinc-500 font-mono">Loading price...</div>
                         }
                     </div>
                  </div>
                  <button (click)="openEditModal('CHAOS', chaosAmount())" class="btn-ghost text-xs">Edit</button>
               </div>
               
               <div>
                  <div class="text-4xl font-mono font-medium text-white tracking-tight">{{ chaosAmount() | number:'1.0-0' }}</div>
                  <div class="text-xs text-blue-400 mt-2 flex items-center gap-1">
                      <span class="text-zinc-500">Value:</span>
                      {{ (chaosAmount() * (chaosPrice() || 0)) | number:'1.1-2' }} div
                  </div>
               </div>
             </div>
          </div>

          <!-- Exalted Card -->
          <div class="rich-panel p-6 rounded-2xl group transition-all hover:border-zinc-500/30">
             <div class="relative z-10 flex flex-col h-full justify-between">
               <div class="flex justify-between items-start mb-6">
                  <div class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 p-2 flex items-center justify-center shadow-inner">
                        <img src="/assets/poe-ninja/exalted-orb.png" alt="Exalted Orb" class="w-full h-full object-contain">
                     </div>
                     <div>
                        <div class="text-white font-bold text-lg">Exalted Orb</div>
                        @if (exaltedPrice(); as price) {
                           @if (price < 1) {
                              <div class="text-xs text-zinc-500 font-mono">1 div = {{ (1 / price) | number:'1.0-0' }} ex</div>
                           } @else {
                              <div class="text-xs text-zinc-500 font-mono">{{ price | number:'1.0-2' }} div</div>
                           }
                        } @else {
                           <div class="text-xs text-zinc-500 font-mono">Loading price...</div>
                        }
                     </div>
                  </div>
                  <button (click)="openEditModal('EXALTED', exaltedAmount())" class="btn-ghost text-xs">Edit</button>
               </div>
               
               <div>
                  <div class="text-4xl font-mono font-medium text-white tracking-tight">{{ exaltedAmount() | number:'1.0-0' }}</div>
                  <div class="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                      <span class="text-zinc-500">Value:</span>
                      {{ (exaltedAmount() * (exaltedPrice() || 0)) | number:'1.1-2' }} div
                  </div>
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

  marketResource = resource({
      loader: () => this.trpc.market.getOverview.query()
  });

  @ViewChild('editDialog') editDialog!: DialogComponent;

  // Wallet Signals
  divineAmount = computed(() => this.getBalance(Currency.DIVINE));
  chaosAmount = computed(() => this.getBalance(Currency.CHAOS));
  exaltedAmount = computed(() => this.getBalance(Currency.EXALTED));

  // Edit State
  editingCurrency = signal<string>('');
  editAmount = signal<number>(0);
  isUpdating = signal(false);

  // Market Prices (in Divine)
  chaosPrice = computed(() => this.getPriceInRange('chaos-orb'));
  exaltedPrice = computed(() => this.getPriceInRange('exalted-orb'));

  // Total Wealth
  totalWealthInDivines = computed(() => {
      const div = this.divineAmount();
      const chaos = this.chaosAmount() * (this.chaosPrice() || 0);
      const exalt = this.exaltedAmount() * (this.exaltedPrice() || 0);
      return div + chaos + exalt;
  });

  totalWealthInChaos = computed(() => {
     const price = this.chaosPrice();
     if (!price) return 0;
     return this.totalWealthInDivines() / price;
  });

  private getBalance(currency: Currency): number {
    const wallet = this.walletResource.value();
    return wallet?.balances.find(b => b.currency === currency)?.amount ?? 0;
  }

  private getPriceInRange(detailsId: string): number | null {
      const market = this.marketResource.value();
      if (!market) return null;
      const item = market.find(i => i.detailsId === detailsId);
      // Ensure we have a valid primary value (Value in Divine)
      return item?.primaryValue ?? null;
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

  async refresh() {
      if (this.isUpdating()) return;
      this.isUpdating.set(true);
      try {
          // Update both wallet and market data
          await Promise.all([
              this.walletResource.reload(),
              this.marketResource.reload()
          ]);
      } finally {
          this.isUpdating.set(false);
      }
  }
}
