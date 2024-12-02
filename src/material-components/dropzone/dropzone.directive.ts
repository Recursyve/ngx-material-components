import { Directive, EventEmitter, HostBinding, HostListener, output, Output } from "@angular/core";

@Directive({
    selector: "[niceDropzone]",
    standalone: true
})
export class NiceDropzoneDirective {
    @HostBinding("class.file-over")
    public fileOver!: boolean;

    @Output()
    public filesDropped = new EventEmitter<FileList>();

    public files = output()

    // Dragover listener
    @HostListener("dragover", ["$event"])
    public onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.fileOver = true;
    }

    // Dragleave listener
    @HostListener("dragleave", ["$event"])
    public onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.fileOver = false;
    }

    // Drop listener
    @HostListener("drop", ["$event"])
    public ondrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.fileOver = false;

        if (!event.dataTransfer) {
            return;
        }

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.filesDropped.emit(files);
        }
    }
}
