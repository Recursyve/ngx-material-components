import { animate, style, transition, trigger } from "@angular/animations";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { MatError } from "@angular/material/form-field";

@Component({
    selector: "nice-form-field-error",
    template: `
        @if (message) {
            <div [@animation]="increment">
                <mat-error>{{ message }}</mat-error>
            </div>
        }
    `,
    styleUrls: ["./form-field-error.scss"],
    animations: [
        trigger("animation", [
            transition(":increment", [style({ opacity: 0 }), animate("200ms ease-in", style({ opacity: 1 }))]),
            transition(":enter", [
                style({ opacity: 0, transform: "translateY(-1rem)" }),
                animate("200ms ease-in", style({ opacity: 1, transform: "translateY(0)" }))
            ]),
            transition(":leave", [animate("200ms ease-out", style({ opacity: 0, transform: "translateY(-1rem)" }))])
        ])
    ],
    encapsulation: ViewEncapsulation.None,
    imports: [
        MatError
    ]
})
export class NiceFormErrorComponent {
    public message = "";
    public increment = 0;

    @Input()
    public set error(value: string) {
        if (value) {
            if (this.message !== value) {
                this.increment++;
            }
        }
        this.message = value;
    }
}
