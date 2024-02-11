import { CurrentConditions } from "../current-conditions/current-conditions.type";
import { Forecast } from "../forecasts-list/forecast.type";

export interface ExpiredWeatherData<T extends Forecast | CurrentConditions> {
  zip: string;
  data: T;
  expiration: number;
}
