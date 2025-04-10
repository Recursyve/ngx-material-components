import { Component, input } from "@angular/core";
import { MatProgressSpinner, ProgressSpinnerMode } from "@angular/material/progress-spinner";

@Component({
    selector: "nice-loading-spinner",
    templateUrl: "loading-spinner.html",
    styleUrls: ["./loading-spinner.scss"],
    imports: [MatProgressSpinner],
    standalone: true
})
export class NiceLoadingSpinner {
    public readonly loading = input<boolean>(false);
    public readonly mode = input<ProgressSpinnerMode>("indeterminate");
    public readonly diameter = input(50);
}
