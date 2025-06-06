import {
    Directive,
    effect,
    ElementRef,
    HostListener,
    inject,
    Injector,
    input,
    OnInit,
    signal,
    untracked
} from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, NgControl } from "@angular/forms";
import { NiceAsyncTypeahead } from "@recursyve/ngx-material-components/typeahead";
import { NiceChipListItems } from "./items/chip-list-items";

@Directive({
    selector: "input[niceChipList], nice-async-typeahead[niceChipList]"
})
export class NiceChipListDirective<T> implements ControlValueAccessor, OnInit {
    public readonly withItemList = input.required<NiceChipListItems<T>>();
    public readonly reloadOnSelected = input<boolean>(true);
    public readonly separatorKeyboardCodes = input<string[]>(["Enter"]);

    private readonly elementRef = inject(ElementRef);
    private readonly injector = inject(Injector);
    private readonly asyncTypeahead = inject<NiceAsyncTypeahead<T>>(NiceAsyncTypeahead, { optional: true });
    private readonly ngControl = inject<NgControl>(NgControl, { optional: true });

    private readonly values = signal<T[]>([]);

    private propagateChanges?: (_: T[]) => void;

    constructor() {
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }

        effect(() => {
            const values = this.values();
            untracked(() => this.updateTypeaheadSearchOptions(values));
        });
    }

    @HostListener("keydown", ["$event"])
    public onKeyDown(event: KeyboardEvent): void {
        if (this.asyncTypeahead) {
            return;
        }

        if (!this.separatorKeyboardCodes().includes(event.code)) {
            return;
        }

        if (!this.elementRef.nativeElement.validity.valid) {
            return;
        }

        this.addValue(this.elementRef.nativeElement.value);
        this.elementRef.nativeElement.value = "";
        event.preventDefault();
    }

    public ngOnInit(): void {
        this.setupAsyncTypeahead();

        const parentElement = this.elementRef.nativeElement.parentElement;
        if (parentElement.classList.contains("mat-mdc-form-field-infix")) {
            parentElement.style.alignItems = "flex-start";
            parentElement.style.flexDirection = "column-reverse";
        }

        const withItemList = this.withItemList();
        withItemList.setItemsReactivity(toObservable(this.values, { injector: this.injector }));
        withItemList.removeChip.subscribe((index) => {
            const values = [...this.values()];
            values.splice(index, 1);

            this.propagateChanges?.(values);
            this.values.set(values);
        });

        if (this.asyncTypeahead) {
            withItemList.setFormatLabel((item) => this.asyncTypeahead!.formatLabel(item));
        }
    }

    public writeValue(obj: T[] | null): void {
        if (!obj) {
            this.values.set([]);
        } else if (Array.isArray(obj)) {
            this.values.set([...obj]);
        }
    }

    public registerOnChange(fn: (_: T[]) => void): void {
        this.propagateChanges = fn;
    }

    public registerOnTouched(): void {
        return;
    }

    private setupAsyncTypeahead(): void {
        if (!this.asyncTypeahead) {
            return;
        }

        this.asyncTypeahead.selected
            .subscribe((value) => {
                if (!value) {
                    return;
                }

                this.addValue(value);
                this.asyncTypeahead?.removeActiveValue();
            });
    }

    private addValue(value: T): void {
        const values = [...this.values()];
        if (values.includes(value)) {
            return;
        }

        values.push(value);
        this.propagateChanges?.(values);
        this.values.set(values);
    }

    private updateTypeaheadSearchOptions(ignore: T[]): void {
        if (!this.asyncTypeahead) {
            return;
        }

        const searchOptions = this.asyncTypeahead.searchOptions();
        this.asyncTypeahead.setSearchOptions({ ...(searchOptions ?? {}), ignore });
    }
}
