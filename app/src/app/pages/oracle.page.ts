import { Component, inject, resource, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TRPC_CLIENT } from '../trpc.token';
import { CreateOrderComponent } from '../components/create-order.component';

type SortField = 'tradability' | 'volume' | 'change' | 'price';
type FilterType = 'all' | 'high-opportunity' | 'trending' | 'high-volume';

@Component({
  selector: 'app-oracle',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateOrderComponent],
  template: `
    <div class="h-full p-8 animate-in fade-in duration-700 pb-20">
      <div class="max-w-7xl mx-auto">
        
        <!-- Header -->
        <header class="mb-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 class="text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                Oracle
                <span class="text-sm font-bold bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">AI Analysis</span>
              </h1>
              <p class="text-zinc-500">Market analysis with trading indicators to identify profitable opportunities.</p>
            </div>
            
            <button 
              (click)="refresh()"
              [disabled]="loading()"
              class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-zinc-700 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" [class.animate-spin]="loading()">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              {{ loading() ? 'Analyzing...' : 'Refresh Analysis' }}
            </button>
          </div>
        </header>

        <!-- Filters & Sorting -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <!-- Filter Tabs -->
          <div class="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 overflow-x-auto">
            @for (filter of filters; track filter.value) {
              <button
                (click)="activeFilter.set(filter.value)"
                [class.bg-zinc-800]="activeFilter() === filter.value"
                [class.text-white]="activeFilter() === filter.value"
                [class.text-zinc-500]="activeFilter() !== filter.value"
                class="px-4 py-2 text-xs font-bold rounded transition-all whitespace-nowrap">
                {{ filter.label }}
              </button>
            }
          </div>

          <!-- Sort Dropdown -->
          <div class="flex items-center gap-2 ml-auto">
            <span class="text-xs text-zinc-500 font-medium">Sort by:</span>
            <select 
              [ngModel]="sortBy()"
              (ngModelChange)="sortBy.set($event)"
              class="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="tradability">Tradability Score</option>
              <option value="volume">Volume</option>
              <option value="change">24h Change</option>
              <option value="price">Price</option>
            </select>
          </div>
        </div>

        <!-- Loading State -->
        @if (analysisResource.isLoading() && !analysisResource.value()) {
          <div class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        }

        <!-- Analysis Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (item of filteredAndSortedItems(); track item.id) {
            <div 
              (click)="openTrade(item)"
              class="rich-panel p-5 rounded-xl cursor-pointer group hover:border-purple-500/30 transition-all relative overflow-hidden">
              
              <!-- Tradability Score Bar (background) -->
              <div 
                class="absolute bottom-0 left-0 h-1 transition-all"
                [style.width.%]="item.tradabilityScore"
                [class.bg-green-500]="item.tradabilityScore >= 60"
                [class.bg-yellow-500]="item.tradabilityScore >= 30 && item.tradabilityScore < 60"
                [class.bg-red-500]="item.tradabilityScore < 30">
              </div>
              
              <!-- Header Row -->
              <div class="flex items-start justify-between gap-3 mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-zinc-900 rounded-lg border border-zinc-800 p-1 flex items-center justify-center shrink-0">
                    <img [src]="'/assets/poe-ninja/' + item.detailsId + '.png'" 
                         [alt]="item.name" 
                         class="w-full h-full object-contain"
                         onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                  </div>
                  <div class="min-w-0">
                    <div class="text-white font-bold text-sm truncate">{{ item.name }}</div>
                    <div class="text-xs text-zinc-500">{{ item.category }}</div>
                  </div>
                </div>
                
                <!-- Tradability Badge -->
                <div class="text-right shrink-0">
                  <div 
                    class="text-2xl font-mono font-bold"
                    [class.text-green-400]="item.tradabilityScore >= 60"
                    [class.text-yellow-400]="item.tradabilityScore >= 30 && item.tradabilityScore < 60"
                    [class.text-red-400]="item.tradabilityScore < 30">
                    {{ item.tradabilityScore | number:'1.0-0' }}
                  </div>
                  <div class="text-[10px] text-zinc-500 uppercase tracking-wider">Score</div>
                </div>
              </div>
              
              <!-- Price & Change -->
              <div class="flex justify-between items-baseline mb-4 pb-4 border-b border-zinc-800">
                <div>
                  <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Price</div>
                  <div class="text-lg font-mono font-bold text-white flex items-center gap-1">
                    {{ item.currentPrice | number:'1.2-4' }}
                    <img src="/assets/poe-ninja/divine-orb.png" class="w-4 h-4 object-contain">
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">24h Change</div>
                  <div 
                    class="text-lg font-mono font-bold"
                    [class.text-green-400]="item.change24h >= 0"
                    [class.text-red-400]="item.change24h < 0">
                    {{ item.change24h >= 0 ? '+' : '' }}{{ item.change24h | number:'1.1-1' }}%
                  </div>
                </div>
              </div>
              
              <!-- Indicators Grid -->
              <div class="grid grid-cols-3 gap-3">
                <!-- Volume -->
                <div class="text-center">
                  <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Volume</div>
                  <div class="relative h-2 bg-zinc-800 rounded-full overflow-hidden mb-1">
                    <div class="absolute inset-y-0 left-0 bg-blue-500 rounded-full" [style.width.%]="item.volumeScore"></div>
                  </div>
                  <div class="text-xs font-mono text-zinc-400">{{ item.volumeScore | number:'1.0-0' }}</div>
                </div>
                
                <!-- Trend -->
                <div class="text-center">
                  <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Trend</div>
                  <div 
                    class="text-lg"
                    [class.text-green-400]="item.trendDirection === 'rising'"
                    [class.text-red-400]="item.trendDirection === 'falling'"
                    [class.text-zinc-500]="item.trendDirection === 'sideways'">
                    @if (item.trendDirection === 'rising') {
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
                      </svg>
                    } @else if (item.trendDirection === 'falling') {
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clip-rule="evenodd" />
                      </svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clip-rule="evenodd" />
                      </svg>
                    }
                  </div>
                  <div class="text-xs font-mono text-zinc-400 capitalize">{{ item.trendDirection }}</div>
                </div>
                
                <!-- Volatility -->
                <div class="text-center">
                  <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Volatility</div>
                  <div 
                    class="text-sm font-mono font-bold"
                    [class.text-green-400]="item.volatility < 5"
                    [class.text-yellow-400]="item.volatility >= 5 && item.volatility < 15"
                    [class.text-red-400]="item.volatility >= 15">
                    {{ item.volatility | number:'1.1-1' }}%
                  </div>
                  <div class="text-[10px] text-zinc-500">
                    {{ item.volatility < 5 ? 'Low' : item.volatility < 15 ? 'Medium' : 'High' }}
                  </div>
                </div>
              </div>
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          }
        </div>

        <!-- Empty State -->
        @if (filteredAndSortedItems().length === 0 && analysisResource.value()) {
          <div class="text-center py-20 text-zinc-500">
            No items match the current filter.
          </div>
        }

      </div>

      <!-- Trade Modal -->
      @if (tradeModalOpen() && selectedItem()) {
        <app-create-order
          [marketItem]="selectedItem()"
          (close)="tradeModalOpen.set(false)"
          (created)="onOrderCreated()"
        ></app-create-order>
      }
    </div>
  `,
})
export default class OraclePage {
  private trpc = inject(TRPC_CLIENT);

  public loading = signal(false);
  public sortBy = signal<SortField>('tradability');
  public activeFilter = signal<FilterType>('all');

  public filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Items' },
    { value: 'high-opportunity', label: '🔥 High Opportunity' },
    { value: 'trending', label: '📈 Trending' },
    { value: 'high-volume', label: '💰 High Volume' },
  ];

  public analysisResource = resource({
    loader: () => this.trpc.market.getOracleAnalysis.query()
  });

  public filteredAndSortedItems = computed(() => {
    let items = [...(this.analysisResource.value() ?? [])];
    
    // Filter
    switch (this.activeFilter()) {
      case 'high-opportunity':
        items = items.filter(i => i.tradabilityScore >= 50);
        break;
      case 'trending':
        items = items.filter(i => i.trendDirection !== 'sideways');
        break;
      case 'high-volume':
        items = items.filter(i => i.volumeScore >= 50);
        break;
    }
    
    // Sort
    switch (this.sortBy()) {
      case 'tradability':
        items.sort((a, b) => b.tradabilityScore - a.tradabilityScore);
        break;
      case 'volume':
        items.sort((a, b) => b.volume - a.volume);
        break;
      case 'change':
        items.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
        break;
      case 'price':
        items.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
    }
    
    return items;
  });

  // Trade Modal
  public tradeModalOpen = signal(false);
  public selectedItem = signal<any>(null);

  openTrade(item: any) {
    // Transform to match MarketItem interface for CreateOrderComponent
    this.selectedItem.set({
      id: item.id,
      name: item.name,
      detailsId: item.detailsId,
      primaryValue: item.currentPrice,
      category: item.category,
      image: item.image
    });
    this.tradeModalOpen.set(true);
  }

  onOrderCreated() {
    this.tradeModalOpen.set(false);
    this.analysisResource.reload();
  }

  async refresh() {
    this.loading.set(true);
    await this.analysisResource.reload();
    this.loading.set(false);
  }
}
