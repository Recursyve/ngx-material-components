import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideNativeDateAdapter } from "@angular/material/core";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter } from "@angular/router";
import { provideColorpicker } from "@recursyve/ngx-material-components/colorpicker";
import { provideNiceComponents } from "@recursyve/ngx-material-components/common";
import { provideDropzone } from "@recursyve/ngx-material-components/dropzone";
import { provideFormFieldError } from "@recursyve/ngx-material-components/form-field-error";
import { provideTimepicker } from "@recursyve/ngx-material-components/timepicker";

import { routes } from "./app.routes";

const demoMessages: Record<string, string> = {
    "components.timepicker.cancel": "Cancel",
    "components.timepicker.confirm": "OK",
    "components.timepicker.title": "Select time",
    "errors.required": "This field is required.",
    "errors.min": "Value must be at least {{min}}.",
    "errors.minlength": "Minimum length is {{value}} characters.",
    "errors.maxlength": "Maximum length is {{value}} characters.",
    "errors.email": "Invalid email address.",
    "errors.reserved": "The username \"{{value}}\" is reserved.",
    "errors.colorpicker.invalidFormat": "Enter a valid color (e.g. #ff0000 or red).",
    "errors.timepicker.invalidFormat": "Enter a valid time (e.g. 2:30 PM or 14:30)."
};

function demoTranslater(key: string, params?: Record<string, string>): string {
    const template = demoMessages[key] ?? key;

    return Object.entries(params ?? {}).reduce(
        (message, [name, value]) => message.replaceAll(`{{${name}}}`, value),
        template
    );
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideNativeDateAdapter(),
        provideRouter(routes),
        provideAnimationsAsync(),
        provideNiceComponents({
            translater: {
                useFactory: () => demoTranslater
            }
        }),
        provideFormFieldError({
            translater: {
                useFactory: () => demoTranslater
            },
            signalErrorTransformers: {
                reserved: (_, details) => ({
                    key: "reserved",
                    params: { value: String(details["reservedValue"] ?? "") }
                })
            }
        }),
        provideColorpicker(),
        provideDropzone(),
        provideTimepicker()
    ]
};
