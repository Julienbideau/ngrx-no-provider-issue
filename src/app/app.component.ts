import {Component, createNgModule, Injector, ViewChild, ViewContainerRef} from '@angular/core';
import {LazyStoreComponent} from "../modules/lazy-module-store/lazy.store.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ngrx-no-provider';

  @ViewChild('transactionContainer', {read: ViewContainerRef, static: true})
  public transactionContainer: ViewContainerRef | undefined;

  constructor(
    private readonly injector: Injector) {
  }

  async loadLazyComponent() {
    const {LazyStoreModule, LazyStoreComponent} = await import('src/modules/lazy-module-store');
    const lazyStoreModuleNgModuleRef = createNgModule(LazyStoreModule, this.injector);
    this.transactionContainer!.createComponent(LazyStoreComponent, {ngModuleRef: lazyStoreModuleNgModuleRef})
  }
}
