import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../trpc/routers/app.router';

// Better approach for Analog + tRPC v11 manually:
import { defineEventHandler, toWebRequest } from 'h3';

export default defineEventHandler(async (event) => {
  const req = toWebRequest(event);
  
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  });
});
