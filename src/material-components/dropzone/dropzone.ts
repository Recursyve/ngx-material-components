import { coerceBooleanProperty } from "@angular/cdk/coercion";
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
import {
    NiceDropzoneFileSizeConfig,
    NiceDropzoneImageConfig,
    NiceDropzoneTranslationKeyConfig
} from "./config";
import { NiceDropzoneDirective } from "./dropzone.directive";
import { NiceDropzoneFileIcon } from "./icons/file/file-icon.component";
import { NiceDropzoneImageIcon } from "./icons/image/image-icon.component";
import { NiceFileDimensions, NiceSelectedFiles } from "./models";
import { NiceDropzoneFilePreview } from "./preview/file-preview";

export const niceDropzoneModes = ["image", "file", "all"] as const;
export type NiceDropzoneModes = (typeof niceDropzoneModes)[number];

@Component({
    selector: "nice-dropzone",
    templateUrl: "dropzone.html",
    styleUrl: "dropzone.scss",
    imports: [
        NiceDropzoneDirective,
        NiceDropzoneImageIcon,
        NiceDropzoneFileIcon,
        NiceDropzoneFilePreview,
        NiceTranslatePipe
    ],
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
    public readonly mode = input<NiceDropzoneModes>("all");
    public readonly multiple = input(false, { transform: coerceBooleanProperty });
    public readonly disabled = input(false, { transform: coerceBooleanProperty });
    public readonly accept = input<string[]>();
    public readonly config = input<NiceDropzoneImageConfig>();
    public readonly maxFileSize = input<NiceDropzoneFileSizeConfig>();

    protected readonly _elementRef = viewChild("element", { read: ElementRef });
    protected readonly _inputRef = viewChild<ElementRef<HTMLInputElement>>("fileInput");

    /**
     * Handles the lazy creation of the MatButton ripple.
     * Used to improve the initial load time of large applications.
     */
    protected readonly _rippleLoader: MatRippleLoader = inject(MatRippleLoader);
    protected readonly _translationKeys = inject<NiceDropzoneTranslationKeyConfig>(NICE_DROPZONE_TRANSLATION_KEYS);

    protected readonly files = signal<NiceSelectedFiles[]>([]);

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

    public async onFilesDropped(fileList: FileList): Promise<void> {
        if (this.multiple() && !this._value) {
            this._value = [];
        }

        const accept = this.accept();
        for (const file of Array.from(fileList)) {
            if (accept && !accept.includes(file.type)) {
                continue;
            }

            const isImage = file.type.startsWith("image/");
            const value = {
                file,
                name: file.name,
                size: file.size,
                ...(isImage && { dimensions: await this.getImageDimension(file) })
            } satisfies NiceSelectedFiles;
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

        this.resetInput();
    }

    public onFileDelete(index: number): void {
        const files = [...this.files()];
        files.splice(index, 1);
        this.propagateChanges(files);

        if (!this.multiple()) {
            this.resetInput();
        }
    }

    protected propagateChanges(value: NiceSelectedFiles | NiceSelectedFiles[]): void {
        this.files.set(Array.isArray(value) ? value : [value]);

        this._value = value;
        this._onChange(value);
    }

    protected getImageDimension(file: File): Promise<NiceFileDimensions> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const image = new Image();
                image.onload = () => {
                    resolve({
                        width: image.width,
                        height: image.height,
                        ratio: image.width / image.height
                    });
                };
                image.onerror = reject;
                image.src = reader.result as string;
            };

            reader.readAsDataURL(file);
        });
    }

    protected resetInput(): void {
        const input = this._inputRef();
        if (!input) {
            return;
        }

        input.nativeElement.value = "";
    }
}
