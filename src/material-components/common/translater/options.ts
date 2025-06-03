import { FactoryProvider } from "@angular/core";
import { NiceTranslater } from "./translater";

export type NiceTranslaterOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    translater: Omit<FactoryProvider, "provide" | "multi"> & { useFactory: (...args: any[]) => NiceTranslater };
};
