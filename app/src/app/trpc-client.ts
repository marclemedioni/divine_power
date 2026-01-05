import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/trpc/routers/app.router'; // Import type only!

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  const proc = (globalThis as any).process;
  if (proc?.env?.['VERCEL_URL']) return `https://${proc.env['VERCEL_URL']}`;
  // Use 127.0.0.1 for Node.js fetch reliability during SSR
  return 'http://127.0.0.1:4200';
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
