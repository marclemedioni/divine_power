import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { Provider } from '@angular/core';
import { TRPC_CLIENT } from './trpc.token';
import type { AppRouter } from '../server/trpc/routers/app.router';

export function provideTrpcClient(): Provider {
  return {
    provide: TRPC_CLIENT,
    useFactory: () =>
      createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: '/api/trpc',
          }),
        ],
      }),
  };
}
