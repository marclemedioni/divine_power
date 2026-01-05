import { Component, inject, resource, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common'; // Important for NgFor, NgIf
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TRPC_CLIENT } from '../../trpc.token';
import { withTransferCache } from '../../trpc.utils';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700 p-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Market Overview</h1>
          <p class="text-zinc-400">Live prices and volume from POE Ninja (Fate of the Vaal)</p>
        </div>
        
        <div class="flex items-center gap-4 w-full md:w-auto">
            <!-- Search Input -->
            <div class="relative group w-full md:w-64">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input 
                    type="text" 
                    [ngModel]="searchQuery()"
                    (ngModelChange)="searchQuery.set($event)"
                    placeholder="Search currency..." 
                    class="w-full bg-zinc-900/50 border border-zinc-700 text-zinc-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 placeholder-zinc-500 transition-all outline-none focus:bg-zinc-900"
                >
            </div>

            <button 
            (click)="refresh()"
            [disabled]="isUpdating()"
            class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-zinc-700 shrink-0"
            >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" [class.animate-spin]="isUpdating() || marketResource.isLoading()">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {{ isUpdating() ? 'Updating...' : 'Refresh' }}
            </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="marketResource.isLoading() && !marketResource.value()" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="marketResource.error() as err" class="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
        Error loading market data: {{ err }}
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <a *ngFor="let item of filteredItems()" 
           [routerLink]="['/market', item.detailsId]"
           class="group bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all duration-200 cursor-pointer relative overflow-hidden block">
          
          <!-- Background Glow on Hover -->
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div class="flex items-start justify-between relative z-10">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-zinc-950 rounded-lg border border-zinc-800 p-1 flex items-center justify-center">
                 <img [src]="item.image" [alt]="item.name" class="w-full h-full object-contain drop-shadow-lg" loading="lazy">
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-white text-sm truncate max-w-[140px]">{{ item.name }}</span>
                <span class="text-xs text-zinc-500 font-mono">{{ item.detailsId }}</span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-zinc-800 relative z-10 grid grid-cols-2 gap-4">
            <div>
               <div class="text-[10px] uppercase font-bold text-zinc-600 tracking-wider mb-1">Price</div>
               <div class="text-lg font-mono font-bold text-blue-400">
                 {{ item.primaryValue | number:'1.2-2' }} <span class="text-xs text-zinc-500 font-sans font-normal">div</span>
               </div>
            </div>
            <div class="text-right">
               <div class="text-[10px] uppercase font-bold text-zinc-600 tracking-wider mb-1">Vol (24h)</div>
               <div class="text-lg font-mono font-bold text-zinc-300">
                 {{ item.volumePrimaryValue | number:'1.0-0' }}
               </div>
            </div>
          </div>
        </a>
      </div>
      
      <!-- Empty State -->
      <div *ngIf="filteredItems().length === 0 && marketResource.value()" class="text-center py-20 text-zinc-500">
         No currency found matching "{{ searchQuery() }}"
      </div>

    </div>
  `,
})
export default class MarketPage {
  private trpc = inject(TRPC_CLIENT);
  
  public searchQuery = signal('');


  public marketResource = resource({
    loader: withTransferCache('market-overview', () => 
      this.trpc.market.getOverview.query()
    ),
  });

  public isUpdating = signal(false);

  public filteredItems = computed(() => {
    const items = this.marketResource.value() ?? [];
    const query = this.searchQuery().toLowerCase();
    
    if (!query) return items;
    
    return items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.detailsId.toLowerCase().includes(query)
    );
  });

  async refresh() {
    if (this.isUpdating()) return;
    
    this.isUpdating.set(true);
    try {
      await this.trpc.market.updateAll.mutate();
      this.marketResource.reload();
    } catch (err) {
      console.error('Failed to update market data', err);
    } finally {
      this.isUpdating.set(false);
    }
  }
}
