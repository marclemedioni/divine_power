import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { trpc } from '../trpc-client';

@Component({
  selector: 'app-home',
  imports: [],
  template: `
    <div style="padding: 2rem;">
      <h2>tRPC v11 Integration</h2>
      @if (helloMessage(); as msg) {
        <p style="color: green; font-weight: bold;">{{ msg }}</p>
      } @else {
        <p>Loading tRPC...</p>
      }
    </div>
  `,
})
export default class HomeComponent {
  helloMessage = signal<string | null>(null);
  platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      console.log('HomeComponent initialized, calling tRPC...');
      trpc.hello.query({ name: 'Analog User' }).then((response) => {
        console.log('tRPC response:', response);
        this.helloMessage.set(response.message);
      }).catch(err => {
        console.error('tRPC error:', err);
        this.helloMessage.set('Error connecting to tRPC: ' + err.message);
      });
    }
  }
}
