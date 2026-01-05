
import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" (click)="close.emit()">
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-6" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="text-center">
          <h3 class="text-xl font-black tracking-tight text-white mb-1 uppercase">Update {{ currency }}</h3>
          <p class="text-xs font-medium text-zinc-500">Current Balance: <span class="text-zinc-300 font-mono">{{ currentBalance | number:'1.2-2' }}</span></p>
        </div>

        <!-- Input -->
        <div class="space-y-2">
           <label class="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">New Balance</label>
           <div class="relative">
             <input 
               type="number" 
               [(ngModel)]="amount" 
               [min]="0"
               class="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
               placeholder="0.00"
               autoFocus
             />
             <div class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-600">{{ currency }}</div>
           </div>
           
           <!-- Validation Message -->
           <div *ngIf="error()" class="text-xs text-red-400 font-medium pl-1">{{ error() }}</div>
        </div>

        <!-- Actions -->
        <div class="grid grid-cols-2 gap-3">
          <button (click)="close.emit()" class="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-sm transition-colors">
            Cancel
          </button>
          <button 
            (click)="onConfirm()" 
            [disabled]="!!error() || amount() === null"
            class="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
            Update
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
export class TransactionModalComponent {
  @Input({ required: true }) currency!: string;
  @Input({ required: true }) currentBalance!: number;
  
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<number>();

  amount = signal<number | null>(null);

  error = computed(() => {
    const val = this.amount();
    if (val === null || isNaN(val)) return null;
    
    if (val < 0) return 'Balance cannot be negative';
    
    return null;
  });

  onConfirm() {
    if (!this.error() && this.amount() !== null) {
      this.confirm.emit(this.amount()!);
    }
  }
}
