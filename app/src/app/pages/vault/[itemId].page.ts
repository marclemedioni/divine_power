import { Component, inject, resource, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TRPC_CLIENT } from '../../trpc.token';
import { withTransferCache } from '../../trpc.utils';

@Component({
  selector: 'app-vault-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700 p-8 min-h-screen">
      
      <!-- Breadcrumb / Back -->
      <a routerLink="/vault" class="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to Vault
      </a>

      <!-- Loading / Error -->
      @if (lotsResource.isLoading()) {
        <div class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }

      @if (lotsResource.error(); as err) {
        <div class="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
          Error loading lots: {{ err }}
        </div>
      }

      @if (lotsResource.value(); as lots) {
         @if (lots.length > 0) {
            @let marketItem = lots[0].marketItem;
            
            <!-- Header -->
            <div class="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent"></div>
                <div class="relative z-10 flex items-center gap-6">
                    <div class="w-20 h-20 bg-zinc-950 rounded-xl border border-zinc-800 p-1 flex items-center justify-center shrink-0">
                        @if (marketItem.image) {
                            <img [src]="marketItem.image" [alt]="marketItem.name" class="w-full h-full object-contain">
                        } @else {
                            <div class="text-xs text-zinc-600">?</div>
                        }
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-white mb-2">{{ marketItem.name }}</h1>
                        <div class="text-zinc-400 font-mono text-sm">
                            Total Quantity: <span class="text-white font-bold">{{ totalQuantity() }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lots Table -->
             <div class="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
                <div class="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h2 class="text-lg font-bold text-white">Purchase Lots</h2>
                    <div class="text-xs text-zinc-500 uppercase tracking-widest font-bold">FIFO</div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-zinc-950/50 text-zinc-500 font-mono text-xs uppercase tracking-wider">
                            <tr>
                                <th class="px-6 py-4 font-medium">Date</th>
                                <th class="px-6 py-4 font-medium text-right">Quantity</th>
                                <th class="px-6 py-4 font-medium text-right">Buy Price</th>
                                <th class="px-6 py-4 font-medium text-right">Current Value</th>
                                <th class="px-6 py-4 font-medium text-right">Return</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-800">
                            @for (lot of lots; track lot.id) {
                                <tr class="hover:bg-white/5 transition-colors group">
                                    <td class="px-6 py-4 text-zinc-400 font-mono">
                                        {{ lot.purchasedAt | date:'mediumDate' }}
                                    </td>
                                    <td class="px-6 py-4 text-white font-bold text-right font-mono">
                                        {{ lot.quantity }}
                                    </td>
                                    <td class="px-6 py-4 text-right font-mono text-zinc-300">
                                        {{ lot.purchasePrice | number:'1.1-2' }} div
                                    </td>
                                    <td class="px-6 py-4 text-right font-mono text-zinc-300">
                                         @if (lot.marketItem.primaryValue) {
                                            {{ lot.marketItem.primaryValue | number:'1.1-2' }} div
                                         } @else {
                                            <span class="text-zinc-600">-</span>
                                         }
                                    </td>
                                    <td class="px-6 py-4 text-right font-mono">
                                        @if (lot.marketItem.primaryValue && lot.purchasePrice > 0) {
                                            @let roi = ((lot.marketItem.primaryValue - lot.purchasePrice) / lot.purchasePrice) * 100;
                                            <span [class.text-green-400]="roi > 0" [class.text-red-400]="roi < 0" [class.text-zinc-500]="roi === 0">
                                                {{ roi > 0 ? '+' : '' }}{{ roi | number:'1.1-1' }}%
                                            </span>
                                        } @else {
                                            <span class="text-zinc-600">-</span>
                                        }
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
             </div>

         } @else {
            <div class="col-span-full py-20 text-center">
                 <div class="text-zinc-500 font-medium">No lots found for this item</div>
            </div>
         }
      }
    </div>
  `
})
export default class VaultDetailsPage {
  private route = inject(ActivatedRoute);
  private trpc = inject(TRPC_CLIENT);

  itemId = signal<string>('');

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('itemId');
      if (id) this.itemId.set(id);
    });
  }

  lotsResource = resource({
    params: () => ({ itemId: this.itemId() }),
    loader: withTransferCache('vault-lots', ({ params }) => {
       if (!params.itemId) return Promise.resolve(null);
       return this.trpc.wallet.getInventoryLots.query({ marketItemId: params.itemId });
    })
  });

  totalQuantity = computed(() => {
     const lots = this.lotsResource.value();
     return lots?.reduce((sum, lot) => sum + lot.quantity, 0) ?? 0;
  });
}
