import { Injectable, WritableSignal, effect, signal } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators";

import { HttpClient } from "@angular/common/http";
import { CurrentConditions } from "../current-conditions/current-conditions.type";
import { Forecast } from "../forecasts-list/forecast.type";
import { LocationService } from "./location.service";
import { isEqual } from "lodash";
import { environment } from "environments/environment";
import { ExpiredWeatherData } from "./expired-weather-data.type";
import { ConditionsAndZip } from "./conditions-and-zip.type";

export const CONDITIONS: string = "conditions";
export const FORECAST: string = "forecast";

@Injectable()
export class WeatherService {
  static URL = "https://api.openweathermap.org/data/2.5";
  static APPID = "5a4b2d457ecbef9eb2a71e480b947604";
  static ICON_URL =
    "https://raw.githubusercontent.com/udacity/Sunshine-Version-2/sunshine_master/app/src/main/res/drawable-hdpi/";

  private writableCurrentForecasts = signal<ExpiredWeatherData<Forecast>[]>(
    [],
    {
      equal: isEqual,
    }
  );
  private writableCurrentConditions = signal<
    ExpiredWeatherData<CurrentConditions>[]
  >([], {
    equal: isEqual,
  });
  private readonly saveConditionsToLocalStorageEffect = effect(() => {
    console.log(
      "updating currentConditions localStorage",
      this.writableCurrentConditions()
    );
    localStorage.setItem(
      CONDITIONS,
      JSON.stringify(this.writableCurrentConditions())
    );
  });
  private readonly saveForecastsToLocalStorageEffect = effect(() => {
    console.log(
      "updating currentForecasts localStorage",
      this.writableCurrentForecasts()
    );
    localStorage.setItem(
      FORECAST,
      JSON.stringify(this.writableCurrentForecasts())
    );
  });

  constructor(
    private http: HttpClient,
    private locationService: LocationService
  ) {
    let locString = localStorage.getItem(CONDITIONS);
    if (locString) {
      this.writableCurrentConditions.set(JSON.parse(locString));
    }
    locString = localStorage.getItem(FORECAST);
    if (locString) {
      this.writableCurrentForecasts.set(JSON.parse(locString));
    }
  }

  getCurrentConditions(zipcode: string): Observable<ConditionsAndZip> {
    return of({}).pipe(
      switchMap(() => {
        this.removeExpiredWeatherData(this.writableCurrentConditions);
        const currentCondition = this.writableCurrentConditions().find(
          (currentCondition: ExpiredWeatherData<CurrentConditions>) =>
            currentCondition.zip === zipcode
        );
        console.log("looking for currentCondition", currentCondition);
        if (!currentCondition) {
          return this.http
            .get<CurrentConditions>(
              `${WeatherService.URL}/weather?zip=${zipcode},us&units=imperial&APPID=${WeatherService.APPID}`
            )
            .pipe(
              map((newCurrentCondition: CurrentConditions) => ({
                zip: zipcode,
                data: newCurrentCondition,
              })),
              tap((newCurrentCondition: ConditionsAndZip) => {
                console.log("request finished", newCurrentCondition);
                this.writableCurrentConditions.update(
                  (
                    currentConditions: ExpiredWeatherData<CurrentConditions>[]
                  ) => [
                    ...currentConditions,
                    {
                      ...newCurrentCondition,
                      expiration: new Date().getTime(),
                    },
                  ]
                );
              }),
              catchError(() => {
                console.error(
                  `No weather conditions available for zipcode ${zipcode}`
                );
                this.locationService.removeLocation(zipcode);
                return of(null);
              })
            );
        }
        return of({
          zip: currentCondition.zip,
          data: currentCondition.data,
        });
      })
    );
  }

  getForecast(zipcode: string): Observable<Forecast> {
    return of({}).pipe(
      switchMap(() => {
        this.removeExpiredWeatherData(this.writableCurrentForecasts);
        const forecast = this.writableCurrentForecasts().find(
          (forecast: ExpiredWeatherData<Forecast>) => forecast.zip === zipcode
        );
        if (!forecast) {
          // Here we make a request to get the forecast data from the API. Note the use of backticks and an expression to insert the zipcode
          return this.http
            .get<Forecast>(
              `${WeatherService.URL}/forecast/daily?zip=${zipcode},us&units=imperial&cnt=5&APPID=${WeatherService.APPID}`
            )
            .pipe(
              tap((newForecast: Forecast) =>
                this.writableCurrentForecasts.update(
                  (currentForecasts: ExpiredWeatherData<Forecast>[]) => [
                    ...currentForecasts,
                    {
                      zip: zipcode,
                      data: newForecast,
                      expiration: new Date().getTime(),
                    },
                  ]
                )
              ),
              catchError(() => {
                console.error(`No forecast available for zipcode ${zipcode}`);
                return of(null);
              })
            );
        }
        return of(forecast.data);
      })
    );
  }

  private removeExpiredWeatherData(
    weatherData: WritableSignal<
      ExpiredWeatherData<CurrentConditions | Forecast>[]
    >
  ): void {
    const now = new Date().getTime();
    weatherData.update(
      (allData: ExpiredWeatherData<CurrentConditions | Forecast>[]) =>
        allData.filter((currentdata) => {
          console.log("expiration check:", currentdata.expiration, now);
          return (
            currentdata.expiration + environment.cacheTimeInSeconds * 1000 >=
            now
          );
        })
    );
  }

  getWeatherIcon(id: number): string {
    if (id >= 200 && id <= 232)
      return WeatherService.ICON_URL + "art_storm.png";
    else if (id >= 501 && id <= 511)
      return WeatherService.ICON_URL + "art_rain.png";
    else if (id === 500 || (id >= 520 && id <= 531))
      return WeatherService.ICON_URL + "art_light_rain.png";
    else if (id >= 600 && id <= 622)
      return WeatherService.ICON_URL + "art_snow.png";
    else if (id >= 801 && id <= 804)
      return WeatherService.ICON_URL + "art_clouds.png";
    else if (id === 741 || id === 761)
      return WeatherService.ICON_URL + "art_fog.png";
    else return WeatherService.ICON_URL + "art_clear.png";
  }
}
