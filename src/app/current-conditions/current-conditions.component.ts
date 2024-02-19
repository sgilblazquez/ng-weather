import { Component, inject, TemplateRef, ViewChild } from "@angular/core";
import { WeatherService } from "../shared/weather.service";
import { LocationService } from "../shared/location.service";
import { Router } from "@angular/router";
import { TabsComponent } from "app/shared/components/tabs/tabs.component";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { from } from "rxjs";
import { concatMap, switchMap } from "rxjs/operators";
import { ConditionsAndZip } from "app/shared/conditions-and-zip.type";

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
        concatMap((currentLocation: string) =>
          this.weatherService.getCurrentConditions(currentLocation)
        ),
        takeUntilDestroyed()
      )
      .subscribe((currentConditions: ConditionsAndZip) => {
        // On every location change, all tabs creation is launched
        this.tabs.createTab({
          // Id information ensures no duplicated tabs
          id: currentConditions.zip,
          // Observable is sent to make weather conditions update
          // on tab activation if needed
          data: this.weatherService.getCurrentConditions(currentConditions.zip),
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
