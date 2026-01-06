import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';

@Component({
  selector: 'app-dialog',
  standalone: true,
  template: `
    <dialog 
      #dialog 
      class="backdrop:bg-black/90 bg-zinc-900 border border-zinc-800 text-white p-0 rounded-2xl shadow-2xl w-[90vw] max-w-lg open:animate-in open:fade-in open:zoom-in-95 backdrop:animate-in backdrop:fade-in outline-none m-auto"
      (close)="onClose()"
      (click)="onClick($event)"
      (keydown.escape)="close()"
      tabindex="-1"
    >
      <div class="p-6 relative bg-gradient-to-br from-zinc-900 to-zinc-950">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">{{ _title() }}</h3>
          <button (click)="close()" class="text-zinc-500 hover:text-white transition-colors p-1 rounded-full hover:bg-zinc-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ng-content></ng-content>
      </div>
    </dialog>
  `
})
export class DialogComponent {
  @Input() set title(val: string) { this._title.set(val); }
  _title = signal('');

  @Output() closed = new EventEmitter<void>();

  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;

  show() {
    this.dialog.nativeElement.showModal();
  }

  close() {
    this.dialog.nativeElement.close();
  }

  onClose() {
    this.closed.emit();
  }

  onClick(event: MouseEvent) {
    const rect = this.dialog.nativeElement.getBoundingClientRect();
    const isInDialog = (
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      this.close();
    }
  }
}
