import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import {
    Component, DoCheck,
    effect,
    ElementRef,
    forwardRef,
    inject, Input,
    OnDestroy,
    OnInit,
    viewChild,
    ViewEncapsulation
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from "@angular/forms";
import { MatRipple, MatRippleLoader } from "@angular/material/core";
import { NiceDropzoneDirective } from "./dropzone.directive";

export type NiceSelectedFiles = {
    file: File | null;
    name: string;
};

@Component({
    selector: "nice-dropzone",
    templateUrl: "dropzone.template.html",
    styleUrl: "dropzone.style.scss",
    imports: [NiceDropzoneDirective, MatRipple],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => NiceDropzone),
            multi: true
        }
    ]
})
export class NiceDropzone implements OnInit, OnDestroy, DoCheck, ControlValueAccessor {
    @Input()
    public accept?: string[];

    @Input()
    public multiple = false;

    @Input()
    public set disabled(value: BooleanInput) {
        this._disabled = coerceBooleanProperty(value);
    }
    public get disabled(): boolean {
        return this._disabled;
    }

    protected _elementRef = viewChild("element", { read: ElementRef });

    /**
     * Handles the lazy creation of the MatButton ripple.
     * Used to improve initial load time of large applications.
     */
    protected _rippleLoader: MatRippleLoader = inject(MatRippleLoader);
    protected _ngControl = inject(NgControl, { optional: true, self: true });

    private _onChange!: (value: NiceSelectedFiles | NiceSelectedFiles[]) => void;
    private _disabled = false;
    private _value: NiceSelectedFiles | NiceSelectedFiles[] | null = null;

    constructor() {
        effect(() => {
            this._rippleLoader.configureRipple(this._elementRef()?.nativeElement, { className: "nice-dropzone-ripple" });
        });
    }

    public ngOnInit(): void {}

    public ngOnDestroy(): void {
        this._rippleLoader.destroyRipple(this._elementRef()?.nativeElement);
    }

    public ngDoCheck(): void {
        if (!this._ngControl) {
            return;
        }

        // We can't use the `_ngControl.statusChanges`, because it won't fire if the input is disabled
        // with `emitEvents = false`, despite the input becoming disabled.
        if (this._ngControl.disabled !== null && this._ngControl.disabled !== this.disabled) {
            this.disabled = this._ngControl.disabled;
        }
    }

    public writeValue(value: NiceSelectedFiles | NiceSelectedFiles[]): void {
        this._value = value;
    }

    public registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
    }

    public registerOnTouched(fn: () => void): void {}

    public setDisabledState(disabled: boolean): void {
        this.disabled = disabled;
    }

    public onFileChanged(event: Event): void {
        const files = (event.target as HTMLInputElement).files;
        if (!files) {
            return;
        }

        this.onFilesDropped(files);
    }

    public onFilesDropped(fileList: FileList): void {
        if (this.multiple && !this._value) {
            this._value = [];
        }

        for (const file of Array.from(fileList)) {
            if (this.accept && !this.accept.includes(file.type)) {
                continue;
            }

            const value = {
                file,
                name: file.name
            };
            if (this.multiple) {
                (this._value as NiceSelectedFiles[]).push(value);
            } else {
                this._value = value;
                this._onChange(this._value);
                return;
            }
        }

        if (this._value) {
            this._onChange(this._value);
        }
    }
}
