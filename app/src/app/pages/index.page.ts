import { Component, inject, resource, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common'; // Import CommonModule for pipes
import { RouterLink } from '@angular/router';
import { TRPC_CLIENT } from '../trpc.token';
import { CreateOrderComponent } from '../components/create-order.component';
import { ResolveOrderComponent } from '../components/resolve-order.component';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, RouterLink, CreateOrderComponent, ResolveOrderComponent],
  template: `
    <div class="h-full p-8 animate-in fade-in duration-700 pb-20">
        <div class="max-w-7xl mx-auto">
             <!-- Header -->
            <header class="mb-12">
               <h1 class="text-4xl font-bold text-white tracking-tight mb-2">Cockpit</h1>
               <p class="text-zinc-500">Your command center for trading and wealth management.</p>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <!-- Wealth Card -->
                <div class="rich-panel p-6 rounded-2xl relative overflow-hidden group">
                     <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <img src="/assets/poe-ninja/divine-orb.png" class="w-24 h-24 object-contain">
                     </div>
                     
                     <div class="relative z-10">
                        <div class="flex justify-between items-start mb-4">
                            <div class="text-zinc-400 text-xs font-bold uppercase tracking-widest">Total Net Worth</div>
                            <button (click)="refresh()" class="p-2 -mr-2 -mt-2 text-zinc-500 hover:text-white transition-colors" title="Refresh Data">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" [class.animate-spin]="loading()">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                            </button>
                        </div>
                        <div class="flex items-baseline gap-2">
                             <span class="text-5xl font-mono font-bold text-white tracking-tighter">
                                {{ totalWealth() | number:'1.0-2' }}
                             </span>
                             <span class="text-xl text-amber-500 font-bold">div</span>
                        </div>
                        <div class="mt-4 flex gap-4">
                            <a routerLink="/wallet" class="btn-ghost text-xs flex items-center gap-2">
                                Manage Wallet 
                                <span aria-hidden="true">&rarr;</span>
                            </a>
                        </div>
                     </div>
                </div>

                 <!-- Active Orders -->
                <div class="rich-panel p-6 rounded-2xl relative overflow-hidden group flex flex-col">
                     <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <!-- Clean List/Activity Icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 stroke-white fill-none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                        </svg>
                     </div>
                     
                     <div class="relative z-10 flex-1 flex flex-col">
                        <div class="flex justify-between items-center mb-4">
                            <div class="text-zinc-400 text-xs font-bold uppercase tracking-widest">Active Orders</div>
                            <span class="text-xs font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{{ activeOrdersCount() }}</span>
                        </div>

                         @if (topPendingOrders().length > 0) {
                             <div class="space-y-3 flex-1">
                                 @for (order of topPendingOrders(); track order.id) {
                                     <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-950/30 border border-zinc-800/50">
                                         <div class="flex items-center gap-3 min-w-0">
                                             <img [src]="'/assets/poe-ninja/' + order.marketItem.detailsId + '.png'" class="w-8 h-8 object-contain bg-zinc-900 rounded p-1 border border-zinc-800" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                                             <div class="min-w-0"> 
                                                 <div class="text-xs font-bold text-white truncate">{{ order.marketItem.name }}</div>
                                                 <div class="text-[10px] text-zinc-500">
                                                     <span [class.text-blue-400]="order.type === 'BUY'" [class.text-red-400]="order.type === 'SELL'">{{ order.type }}</span> 
                                                     {{ order.quantity }} @ {{ order.pricePerUnit }}d
                                                 </div>
                                             </div>
                                         </div>
                                         <button 
                                            (click)="openResolve(order)"
                                            class="shrink-0 px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded transition-colors border border-green-600/30">
                                             Resolve
                                         </button>
                                     </div>
                                 }
                             </div>
                         } @else {
                             <div class="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm italic">
                                 No active orders
                             </div>
                         }

                        <div class="mt-4">
                            <a routerLink="/orders" class="btn-ghost text-xs flex items-center gap-2">
                                View All Orders
                                <span aria-hidden="true">&rarr;</span>
                            </a>
                        </div>
                     </div>
                </div>

                <!-- Vault Status -->
                 <div class="rich-panel p-6 rounded-2xl relative overflow-hidden group">
                     <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 stroke-white fill-none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                        </svg>
                     </div>
                     
                     <div class="relative z-10">
                        <div class="flex justify-between items-center mb-4">
                            <div class="text-zinc-400 text-xs font-bold uppercase tracking-widest">Vault Inventory</div>
                             <span class="text-xs font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{{ vaultItemCount() }}</span>
                        </div>

                         @if (topVaultItems().length > 0) {
                             <div class="space-y-3 flex-1">
                                 @for (invItem of topVaultItems(); track invItem.id) {
                                     <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-950/30 border border-zinc-800/50 group/item">
                                         <div class="flex items-center gap-3 min-w-0">
                                             <img [src]="'/assets/poe-ninja/' + invItem.marketItem.detailsId + '.png'" class="w-8 h-8 object-contain bg-zinc-900 rounded p-1 border border-zinc-800" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                                             <div class="min-w-0"> 
                                                 <div class="text-xs font-bold text-white truncate">{{ invItem.marketItem.name }}</div>
                                                 <div class="text-[10px] text-zinc-500">
                                                     <span class="text-zinc-300">{{ invItem.quantity }}</span> in stock
                                                     <span class="text-zinc-600 mx-1">|</span>
                                                     <span class="text-zinc-500">~{{ invItem.totalValue | number:'1.0-1' }} div</span>
                                                 </div>
                                             </div>
                                         </div>
                                         <button 
                                            (click)="openSell(invItem.marketItem)"
                                            class="shrink-0 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded transition-colors border border-blue-600/30 opacity-0 group-hover/item:opacity-100 focus:opacity-100">
                                             Sell
                                         </button>
                                     </div>
                                 }
                             </div>
                         } @else {
                             <div class="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm italic">
                                 Vault is empty
                             </div>
                         }

                        <div class="mt-4">
                            <a routerLink="/vault" class="btn-ghost text-xs flex items-center gap-2">
                                Inspect Vault
                                <span aria-hidden="true">&rarr;</span>
                            </a>
                        </div>
                     </div>
                </div>

            </div>

            <!-- Market Ticker / Highlights -->
            <div class="mt-8">
                 <div class="text-zinc-500 text-sm font-bold mb-4 flex items-center justify-between">
                    <span>Market Highlights</span>
                    <a routerLink="/market" class="text-blue-400 hover:text-blue-300 text-xs">View Market &rarr;</a>
                 </div>
                 
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    @for (item of topMovers(); track item.id) {
                         <div class="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-3 hover:bg-zinc-800/50 transition-colors group relative">
                            <a [routerLink]="['/market', item.detailsId]" class="absolute inset-0 z-0"></a>
                            <img [src]="item.image" class="w-10 h-10 object-contain relative z-10 pointer-events-none" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                            <div class="min-w-0 relative z-10 pointer-events-none">
                                <div class="text-white font-bold text-sm truncate">{{ item.name }}</div>
                                <div class="text-zinc-400 text-xs font-mono flex items-center gap-1">
                                    {{ getDivinePrice(item) | number:'1.1-2' }}
                                    <img src="/assets/poe-ninja/divine-orb.png" class="w-4 h-4 object-contain">
                                </div>
                            </div>
                            
                            <div class="ml-auto flex items-center gap-2 relative z-10">
                                <span class="text-xs font-mono px-2 py-1 rounded pointer-events-none"
                                    [class.text-green-400]="(item.change24h ?? 0) >= 0"
                                    [class.bg-green-900/20]="(item.change24h ?? 0) >= 0"
                                    [class.text-red-400]="(item.change24h ?? 0) < 0"
                                    [class.bg-red-900/20]="(item.change24h ?? 0) < 0">
                                    {{ (item.change24h ?? 0) > 0 ? '+' : '' }}{{ item.change24h | number:'1.0-1' }}%
                                </span>
                                <button 
                                    (click)="openTrade(item)"
                                    class="w-6 h-6 flex items-center justify-center rounded bg-blue-600 hover:bg-blue-500 text-white transition-opacity opacity-0 group-hover:opacity-100"
                                    title="Trade">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                      <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                         </div>
                    }
                    @if (topMovers().length === 0) {
                        <div class="col-span-full py-8 text-center text-zinc-600 text-sm italic">
                            Loading market data...
                        </div>
                    }
                 </div>
            </div>

        </div>

        <!-- Modals -->
        @if (tradeModalOpen() && selectedMarketItem()) {
            <app-create-order
                [marketItem]="selectedMarketItem()"
                [initialOrderType]="tradeStartMode()"
                (close)="tradeModalOpen.set(false)"
                (created)="onOrderCreated()"
            ></app-create-order>
        }

        @if (resolveModalOpen() && selectedOrder()) {
            <app-resolve-order
                [order]="selectedOrder()"
                (close)="resolveModalOpen.set(false)"
                (resolved)="onResolved($event)"
            ></app-resolve-order>
        }
    </div>
  `,
})
export default class CockpitPage {
  private trpc = inject(TRPC_CLIENT);

  public loading = signal(false);

  // Resources
  walletResource = resource({
    loader: () => this.trpc.wallet.getWallet.query()
  });

  ordersResource = resource({
     loader: () => this.trpc.orders.listOrders.query({})
  });

  marketResource = resource({
      loader: () => this.trpc.market.getOverview.query()
  });

  // Computations
  
  // Wealth Calculation
  totalWealth = computed(() => {
     const wallet = this.walletResource.value() as any;
     if (!wallet) return 0;

     // We need market prices to calculate total wealth in Divines
     const market = this.marketResource.value() as any[];
     if (!market) return 0; 

     const divBalance = wallet.balances.find((b: any) => b.currency === 'DIVINE')?.amount ?? 0;
     const chaosBalance = wallet.balances.find((b: any) => b.currency === 'CHAOS')?.amount ?? 0;
     const exBalance = wallet.balances.find((b: any) => b.currency === 'EXALTED')?.amount ?? 0;

     const chaosPrice = market.find((i: any) => i.detailsId === 'chaos-orb')?.primaryValue ?? 0;
     const exPrice = market.find((i: any) => i.detailsId === 'exalted-orb')?.primaryValue ?? 0;

     return divBalance + (chaosBalance * chaosPrice) + (exBalance * exPrice);
  });

  activeOrdersCount = computed(() => {
      const orders = (this.ordersResource.value() as any[]) ?? [];
      return orders.filter(o => o.status === 'PENDING').length;
  });

  topPendingOrders = computed(() => {
      const orders = (this.ordersResource.value() as any[]) ?? [];
      return orders
        .filter(o => o.status === 'PENDING')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
  });

  vaultItemCount = computed(() => {
      const wallet = this.walletResource.value() as any;
      const items = (wallet?.inventory as any[]) ?? [];
      return items.filter(i => i.quantity > 0).length;
  });

  topVaultItems = computed(() => {
      const wallet = this.walletResource.value() as any;
      if (!wallet || !wallet.inventory) return [];
      
      return (wallet.inventory as any[])
          .filter(item => item.quantity > 0)
          .map(item => ({
              ...item,
              totalValue: item.quantity * (item.marketItem.primaryValue || 0)
          }))
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 3);
  });

  topMovers = computed(() => {
      const market = (this.marketResource.value() as any[]) ?? [];
      // Just taking the first 4 for now as "highlights"
      return market.slice(0, 4);
  });

  // Actions
  
  async refresh() {
      this.loading.set(true);
      await Promise.all([
          this.walletResource.reload(),
          this.ordersResource.reload(),
          this.marketResource.reload()
      ]);
      this.loading.set(false);
  }

  // Trade Modal
  public tradeModalOpen = signal(false);
  public selectedMarketItem = signal<any>(null);
  public tradeStartMode = signal<'BUY' | 'SELL'>('BUY');

  openTrade(item: any) {
      this.selectedMarketItem.set(item);
      this.tradeStartMode.set('BUY');
      this.tradeModalOpen.set(true);
  }

  openSell(item: any) {
      this.selectedMarketItem.set(item);
      this.tradeStartMode.set('SELL');
      this.tradeModalOpen.set(true);
  }

  onOrderCreated() {
      this.refresh();
  }

  // Resolution Modal
  public resolveModalOpen = signal(false);
  public selectedOrder = signal<any>(null);

  openResolve(order: any) {
      this.selectedOrder.set(order);
      this.resolveModalOpen.set(true);
  }

  async onResolved(event: { quantity: number; pricePerUnit: number }) {
      const order = this.selectedOrder();
      if (!order) return;

      try {
          // @ts-ignore
          await this.trpc.orders.resolveOrder.mutate({
              orderId: order.id,
              fulfilledQuantity: event.quantity,
              fulfilledPricePerUnit: event.pricePerUnit
          });
          this.refresh();
          this.resolveModalOpen.set(false);
      } catch (e) {
          console.error("Failed to resolve", e);
          alert("Error: " + (e as any).message);
      }
  }

  getDivinePrice(item: any): number {
      return item.pairs?.find((p: any) => p.currencyId === 'divine')?.rate ?? 0;
  }
}



