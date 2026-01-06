import { Component, Input, Output, EventEmitter, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TRPC_CLIENT } from '../trpc.token';
import { MarketItem, Wallet, InventoryLot } from '../interfaces';

const INVESTMENT_MODES = {
  PRUDENT: 0.1,
  BALANCED: 0.3,
  AGGRESSIVE: 0.5
} as const;

type InvestmentMode = keyof typeof INVESTMENT_MODES;

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" 
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
        tabindex="-1"
        role="presentation">
        
        <!-- Header -->
        <div class="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <img [src]="'/assets/poe-ninja/' + marketItem.detailsId + '.png'" [alt]="marketItem.name" class="w-6 h-6 object-contain" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
            <span class="text-blue-400">Trade</span> {{ marketItem.name }}
          </h2>
          <button (click)="closed.emit()" class="text-zinc-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          
          <!-- Buy / Sell Toggle -->
          <div class="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button 
                class="flex-1 py-2 text-sm font-bold rounded-md transition-all"
                [class.bg-blue-600]="orderType() === 'BUY'"
                [class.text-white]="orderType() === 'BUY'"
                [class.text-zinc-500]="orderType() !== 'BUY'"
                [class.hover:text-zinc-300]="orderType() !== 'BUY'"
                (click)="orderType.set('BUY')"
            >BUY</button>
            <button 
                class="flex-1 py-2 text-sm font-bold rounded-md transition-all"
                [class.bg-red-600]="orderType() === 'SELL'"
                [class.text-white]="orderType() === 'SELL'"
                [class.text-zinc-500]="orderType() !== 'SELL'"
                [class.hover:text-zinc-300]="orderType() !== 'SELL'"
                (click)="orderType.set('SELL')"
            >SELL</button>
          </div>

          <!-- Strategy / Investment Mode -->
          @if (orderType() === 'BUY') {
              <div class="space-y-2">
                <label for="investment-strategy" class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Investment Strategy (Divine Flip)</label>
                <div id="investment-strategy" class="grid grid-cols-3 gap-2">
                    @for (mode of modeKeys; track mode) {
                        <button 
                            class="py-2 px-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1"
                            [class.border-blue-500]="investmentMode() === mode"
                            [class.bg-blue-500/10]="investmentMode() === mode"
                            [class.text-blue-400]="investmentMode() === mode"
                            [class.border-zinc-800]="investmentMode() !== mode"
                            [class.bg-zinc-900]="investmentMode() !== mode"
                            [class.text-zinc-400]="investmentMode() !== mode"
                            (click)="setStartgy(mode)"
                        >
                            {{ mode }}
                            <span class="text-[10px] opacity-60">{{ getModePercent(mode) * 100 }}% Capital</span>
                        </button>
                    }
                </div>
                <div class="text-right text-xs text-zinc-500 font-mono flex items-center justify-end gap-1">
                    Available: <span class="text-blue-400 font-bold">{{ availableCurrency() | number:'1.0-0' }}</span>
                    <img src="/assets/poe-ninja/divine-orb.png" alt="Divine Orb" class="w-4 h-4 object-contain">
                </div>
              </div>
          } @else {
              <!-- SELL MODE - Show Lots -->
              <div class="space-y-4">
                <!-- Lots Selection -->
                <div class="space-y-2">
                  <div class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Lot to Sell</div>
                  
                  @if (inventoryLots().length === 0) {
                    <div class="text-sm text-zinc-500 text-center py-6 bg-zinc-950 rounded-lg border border-zinc-800">No items in inventory</div>
                  } @else {
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                      @for (lot of inventoryLots(); track lot.id) {
                        <button 
                          type="button"
                          (click)="selectLot(lot)"
                          class="w-full bg-zinc-950 p-3 rounded-lg border transition-all cursor-pointer hover:bg-zinc-900" 
                          [class.border-green-500]="selectedLot()?.id === lot.id && sellPricePerUnit() > lot.purchasePrice"
                          [class.border-red-500]="selectedLot()?.id === lot.id && sellPricePerUnit() < lot.purchasePrice"
                          [class.border-blue-500]="selectedLot()?.id === lot.id && sellPricePerUnit() === lot.purchasePrice"
                          [class.border-zinc-800]="selectedLot()?.id !== lot.id"
                          [class.ring-2]="selectedLot()?.id === lot.id"
                          [class.ring-green-500/50]="selectedLot()?.id === lot.id && sellPricePerUnit() > lot.purchasePrice"
                          [class.ring-red-500/50]="selectedLot()?.id === lot.id && sellPricePerUnit() < lot.purchasePrice">
                          <div class="flex justify-between items-start mb-2">
                            <div class="text-left">
                              <div class="text-sm font-mono text-white font-bold">{{ lot.quantity }} items</div>
                              <div class="text-xs text-zinc-500">Bought @ {{ lot.purchasePrice | number:'1.2-4' }} div/ea</div>
                            </div>
                            <div class="text-right">
                              @if (sellRatioDivine() > 0) {
                                <div class="text-xs font-mono font-bold" 
                                     [class.text-green-400]="sellPricePerUnit() > lot.purchasePrice"
                                     [class.text-red-400]="sellPricePerUnit() < lot.purchasePrice"
                                     [class.text-zinc-400]="sellPricePerUnit() === lot.purchasePrice">
                                  {{ (sellPricePerUnit() - lot.purchasePrice) >= 0 ? '+' : '' }}{{ (sellPricePerUnit() - lot.purchasePrice) | number:'1.2-4' }} div/ea
                                </div>
                                <div class="text-xs" 
                                     [class.text-green-300]="sellPricePerUnit() > lot.purchasePrice"
                                     [class.text-red-300]="sellPricePerUnit() < lot.purchasePrice"
                                     [class.text-zinc-500]="sellPricePerUnit() === lot.purchasePrice">
                                  Total: {{ (sellPricePerUnit() - lot.purchasePrice) >= 0 ? '+' : '' }}{{ (sellPricePerUnit() - lot.purchasePrice) * lot.quantity | number:'1.0-0' }} div
                                </div>
                              }
                            </div>
                          </div>
                          <div class="flex justify-between items-center text-[10px]">
                            <div class="text-zinc-600">{{ lot.purchasedAt | date:'short' }}</div>
                            @if (selectedLot()?.id === lot.id) {
                              <div class="text-blue-400 font-bold">✓ SELECTED</div>
                            }
                          </div>
                        </button>
                      }
                    </div>
                    
                    @if (selectedLot() && sellRatioDivine() > 0) {
                      <div class="bg-zinc-900/50 p-3 rounded-lg border"
                           [class.border-green-500/30]="totalProfit() > 0"
                           [class.border-red-500/30]="totalProfit() < 0">
                        <div class="text-xs text-zinc-400 mb-1">Profit/Loss for this lot:</div>
                        <div class="text-xl font-mono font-bold"
                             [class.text-green-400]="totalProfit() > 0"
                             [class.text-red-400]="totalProfit() < 0">
                          {{ totalProfit() >= 0 ? '+' : '' }}{{ totalProfit() | number:'1.0-0' }} div
                        </div>
                      </div>
                    }
                  }
                </div>
                
                <div class="text-right text-xs text-zinc-500 font-mono flex items-center justify-end gap-1">
                  Total Owned: <span class="text-blue-400 font-bold">{{ availableInventory() | number:'1.0-0' }}</span>
                  <img [src]="'/assets/poe-ninja/' + marketItem.detailsId + '.png'" [alt]="marketItem.name" class="w-4 h-4 object-contain" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                </div>
              </div>
          }
 
          <!-- Ratio Inputs (BUY MODE ONLY) -->
          @if (orderType() === 'BUY') {
            <div class="space-y-4 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
               <div class="space-y-2">
                  <label for="buy-ratio-item" class="text-xs font-bold text-zinc-500 uppercase">🔵 BUY Ratio (Entry)</label>
                  <div class="flex items-center gap-3">
                     <input id="buy-ratio-item" type="number" step="1" [(ngModel)]="buyRatioItem" class="w-20 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono text-center">
                     <img [src]="'/assets/poe-ninja/' + marketItem.detailsId + '.png'" [alt]="marketItem.name" class="w-5 h-5" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                     <span class="text-zinc-600">:</span>
                     <input type="number" step="0.01" [(ngModel)]="buyRatioDivine" class="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2 pr-10 text-white font-mono">
                     <img src="/assets/poe-ninja/divine-orb.png" alt="Divine Orb" class="w-5 h-5 -ml-9">
                  </div>
               </div>
               <div class="space-y-2">
                  <label for="sell-ratio-item" class="text-xs font-bold text-zinc-500 uppercase">🟢 SELL Ratio (Exit)</label>
                  <div class="flex items-center gap-3">
                     <input id="sell-ratio-item" type="number" step="1" [(ngModel)]="sellRatioItem" class="w-20 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono text-center">
                     <img [src]="'/assets/poe-ninja/' + marketItem.detailsId + '.png'" [alt]="marketItem.name" class="w-5 h-5" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                     <span class="text-zinc-600">:</span>
                     <input type="number" step="0.01" [(ngModel)]="sellRatioDivine" class="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2 pr-10 text-white font-mono">
                     <img src="/assets/poe-ninja/divine-orb.png" alt="Divine Orb" class="w-5 h-5 -ml-9">
                  </div>
               </div>


               <!-- Deviation Warning -->
               @if (priceDeviation() > 10) {
                   <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                         <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                       </svg>
                       <div class="text-xs text-red-200">
                           <span class="font-bold">High Deviation:</span> Your price is {{ priceDeviation() | number:'1.0-1' }}% higher than market. You are overpaying!
                       </div>
                   </div>
               }
               @if (priceDeviation() < -10) {
                   <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                         <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                       </svg>
                       <div class="text-xs text-yellow-200">
                           <span class="font-bold">Low Price:</span> Your price is {{ priceDeviation() | number:'1.0-1' }}% lower than market. Order may not fill.
                       </div>
                   </div>
               }
            </div>
          }

          @if (orderType() === 'SELL') {
            <!-- Target Exit Price Display -->
            <div class="bg-gradient-to-br from-green-950/30 to-emerald-950/30 p-4 rounded-lg border border-green-800/50">
              <div class="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">🎯 Target Exit Price</div>
              <div class="flex items-center gap-2">
                <input type="number" 
                        step="0.0001" 
                        [(ngModel)]="sellRatioDivine" 
                        class="flex-1 bg-zinc-900 border border-green-700 rounded-lg p-3 text-white font-mono text-lg"
                        placeholder="Enter target price">
                <span class="text-zinc-400 text-sm">div/item</span>
              </div>
              <div class="text-xs text-zinc-500 mt-1">Current market: {{ marketItem.primaryValue | number:'1.2-4' }} div/item</div>
            </div>
          }

          <!-- IN-GAME VALUES -->
          <div class="bg-gradient-to-br from-blue-950/30 to-purple-950/30 p-5 rounded-xl border border-blue-500/30">
             <div class="text-xs font-bold text-blue-300 uppercase mb-4">📋 In-Game Values</div>
             <div class="grid grid-cols-2 gap-4">
                @if (orderType() === 'BUY') {
                  <!-- BUY MODE: I want items, I have divines -->
                  <div>
                     <div class="text-[10px] text-zinc-500 uppercase">I Want</div>
                     <div class="flex items-center gap-2 bg-zinc-900/50 p-3 rounded-lg">
                        <span class="text-3xl font-mono font-bold text-white">{{ optimalQuantity() }}</span>
                        <img [src]="'/assets/poe-ninja/' + marketItem.detailsId + '.png'" [alt]="marketItem.name" class="w-7 h-7" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                     </div>
                  </div>
                  <div>
                     <div class="text-[10px] text-zinc-500 uppercase">I Have</div>
                     <div class="flex items-center gap-2 bg-zinc-900/50 p-3 rounded-lg">
                        <span class="text-3xl font-mono font-bold text-white">{{ inGameDivines() }}</span>
                        <img src="/assets/poe-ninja/divine-orb.png" alt="Divine Orb" class="w-7 h-7">
                     </div>
                  </div>
                } @else {
                  <!-- SELL MODE: I want divines, I have items -->
                  <div>
                     <div class="text-[10px] text-zinc-500 uppercase">I Want</div>
                     <div class="flex items-center gap-2 bg-zinc-900/50 p-3 rounded-lg">
                        <span class="text-3xl font-mono font-bold text-white">{{ inGameDivines() }}</span>
                        <img src="/assets/poe-ninja/divine-orb.png" alt="Divine Orb" class="w-7 h-7">
                     </div>
                  </div>
                  <div>
                     <div class="text-[10px] text-zinc-500 uppercase">I Have</div>
                     <div class="flex items-center gap-2 bg-zinc-900/50 p-3 rounded-lg">
                        <span class="text-3xl font-mono font-bold text-white">{{ optimalQuantity() }}</span>
                        <img [src]="'/assets/poe-ninja/' + marketItem.detailsId + '.png'" [alt]="marketItem.name" class="w-7 h-7" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                     </div>
                  </div>
                }
             </div>
             <div class="mt-4 grid grid-cols-2 gap-3">
                <div class="bg-green-900/20 border border-green-500/30 rounded-lg p-2 text-center">
                   <div class="text-[10px] text-green-400 uppercase">ROI</div>
                   <div class="text-lg font-mono font-bold text-green-300">{{ roiPercent() | number:'1.1-1' }}%</div>
                </div>
                <div class="bg-green-900/20 border border-green-500/30 rounded-lg p-2 text-center">
                   <div class="text-[10px] text-green-400 uppercase">Profit</div>
                   <div class="text-lg font-mono font-bold text-green-300">{{ profitDivines() }} div</div>
                </div>
             </div>
          </div>

          <!-- Action -->
           <button 
            (click)="createOrder()"
            [disabled]="isSubmitting() || !isValid()"
            class="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
           >
             @if (isSubmitting()) {
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
             }
             {{ orderType() === 'BUY' ? 'Place Buy Order' : 'Place Sell Order' }}
           </button>

        </div>
      </div>
    </div>
  `
})
export class CreateOrderComponent implements OnInit {
  @Input({ required: true }) marketItem!: MarketItem;
  @Input() initialOrderType: 'BUY' | 'SELL' = 'BUY';
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  private trpc = inject(TRPC_CLIENT);

  public orderType = signal<'BUY' | 'SELL'>('BUY');

  ngOnInit() {
    this.orderType.set(this.initialOrderType);
  }
  public investmentMode = signal<InvestmentMode | null>(null);
  
  // Dual Ratio System
  public buyRatioItem = signal<number>(1);
  public buyRatioDivine = signal<number>(0);
  public sellRatioItem = signal<number>(1);
  public sellRatioDivine = signal<number>(0);
  
  // Computed prices from ratios
  public buyPricePerUnit = computed(() => {
      const items = this.buyRatioItem();
      const divines = this.buyRatioDivine();
      return items > 0 ? divines / items : 0;
  });
  
  public sellPricePerUnit = computed(() => {
      const items = this.sellRatioItem();
      const divines = this.sellRatioDivine();
      return items > 0 ? divines / items : 0;
  });
  
  // Calculate optimal quantity based on mode
  public optimalQuantity = computed(() => {
      // SELL MODE: return quantity from selected lot
      if (this.orderType() === 'SELL') {
          const lot = this.selectedLot();
          return lot ? lot.quantity : 0;
      }
      
      // BUY MODE: calculate optimal quantity based on investment strategy
      const mode = this.investmentMode();
      if (!mode) return 0;
      
      const percent = INVESTMENT_MODES[mode];
      const available = this.availableCurrency();
      const capital = available * percent;
      const buyPrice = this.buyPricePerUnit();
      
      if (buyPrice <= 0) return 0;
      
      // Find the quantity where floor(qty * price) / qty is closest to price
      // Prioritize accuracy first, then maximize quantity as tiebreaker
      let bestQty = 0;
      let bestRatioDiff = Infinity;
      const maxQty = Math.floor(capital / buyPrice) + 10;
      
      for (let qty = 1; qty <= maxQty; qty++) {
          const divinesNeeded = Math.floor(qty * buyPrice);
          if (divinesNeeded > capital) continue; // Skip if over budget
          
          const inGameRatio = divinesNeeded / qty;
          const diff = Math.abs(inGameRatio - buyPrice);
          
          // Accept if this is a better ratio, or same ratio but higher quantity
          if (diff < bestRatioDiff || (diff === bestRatioDiff && qty > bestQty)) {
              bestQty = qty;
              bestRatioDiff = diff;
          }
      }
      
      return bestQty;
  });
  
  // In-game values to display
  public inGameDivines = computed(() => {
      const qty = this.optimalQuantity();
      
      // SELL MODE: calculate divines to receive from selling
      if (this.orderType() === 'SELL') {
          const sellPrice = this.sellPricePerUnit();
          return Math.floor(qty * sellPrice);
      }
      
      // BUY MODE: calculate divines needed to buy
      const price = this.buyPricePerUnit();
      return Math.floor(qty * price);
  });
  
  // ROI and Profit calculations
  public roiPercent = computed(() => {
      let buy = this.buyPricePerUnit();
      
      // In SELL mode, use the lot's purchase price as the "buy" price
      if (this.orderType() === 'SELL') {
          const lot = this.selectedLot();
          buy = lot ? lot.purchasePrice : 0;
      }

      const sell = this.sellPricePerUnit();
      return buy > 0 ? ((sell - buy) / buy) * 100 : 0;
  });
  
  public profitDivines = computed(() => {
      // In SELL mode, use the calculated total profit (which handles lot cost basis)
      if (this.orderType() === 'SELL') {
          // If a lot is selected, totalProfit returns profit for that lot
          // If not, it returns profit for all lots, but optimalQuantity is 0 so maybe we should return 0?
          // But consistency: displayed IN-GAME values usually reflect the "Order" we are about to make.
          // Since optimalQuantity uses selectedLot, we should stick to that.
          const lot = this.selectedLot();
          return lot ? this.totalProfit() : 0;
      }

      const qty = this.optimalQuantity();
      const buy = this.buyPricePerUnit();
      const sell = this.sellPricePerUnit();
      return Math.floor((sell - buy) * qty);
  });
  
  public quantity = signal<number>(0);
  public totalPrice = signal<number>(0);
  
  public pricePerUnit = computed(() => {
      const q = this.quantity();
      const p = this.totalPrice();
      return q > 0 ? p / q : 0;
  });

  public potentialGain = computed(() => {
      const q = this.quantity();
      const p = this.totalPrice();
      const currentMarketPrice = this.marketItem.primaryValue || 0;
      
      if (this.orderType() === 'BUY') {
          // If I buy for P, and sell for currentMarketPrice * Q
          return (currentMarketPrice * q) - p;
      } else {
          // If I sell for P, and I bought for ...? (We don't know cost basis easily yet)
          // Let's assume gain is P - (averageMarketPrice * Q)
          return p - (currentMarketPrice * q);
      }
  });
  
  public isSubmitting = signal(false);
  public walletData = signal<Wallet | null>(null); // Cache wallet data
  public inventoryLots = signal<InventoryLot[]>([]); // Inventory lots for SELL mode
  public selectedLot = signal<InventoryLot | null>(null); // Currently selected lot for SELL

  public totalCost = computed(() => this.totalPrice());

  // Calculate total profit if selling selected lot (or all lots)
  public totalProfit = computed(() => {
    const selectedLot = this.selectedLot();
    const sellPrice = this.sellPricePerUnit();
    
    if (selectedLot) {
      // Profit for selected lot only
      return Math.floor((sellPrice - selectedLot.purchasePrice) * selectedLot.quantity);
    } else {
      // Total profit for all lots
      const lots = this.inventoryLots();
      return lots.reduce((total, lot) => {
        return total + Math.floor((sellPrice - lot.purchasePrice) * lot.quantity);
      }, 0);
    }
  });

  public priceDeviation = computed(() => {
      const price = this.orderType() === 'BUY' ? this.buyPricePerUnit() : this.sellPricePerUnit();
      const market = this.marketItem.primaryValue || 0;
      if (market === 0 || price === 0) return 0;
      return ((price - market) / market) * 100;
  });

  public modeKeys = Object.keys(INVESTMENT_MODES) as InvestmentMode[];

  constructor() {
    // Initial fetch of wallet
    this.fetchWallet();
    
    // Reset investments when changing type
    effect(() => {
        if (this.orderType() === 'SELL') {
             this.investmentMode.set(null);
             const inv = this.availableInventory();
             if (inv > 0) {
                 this.quantity.set(inv);
                 // Auto set total price for sell based on market
                 this.totalPrice.set(parseFloat((inv * (this.marketItem.primaryValue || 0)).toFixed(2)));
             }
             // Fetch lots for SELL mode
             this.fetchInventoryLots();
        }
    });

    // Auto set price from input marketItem
    effect(() => {
        if (this.marketItem && this.orderType() === 'BUY') {
            // Default to 10 items or something sensible
            const q = 10;
            this.quantity.set(q);
            this.totalPrice.set(parseFloat((q * (this.marketItem.primaryValue || 0)).toFixed(2)));
        }
    });
    
    // Initialize dual ratios with market prices
    effect(() => {
        const item = this.marketItem;
        if (!item || !item.primaryValue) return;
        
        const marketPrice = item.primaryValue;
        if (this.buyRatioDivine() === 0) {
            this.buyRatioDivine.set(marketPrice);
            this.sellRatioDivine.set(marketPrice * 1.05);
            this.investmentMode.set('PRUDENT');
        }
    });
  }

  onQuantityChange(val: number) {
      // Ensure integer
      const q = Math.max(0, Math.floor(val || 0));
      this.quantity.set(q);
      // We don't change totalPrice automatically when user types quantity manually?
      // Actually usually in POE tools, changing one updates the other if we want to maintain pricePerUnit.
      // But user said "X items for Y div". 
  }

  onTotalPriceChange(val: number) {
      this.totalPrice.set(Math.max(0, val || 0));
  }

  async fetchWallet() {
      try {
          const w = await this.trpc.wallet.getWallet.query();
          this.walletData.set(w);
      } catch (e) {
          console.error("Failed to load wallet", e);
      }
  }

  async fetchInventoryLots() {
      try {
          const lots = await this.trpc.wallet.getInventoryLots.query({ 
              marketItemId: this.marketItem.id 
          });
          this.inventoryLots.set(lots);
          // Reset selected lot when lots change
          this.selectedLot.set(null);
      } catch (e) {
          console.error("Failed to load inventory lots", e);
      }
  }

  selectLot(lot: InventoryLot) {
      this.selectedLot.set(lot);
      // Auto-fill quantity from the lot
      this.quantity.set(lot.quantity);
      // The price is already set by sellRatioDivine which is the target exit price
      // User can manually adjust sellRatioDivine if needed
  }

  availableCurrency() {
      const w = this.walletData();
      if (!w) return 0;
      const b = w.balances.find((x) => x.currency === 'DIVINE');
      return b ? b.amount : 0;
  }

  availableInventory() {
      const w = this.walletData();
      if (!w) return 0;
      const inv = w.inventory?.find((x) => x.marketItemId === this.marketItem.id);
      return inv ? inv.quantity : 0;
  }

  getModePercent(mode: InvestmentMode) {
      return INVESTMENT_MODES[mode];
  }

  setStartgy(mode: InvestmentMode) {
      this.investmentMode.set(mode);
      const percent = INVESTMENT_MODES[mode];
      const available = this.availableCurrency();
      const marketPrice = this.marketItem.primaryValue || 0;
      
      if (marketPrice <= 0) return;

      const investAmount = available * percent;
      const q = Math.floor(investAmount / marketPrice);
      this.quantity.set(q);
      this.totalPrice.set(parseFloat((q * marketPrice).toFixed(2)));
  }

  adjustPriceRelative(percent: number) {
      this.totalPrice.update(v => parseFloat((v * (1 + percent)).toFixed(2)));
  }

  isValid() {
      const price = this.orderType() === 'BUY' ? this.buyPricePerUnit() : this.sellPricePerUnit();
      return this.optimalQuantity() > 0 && price > 0;
  }

  async createOrder() {
      if (this.isSubmitting() || !this.isValid()) return;
      this.isSubmitting.set(true);
      
      try {
          await this.trpc.orders.createOrder.mutate({
              marketItemId: this.marketItem.id,
              type: this.orderType(),
              currency: 'DIVINE',
              pricePerUnit: this.orderType() === 'BUY' ? this.buyPricePerUnit() : this.sellPricePerUnit(),
              quantity: this.optimalQuantity(),
              strategy: this.investmentMode() ? 'DIVINE_FLIP' : undefined
          });
          this.created.emit();
          this.closed.emit();
      } catch (err) {
          console.error("Order failed", err);
          alert("Order Creation Failed: " + (err as Error).message);
      } finally {
          this.isSubmitting.set(false);
      }
  }
}
