import { Component, inject } from '@angular/core';
import { NavigationEnd, NavigationError, Router } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { filter, take } from 'rxjs';
import { AuthService } from './services/auth.service';
import { TemaService } from './services/tema.service';

const ATRASO_POPUP_MS = 4000;
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private tema = inject(TemaService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private sw = inject(SwUpdate);

  constructor() {
    if (this.sw.isEnabled) {
      this.sw.versionUpdates
        .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
        .subscribe(() => document.location.reload());
    }
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd || e instanceof NavigationError),
        take(1)
      )
      .subscribe(() => {
        requestAnimationFrame(() => this.esconderAbertura());
        setTimeout(() => this.authService.prepararPopup(), ATRASO_POPUP_MS);
      });
  }

  private esconderAbertura(): void {
    const abertura = document.getElementById('abertura');
    if (!abertura) return;
    abertura.classList.add('saindo');
    setTimeout(() => abertura.remove(), 300);
  }
}
