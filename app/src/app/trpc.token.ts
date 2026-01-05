import { InjectionToken } from '@angular/core';
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '../server/trpc/routers/app.router';

export type TrpcClient = ReturnType<typeof createTRPCClient<AppRouter>>;

export const TRPC_CLIENT = new InjectionToken<TrpcClient>('TRPC_CLIENT');
