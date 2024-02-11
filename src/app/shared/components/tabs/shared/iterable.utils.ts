import { KeyValue } from "@angular/common";

export const ORIGINAL_ORDER: (
  a: string | number | KeyValue<string | number, unknown>,
  b: string | number | KeyValue<string | number, unknown>
) => number = (
  a: string | number | KeyValue<string | number, unknown>,
  b: string | number | KeyValue<string | number, unknown>
): number => 0;

export const ASC_ORDER: (
  a: string | number | KeyValue<string | number, unknown>,
  b: string | number | KeyValue<string | number, unknown>
) => number = (
  a: string | number | KeyValue<string | number, unknown>,
  b: string | number | KeyValue<string | number, unknown>
): number =>
  ((a as KeyValue<string | number, unknown>).key ?? a)
    .toString()
    .localeCompare(
      ((b as KeyValue<string | number, unknown>).key ?? b).toString()
    );

export const DESC_ORDER: (
  a: string | number | KeyValue<string | number, unknown>,
  b: string | number | KeyValue<string | number, unknown>
) => number = (
  a: string | number | KeyValue<string | number, unknown>,
  b: string | number | KeyValue<string | number, unknown>
): number =>
  ((b as KeyValue<string | number, unknown>).key ?? b)
    .toString()
    .localeCompare(
      ((a as KeyValue<string | number, unknown>).key ?? a).toString()
    );
