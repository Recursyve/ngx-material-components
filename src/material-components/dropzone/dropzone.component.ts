import { coerceBooleanProperty } from "@angular/cdk/coercion";
import {
    Component,
    effect,
    ElementRef,
    forwardRef,
    inject,
    input,
    OnDestroy,
    OnInit,
    viewChild,
    ViewEncapsulation
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from "@angular/forms";
import { MatRippleLoader } from "@angular/material/core";
import { NiceDropzoneDirective } from "./dropzone.directive";

export type NiceSelectedFiles = {
    file: File | null;
    name: string;
};

@Component({
    selector: "nice-dropzone",
    templateUrl: "dropzone.template.html",
    styleUrl: "dropzone.style.scss",
    imports: [NiceDropzoneDirective],
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
export class NiceDropzone implements OnInit, OnDestroy, ControlValueAccessor {
    public accept = input<string[]>();
    public multiple = input(false, { transform: coerceBooleanProperty });
    public disabled = input(false, { transform: coerceBooleanProperty });

    protected _elementRef = viewChild("element", { read: ElementRef });

    /**
     * Handles the lazy creation of the MatButton ripple.
     * Used to improve the initial load time of large applications.
     */
    protected _rippleLoader: MatRippleLoader = inject(MatRippleLoader);

    protected _disabled = false;

    private _onChange!: (value: NiceSelectedFiles | NiceSelectedFiles[]) => void;
    private _value: NiceSelectedFiles | NiceSelectedFiles[] | null = null;

    constructor() {
        effect(() => {
            const elementRef = this._elementRef();
            if (!elementRef) {
                return;
            }

            this._rippleLoader.configureRipple(elementRef.nativeElement, { className: "nice-dropzone-ripple" });
        });

        effect(() => {
            this._disabled = this.disabled();
        });
    }

    public ngOnInit(): void {}

    public ngOnDestroy(): void {
        this._rippleLoader.destroyRipple(this._elementRef()?.nativeElement);
    }

    public writeValue(value: NiceSelectedFiles | NiceSelectedFiles[]): void {
        this._value = value;
    }

    public registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
    }

    public registerOnTouched(fn: () => void): void {}

    public setDisabledState(disabled: boolean): void {
        this._disabled = disabled;
    }

    public onFileChanged(event: Event): void {
        const files = (event.target as HTMLInputElement).files;
        if (!files) {
            return;
        }

        this.onFilesDropped(files);
    }

    public onFilesDropped(fileList: FileList): void {
        if (this.multiple() && !this._value) {
            this._value = [];
        }

        const accept = this.accept();
        for (const file of Array.from(fileList)) {
            if (accept && !accept.includes(file.type)) {
                continue;
            }

            const value = {
                file,
                name: file.name
            };
            if (this.multiple()) {
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
