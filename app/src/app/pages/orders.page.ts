
import { Component, inject, resource, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TRPC_CLIENT } from '../trpc.token';
import { withTransferCache } from '../trpc.utils';
import { ResolveOrderComponent } from '../components/resolve-order.component';
import { Order } from '../interfaces';



@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ResolveOrderComponent],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700 p-8 max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-2">My Orders</h1>

      <!-- Tabs -->
      <div class="flex gap-4 border-b border-zinc-800">
          <button class="px-4 py-2 text-sm font-bold border-b-2 transition-colors"
             [class.border-blue-500]="activeTab() === 'PENDING'"
             [class.text-blue-400]="activeTab() === 'PENDING'"
             [class.border-transparent]="activeTab() !== 'PENDING'"
             [class.text-zinc-500]="activeTab() !== 'PENDING'"
             (click)="activeTab.set('PENDING')">
             Pending
          </button>
           <button class="px-4 py-2 text-sm font-bold border-b-2 transition-colors"
             [class.border-blue-500]="activeTab() === 'EXECUTED'"
             [class.text-blue-400]="activeTab() === 'EXECUTED'"
             [class.border-transparent]="activeTab() !== 'EXECUTED'"
             [class.text-zinc-500]="activeTab() !== 'EXECUTED'"
             (click)="activeTab.set('EXECUTED')">
             History
          </button>
      </div>

      <!-- List -->
      <div class="grid gap-4">
        @if (ordersResource.isLoading()) {
             <div class="text-center py-10 text-zinc-500">Loading...</div>
        }
        
        @for (order of filteredOrders(); track order.id) {
           <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-zinc-700 transition-colors">
               
               <div class="flex items-center gap-4">
                   <!-- Icon -->
                   <div class="w-12 h-12 bg-zinc-950 rounded-lg border border-zinc-800 p-1 flex items-center justify-center">
                         <img [src]="'/assets/poe-ninja/' + order.marketItem.detailsId + '.png'" [alt]="order.marketItem.name" class="w-full h-full object-contain">
                   </div>
                   
                   <div>
                       <div class="flex items-center gap-2">
                            <span class="text-xs font-bold px-2 py-0.5 rounded uppercase"
                                [class.bg-blue-900]="order.type === 'BUY'"
                                [class.text-blue-300]="order.type === 'BUY'"
                                [class.bg-red-900]="order.type === 'SELL'"
                                [class.text-red-300]="order.type === 'SELL'">
                                {{ order.type }}
                            </span>
                           <h3 class="font-bold text-white">{{ order.marketItem.name }}</h3>
                       </div>
                       <div class="text-sm text-zinc-500 mt-1">
                           Target: <span class="text-zinc-300 font-mono">{{ order.quantity }}</span> items @ <span class="text-zinc-300 font-mono">{{ order.pricePerUnit }}</span> div/ea
                           <span class="ml-2 text-xs opacity-50">({{ order.createdAt | date:'short' }})</span>
                       </div>
                   </div>
               </div>

               <!-- Actions / Status -->
               @if (order.status === 'PENDING') {
                   <div class="flex items-center gap-3 w-full md:w-auto">
                       <button 
                         (click)="openResolve(order)"
                         class="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm transition-colors">
                          Resolve
                       </button>
                       <button 
                          (click)="cancel(order.id)"
                          class="px-4 py-2 bg-zinc-800 hover:bg-red-900/50 hover:text-red-400 text-zinc-400 font-bold rounded-lg text-sm transition-colors">
                          Cancel
                       </button>
                   </div>
               } @else {
                   <div class="text-right">
                       <div class="text-sm font-bold text-green-400 flex items-center gap-1 justify-end">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            Executed
                       </div>
                       <div class="text-xs text-zinc-500">
                           Filfilled: {{ order.fulfilledQuantity }} @ {{ order.fulfilledPricePerUnit }} div
                       </div>
                   </div>
               }
           </div>
        }

        @if (filteredOrders().length === 0 && !ordersResource.isLoading()) {
            <div class="text-center py-20 text-zinc-500 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
                No {{ activeTab().toLowerCase() }} orders found.
            </div>
        }
      </div>


      <!-- Resolution Modal -->
      @if (resolveModalOpen() && selectedOrder(); as order) {
          <app-resolve-order
            [order]="order"
            (closed)="resolveModalOpen.set(false)"
            (resolved)="onResolved($event)"
          ></app-resolve-order>
      }

    </div>
  `
})
export default class OrdersPage {
  private trpc = inject(TRPC_CLIENT);

  public activeTab = signal<'PENDING' | 'EXECUTED'>('PENDING');

  public ordersResource = resource({
    loader: withTransferCache('orders-list', () => 
      this.trpc.orders.listOrders.query({})
    ),
  });

  public filteredOrders = computed(() => {
     const orders = (this.ordersResource.value() as Order[]) ?? [];
     return orders.filter((o) => o.status === this.activeTab());
  });


  // Resolution Logic
  public resolveModalOpen = signal(false);
  public selectedOrder = signal<Order | null>(null);

  openResolve(order: Order) {
      this.selectedOrder.set(order);
      this.resolveModalOpen.set(true);
  }

  async onResolved(event: { quantity: number; pricePerUnit: number }) {
      const order = this.selectedOrder();
      if (!order) return;

      try {

          await this.trpc.orders.resolveOrder.mutate({
              orderId: order.id,
              fulfilledQuantity: event.quantity,
              fulfilledPricePerUnit: event.pricePerUnit
          });
          this.ordersResource.reload();
          this.resolveModalOpen.set(false);
      } catch (e) {
          console.error("Failed to resolve", e);
          alert("Error: " + (e as Error).message);
      }
  }

  async cancel(orderId: string) {
      if (!confirm("Cancel this order?")) return;
      try {

          await this.trpc.orders.cancelOrder.mutate({ orderId });
          this.ordersResource.reload();
      } catch (e) {
          console.error("Failed to cancel", e);
      }
  }
}
