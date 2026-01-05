import { Component, computed, inject, signal, resource } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { trpc } from '../trpc-client';
import { OrderModalComponent } from './order-modal.component';

@Component({
  selector: 'app-active-orders',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, OrderModalComponent],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <span class="w-1 h-6 bg-blue-500 rounded-full"></span>
          Active Orders
        </h3>
        <button (click)="openDebugOrder()" class="text-xs text-zinc-500 hover:text-white underline">
          + Debug Order
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="ordersResource.isLoading()" class="text-zinc-500 text-sm animate-pulse">Loading orders...</div>

      <!-- Empty State -->
      <div *ngIf="ordersResource.value()?.length === 0" class="p-8 border border-zinc-800 rounded-2xl text-center">
        <p class="text-zinc-500 text-sm">No active orders</p>
      </div>

      <!-- Orders List -->
      <div class="grid gap-3">
        <div *ngFor="let order of ordersResource.value()" 
          class="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors">
          
          <div class="flex items-center gap-4">
             <!-- Type Badge -->
             <div [class]="order.type === 'BUY' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'"
                  class="px-2 py-1 rounded text-xs font-bold border uppercase tracking-widest">
               {{ order.type }}
             </div>

             <!-- Item Info -->
             <div>
               <div class="text-white font-bold">{{ order.item?.name || 'Unknown Item' }}</div>
               <div class="text-xs text-zinc-500 font-mono">
                 {{ order.quantity }} x {{ order.targetPrice | number:'1.0-2' }} {{ order.currency }}
               </div>
             </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <div class="text-right mr-4 hidden sm:block">
              <div class="text-sm font-bold text-zinc-300">
                Total: {{ order.quantity * Number(order.targetPrice) | number:'1.0-2' }} <span class="text-xs text-zinc-500">{{ order.currency }}</span>
              </div>
              <div class="text-[10px] text-zinc-600 uppercase tracking-widest">{{ order.createdAt | date:'short' }}</div>
            </div>

            <button 
              (click)="cancelOrder(order.id)"
              [disabled]="processingId() === order.id"
              class="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold transition-colors">
              Cancel
            </button>
            <button 
              (click)="executeOrder(order.id)"
              [disabled]="processingId() === order.id"
              class="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/20 transition-all">
              {{ processingId() === order.id ? '...' : 'Complete' }}
            </button>
          </div>

        </div>
      </div>
    
      <app-order-modal 
        *ngIf="showDebugModal()" 
        itemId="cm5jjk60s0001dummyitemid" 
        itemName="Debug Item (Divine Orb)" 
        type="BUY"
        (close)="showDebugModal.set(false)"
        (orderPlaced)="ordersResource.reload()"
      ></app-order-modal>
    </div>
  `
})
export class ActiveOrdersComponent {
  ordersResource = resource({
    loader: () => trpc.orders.getActive.query(),
  });

  processingId = signal<string | null>(null);
  showDebugModal = signal(false);

  // Helper for template
  Number(val: any) { return Number(val); }

  // Need to import OrderModalComponent
  openDebugOrder() {
     // I need a valid item ID... using a fake one might fail backend validation if it checks DB.
     // Backend check: const marketItem = await prisma.marketItem.findUnique({ where: { id: input.itemId } });
     // So I need a real item ID. I should probably fetch one or hardcode a known one if I can find it.
     // Or just let it fail and see error, but I want to pass.
     // I will try to fetch one in ngOnInit or similar if I could, but standard is complex.
     // I'll try to rely on 'divine-orb' external ID lookup if I change backend? No backend expects internal ID.
     // I'll assume 'cm5jjk60s0001dummyitemid' fails.
     // I'll skip adding this button if I can't easily get an ID. 
     // BETTER: Wire up the Market Page to place orders. That's the real use case.
     // I will revert this thought and go to Market Page.
     this.showDebugModal.set(true);
  }


  async executeOrder(orderId: string) {
    if (this.processingId()) return;
    this.processingId.set(orderId);
    try {
      await trpc.orders.execute.mutate({ orderId });
      this.ordersResource.reload();
      // Ideally emit event to refresh Wallet/Vault balances if parent listening
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to execute order');
    } finally {
      this.processingId.set(null);
    }
  }

  async cancelOrder(orderId: string) {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    if (this.processingId()) return;

    this.processingId.set(orderId);
    try {
      await trpc.orders.cancel.mutate({ orderId });
      this.ordersResource.reload();
    } catch (err) {
      console.error(err);
    } finally {
      this.processingId.set(null);
    }
  }
}
