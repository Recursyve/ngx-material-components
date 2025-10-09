import { CdkConnectedOverlay, CdkOverlayOrigin } from "@angular/cdk/overlay";
import { NgClass, NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    input,
    OnInit,
    viewChild,
    ViewEncapsulation,
    booleanAttribute
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatIconButton } from "@angular/material/button";
import { MatOption } from "@angular/material/core";
import { MatFormField, MatFormFieldControl, MatPrefix } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { NiceTypeaheadSearchIcon } from "./icons/search/typeahead-search-icon";
import { NiceTypeaheadService } from "./providers";
import { NiceTypeaheadBase } from "./typeahead-base";

@Component({
    selector: "nice-async-typeahead",
    imports: [
        CdkOverlayOrigin,
        CdkConnectedOverlay,
        ReactiveFormsModule,
        MatOption,
        MatFormField,
        MatInput,
        MatIconButton,
        MatPrefix,
        NgClass,
        NgTemplateOutlet,
        NiceTypeaheadSearchIcon
    ],
    templateUrl: "./typeahead.html",
    styleUrl: "./typeahead.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        { provide: MatFormFieldControl, useExisting: NiceAsyncTypeahead },
        NiceTypeaheadService
    ],
    host: {
        "role": "combobox",
        "aria-haspopup": "listbox",
        "class": "nice-typeahead",
        "[attr.id]": "id",
        "[attr.aria-controls]": "panelOpen ? id + \"-panel\" : null",
        "[attr.aria-expanded]": "panelOpen",
        "[attr.aria-required]": "required.toString()",
        "[attr.aria-disabled]": "disabled.toString()",
        "[attr.aria-invalid]": "errorState",
        "[class.nice-typeahead-disabled]": "disabled",
        "[class.nice-typeahead-invalid]": "errorState",
        "[class.nice-typeahead-required]": "required",
        "[class.nice-typeahead-empty]": "empty",
        "(keydown)": "_handleKeydown($event)",
        "(focus)": "onFocusChanged(true)",
        "(blur)": "onFocusChanged(false)"
    }
})
export class NiceAsyncTypeahead<T, S extends object = object> extends NiceTypeaheadBase<T> implements OnInit {
    public readonly resource = input.required<string>();
    public readonly searchOptions = input<S | null>(null);
    public readonly autoSelectFirstValue = input(false, { transform: booleanAttribute });

    public readonly filteredValues = computed(() => this.service.items());

    protected readonly optionsContainer = viewChild<ElementRef<HTMLElement>>("optionsContainer");

    private readonly service = inject(NiceTypeaheadService);

    protected override _compareWith = (o1: T, o2: T) => {
        if (!(typeof o1 === "object" && o1 && typeof o2 === "object" && o2)) {
            return o1 === o2;
        }

        if (!("id" in o1) || !("id" in o2)) {
            return o1 === o2;
        }

        return o1.id === o2.id;
    };

    /**
     * Infinite scroll internal state
     */
    private readonly scrollThresholdPercent = 0.99;
    private lastScrollHeight = 0;

    constructor() {
        super();

        effect(() => this.service.setSearchOptions(this.searchOptions()));

        effect(() => this.service.search(this._searchValue()));

        effect(() => {
            const container = this.optionsContainer();
            if (!container) {
                return;
            }

            container.nativeElement.addEventListener("scroll", this.onScroll.bind(this));
        });

        effect(() => {
            this.value = this.service.active();
        });
    }

    public override ngOnInit(): void {
        super.ngOnInit();

        const searchOptions = this.optionsContainer();
        this.service.init(this.resource(), {
            autoSelectFirstValue: this.autoSelectFirstValue(),
            ...(searchOptions && { searchOptions: searchOptions })
        });
    }

    public override writeValue(value: T | string | number): void {
        if (typeof value === "string" || typeof value === "number") {
            this.service.setActiveFromId(value);
            return;
        }

        super.writeValue(value);
        this.service.setActive(value);
    }

    public override onFocusChanged(isFocused: boolean): void {
        super.onFocusChanged(isFocused);

        if (isFocused) {
            this._searchControl.patchValue("");
        }
    }

    public override formatLabel(item: T): string {
        return this.service.formatLabel(item);
    }

    public override removeActiveValue() {
        super.removeActiveValue();

        this.service.setActive(null);
    }

    protected override _onSelect(option: MatOption): void {
        this.service.setActive(option.value);

        this._setSelectionByValue(option.value);
        this._selectOptionByValue(option.value);

        this.stateChanges.next();
    }

    public setSearchOptions(options: S | null): void {
        this.service.setSearchOptions(options);
    }

    public reload(): void {
        this.service.reload();
    }

    public reloadActive(): void {
        this.service.reloadActive();
    }

    protected onScroll(event: Event): void {
        const target = event.target as HTMLElement;
        const threshold = (this.scrollThresholdPercent * 100 * target.scrollHeight) / 100;
        const current = target.scrollTop + target.clientHeight;

        if (this.lastScrollHeight > target.scrollHeight) {
            this.lastScrollHeight = 0;
        }

        if (current > threshold && this.lastScrollHeight < target.scrollHeight) {
            this.service.loadMore();
            this.lastScrollHeight = target.scrollHeight;
        }
    }
}
