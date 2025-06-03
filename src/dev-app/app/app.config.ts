import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter } from "@angular/router";
import { provideNiceComponents } from "@recursyve/ngx-material-components/common";
import { provideDropzone } from "@recursyve/ngx-material-components/dropzone";
import { provideFormFieldError } from "@recursyve/ngx-material-components/form-field-error";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideAnimationsAsync(),
        provideNiceComponents({
            translater: {
                useFactory: () => (key) => key
            }
        }),
        provideFormFieldError({
            translater: {
                useFactory: () => (key) => key
            }
        }),
        provideDropzone()
    ]
};
