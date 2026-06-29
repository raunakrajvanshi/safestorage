/**
 * SafeStorageModule — NgModule-based setup for apps that haven't migrated
 * to standalone components yet.
 *
 * NOTE: Because @safestorage/angular is built without the Angular compiler (ngc),
 * the @NgModule decorator is intentionally omitted. The module is provided as a
 * plain class with static factory methods that return provider arrays, which
 * work correctly with Angular's Ivy AOT.
 *
 * @example — NgModule app (app.module.ts)
 *   @NgModule({
 *     providers: SafeStorageModule.forRoot({ password: environment.storageKey }),
 *   })
 *   export class AppModule {}
 */

import type { Provider } from '@angular/core';
import { SafeStorageService } from './safe-storage.service.js';
import type { SafeStorageConfig } from '@safestorage/core';

export class SafeStorageModule {
  static forRoot(config: SafeStorageConfig): Provider[] {
    return [
      { provide: SafeStorageService, useFactory: () => new SafeStorageService(config) },
    ];
  }

  static forChild(config: SafeStorageConfig): Provider[] {
    return [
      { provide: SafeStorageService, useFactory: () => new SafeStorageService(config) },
    ];
  }
}

/**
 * Use in `app.config.ts` for standalone Angular apps (Angular 15+).
 *
 * @example
 *   export const appConfig: ApplicationConfig = {
 *     providers: [provideSafeStorage({ password: environment.storageKey })],
 *   };
 */
export function provideSafeStorage(config: SafeStorageConfig): Provider[] {
  return [
    { provide: SafeStorageService, useFactory: () => new SafeStorageService(config) },
  ];
}
