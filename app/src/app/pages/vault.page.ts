import { Component, inject, resource } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trpc } from '../trpc-client';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-black tracking-tight text-gradient">Vault</h1>
          <p class="text-zinc-500 font-medium">Your trading inventory and investment performance.</p>
        </div>
        <div class="px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-md shadow-2xl">
           <div class="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-1 text-center">Portfolio Net P&L</div>
           <div class="text-2xl font-black text-center" 
                [class.text-green-400]="(totalPnLResource.value()?.unrealizedPnL || 0) > 0"
                [class.text-red-400]="(totalPnLResource.value()?.unrealizedPnL || 0) < 0">
             {{ (totalPnLResource.value()?.unrealizedPnL || 0) > 0 ? '+' : '' }}{{ totalPnLResource.value()?.unrealizedPnL | number:'1.2-2' }} DIV
           </div>
        </div>
      </div>

      <!-- Inventory Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let v of vaultItemsResource.value()" 
             class="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all duration-300">
          
          <!-- Card Header & Image -->
          <div class="p-6 pb-0 flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700 p-2 overflow-hidden">
                <img [src]="v.item.imageUrl" [alt]="v.item.name" class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" *ngIf="v.item.imageUrl">
              </div>
              <div>
                <h3 class="font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">{{ v.item.name }}</h3>
                <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 mt-1 uppercase tracking-wider">
                  {{ v.item.category }}
                </span>
              </div>
            </div>
            <div class="text-xl font-bold text-zinc-200">x{{ v.quantity }}</div>
          </div>

          <!-- Divider -->
          <div class="mx-6 my-4 border-t border-zinc-800"></div>

          <!-- Stats Section -->
          <div class="px-6 pb-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 text-center">Cost Basis</div>
                <div class="text-sm font-mono text-zinc-300 text-center">{{ v.costBasis | number:'1.2-2' }} DIV</div>
              </div>
              <div>
                <div class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 text-center">Market Price</div>
                <div class="text-sm font-mono text-zinc-300 text-center">{{ v.currentRate | number:'1.2-2' }} DIV</div>
              </div>
            </div>

            <!-- ROI Badge -->
            <div class="flex flex-col items-center justify-center p-3 rounded-lg"
                 [class.bg-green-500/10]="v.unrealizedPnL > 0"
                 [class.bg-red-500/10]="v.unrealizedPnL < 0">
              <div class="text-[10px] font-bold uppercase tracking-widest mb-1"
                   [class.text-green-400]="v.unrealizedPnL > 0"
                   [class.text-red-400]="v.unrealizedPnL < 0">ROI</div>
              <div class="flex items-baseline gap-2">
                <span class="text-lg font-bold"
                      [class.text-green-400]="v.unrealizedPnL > 0"
                      [class.text-red-400]="v.unrealizedPnL < 0">
                  {{ v.unrealizedPnL > 0 ? '+' : '' }}{{ v.unrealizedPnL | number:'1.2-2' }} DIV
                </span>
                <span class="text-xs font-medium opacity-60"
                      [class.text-green-400]="v.unrealizedPnL > 0"
                      [class.text-red-400]="v.unrealizedPnL < 0">
                  ({{ v.pnLPercent > 0 ? '+' : '' }}{{ v.pnLPercent | number:'1.1-1' }}%)
                </span>
              </div>
            </div>
          </div>

          <!-- P&L Progress Bar (Subtle) -->
          <div class="absolute bottom-0 left-0 h-1 bg-zinc-800 w-full overflow-hidden">
             <div class="h-full transition-all duration-1000"
                  [style.width.%]="v.pnLPercent > 0 ? 100 : 0"
                  [class.bg-green-500]="v.unrealizedPnL > 0"
                  [class.bg-red-500]="v.unrealizedPnL < 0"
                  [style.opacity]="0.3"></div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="vaultItemsResource.value()?.length === 0" class="col-span-full py-20 text-center">
          <div class="text-5xl mb-4 opacity-20">📦</div>
          <h3 class="text-xl font-bold text-zinc-500">Your vault is empty</h3>
          <p class="text-zinc-600 mt-2">Start trading to build your portfolio.</p>
          <a routerLink="/market" class="inline-block mt-6 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700">Explore Market</a>
        </div>
      </div>
    </div>
  `,
})
export default class VaultPage {
  public vaultItemsResource = resource({
    loader: () => trpc.vault.getItems.query(),
  });
  
  public totalPnLResource = resource({
    loader: () => trpc.vault.getTotalUnrealizedPnL.query(),
  });
}
