import { createTRPCClient, TRPCLink, TRPCClientError } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import { Provider } from '@angular/core';
import { TRPC_CLIENT } from './trpc.token';
import { appRouter, type AppRouter } from '../server/trpc/routers/app.router';

// Custom link that calls the router directly on the server
const serverLink: TRPCLink<AppRouter> = () => {
  return ({ op }) => {
    return observable((observer) => {
      // ... same content ...
      const caller = appRouter.createCaller({});
      
      const pathParts = op.path.split('.');
      let fn: unknown = caller;
      for (const part of pathParts) {
        if (fn && typeof fn === 'object') fn = (fn as Record<string, unknown>)[part];
      }

      if (typeof fn !== 'function') {
        observer.error(TRPCClientError.from(new Error(`Procedure not found: ${op.path}`)));
        return;
      }

      Promise.resolve((fn as (input: unknown) => Promise<unknown>)(op.input))
        .then((data) => {
          observer.next({ result: { data } });
          observer.complete();
        })
        .catch((err) => {
          observer.error(TRPCClientError.from(err));
        });
    });
  };
};

export function provideServerTrpcClient(): Provider {
  return {
    provide: TRPC_CLIENT,
    useFactory: () =>
      createTRPCClient<AppRouter>({
        links: [serverLink],
      }),
  };
}
