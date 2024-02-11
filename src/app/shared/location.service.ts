import { Injectable, Signal, effect, signal } from "@angular/core";
import { isEqual } from "lodash";

export const LOCATIONS: string = "locations";

@Injectable()
export class LocationService {
  selectedLocation: Signal<string>;
  locations: Signal<string[]>;

  private writableSelectedLocation = signal<string>("");
  private writableLocations = signal<string[]>([], { equal: isEqual });
  private readonly refreshLocalStorageEffect = effect(() => {
    console.log("updating locations localStorage", this.writableLocations());
    localStorage.setItem(LOCATIONS, JSON.stringify(this.writableLocations()));
  });

  constructor() {
    let locString = localStorage.getItem(LOCATIONS);
    if (locString) {
      this.writableLocations.set(JSON.parse(locString));
    }
    this.selectedLocation = this.writableSelectedLocation.asReadonly();
    this.locations = this.writableLocations.asReadonly();
    console.log("LocationService constructor");
  }

  addLocation(zipcode: string) {
    const zipcodeAsNumber = Number.parseInt(zipcode);
    if (zipcodeAsNumber) {
      if (zipcode === this.writableSelectedLocation()) {
        console.log(`Location already selected: ${zipcode}`);
      }
      this.writableSelectedLocation.set(zipcode);
      // Set used to avoid duplicates
      this.writableLocations.update((locations) => [
        ...new Set<string>([...locations, zipcode]).values(),
      ]);
    } else {
      console.warn(`Wrong zipcode: ${zipcode}`);
    }
  }

  removeLocation(zipcode: string) {
    this.writableLocations.update((locations) =>
      locations.filter((location) => location !== zipcode)
    );
  }
}
