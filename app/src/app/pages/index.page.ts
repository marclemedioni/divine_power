import { Component, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { TRPC_CLIENT } from '../trpc.token';
import { withTransferCache } from '../trpc.utils';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [FormsModule], // Remove CommonModule, add FormsModule
  template: `
    <div class="space-y-8 animate-in fade-in duration-700 bg-zinc-900/50 p-8 rounded-xl border border-zinc-800">
      <h1 class="text-3xl font-bold text-white mb-6">Test SSR & Client</h1>
      
      <div class="flex gap-4 items-center">
        <input 
          [ngModel]="nameInput()"
          (ngModelChange)="nameInput.set($event)"
          placeholder="Enter name"
          class="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
        <button 
          (click)="updateName()"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
        >
          Call tRPC
        </button>
      </div>

      <div class="p-4 bg-black/30 rounded-lg border border-zinc-800/50">
        <div class="text-xs text-zinc-500 uppercase font-bold mb-2">Server Response:</div>
        <div class="text-xl text-blue-400 font-mono">
          {{ helloResource.value()?.message }}
        </div>
        
        @if (helloResource.isLoading()) {
          <div class="text-sm text-yellow-500 mt-2">Loading...</div>
        }
        
        @if (helloResource.error(); as err) {
          <div class="text-sm text-red-500 mt-2 font-mono">
            Error: {{ err }}
          </div>
        }
      </div>
    </div>
  `,
})
export default class IndexPage {
  private trpc = inject(TRPC_CLIENT);
  
  // Signal for user input
  public nameInput = signal('toto');
  
  // Signal for the active query name (updated by button)
  public activeName = signal('toto');

  // Resource with automatic TransferState handling
  public helloResource = resource({
    params: () => ({ name: this.activeName() }),
    loader: withTransferCache('hello', ({ params }) => 
      this.trpc.hello.query({ name: params.name })
    ),
  });

  updateName() {
    this.activeName.set(this.nameInput());
    this.helloResource.reload();
  }
}


