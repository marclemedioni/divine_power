
import { Component, inject, resource, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import { TRPC_CLIENT } from '../../trpc.token';
import { withTransferCache } from '../../trpc.utils';
import { PoeNinjaItemDetails, PoeNinjaPairData } from '../../../server/services/poe-ninja.service';

@Component({
  selector: 'app-market-details',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxEchartsDirective],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700 p-8 min-h-screen">
      
      <!-- Breadcrumb / Back -->
      <a routerLink="/market" class="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to Overview
      </a>

      <!-- Loading / Error -->
      <div *ngIf="detailsResource.isLoading()" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <div *ngIf="detailsResource.error() as err" class="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
        Error loading item details: {{ err }}
      </div>

      @if (detailsResource.value(); as item) {
        <!-- Header -->
        <div class="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent"></div>
          
          <div class="relative z-10 flex items-center justify-between">
            <div class="flex items-center gap-6">
               <div class="w-24 h-24 bg-zinc-950 rounded-xl border border-zinc-800 p-4 flex items-center justify-center shrink-0">
                  <div class="text-4xl">💎</div>
               </div>
               <div>
                 <h1 class="text-4xl font-bold text-white mb-2">{{ item.name }}</h1>
                 <div class="flex items-center gap-3 text-zinc-400">
                    <span class="px-2 py-1 bg-zinc-800 rounded text-xs uppercase font-bold tracking-wider">Currency</span>
                    <span class="text-zinc-600">|</span>
                    <span class="font-mono text-sm">{{ item.id }}</span>
                 </div>
               </div>
            </div>

            <div class="text-right">
              <div class="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Price (Divine)</div>
              <div class="text-5xl font-mono font-bold text-blue-400">
                {{ getRate(item, 'divine') | number:'1.1-2' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Left Column: Exchange Pairs -->
          <div class="lg:col-span-1 space-y-6">
            
            <div class="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-zinc-500">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Exchange Rates
              </h2>
              
              <div class="space-y-4">
                <!-- Divine -->
                <div class="p-4 bg-zinc-950/50 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors group">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-bold text-purple-400 group-hover:text-purple-300">Divine Orb</span>
                        <span class="text-xs text-zinc-500 font-mono">24h Vol</span>
                    </div>
                    <div class="flex justify-between items-end">
                        <div class="flex flex-col">
                            <span class="text-2xl font-mono font-bold text-white">
                                {{ getRate(item, 'divine') | number:'1.2-2' }}
                            </span>
                            <span class="text-[10px] text-zinc-500 uppercase tracking-wider">Rate</span>
                        </div>
                        <span class="text-lg font-mono text-zinc-300">
                            {{ getVolume(item, 'divine') | number:'1.0-0' }}
                        </span>
                    </div>
                </div>

                <!-- Exalted -->
                <div class="p-4 bg-zinc-950/50 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors group">
                     <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-bold text-amber-400 group-hover:text-amber-300">Exalted Orb</span>
                        <span class="text-xs text-zinc-500 font-mono">24h Vol</span>
                    </div>
                    <div class="flex justify-between items-end">
                         <div class="flex flex-col">
                            <span class="text-2xl font-mono font-bold text-white">
                                {{ getRate(item, 'exalted') | number:'1.0-0' }}
                            </span>
                             <span class="text-[10px] text-zinc-500 uppercase tracking-wider">Rate</span>
                        </div>
                        <span class="text-lg font-mono text-zinc-300">
                            {{ getVolume(item, 'exalted') | number:'1.0-0' }}
                        </span>
                    </div>
                </div>

                <!-- Chaos -->
                <div class="p-4 bg-zinc-950/50 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors group">
                     <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-bold text-blue-400 group-hover:text-blue-300">Chaos Orb</span>
                        <span class="text-xs text-zinc-500 font-mono">24h Vol</span>
                    </div>
                    <div class="flex justify-between items-end">
                         <div class="flex flex-col">
                            <span class="text-2xl font-mono font-bold text-white">
                                {{ getRate(item, 'chaos') | number:'1.0-0' }}
                            </span>
                             <span class="text-[10px] text-zinc-500 uppercase tracking-wider">Rate</span>
                        </div>
                        <span class="text-lg font-mono text-zinc-300">
                            {{ getVolume(item, 'chaos') | number:'1.0-0' }}
                        </span>
                    </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Chart -->
          <div class="lg:col-span-2">
            <div class="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 h-full min-h-[400px] flex flex-col">
               <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-zinc-500">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
                Price History (Divine)
              </h2>
              
              <!-- ECharts Chart -->
               <div class="w-full flex-1 min-h-[300px]" 
                    echarts 
                    [options]="chartOptions()" 
                    [theme]="'dark'">
               </div>

            </div>
          </div>

        </div>
      }
    </div>
  `,
})
export default class MarketDetailsPage {
  private route = inject(ActivatedRoute);
  private trpc = inject(TRPC_CLIENT);

  public detailsId = signal<string>('');

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('detailsId');
      if (id) this.detailsId.set(id);
    });
  }

  public detailsResource = resource({
    params: () => ({ detailsId: this.detailsId() }),
    loader: withTransferCache('market-details', ({ params }) => {
       if (!params.detailsId) return Promise.resolve(null);
       return this.trpc.market.getItemDetails.query({ detailsId: params.detailsId });
    })
  });

  // Helpers
  getRate(item: PoeNinjaItemDetails, currencyId: string): number {
    return item.pairs.find(p => p.currencyId === currencyId)?.rate ?? 0;
  }

  getVolume(item: PoeNinjaItemDetails, currencyId: string): number {
    return item.pairs.find(p => p.currencyId === currencyId)?.volume ?? 0;
  }

  // Chart Options Computed
  chartOptions = computed(() => {
    const item = this.detailsResource.value();
    const history = item?.pairs.find(p => p.currencyId === 'divine')?.history ?? [];
    
    // Sort ascending by date
    const sortedData = [...history].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const dates = sortedData.map(d => new Date(d.timestamp).toLocaleDateString());
    const values = sortedData.map(d => d.rate);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        borderColor: '#3f3f46',
        textStyle: { color: '#fff' },
        axisPointer: {
             type: 'cross',
             label: { backgroundColor: '#3b82f6' }
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
          name: 'Divine Price',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: { width: 3, color: '#3b82f6' },
          showSymbol: false,
          areaStyle: {
            opacity: 0.8,
            color: {
                type: 'linear',
                x: 0, 
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.5)' }, { offset: 1, color: 'rgba(59, 130, 246, 0)' }]
            }
          },
          emphasis: { focus: 'series' },
          data: values
        }
      ]
    };
  });
}
