import { Component, inject, resource, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TRPC_CLIENT } from '../trpc.token';
import { CreateOrderComponent } from '../components/create-order.component';
import { MarketItemDetailsComponent } from '../components/market-item-details.component';
import { OracleAnalysisItem, MarketItem } from '../interfaces';

type SortField = 'tradability' | 'volume' | 'change' | 'price';
type FilterType = 'all' | 'high-opportunity' | 'trending' | 'high-volume';

@Component({
  selector: 'app-oracle',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateOrderComponent, MarketItemDetailsComponent],
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
            @for (filter of filters(); track filter.value) {
              <button
                (click)="setFilter(filter.value)"
                [class.bg-zinc-800]="activeFilter() === filter.value"
                [class.text-white]="activeFilter() === filter.value"
                [class.text-zinc-500]="activeFilter() !== filter.value"
                class="px-4 py-2 text-xs font-bold rounded transition-all whitespace-nowrap flex items-center gap-2">
                {{ filter.label }}
                <span class="px-1.5 py-0.5 rounded-full bg-zinc-800 text-[10px] min-w-[1.25rem] text-center" 
                      [class.bg-zinc-700]="activeFilter() === filter.value"
                      [class.text-zinc-400]="activeFilter() !== filter.value">
                  {{ filter.count }}
                </span>
              </button>
            }
          </div>

          <!-- Sort Dropdown -->
          <div class="flex items-center gap-2 ml-auto">
            <span class="text-xs text-zinc-500 font-medium">Sort by:</span>
            <select 
              [ngModel]="sortBy()"
              (ngModelChange)="onSortChange($event)"
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (item of filteredAndSortedItems(); track item.id) {
            <div 
              class="rich-panel p-6 rounded-2xl group transition-all relative overflow-hidden flex flex-col h-full bg-zinc-900/40 backdrop-blur-sm border border-zinc-800">
              
              <!-- Risk Level Badge (Top Right) -->
              <div class="absolute top-4 right-4 z-10">
                @let risk = getRiskLevel(item);
                <span 
                  [class]="risk.class"
                  class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border">
                  {{ risk.label }}
                </span>
              </div>

              <!-- Tradability Score Bar (background) -->
              <div 
                class="absolute bottom-0 left-0 h-1 transition-all opacity-50"
                [style.width.%]="item.tradabilityScore"
                [class.bg-green-500]="item.tradabilityScore >= 60"
                [class.bg-yellow-500]="item.tradabilityScore >= 30 && item.tradabilityScore < 60"
                [class.bg-red-500]="item.tradabilityScore < 30">
              </div>
              
              <!-- Header Row -->
              <div 
                class="flex items-start gap-4 mb-6 cursor-pointer" 
                (click)="selectedDetailsId.set(item.detailsId)"
                (keydown.enter)="selectedDetailsId.set(item.detailsId)"
                (keydown.space)="selectedDetailsId.set(item.detailsId); $event.preventDefault()"
                tabindex="0"
                role="button">
                <div class="w-14 h-14 bg-zinc-950 rounded-xl border border-zinc-800 p-2 flex items-center justify-center shrink-0 shadow-inner group-hover:border-purple-500/50 transition-colors">
                  <img [src]="'/assets/poe-ninja/' + item.detailsId + '.png'" 
                       [alt]="item.name" 
                       class="w-full h-full object-contain"
                       onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                </div>
                <div class="min-w-0 pr-16">
                  <div class="text-white font-bold text-base truncate group-hover:text-purple-300 transition-colors">{{ item.name }}</div>
                  <div class="text-xs text-zinc-500 font-medium">{{ item.category }}</div>
                  <div class="flex items-center gap-1.5 mt-1">
                    <div class="w-1.5 h-1.5 rounded-full" [class.bg-green-500]="item.trendDirection === 'rising'" [class.bg-red-500]="item.trendDirection === 'falling'" [class.bg-zinc-500]="item.trendDirection === 'sideways'"></div>
                    <span class="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{{ item.trendDirection }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Price & Performance -->
              <div class="grid grid-cols-2 gap-4 mb-6 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <div>
                  <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Current Price</div>
                  <div class="text-lg font-mono font-bold text-white flex items-center gap-1.5">
                    {{ item.currentPrice | number:'1.2-4' }}
                    <img src="/assets/poe-ninja/divine-orb.png" alt="Divine Orb" class="w-4 h-4 object-contain opacity-80">
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">24h Gain</div>
                  <div 
                    class="text-lg font-mono font-bold"
                    [class.text-green-400]="item.change24h >= 0"
                    [class.text-red-400]="item.change24h < 0">
                    {{ item.change24h >= 0 ? '+' : '' }}{{ item.change24h | number:'1.1-1' }}%
                  </div>
                </div>
              </div>

              <!-- Indicators Grid -->
              <div class="space-y-4 flex-grow">
                <!-- Safety Metrics -->
                <div class="grid grid-cols-2 gap-3">
                  <div class="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div class="text-[9px] text-zinc-500 uppercase font-bold mb-1">Floor Proximity</div>
                    <div class="flex items-baseline gap-1">
                      <span class="text-sm font-mono font-bold" [class.text-green-400]="item.floorProximity < 5" [class.text-zinc-300]="item.floorProximity >= 5">+{{ item.floorProximity | number:'1.1-1' }}%</span>
                      <span class="text-[9px] text-zinc-600">above 48h low</span>
                    </div>
                  </div>
                  <div class="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div class="text-[9px] text-zinc-500 uppercase font-bold mb-1">Stability Score</div>
                    <div class="flex items-baseline gap-1">
                        <span class="text-sm font-mono font-bold text-blue-400">{{ item.stabilityScore | number:'1.0-0' }}</span>
                        <span class="text-[9px] text-zinc-600">/ 100</span>
                    </div>
                  </div>
                </div>

                <!-- Technical Analytics -->
                <div class="space-y-3 pt-2">
                   <!-- RSI -->
                   <div>
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] text-zinc-500 uppercase font-bold">RSI (14 periods)</span>
                        <span class="text-[10px] font-bold" 
                              [class.text-red-400]="item.rsi > 70" 
                              [class.text-green-400]="item.rsi < 30"
                              [class.text-zinc-400]="item.rsi >= 30 && item.rsi <= 70">
                              {{ item.rsi > 70 ? 'Overbought' : item.rsi < 30 ? 'Oversold' : 'Neutral' }}
                        </span>
                    </div>
                    <div class="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div class="absolute top-0 bottom-0 left-[30%] right-[30%] bg-zinc-700/50"></div> <!-- Neutral zone -->
                        <div class="absolute inset-y-0 left-0 transition-all duration-500" 
                             [style.width.%]="item.rsi"
                             [class.bg-green-500]="item.rsi < 30"
                             [class.bg-red-500]="item.rsi > 70"
                             [class.bg-blue-500]="item.rsi >= 30 && item.rsi <= 70"></div>
                    </div>
                   </div>

                   <!-- Bollinger Bands -->
                   <div>
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[10px] text-zinc-500 uppercase font-bold">Bollinger Position</span>
                        <span class="text-[10px] font-bold text-zinc-400">
                           {{ getPricePositionLabel(item) }}
                        </span>
                    </div>
                    <div class="relative h-1.5 bg-zinc-800 rounded-full flex items-center">
                         @let bbRange = item.bollingerUpper - item.bollingerLower;
                         @let bbPos = bbRange > 0 ? ((item.currentPrice - item.bollingerLower) / bbRange) * 100 : 50;
                         <div class="w-full h-full bg-zinc-800 absolute"></div>
                         <div class="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-zinc-700"></div> <!-- Mid point -->
                         <div class="absolute h-3 w-3 bg-white border-2 border-purple-500 rounded-full shadow-lg transition-all duration-500 z-10"
                              [style.left.%]="bbPos"></div>
                    </div>
                   </div>
                </div>
              </div>
              
              <!-- Footer / Tradability -->
              <div class="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                <div>
                   <div class="text-[10px] text-zinc-500 uppercase font-bold">Tradability Score</div>
                   <div class="text-xl font-mono font-extrabold text-white">{{ item.tradabilityScore | number:'1.0-0' }}<span class="text-zinc-600 text-xs ml-0.5">/100</span></div>
                </div>
                <button 
                  (click)="openTrade(item)"
                  class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-purple-900/20 group-hover:scale-105 active:scale-95">
                  Analyze Deal
                </button>
              </div>

              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/[0.03] transition-colors pointer-events-none"></div>
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
      @if (tradeModalOpen() && selectedItem(); as item) {
        <app-create-order
          [marketItem]="item"
          (closed)="tradeModalOpen.set(false)"
          (created)="onOrderCreated()"
        ></app-create-order>
      }

      <!-- Details Modal -->
      @if (selectedDetailsId(); as id) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <!-- Backdrop -->
            <div 
              (click)="selectedDetailsId.set(null)" 
              (keydown.escape)="selectedDetailsId.set(null)"
              tabindex="-1"
              role="presentation"
              class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"></div>
            
            <!-- Modal Content -->
            <div class="relative w-full max-w-6xl z-10">
                <app-market-item-details 
                    [detailsId]="id"
                    (closed)="selectedDetailsId.set(null)"
                />
            </div>
        </div>
      }
    </div>
  `,
})
export default class OraclePage {
  private trpc = inject(TRPC_CLIENT);

  public loading = signal(false);
  public sortBy = signal<SortField>('tradability');
  public activeFilter = signal<FilterType>('all');
  public userHasManuallySorted = signal(false);
  public selectedDetailsId = signal<string | null>(null);

  public analysisResource = resource({
    loader: () => this.trpc.market.getOracleAnalysis.query()
  });

  public filters = computed(() => {
    const items = this.analysisResource.value() ?? [];
    return [
      { value: 'all', label: 'All Items', count: items.length },
      { value: 'high-opportunity', label: '🔥 High Opportunity', count: items.filter(i => i.tradabilityScore >= 50).length },
      { value: 'trending', label: '📈 Trending', count: items.filter(i => i.trendDirection !== 'sideways').length },
      { value: 'high-volume', label: '💰 High Volume', count: items.filter(i => i.volumeScore >= 50).length },
    ] as { value: FilterType; label: string; count: number }[];
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
  public selectedItem = signal<MarketItem | null>(null);

  setFilter(filter: FilterType) {
    this.activeFilter.set(filter);
    
    // Auto-sort based on filter if user hasn't manually changed it
    if (!this.userHasManuallySorted()) {
      switch (filter) {
        case 'high-opportunity':
          this.sortBy.set('tradability');
          break;
        case 'trending':
          this.sortBy.set('change');
          break;
        case 'high-volume':
          this.sortBy.set('volume');
          break;
        default:
          this.sortBy.set('tradability');
      }
    }
  }

  onSortChange(field: SortField) {
    this.sortBy.set(field);
    this.userHasManuallySorted.set(true);
  }

  openTrade(item: OracleAnalysisItem) {
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

  getRiskLevel(item: OracleAnalysisItem) {
    if (item.volatility > 15 || item.rsi > 70 || item.currentPrice > item.bollingerUpper) {
      return { label: 'High Risk', class: 'bg-red-500/20 text-red-400 border-red-500/30' };
    }
    if (item.volatility > 8 || item.rsi > 60 || item.rsi < 35) {
      return { label: 'Moderate', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    }
    return { label: 'Safe', class: 'bg-green-500/20 text-green-400 border-green-500/30' };
  }

  getPricePositionLabel(item: OracleAnalysisItem) {
    const range = item.bollingerUpper - item.bollingerLower;
    if (range === 0) return 'Stable';
    const pos = (item.currentPrice - item.bollingerLower) / range;
    
    if (pos > 0.9) return 'Upper Bound';
    if (pos < 0.1) return 'Lower Bound';
    if (pos > 0.45 && pos < 0.55) return 'Mean Value';
    return pos > 0.5 ? 'Trending High' : 'Trending Low';
  }

  async refresh() {
    this.loading.set(true);
    await this.analysisResource.reload();
    this.loading.set(false);
  }
}
