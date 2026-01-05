import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-resolve-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <img [src]="'/assets/poe-ninja/' + order.marketItem.detailsId + '.png'" class="w-6 h-6 object-contain" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
            <span class="text-green-400">Resolve</span> {{ order.marketItem.name }}
          </h2>
          <button (click)="close.emit()" class="text-zinc-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          
          <!-- Order Info -->
          <div class="bg-zinc-950/30 p-4 rounded-lg border border-zinc-800/50">
            <div class="text-xs text-zinc-500 uppercase font-bold mb-2">Order Details</div>
            <div class="flex justify-between items-center">
              <div>
                <span class="text-xs font-bold px-2 py-0.5 rounded uppercase"
                    [class.bg-blue-900]="order.type === 'BUY'"
                    [class.text-blue-300]="order.type === 'BUY'"
                    [class.bg-red-900]="order.type === 'SELL'"
                    [class.text-red-300]="order.type === 'SELL'">
                    {{ order.type }}
                </span>
              </div>
              <div class="text-right">
                <div class="text-sm font-mono text-zinc-400">Target: <span class="text-white">{{ order.quantity }}</span> @ <span class="text-white">{{ order.pricePerUnit }}</span> div/ea</div>
              </div>
            </div>
          </div>

          <!-- What You Got -->
          <div class="space-y-4 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
            <div class="space-y-2">
              <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quantity Received</label>
              <div class="relative">
                <input 
                  type="number"
                  step="1"
                  [(ngModel)]="actualQuantity"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 pr-10 text-white font-mono focus:border-green-500 outline-none text-sm"
                >
                <div class="absolute right-3 top-2.5 flex items-center h-5">
                  <img [src]="'/assets/poe-ninja/' + order.marketItem.detailsId + '.png'" class="w-5 h-5 object-contain" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                </div>
              </div>
            </div>

            <!-- Remainder/Change -->
            @if (order.type === 'BUY') {
              <div class="space-y-2">
                <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Change Received (Divines)</label>
                <div class="relative">
                  <input 
                    type="number"
                    step="0.01"
                    [(ngModel)]="remainderDivines"
                    placeholder="0"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 pr-10 text-white font-mono focus:border-green-500 outline-none text-sm"
                  >
                  <div class="absolute right-3 top-2.5 flex items-center h-5">
                    <img src="/assets/poe-ninja/divine-orb.png" class="w-5 h-5 object-contain">
                  </div>
                </div>
                <div class="text-xs text-zinc-500">If they gave you back any divines</div>
              </div>
            } @else {
              <div class="space-y-2">
                <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Change Received (Items)</label>
                <div class="relative">
                  <input 
                    type="number"
                    step="1"
                    [(ngModel)]="remainderItems"
                    placeholder="0"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 pr-10 text-white font-mono focus:border-green-500 outline-none text-sm"
                  >
                  <div class="absolute right-3 top-2.5 flex items-center h-5">
                    <img [src]="'/assets/poe-ninja/' + order.marketItem.detailsId + '.png'" class="w-5 h-5 object-contain" onerror="this.src='/assets/poe-ninja/divine-orb.png'">
                  </div>
                </div>
                <div class="text-xs text-zinc-500">If they gave you back any items</div>
              </div>
            }
          </div>

          <!-- Calculated Summary -->
          <div class="bg-gradient-to-br from-green-950/30 to-blue-950/30 p-4 rounded-xl border border-green-500/30">
            <div class="text-xs font-bold text-green-300 uppercase mb-3">Summary</div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-zinc-400">Final Quantity:</span>
                <span class="font-mono font-bold text-white">{{ finalQuantity() }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-zinc-400">Actual Price/Unit:</span>
                <span class="font-mono font-bold text-white">{{ actualPricePerUnit() | number:'1.2-4' }} div</span>
              </div>
              <div class="flex justify-between text-sm border-t border-green-500/20 pt-2 mt-2">
                <span class="text-zinc-400">Total Paid:</span>
                <span class="font-mono font-bold text-green-300">{{ totalPaid() | number:'1.0-0' }} div</span>
              </div>
            </div>
          </div>

          <!-- Action -->
          <div class="flex gap-3">
            <button 
              (click)="close.emit()"
              class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              (click)="confirm()"
              [disabled]="!isValid()"
              class="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-lg transition-colors"
            >
              Confirm Trade
            </button>
          </div>

        </div>
      </div>
    </div>
  `
})
export class ResolveOrderComponent {
  @Input({ required: true }) order!: any;
  @Output() close = new EventEmitter<void>();
  @Output() resolved = new EventEmitter<{ quantity: number; pricePerUnit: number }>();

  public actualQuantity = signal(0);
  public remainderDivines = signal(0);
  public remainderItems = signal(0);

  ngOnInit() {
    // Initialize with order quantity
    this.actualQuantity.set(this.order.quantity);
  }

  // Final quantity after accounting for change
  public finalQuantity = computed(() => {
    const qty = this.actualQuantity();
    if (this.order.type === 'SELL') {
      // If selling and got items back, subtract them
      return qty - this.remainderItems();
    }
    return qty;
  });

  // Total amount paid (floored to whole divines)
  public totalPaid = computed(() => {
    const qty = this.finalQuantity();
    if (qty <= 0) return 0;

    const targetTotal = this.order.quantity * this.order.pricePerUnit;
    
    if (this.order.type === 'BUY') {
      // Bought items, got divines back
      const totalPaidRaw = targetTotal - this.remainderDivines();
      return Math.floor(totalPaidRaw);
    } else {
      // Sold items
      return Math.floor(qty * this.order.pricePerUnit);
    }
  });

  // Calculate actual price per unit based on floored total paid
  public actualPricePerUnit = computed(() => {
    const qty = this.finalQuantity();
    if (qty <= 0) return 0;

    const total = this.totalPaid();
    return total / qty;
  });

  public isValid() {
    return this.actualQuantity() > 0;
  }

  public confirm() {
    if (!this.isValid()) return;

    this.resolved.emit({
      quantity: this.finalQuantity(),
      pricePerUnit: this.actualPricePerUnit()
    });
  }
}
