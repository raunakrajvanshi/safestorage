import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideSafeStorage } from '@safestorage/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideSafeStorage({ password: 'angular-demo-secret-key', namespace: 'ng-demo::' }),
  ],
};
