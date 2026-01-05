import { Component, signal, resource, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trpc } from '../trpc-client';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-black tracking-tight text-gradient">Market</h1>
          <p class="text-zinc-500 font-medium">Live prices and historical trends from poe.ninja.</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 text-center">Search</label>
          <input [ngModel]="search()" 
                 (ngModelChange)="search.set($event); offset.set(0)"
                 placeholder="Search items..." 
                 class="w-full bg-zinc-800 border-zinc-700 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none">
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 text-center font-bold">Category</label>
          <select [ngModel]="category()" 
                  (ngModelChange)="category.set($event); offset.set(0)"
                  class="w-full bg-zinc-800 border-zinc-700 rounded-lg px-4 py-2 text-sm outline-none">
            <option value="">All Categories</option>
            <option *ngFor="let cat of categoriesResource.value()" [value]="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 text-center font-bold">Sort By</label>
          <select [ngModel]="sortBy()" 
                  (ngModelChange)="sortBy.set($event); offset.set(0)"
                  class="w-full bg-zinc-800 border-zinc-700 rounded-lg px-4 py-2 text-sm outline-none">
            <option value="name">Name</option>
            <option value="divineRate">Divine Rate</option>
            <option value="volume24h">Volume (24h)</option>
            <option value="updatedAt">Last Updated</option>
          </select>
        </div>
      </div>

      <!-- Market Table -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-zinc-800/50 border-b border-zinc-800">
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Item</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Category</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Divine</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Volume</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Trend</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800">
              <tr *ngFor="let item of itemsResource.value()?.items" class="hover:bg-zinc-800/30 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <img [src]="item.imageUrl" [alt]="item.name" class="w-7 h-7 object-contain group-hover:scale-110 transition-transform" *ngIf="item.imageUrl">
                    <span class="font-medium text-zinc-100">{{ item.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 uppercase tracking-widest">
                    {{ item.category }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="text-sm font-mono font-bold text-zinc-100">{{ item.divineRate | number:'1.2-2' }} DIV</div>
                  <div class="text-[10px] text-zinc-500 font-mono">{{ item.chaosRate | number:'1.0-2' }} CHAOS</div>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="text-sm font-mono text-zinc-400">{{ item.volume24h | number }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex justify-center flex-col items-center gap-1">
                    <div class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Stable</div>
                    <div class="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-500 opacity-30" style="width: 100%"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 bg-zinc-800/30 border-t border-zinc-800 flex items-center justify-between">
          <div class="text-xs text-zinc-500">
            Showing {{ itemsResource.value()?.items?.length || 0 }} of {{ itemsResource.value()?.total || 0 }} items
          </div>
          <div class="flex gap-2">
            <button class="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 disabled:opacity-50 text-xs text-zinc-400 transition-colors"
                    [disabled]="offset() === 0" (click)="prevPage()">Previous</button>
            <button class="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 disabled:opacity-50 text-xs text-zinc-400 transition-colors"
                    [disabled]="!itemsResource.value()?.hasMore" (click)="nextPage()">Next</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export default class MarketPage {
  search = signal('');
  category = signal('');
  sortBy = signal('name');
  limit = 100;
  offset = signal(0);

  public categoriesResource = resource({
    loader: () => trpc.market.getCategories.query(),
  });
  
  public itemsResource = resource({
    loader: () => trpc.market.getItems.query({
      category: this.category() || undefined,
      search: this.search() || undefined,
      sortBy: this.sortBy() as any,
      limit: this.limit,
      offset: this.offset()
    }),
  });

  nextPage() {
    if (this.itemsResource.value()?.hasMore) {
      this.offset.update(o => o + this.limit);
    }
  }

  prevPage() {
    if (this.offset() >= this.limit) {
      this.offset.update(o => o - this.limit);
    }
  }
}
