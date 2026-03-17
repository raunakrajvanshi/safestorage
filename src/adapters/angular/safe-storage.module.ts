/**
 * SafeStorageModule — NgModule-based setup for Angular apps that haven't
 * migrated to standalone components yet.
 *
 * @example
 *   // app.module.ts
 *   @NgModule({
 *     imports: [
 *       SafeStorageModule.forRoot({
 *         password: environment.storageKey,
 *         namespace: 'app::',
 *       }),
 *     ],
 *   })
 *   export class AppModule {}
 */

import { NgModule, ModuleWithProviders } from '@angular/core';
import { SAFE_STORAGE_CONFIG, SafeStorageService } from './safe-storage.service.js';
import type { SafeStorageConfig } from '../../core/types.js';

@NgModule({})
export class SafeStorageModule {
  static forRoot(config: SafeStorageConfig): ModuleWithProviders<SafeStorageModule> {
    return {
      ngModule: SafeStorageModule,
      providers: [
        { provide: SAFE_STORAGE_CONFIG, useValue: config },
        SafeStorageService,
      ],
    };
  }

  /**
   * Use `forChild` in feature modules if you need a separate namespace
   * or password from the root configuration.
   *
   * @example
   *   SafeStorageModule.forChild({ password: '...', namespace: 'feature::' })
   */
  static forChild(config: SafeStorageConfig): ModuleWithProviders<SafeStorageModule> {
    return {
      ngModule: SafeStorageModule,
      providers: [
        { provide: SAFE_STORAGE_CONFIG, useValue: config },
        SafeStorageService,
      ],
    };
  }
}

// ─── Standalone provider helper ───────────────────────────────────────────────

/**
 * Use this in `app.config.ts` for standalone Angular apps (Angular 15+).
 *
 * @example
 *   export const appConfig: ApplicationConfig = {
 *     providers: [provideSafeStorage({ password: environment.storageKey })],
 *   };
 */
export function provideSafeStorage(config: SafeStorageConfig) {
  return [
    { provide: SAFE_STORAGE_CONFIG, useValue: config },
    SafeStorageService,
  ];
}
