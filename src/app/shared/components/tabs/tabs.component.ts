import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { Tab } from "./shared/tab.model";
import { KeyValue } from "@angular/common";
import { ASC_ORDER, DESC_ORDER, ORIGINAL_ORDER } from "./shared/iterable.utils";

@Component({
  selector: "app-tabs",
  templateUrl: "./tabs.component.html",
  styleUrl: "./tabs.component.css",
})
export class TabsComponent implements OnChanges {
  @Input() tabsOrderByKey: "default" | "asc" | "desc" = "default";
  @Output() tabRemoved = new EventEmitter<string | number>();

  protected selectedTabId: string | number | null = null;
  protected tabs = new Map<string | number, Tab>();
  protected itemsOrder: (
    a: string | number | KeyValue<string | number, Tab>,
    b: string | number | KeyValue<string | number, Tab>
  ) => number = ORIGINAL_ORDER;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["tabsOrderByKey"]?.currentValue) {
      switch (changes["tabsOrderByKey"].currentValue) {
        case "asc":
          this.itemsOrder = ASC_ORDER;
          break;
        case "desc":
          this.itemsOrder = DESC_ORDER;
          break;
        default:
          this.itemsOrder = ORIGINAL_ORDER;
      }
    }
  }

  createTab(newTab: Tab): void {
    console.log("newTab", newTab);
    if (!this.tabs.has(newTab.id)) {
      this.selectedTabId = newTab.id;
    }
    this.tabs.set(newTab.id, newTab);
  }

  protected onTabSelected(tabId: string | number): void {
    this.selectedTabId = tabId;
  }
  protected onTabClose(tabIdToRemove: string | number): void {
    console.log("onTabClose");
    if (this.selectedTabId === tabIdToRemove) {
      const currentIndex = [...this.tabs.keys()]
        .sort(this.itemsOrder)
        .findIndex((key: string | number) => key === tabIdToRemove);
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : 1;
      this.selectedTabId =
        this.tabs.size > 1
          ? [...this.tabs.keys()].sort(this.itemsOrder)[nextIndex]
          : null;
      console.log("newSelectedTabId", this.selectedTabId);
    }
    this.tabs.delete(tabIdToRemove);
    this.tabRemoved.emit(tabIdToRemove);
  }
}
