import { inject, Pipe, PipeTransform } from "@angular/core";
import { NICE_COMPONENTS_TRANSLATER } from "./constant";
import { NiceTranslater } from "./translater";

@Pipe({
    name: "niceTranslate"
})
export class NiceTranslatePipe implements PipeTransform {
    private readonly translater = inject<NiceTranslater>(NICE_COMPONENTS_TRANSLATER);

    public transform(key: string, params?: Record<string, string>): string {
        return this.translater(key, params);
    }
}
