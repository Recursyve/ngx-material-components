import { Component } from "@angular/core";
import { NiceDropzone } from "@recursyve/ngx-material-components/dropzone";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [NiceDropzone],
    templateUrl: "./app.template.html",
    styleUrl: "./app.style.scss"
})
export class AppComponent {}
