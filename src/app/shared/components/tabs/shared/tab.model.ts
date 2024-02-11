import { TemplateRef } from "@angular/core";
import { Observable } from "rxjs";

export class Tab {
  id: string | number;
  data: Observable<unknown>;
  headerTemplate: TemplateRef<unknown>;
  bodyTemplate: TemplateRef<unknown>;
}
