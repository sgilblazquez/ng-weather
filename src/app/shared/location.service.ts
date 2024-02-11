import { Injectable, Signal, effect, signal } from "@angular/core";
import { isEqual } from "lodash";

export const LOCATIONS: string = "locations";

@Injectable()
export class LocationService {
  locations: Signal<string[]>;

  private writableLocations = signal<string[]>([], { equal: isEqual });
  /** Effect to save locations changes in localStorage */
  private readonly saveLocationsToLocalStorageEffect = effect(() =>
    localStorage.setItem(LOCATIONS, JSON.stringify(this.writableLocations()))
  );

  constructor() {
    // Retrieve all locations from localStorage
    let locString = localStorage.getItem(LOCATIONS);
    if (locString) {
      this.writableLocations.set(JSON.parse(locString));
    }
    this.locations = this.writableLocations.asReadonly();
  }

  /**
   * Add a new location ti the storage
   * @param zipcode Location to add
   */
  addLocation(zipcode: string) {
    const zipcodeAsNumber = Number.parseInt(zipcode);
    // Verify zipcode number is valid
    if (zipcodeAsNumber) {
      // Set used to avoid duplicates
      this.writableLocations.update((locations) => [
        ...new Set<string>([...locations, zipcode]).values(),
      ]);
    } else {
      console.warn(`Wrong zipcode: ${zipcode}`);
    }
  }

  /**
   * Remove a location from the storage
   * @param zipcode Location to remove
   */
  removeLocation(zipcode: string) {
    this.writableLocations.update((locations) =>
      locations.filter((location) => location !== zipcode)
    );
  }
}
