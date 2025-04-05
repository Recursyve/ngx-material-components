import { CdkConnectedOverlay, CdkOverlayOrigin } from "@angular/cdk/overlay";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect, ElementRef,
    inject,
    input,
    OnInit, viewChild,
    ViewEncapsulation
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatIconButton } from "@angular/material/button";
import { MatOption } from "@angular/material/core";
import { MatFormField, MatFormFieldControl } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { matSelectAnimations } from "@angular/material/select";
import { NiceTypeaheadService } from "@recursyve/ngx-material-components/typeahead/providers/async-typeahead.service";
import { NiceTypeaheadBase } from "./typeahead-base.component";

@Component({
    selector: "nice-async-typeahead",
    standalone: true,
    imports: [
        CdkOverlayOrigin,
        CdkConnectedOverlay,
        ReactiveFormsModule,
        MatOption,
        MatFormField,
        MatInput,
        MatIconButton
    ],
    templateUrl: "./typeahead.template.html",
    styleUrl: "./typeahead.style.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    animations: [matSelectAnimations.transformPanel],
    providers: [
        { provide: MatFormFieldControl, useExisting: NiceAsyncTypeaheadComponent },
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
export class NiceAsyncTypeaheadComponent<T> extends NiceTypeaheadBase<T> implements OnInit {
    public readonly resource = input.required<string>();

    public readonly filteredValues = computed(() => this.service.items());

    protected readonly optionsContainer = viewChild<ElementRef<HTMLElement>>("optionsContainer");

    private readonly service = inject(NiceTypeaheadService);

    override _compareWith = (o1: T, o2: T) => {
        if (!(typeof o1 === "object" && o1 && typeof o2 === "object" && o2)) {
            return o1 === o1;
        }

        if (!("id" in o1) || !("id" in o2)) {
            return o1 === o1;
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

        effect(() => this.service.search(this._searchValue()), {
            allowSignalWrites: true
        });

        effect(() => {
            const container = this.optionsContainer();
            if (!container) {
                return;
            }

            container.nativeElement.addEventListener("scroll", this.onScroll.bind(this));
        });
    }

    public override ngOnInit(): void {
        super.ngOnInit();

        this.service.init(this.resource());
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
