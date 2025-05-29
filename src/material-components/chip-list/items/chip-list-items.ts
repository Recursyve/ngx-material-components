import { ChangeDetectionStrategy, Component, inject, Injector, output, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatChipRemove, MatChipRow, MatChipSet } from "@angular/material/chips";
import { Observable } from "rxjs";
import { NiceChipListItemsClearIcon } from "../icons/clear/chip-list-items-clear-icon";

@Component({
    selector: "nice-chip-list-items",
    templateUrl: "./chip-list-items.html",
    styleUrls: ["./chip-list-items.scss"],
    imports: [
        MatChipSet,
        MatChipRemove,
        MatChipRow,
        NiceChipListItemsClearIcon
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NiceChipListItems<T> {
    public readonly removeChip = output<number>();

    protected readonly injector = inject(Injector);

    public items?: Signal<T[]>;
    public formatLabelFn?: (value: T) => string;

    public setItemsReactivity(items$: Observable<T[]>): void {
        this.items = toSignal(items$, { injector: this.injector, initialValue: [] });
    }

    public setFormatLabel(fn: (value: T) => string): void {
        this.formatLabelFn = fn;
    }

    public remove(index: number): void {
        this.removeChip.emit(index);
    }
}
