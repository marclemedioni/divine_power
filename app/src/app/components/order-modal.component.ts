import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trpc } from '../trpc-client';

@Component({
  selector: 'app-order-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" (click)="close.emit()">
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-6" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="text-center">
          <h3 class="text-xl font-black tracking-tight text-white mb-1 uppercase">{{ type }} Order</h3>
          <p class="text-xs font-medium text-zinc-500">{{ itemName }}</p>
        </div>

        <!-- Inputs -->
        <div class="space-y-4">
           <!-- Quantity -->
           <div class="space-y-2">
             <label class="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Quantity</label>
             <input 
               type="number" 
               [(ngModel)]="quantity" 
               [min]="1"
               class="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
               placeholder="1"
             />
           </div>

           <!-- Target Price -->
           <div class="space-y-2">
             <label class="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Price per Item</label>
             <div class="relative">
               <input 
                 type="number" 
                 [(ngModel)]="price" 
                 [min]="0"
                 class="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
                 placeholder="0.00"
               />
               <!-- Currency Selector (Simple toggle for now or passed input) -->
               <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                 <button 
                  *ngFor="let c of currencies"
                  (click)="currency.set(c)"
                  [class.text-white]="currency() === c"
                  [class.text-zinc-600]="currency() !== c"
                  class="px-2 py-1 text-xs font-bold rounded hover:bg-zinc-800 transition-colors"
                 >
                   {{ c }}
                 </button>
               </div>
             </div>
           </div>

           <!-- Total Estimate -->
            <div class="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 flex justify-between items-center">
              <span class="text-xs font-medium text-zinc-500">Total Estimate</span>
              <span class="font-mono font-bold text-white">{{ total() | number:'1.0-2' }} <span class="text-xs text-zinc-500">{{ currency() }}</span></span>
            </div>
           
           <!-- Error Message -->
           <div *ngIf="error()" class="text-xs text-red-400 font-medium pl-1">{{ error() }}</div>
        </div>

        <!-- Actions -->
        <div class="grid grid-cols-2 gap-3">
          <button (click)="close.emit()" class="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-sm transition-colors">
            Cancel
          </button>
          <button 
            (click)="onConfirm()" 
            [disabled]="!!error() || isSubmitting()"
            class="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            <span *ngIf="isSubmitting()" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            {{ isSubmitting() ? 'Placing...' : 'Place Order' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `]
})
export class OrderModalComponent {
  @Input({ required: true }) itemId!: string;
  @Input({ required: true }) itemName!: string;
  @Input({ required: true }) type!: 'BUY' | 'SELL';
  @Input() defaultPrice?: number;
  
  @Output() close = new EventEmitter<void>();
  @Output() orderPlaced = new EventEmitter<void>();

  quantity = signal<number>(1);
  price = signal<number>(0);
  currency = signal<'DIVINE' | 'CHAOS' | 'EXALTED'>('DIVINE');
  currencies = ['DIVINE', 'CHAOS', 'EXALTED'] as const;

  isSubmitting = signal(false);

  // Initialize signals with inputs safely? 
  // Angular inputs are available in ngOnInit or effects. 
  // We'll leave them as is, but rely on user input.

  total = computed(() => this.quantity() * this.price());

  error = computed(() => {
    if (this.quantity() <= 0) return 'Quantity must be > 0';
    if (this.price() <= 0) return 'Price must be > 0';
    return null;
  });

  async onConfirm() {
    if (this.error() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      await trpc.orders.create.mutate({
        itemId: this.itemId,
        type: this.type,
        quantity: this.quantity(),
        targetPrice: this.price(),
        currency: this.currency(),
      });
      this.orderPlaced.emit();
      this.close.emit();
    } catch (err) {
      console.error(err);
      // Ideally show error in UI
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
