import { Injectable, WritableSignal, effect, signal } from "@angular/core";
import { EMPTY, Observable, of } from "rxjs";
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
    { equal: isEqual }
  );
  private writableCurrentConditions = signal<
    ExpiredWeatherData<CurrentConditions>[]
  >([], { equal: isEqual });
  /** Effect to save conditions changes in localStorage */
  private readonly saveConditionsToLocalStorageEffect = effect(() =>
    localStorage.setItem(
      CONDITIONS,
      JSON.stringify(this.writableCurrentConditions())
    )
  );
  /** Effect to save forecasts changes in localStorage */
  private readonly saveForecastsToLocalStorageEffect = effect(() =>
    localStorage.setItem(
      FORECAST,
      JSON.stringify(this.writableCurrentForecasts())
    )
  );

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

  /**
   * Get the current conditions and zipcode from location in parameter
   * @param zipcode Location to get conditions from
   * @returns Observable with conditions and zipcode information for location
   */
  getCurrentConditions(zipcode: string): Observable<ConditionsAndZip> {
    return of({}).pipe(
      switchMap(() => {
        // Verify and remove data expired
        this.removeExpiredWeatherData(this.writableCurrentConditions);
        const currentCondition = this.writableCurrentConditions().find(
          (currentCondition: ExpiredWeatherData<CurrentConditions>) =>
            currentCondition.zip === zipcode
        );
        // If conditions are not present in storage, request to server
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
                return EMPTY;
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

  /**
   * Get the current forecasts from location in parameter
   * @param zipcode Location to get forecast from
   * @returns Observable with forecasts information for location
   */
  getForecast(zipcode: string): Observable<Forecast> {
    return of({}).pipe(
      switchMap(() => {
        // Verify and remove data expired
        this.removeExpiredWeatherData(this.writableCurrentForecasts);
        const forecast = this.writableCurrentForecasts().find(
          (forecast: ExpiredWeatherData<Forecast>) => forecast.zip === zipcode
        );
        // If forecast is not present in storage, request to server
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
                return EMPTY;
              })
            );
        }
        return of(forecast.data);
      })
    );
  }

  /**
   * Verify and update storage, removing expiration data
   * @param weatherData Weather data signal from where to verify expiration data
   */
  private removeExpiredWeatherData(
    weatherData: WritableSignal<
      ExpiredWeatherData<CurrentConditions | Forecast>[]
    >
  ): void {
    const now = new Date().getTime();
    weatherData.update(
      (allData: ExpiredWeatherData<CurrentConditions | Forecast>[]) =>
        allData.filter(
          (currentdata) =>
            currentdata.expiration + environment.cacheTimeInSeconds * 1000 >=
            now
        )
    );
  }

  /**
   * Retrieve an icon url
   * @param id Icon id
   * @returns Icon url
   */
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
