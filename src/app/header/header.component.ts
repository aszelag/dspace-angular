import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import { Router, NavigationEnd, Event } from "@angular/router";
import { Store } from "@ngrx/store";
import { HeaderState } from "./header.reducer";
import { HeaderActions } from "./header.actions";
import { Observable } from "rxjs";

@Component({
  selector: 'ds-header',
  styleUrls: ['header.component.css'],
  templateUrl: 'header.component.html'
})
export class HeaderComponent implements OnDestroy, OnInit {
  private routerSubscription: any;
  public isNavBarCollapsed: Observable<boolean>;

  constructor(
    private router: Router,
    private actions: HeaderActions,
    private store: Store<HeaderState>
  ) {
  }

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.collapse();
      }
    });
    this.isNavBarCollapsed = this.store.select('headerReducer')
      .map(({ navCollapsed }: HeaderState) => navCollapsed);
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  private onResize(event): void {
    this.collapse();
  }

  private collapse(): void {
    this.store.dispatch(this.actions.collapse());
  }

  private expand(): void {
    this.store.dispatch(this.actions.expand());
  }

  public toggle(): void {
    this.store.dispatch(this.actions.toggle());
  }

}
