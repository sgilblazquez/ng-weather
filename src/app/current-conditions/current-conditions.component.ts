import { Component, inject, TemplateRef, ViewChild } from "@angular/core";
import { WeatherService } from "../shared/weather.service";
import { LocationService } from "../shared/location.service";
import { Router } from "@angular/router";
import { TabsComponent } from "app/shared/components/tabs/tabs.component";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { from } from "rxjs";
import { switchMap } from "rxjs/operators";

@Component({
  selector: "app-current-conditions",
  templateUrl: "./current-conditions.component.html",
  styleUrls: ["./current-conditions.component.css"],
})
export class CurrentConditionsComponent {
  @ViewChild("defaultHeader") defaultHeaderTemplate?: TemplateRef<unknown>;
  @ViewChild("defaultBody") defaultBodyTemplate?: TemplateRef<unknown>;
  @ViewChild(TabsComponent) tabs?: TabsComponent;

  private weatherService = inject(WeatherService);
  private router = inject(Router);
  private locationService = inject(LocationService);

  constructor() {
    toObservable(this.locationService.locations)
      .pipe(
        switchMap((currentLocations: string[]) => from(currentLocations)),
        takeUntilDestroyed()
      )
      .subscribe((currentLocation: string) => {
        // On every location change, all tabs creation is launched
        // Id information ensures no duplicated tabs
        this.tabs.createTab({
          id: currentLocation,
          data: this.weatherService.getCurrentConditions(currentLocation),
          headerTemplate: this.defaultHeaderTemplate,
          bodyTemplate: this.defaultBodyTemplate,
        });
      });
  }

  onTabRemoved(tabId: string) {
    // When a tab is removed, location is also removed
    this.locationService.removeLocation(tabId);
  }

  showForecast(zipcode: string) {
    this.router.navigate(["/forecast", zipcode]);
  }
}
