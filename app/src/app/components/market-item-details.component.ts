
import { Component, inject, resource, computed, signal, PLATFORM_ID, input, output } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import { TRPC_CLIENT } from '../trpc.token';
import { withTransferCache } from '../trpc.utils';
import { PoeNinjaItemDetails } from '../../server/services/poe-ninja.service';
import { CreateOrderComponent } from './create-order.component';

@Component({
  selector: 'app-market-item-details',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective, CreateOrderComponent],
  template: `
    <div class="relative max-w-[1000px] w-full mx-auto animate-in zoom-in-95 fade-in duration-500">
      <!-- Close Button (Outside) -->
      <div class="absolute -top-6 -right-6 md:-top-8 md:-right-8 z-50">
          <button (click)="closed.emit()" class="p-3 text-zinc-400 hover:text-white transition-all bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-800 hover:border-zinc-700 shadow-2xl group">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 transition-transform group-hover:rotate-90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
          </button>
      </div>

      <!-- Scrolling Content Area -->
      <div 
        class="max-h-[85vh] overflow-auto bg-zinc-900 border border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] p-6 md:p-8 rounded-3xl space-y-8">

      <!-- Loading / Error -->
      @if (detailsResource.isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span class="text-zinc-500 text-sm">Loading market data...</span>
        </div>
      }

      @if (detailsResource.error(); as err) {
        <div class="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-4">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span class="font-medium text-sm">Error loading item details: {{ err }}</span>
        </div>
      }

      @if (detailsResource.value(); as item) {
        <!-- Header -->
        <div class="bg-zinc-950/50 rounded-2xl border border-zinc-800 p-8 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent"></div>
          
          <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div class="flex items-center gap-6">
               <div class="w-24 h-24 bg-zinc-950 rounded-xl border border-zinc-800 p-1 flex items-center justify-center shrink-0">
                  @if (item.id) {
                    <img [src]="'/assets/poe-ninja/' + item.detailsId + '.png'" [alt]="item.name" class="w-full h-full object-contain"
                       onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                  }
               </div>
               <div>
                  <h1 class="text-4xl font-bold text-white mb-2">{{ item.name }}</h1>
                  <div class="flex items-center gap-3 text-zinc-400">
                    <span class="px-2 py-1 bg-zinc-800 rounded text-xs uppercase font-bold tracking-wider">{{ item.category }}</span>
                    <span class="text-zinc-600">|</span>
                    <span class="font-mono text-sm">{{ item.id }}</span>
                 </div>
               </div>
            </div>

            <div class="text-right flex flex-col items-center md:items-end gap-4">
              <div>
                <div class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Price (Divine)</div>
                <div class="text-5xl font-mono font-bold text-blue-400">
                  {{ getRate(item, 'divine') | number:'1.1-2' }}
                </div>
              </div>
              
              <button 
                (click)="isTradeModalOpen.set(true)"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span>Trade Strategy</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
                  </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Order Modal -->
        @if (isTradeModalOpen()) {
            <app-create-order 
                [marketItem]="item" 
                (closed)="isTradeModalOpen.set(false)"
                (created)="onOrderCreated()"
            />
        }

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div class="lg:col-span-1 space-y-6">
            <div class="bg-zinc-950/50 rounded-xl border border-zinc-800 p-6">
              <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-zinc-500">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Exchange Rates
              </h2>
              
              <div class="space-y-4">
                @for (currency of ['divine', 'exalted', 'chaos']; track currency) {
                  <div
                       (click)="selectedCurrency.set(currency)"
                       (keydown.enter)="selectedCurrency.set(currency)"
                       (keydown.space)="selectedCurrency.set(currency); $event.preventDefault()"
                       tabindex="0"
                       role="button"
                       [class.border-blue-500]="selectedCurrency() === currency"
                       [class.bg-zinc-800]="selectedCurrency() === currency"
                       class="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 hover:border-zinc-600 transition-all cursor-pointer group/rate">
                      
                      <div class="flex justify-between items-center mb-2">
                          <div class="flex items-center gap-3">
                              <div class="w-8 h-8 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center group-hover/rate:scale-110 transition-transform">
                                <img [src]="'/assets/poe-ninja/' + currency + '-orb.png'" [alt]="currency + ' Orb'" class="w-5 h-5 object-contain">
                              </div>
                              <span class="text-sm font-bold text-white capitalize">{{ currency }} Orb</span>
                          </div>
                           <span class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">24h Vol</span>
                      </div>

                      <div class="flex justify-between items-end">
                          <div class="flex flex-col">
                              <span class="text-2xl font-mono font-bold text-white">
                                  {{ getRate(item, currency) | number:(currency === 'chaos' ? '1.0-0' : '1.2-2') }}
                              </span>
                              <span class="text-[10px] text-zinc-500 uppercase tracking-wider">Rate</span>
                          </div>
                          <div class="text-right">
                              <span class="text-lg font-black font-mono text-zinc-300 tracking-tighter block">
                                  {{ getVolume(item, currency) | number:'1.0-0' }}
                              </span>
                          </div>
                      </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Right Column: Chart -->
          <div class="lg:col-span-2">
            <div class="bg-zinc-950/50 rounded-xl border border-zinc-800 p-6 h-full flex flex-col min-h-[400px]">

               <div class="flex justify-between items-center mb-6">
                   <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-zinc-500">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                    </svg>
                    Price History ({{ selectedCurrency() | titlecase }})
                  </h2>

                  <!-- Tab Switcher -->
                  <div class="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                      @for (curr of ['divine', 'exalted', 'chaos']; track curr) {
                        <button
                                (click)="selectedCurrency.set(curr)"
                                [class.bg-zinc-800]="selectedCurrency() === curr"
                                [class.text-white]="selectedCurrency() === curr"
                                [class.text-zinc-500]="selectedCurrency() !== curr"
                                class="px-3 py-1 text-xs font-bold rounded flex items-center gap-2 transition-all">
                            <img [src]="'/assets/poe-ninja/' + curr + '-orb.png'" [alt]="curr + ' Orb'" class="w-4 h-4 object-contain">
                            <span class="hidden md:inline capitalize">{{ curr }}</span>
                        </button>
                      }
                  </div>
               </div>
              
              <!-- ECharts Chart -->
               @if (isBrowser) {
                <div
                     class="w-full flex-1 min-h-[350px] relative z-10" 
                     echarts 
                     [options]="chartOptions()" 
                     [theme]="'dark'">
                </div>
               }
            </div>
          </div>
        </div>
      }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class MarketItemDetailsComponent {
  private trpc = inject(TRPC_CLIENT);
  private platformId = inject(PLATFORM_ID);
  
  public isBrowser = isPlatformBrowser(this.platformId);

  // Inputs
  public detailsId = input.required<string>();

  // Outputs
  public closed = output<void>();

  public selectedCurrency = signal<string>('divine');
  public isTradeModalOpen = signal(false);

  public detailsResource = resource({
    params: () => ({ detailsId: this.detailsId() }),
    loader: withTransferCache('market-details', ({ params }) => {
       if (!params.detailsId) return Promise.resolve(null);
       return this.trpc.market.getItemDetails.query({ detailsId: params.detailsId });
    })
  });

  onOrderCreated() {
      this.detailsResource.reload();
  }

  // Helpers
  getRate(item: PoeNinjaItemDetails, currencyId: string): number {
    return item.pairs?.find(p => p.currencyId === currencyId)?.rate ?? 0;
  }

  getVolume(item: PoeNinjaItemDetails, currencyId: string): number {
    const divineRate = this.getRate(item, 'divine');
    const pair = item.pairs?.find(p => p.currencyId === currencyId);
    if (!pair || !divineRate || divineRate === 0) return 0;
    return pair.volume / divineRate;
  }

  // Chart Options Computed
  chartOptions = computed(() => {
    const item = this.detailsResource.value();
    if (!item) return {};
    const currency = this.selectedCurrency();
    const history = item?.pairs?.find(p => p.currencyId === currency)?.history ?? [];
    
    // Sort ascending by date
    const sortedData = [...history].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const dates = sortedData.map(d => new Date(d.timestamp).toLocaleDateString());
    const values = sortedData.map(d => d.rate);

    // Dynamic color based on currency
    const colors: Record<string, string> = {
        divine: '#3b82f6', // Blue
        exalted: '#f59e0b', // Amber/Gold
        chaos: '#a855f7'   // Purple
    };

    const color = colors[currency] || '#3b82f6';

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        borderColor: '#3f3f46',
        textStyle: { color: '#fff' },
        axisPointer: {
             type: 'cross',
             label: { backgroundColor: color }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
        borderColor: '#27272a'
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#52525b' } },
        axisLabel: { color: '#a1a1aa' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#27272a' } },
        axisLabel: { color: '#a1a1aa' }
      },
      series: [
        {
          name: `${currency.charAt(0).toUpperCase() + currency.slice(1)} Price`,
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: { width: 3, color: color },
          showSymbol: false,
          areaStyle: {
            opacity: 0.8,
            color: {
                type: 'linear',
                x: 0, 
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{ offset: 0, color: color.replace(')', ', 0.5)').replace('rgb', 'rgba') }, { offset: 1, color: 'transparent' }]
            }
          },
          emphasis: { focus: 'series' },
          data: values
        }
      ]
    };
  });
}
