import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter } from "@angular/router";
import { provideNiceComponents } from "@recursyve/ngx-material-components/common";
import { provideDropzone } from "@recursyve/ngx-material-components/dropzone";
import { provideFormFieldError } from "@recursyve/ngx-material-components/form-field-error";

import { routes } from "./app.routes";

const demoErrorMessages: Record<string, string> = {
    "errors.required": "This field is required.",
    "errors.min": "Value must be at least {{min}}.",
    "errors.minlength": "Minimum length is {{value}} characters.",
    "errors.maxlength": "Maximum length is {{value}} characters.",
    "errors.email": "Invalid email address.",
    "errors.reserved": "The username \"{{value}}\" is reserved."
};

function demoTranslater(key: string, params?: Record<string, string>): string {
    const template = demoErrorMessages[key] ?? key;

    return Object.entries(params ?? {}).reduce(
        (message, [name, value]) => message.replaceAll(`{{${name}}}`, value),
        template
    );
}

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
                useFactory: () => demoTranslater
            },
            signalErrorTransformers: {
                reserved: (_, details) => ({
                    key: "reserved",
                    params: { value: String(details["reservedValue"] ?? "") }
                })
            }
        }),
        provideDropzone()
    ]
};
