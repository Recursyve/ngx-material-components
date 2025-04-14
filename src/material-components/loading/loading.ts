import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { Directive, effect, inject, input, OnDestroy } from "@angular/core";
import { NICE_LOADING_OPTIONS } from "./constant";
import { NiceLoadingSpinner } from "./loading-spinner";
import { NiceLoadingOptions } from "./options";

@Directive({ selector: "[niceLoadingOverlay]", standalone: true })
export class NiceLoadingDirective implements OnDestroy {
    private readonly options = inject<NiceLoadingOptions>(NICE_LOADING_OPTIONS, { optional: true });
    private readonly overlay = inject(Overlay);

    public loading = input<boolean | null>(null, { alias: "niceLoadingOverlay" });

    private overlayRef: OverlayRef | null = null;
    private _loading = false;

    constructor() {
        effect(() => {
            if (this.loading() === this._loading) {
                return;
            }

            this._loading = this.loading() ?? false;
            if (!this.overlayRef) {
                this.overlayRef = this.overlay.create({
                    positionStrategy: this.overlay
                        .position()
                        .global()
                        .centerHorizontally()
                        .centerVertically(),
                    hasBackdrop: true,
                    panelClass: "nice-loading-overlay"
                });
            }

            if (this._loading) {
                this.overlayRef.attach(new ComponentPortal(this.options?.customLoading ?? NiceLoadingSpinner));
            } else {
                this.overlayRef.detach();
            }
        });
    }

    public ngOnDestroy(): void {
        if (!this.overlayRef) {
            return;
        }

        if (this.overlayRef.hasAttached()) {
            this.overlayRef.detach();
        }
    }
}
