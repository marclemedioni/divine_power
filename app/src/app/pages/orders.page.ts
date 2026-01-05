import { Component, inject, resource } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { trpc } from '../trpc-client';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-black tracking-tight text-gradient">Orders</h1>
          <p class="text-zinc-500 font-medium">Track and manage your active trade orders.</p>
        </div>
        <div class="flex gap-4">
          <div class="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl">
             <div class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 text-center">Active Orders</div>
             <div class="text-xl font-bold text-yellow-400 text-center">{{ statsResource.value()?.pending }}</div>
          </div>
        </div>
      </div>

      <!-- Actionable Orders -->
      <div *ngIf="actionableResource.value()?.length" class="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.1)]">
        <h2 class="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
          <span>🔔</span> Actionable Opportunities
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let o of actionableResource.value()" class="p-4 bg-zinc-900/60 rounded-xl border border-yellow-500/20 group hover:border-yellow-500/40 transition-all">
            <div class="flex items-center gap-3 mb-4">
               <img [src]="o.item.imageUrl" class="w-8 h-8 object-contain">
               <div>
                 <div class="text-sm font-bold text-zinc-100">{{ o.item.name }}</div>
                 <div class="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{{ o.type }}</div>
               </div>
            </div>
            <div class="flex justify-between items-end">
              <div>
                <div class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 font-center">Price Target met</div>
                <div class="text-sm font-mono text-zinc-300">{{ o.currentPrice | number:'1.2-2' }} / {{ o.targetPrice | number:'1.2-2' }} DIV</div>
              </div>
              <button (click)="executeOrder(o.id)" class="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg shadow-yellow-900/20">
                Execute
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Orders Table -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div class="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-800/20">
          <h2 class="font-bold text-zinc-100 flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
            Pending Orders
          </h2>
          <div class="text-xs text-zinc-500">{{ (ordersResource.value()?.orders || []).length }} Active</div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-zinc-900/50 border-b border-zinc-800">
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Item</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Type</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Quantity</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Target Price</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Created</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/50">
              <tr *ngFor="let o of ordersResource.value()?.orders" class="hover:bg-zinc-800/20 transition-all group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <img [src]="o.item.imageUrl" class="w-6 h-6 object-contain opacity-60 group-hover:opacity-100 transition-opacity">
                    <span class="font-medium text-zinc-200 group-hover:text-zinc-100">{{ o.item.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest"
                        [class.bg-blue-500/10]="o.type === 'BUY'"
                        [class.text-blue-400]="o.type === 'BUY'"
                        [class.bg-purple-500/10]="o.type === 'SELL'"
                        [class.text-purple-400]="o.type === 'SELL'">
                    {{ o.type }}
                  </span>
                </td>
                <td class="px-6 py-4 font-mono text-zinc-400 text-sm">x{{ o.quantity }}</td>
                <td class="px-6 py-4 text-right">
                  <div class="text-sm font-mono font-bold text-zinc-200">{{ o.targetPrice | number:'1.2-2' }} DIV</div>
                </td>
                <td class="px-6 py-4 text-right text-xs text-zinc-400">{{ o.createdAt | date:'short' }}</td>
                <td class="px-6 py-4 text-center">
                  <button (click)="cancelOrder(o.id)" class="p-2 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded-lg transition-all group/btn">
                    <span class="text-xs font-bold uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity mr-2">Cancel</span>
                    🗑️
                  </button>
                </td>
              </tr>
              <tr *ngIf="(ordersResource.value()?.orders || []).length === 0">
                <td colspan="6" class="px-6 py-20 text-center">
                  <div class="text-4xl mb-4 opacity-10">📝</div>
                  <div class="text-zinc-500 font-bold uppercase tracking-widest text-xs">No active orders</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export default class OrdersPage {
  public ordersResource = resource({
    loader: () => trpc.orders.getOrders.query({ status: 'PENDING' }),
  });

  public statsResource = resource({
    loader: () => trpc.orders.getStats.query(),
  });

  public actionableResource = resource({
    loader: () => trpc.orders.getActionableOrders.query(),
  });

  async cancelOrder(id: string) {
    if (confirm('Cancel this order?')) {
      await trpc.orders.cancelOrder.mutate({ id });
      this.reload();
    }
  }

  async executeOrder(id: string) {
    await trpc.orders.executeOrder.mutate({ orderId: id });
    this.reload();
  }

  private reload() {
    this.ordersResource.reload();
    this.statsResource.reload();
    this.actionableResource.reload();
  }
}
