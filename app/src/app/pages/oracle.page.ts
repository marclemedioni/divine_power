import { Component, signal, inject, PLATFORM_ID, OnInit, resource } from '@angular/core';
import { isPlatformBrowser, CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trpc } from '../trpc-client';

@Component({
  selector: 'app-oracle',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  template: `
    <div class="space-y-6 pb-20">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-black tracking-tight text-gradient">Oracle</h1>
          <p class="text-zinc-500 font-medium">Algorithmic trade suggestions and market analysis.</p>
        </div>
        <div class="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
          <button *ngFor="let s of strategies" 
                  (click)="strategy.set(s.id)"
                  [class.bg-blue-600]="strategy() === s.id"
                  [class.text-white]="strategy() === s.id"
                  [class.bg-transparent]="strategy() !== s.id"
                  [class.text-zinc-500]="strategy() !== s.id"
                  class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all">
            {{ s.name }}
          </button>
        </div>
      </div>

      <!-- Market Stats Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 text-center">Market Sentiment</div>
          <div class="text-2xl font-bold text-center"
               [class.text-green-400]="market?.marketSentiment === 'BULLISH'"
               [class.text-red-400]="market?.marketSentiment === 'BEARISH'">
            {{ market?.marketSentiment }}
          </div>
        </div>
        <div class="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-center gap-8">
          <div class="text-center">
            <div class="text-[10px] font-bold text-green-500 uppercase tracking-widest">{{ market?.gainers }}</div>
            <div class="text-xl font-bold">Gainers</div>
          </div>
          <div class="text-center">
             <div class="text-[10px] font-bold text-red-500 uppercase tracking-widest">{{ market?.losers }}</div>
             <div class="text-xl font-bold">Losers</div>
          </div>
        </div>
        <div class="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
           <div class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 text-center">Top Opportunity</div>
           <div class="text-xl font-bold text-blue-400 text-center truncate">
             {{ suggestions[0]?.item?.name || 'Searching...' }}
           </div>
        </div>
      </div>

      <!-- Suggestions Sidebar/Grid Layout -->
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <!-- Main Suggestions List -->
        <div class="xl:col-span-3 space-y-4">
          <div *ngFor="let s of suggestions" 
               class="group bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 rounded-xl overflow-hidden transition-all duration-300">
            <div class="p-6 flex flex-col md:flex-row gap-6">
              <!-- Item Info -->
              <div class="flex items-center gap-4 min-w-[200px]">
                <div class="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700 p-3 shadow-lg">
                  <img [src]="s.item.imageUrl" class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" *ngIf="s.item.imageUrl">
                </div>
                <div>
                  <h3 class="font-bold text-lg text-zinc-100">{{ s.item.name }}</h3>
                  <div class="flex gap-2 mt-1">
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-blue-400 uppercase tracking-widest border border-blue-900/30">
                      {{ s.item.category }}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 uppercase tracking-widest">
                      VOL: {{ s.item.volume24h | number }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Metrics -->
              <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 py-2 border-l border-r border-zinc-800/50 px-6">
                <div class="text-center">
                  <div class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">RSI</div>
                  <div class="text-sm font-mono" [class.text-green-400]="s.metrics.rsi < 30" [class.text-red-400]="s.metrics.rsi > 70">
                    {{ s.metrics.rsi }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Volat.</div>
                  <div class="text-sm font-mono text-zinc-300">{{ s.metrics.volatility }}</div>
                </div>
                <div class="text-center">
                  <div class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">7D Avg</div>
                  <div class="text-sm font-mono text-zinc-300">{{ s.metrics.sma7 | number:'1.2-2' }}</div>
                </div>
                <div class="text-center">
                  <div class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Signal</div>
                  <div class="text-[10px] font-bold uppercase" 
                       [class.text-green-400]="s.suggestedAction === 'BUY'"
                       [class.text-red-400]="s.suggestedAction === 'SELL'">
                    {{ s.reason }}
                  </div>
                </div>
              </div>

              <!-- Action -->
              <div class="flex flex-col items-center justify-center min-w-[150px] gap-2">
                <div class="text-xs text-zinc-500 uppercase font-bold tracking-widest">Confidence</div>
                <div class="text-2xl font-black text-zinc-100">{{ s.score }}%</div>
                <button class="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                  Execute Strategy
                </button>
              </div>
            </div>

            <!-- Price Mini Chart Replacement (Visual Element) -->
            <div class="h-1 bg-zinc-800 w-full overflow-hidden flex">
              <div *ngFor="let p of s.priceHistory" 
                   class="h-full border-r border-zinc-900/50 flex-1 bg-blue-500/20 transition-all duration-500"
                   [style.opacity]="0.1 + (s.score / 100)"></div>
            </div>
          </div>
        </div>

        <!-- Sidebar Info -->
        <div class="space-y-6">
          <div class="p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl">
            <h3 class="font-bold text-blue-400 mb-2 flex items-center gap-2 text-center">
              <span>🧠</span>
              Oracle Logic
            </h3>
            <p class="text-xs text-zinc-400 leading-relaxed">
              Our Oracle analyzes historical data including RSI, SMA crossovers, and volume spikes to identify market inefficiencies.
            </p>
            <div class="mt-4 space-y-2">
              <div class="flex items-center gap-2 text-[10px] text-zinc-300 font-bold">
                <span class="w-1 h-1 bg-blue-500 rounded-full"></span>
                RSI < 30 = OVERBOUGHT
              </div>
              <div class="flex items-center gap-2 text-[10px] text-zinc-300 font-bold">
                <span class="w-1 h-1 bg-blue-500 rounded-full"></span>
                VOL > 100 = LIQUIDITY
              </div>
            </div>
          </div>

          <div class="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <h3 class="font-bold text-zinc-300 mb-4 text-center">Risk Disclaimer</h3>
            <p class="text-[10px] text-zinc-500 leading-relaxed italic">
               Trading in Path of Exile is subject to market volatility and ninja manipulation. Never invest more than you can afford to lose. All suggestions are algorithmic results, not financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export default class OraclePage {
  strategy = signal<'ALL' | 'DIP_HUNTER' | 'SNIPER' | 'ARBITRAGE' | 'MOMENTUM'>('ALL');

  strategies: { id: any; name: string }[] = [
    { id: 'ALL', name: 'All' },
    { id: 'DIP_HUNTER', name: 'Dip Hunter' },
    { id: 'SNIPER', name: 'Sniper' },
    { id: 'ARBITRAGE', name: 'Arbitrage' },
    { id: 'MOMENTUM', name: 'Momentum' },
  ];

  public marketResource = resource({
    loader: () => trpc.oracle.getMarketOverview.query(),
  });
  
  public suggestionsResource = resource({
    loader: () => trpc.oracle.getSuggestions.query({ strategy: this.strategy() }),
  });

  protected get suggestions() {
    return (this.suggestionsResource.value() || []) as any[];
  }

  protected get market() {
    return this.marketResource.value();
  }
}
