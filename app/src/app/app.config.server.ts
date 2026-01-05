import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';

import { appConfig } from './app.config';
import { provideServerTrpcClient } from './trpc.server';


const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerTrpcClient(),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
