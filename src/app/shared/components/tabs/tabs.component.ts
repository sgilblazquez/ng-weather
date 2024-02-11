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
  /** Ascending or descending order could be used to show tabs headers instead of original added order */
  @Input() tabsOrderByKey: "default" | "asc" | "desc" = "default";
  /** Notify when a tab has been removed, sending tab id of removed tab */
  @Output() tabRemoved = new EventEmitter<string | number>();

  protected selectedTabId: string | number | null = null;
  protected tabs = new Map<string | number, Tab>();
  protected itemsOrder: (
    a: string | number | KeyValue<string | number, Tab>,
    b: string | number | KeyValue<string | number, Tab>
  ) => number = ORIGINAL_ORDER;

  ngOnChanges(changes: SimpleChanges): void {
    // Update items order function based on "tabsOrderByKey" input
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

  /**
   * Create a new tab if id is not already present in the map tabs
   * @param newTab Tab to be created
   */
  createTab(newTab: Tab): void {
    if (!this.tabs.has(newTab.id)) {
      this.selectedTabId = newTab.id;
      this.tabs.set(newTab.id, newTab);
    }
  }

  /**
   * Select a tab
   * @param tabId Tab id to select
   */
  protected onTabSelected(tabId: string | number): void {
    this.selectedTabId = tabId;
  }

  /**
   * Close and remove a tab and notify about removed tab id
   * @param tabIdToRemove Tab id of tab to remove
   */
  protected onTabClose(tabIdToRemove: string | number): void {
    // If tab to close is the current selected tab, calculate next tab to select
    if (this.selectedTabId === tabIdToRemove) {
      const currentIndex = [...this.tabs.keys()]
        .sort(this.itemsOrder)
        .findIndex((key: string | number) => key === tabIdToRemove);
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : 1;
      this.selectedTabId =
        this.tabs.size > 1
          ? [...this.tabs.keys()].sort(this.itemsOrder)[nextIndex]
          : null;
    }
    this.tabs.delete(tabIdToRemove);
    this.tabRemoved.emit(tabIdToRemove);
  }
}
