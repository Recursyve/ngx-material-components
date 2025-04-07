import { Observable } from "rxjs";

export type NiceAsyncTypeaheadSearchResult<T> = {
    items: T[];
    nextPage: number | null;
}

export abstract class NiceAsyncTypeaheadResourceProvider<T, ID = number, Options = object> {
    public abstract resource: string;

    public abstract search(
        searchQuery: string,
        page: number,
        options?: Options
    ): Observable<NiceAsyncTypeaheadSearchResult<T>>;

    public abstract getById(id: ID, options?: Options): Observable<T>;

    public abstract format(item: T): string;
}
