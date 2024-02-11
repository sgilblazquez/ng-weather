import { Component } from "@angular/core";
import { WeatherService } from "../shared/weather.service";
import { ActivatedRoute } from "@angular/router";
import { Forecast } from "./forecast.type";
import { Observable } from "rxjs";

@Component({
  selector: "app-forecasts-list",
  templateUrl: "./forecasts-list.component.html",
  styleUrls: ["./forecasts-list.component.css"],
})
export class ForecastsListComponent {
  zipcode: string;
  forecast$: Observable<Forecast>;

  constructor(protected weatherService: WeatherService, route: ActivatedRoute) {
    route.params.subscribe((params) => {
      this.zipcode = params["zipcode"];
      this.forecast$ = weatherService.getForecast(this.zipcode);
    });
  }
}
