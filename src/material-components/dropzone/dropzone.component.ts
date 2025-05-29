import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { NgTemplateOutlet } from "@angular/common";
import {
    Component,
    effect,
    ElementRef,
    forwardRef,
    inject,
    input,
    OnDestroy,
    signal,
    viewChild,
    ViewEncapsulation
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { MatRippleLoader } from "@angular/material/core";
import { NiceTranslatePipe } from "@recursyve/ngx-material-components/common";

import { NICE_DROPZONE_TRANSLATION_KEYS } from "./constant";
import { NiceDropzoneFileSizeConfig, NiceDropzoneImageConfig, NiceDropzoneTranslationKeyConfig } from "./dropzone.config";
import { NiceDropzoneDirective } from "./dropzone.directive";
import { NiceDropzoneFileIcon } from "./icons/file/file-icon.component";
import { NiceDropzoneImageIcon } from "./icons/image/image-icon.component";
import { NiceSelectedFiles } from "./models";

export const niceDropzoneModes = ["image", "file", "all"] as const;
export type NiceDropzoneModes = (typeof niceDropzoneModes)[number];

@Component({
    selector: "nice-dropzone",
    templateUrl: "dropzone.template.html",
    styleUrl: "dropzone.style.scss",
    imports: [NiceDropzoneDirective, NiceDropzoneImageIcon, NiceDropzoneFileIcon, NiceTranslatePipe, NgTemplateOutlet],
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
export class NiceDropzone implements OnDestroy, ControlValueAccessor {
    public mode = input<NiceDropzoneModes>("all");
    public multiple = input(false, { transform: coerceBooleanProperty });
    public disabled = input(false, { transform: coerceBooleanProperty });
    public accept = input<string[]>();
    public config = input<NiceDropzoneImageConfig>();
    public maxFileSize = input<NiceDropzoneFileSizeConfig>();

    protected _elementRef = viewChild("element", { read: ElementRef });

    /**
     * Handles the lazy creation of the MatButton ripple.
     * Used to improve the initial load time of large applications.
     */
    protected _rippleLoader: MatRippleLoader = inject(MatRippleLoader);
    protected _translationKeys = inject<NiceDropzoneTranslationKeyConfig>(NICE_DROPZONE_TRANSLATION_KEYS);

    protected _disabled = false;

    protected files = signal<NiceSelectedFiles[]>([]);

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

    public ngOnDestroy(): void {
        this._rippleLoader.destroyRipple(this._elementRef()?.nativeElement);
    }

    public writeValue(value: NiceSelectedFiles | NiceSelectedFiles[]): void {
        this._value = value;
        if (value) {
            this.files.set(Array.isArray(value) ? value : [value]);
        }
    }

    public registerOnChange(fn: (value: NiceSelectedFiles | NiceSelectedFiles[]) => void): void {
        this._onChange = fn;
    }

    public registerOnTouched(): void {
        // Do nothing
    }

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
                this.propagateChanges(this._value);
                return;
            }
        }

        if (this._value) {
            this.propagateChanges(this._value);
        }
    }

    protected propagateChanges(value: NiceSelectedFiles | NiceSelectedFiles[]): void {
        this.files.set(Array.isArray(value) ? value : [value]);
        this._onChange(value);
    }
}
