import { Component, inject, resource, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TRPC_CLIENT } from '../../trpc.token';
import { Inventory } from '../../interfaces';

@Component({
  selector: 'app-vault-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="h-full p-8 animate-in fade-in duration-700">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <header class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-white tracking-tight mb-2">Vault</h1>
            <p class="text-zinc-500 text-sm">Manage your inventory and tracked items.</p>
          </div>
        </header>

        <!-- Inventory Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @if (inventory(); as items) {
             @for (item of items; track item.id) {
                <div class="rich-panel p-4 rounded-xl group hover:border-blue-500/30 transition-all flex items-start gap-4 cursor-pointer relative" [routerLink]="['/vault', item.marketItem.id]">
                   <div class="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 p-2 flex-shrink-0 flex items-center justify-center">
                      @if (item.marketItem.image) {
                        <img [src]="item.marketItem.image" [alt]="item.marketItem.name" class="w-full h-full object-contain">
                      } @else {
                        <div class="text-xs text-zinc-600">?</div>
                      }
                   </div>
                   <div class="flex-1 min-w-0">
                      <div class="text-white font-bold truncate">{{ item.marketItem.name }}</div>
                      <div class="text-xs text-zinc-500 font-mono mt-1">
                        Quantity: <span class="text-zinc-300">{{ item.quantity }}</span>
                      </div>
                   </div>
                </div>
             }
             @if (items.length === 0) {
               <div class="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
                 <div class="text-zinc-500 font-medium">Your vault is empty</div>
                 <div class="text-xs text-zinc-600 mt-1">Purchased items will appear here</div>
               </div>
             }
          } @else {
             <!-- Loading Skeleton -->
             @for (i of [1,2,3,4]; track i) {
               <div class="rich-panel h-24 rounded-xl animate-pulse"></div>
             }
          }
        </div>
      </div>
    </div>
  `
})
export default class VaultPage {
  private trpc = inject(TRPC_CLIENT);

  walletResource = resource({
    loader: () => this.trpc.wallet.getWallet.query()
  });

  inventory = computed(() => {
    const wallet = this.walletResource.value();
    const items = (wallet?.inventory as Inventory[]) ?? [];
    return items.filter(item => item.quantity > 0);
  });
}
