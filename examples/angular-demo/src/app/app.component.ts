import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafeStorageService } from '@safestorage/angular';

interface Profile {
  name: string;
  email: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly storage = inject(SafeStorageService);

  // Signal-based API (Angular 16+) — initialized after inject()
  readonly theme = this.storage.toSignal<string>('theme', 'system');
  readonly themes = ['light', 'dark', 'system'];

  // Manual state for profile demo
  profile: Profile | null = null;
  nameInput = '';
  emailInput = '';

  // Counter backed by encrypted storage
  count = 0;

  async ngOnInit() {
    this.profile = (await this.storage.get<Profile>('profile')) ?? null;
    this.count = (await this.storage.get<number>('counter')) ?? 0;
  }

  async saveProfile() {
    if (!this.nameInput.trim() || !this.emailInput.trim()) return;
    const p: Profile = { name: this.nameInput, email: this.emailInput };
    await this.storage.set('profile', p);
    this.profile = p;
    this.nameInput = '';
    this.emailInput = '';
  }

  async clearProfile() {
    await this.storage.remove('profile');
    this.profile = null;
  }

  async increment() {
    this.count++;
    await this.storage.set('counter', this.count);
  }

  async decrement() {
    this.count--;
    await this.storage.set('counter', this.count);
  }

  async reset() {
    this.count = 0;
    await this.storage.set('counter', 0);
  }

  async setTheme(t: string) {
    await this.storage.setSignal('theme', t);
  }
}
