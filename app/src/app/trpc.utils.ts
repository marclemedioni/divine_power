import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Wraps a resource loader with TransferState caching logic.
 * - On Server: Executes loader and saves result to TransferState.
 * - On Client: Checks TransferState first. If found, returns cached value and removes it from state.
 *   Subsequent calls will execute the loader (fresh data).
 * 
 * Must be called in an Injection Context.
 */
export function withTransferCache<T, Args extends any[]>(
  keyName: string,
  loader: (...args: Args) => Promise<T>
): (...args: Args) => Promise<T> {
  const transferState = inject(TransferState);
  const platformId = inject(PLATFORM_ID);
  const key = makeStateKey<T>(keyName);

  return async (...args: Args) => {
    // 1. Client: Check TransferState
    if (transferState.hasKey(key)) {
      const cached = transferState.get(key, null);
      transferState.remove(key); // Important: Remove to ensure fresh data on next params change
      return cached!;
    }

    // 2. Execute Loader
    const data = await loader(...args);

    // 3. Server: Save to TransferState
    if (!isPlatformBrowser(platformId)) {
      transferState.set(key, data);
    }

    return data;
  };
}
