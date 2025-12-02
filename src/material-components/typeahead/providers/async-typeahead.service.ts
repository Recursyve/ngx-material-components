import { computed, DestroyRef, inject, Injectable, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, defer, EMPTY, finalize, map, Observable, Subject, switchMap, tap } from "rxjs";
import { NICE_ASYNC_TYPEAHEAD_RESOURCES_PROVIDER } from "../constants";
import { NiceAsyncTypeaheadResourceProvider } from "./async-typeahead.provider";

export type AsyncTypeaheadRequests = {
    page: number;
    searchQuery?: string;
    onFinish: Subject<void> | null;
};

export type FetchActiveRequest = {
    id: number | string;
};

export type NiceTypeaheadInitOptions = {
    autoSelectFirstValue?: boolean;
    searchOptions?: object;
};

@Injectable()
export class NiceTypeaheadService<T extends object> {
    private readonly resources = inject<NiceAsyncTypeaheadResourceProvider<unknown>[]>(
        NICE_ASYNC_TYPEAHEAD_RESOURCES_PROVIDER, { optional: true }
    ) ?? [];
    private readonly destroyRef = inject(DestroyRef);

    private readonly fetchResources$ = new Subject<AsyncTypeaheadRequests>();
    private readonly fetchActive$ = new Subject<FetchActiveRequest>();
    private resourceProvider: NiceAsyncTypeaheadResourceProvider<T, string | number> | null = null;

    private readonly _items = signal<T[]>([]);
    private readonly _active = signal<T | null>(null);
    private readonly _searchOptions = signal<object | null>(null);
    private readonly _request = signal<AsyncTypeaheadRequests | null>(null);
    private readonly _nextRequest = signal<AsyncTypeaheadRequests | null>(null);

    private readonly _preloaded = signal(false);
    private readonly _autoSelectFirstValue = signal(false);
    private readonly _loading = signal(true);

    public readonly items = this._items.asReadonly();
    public readonly active = this._active.asReadonly();
    public readonly loading = this._loading.asReadonly();
    public readonly isLastPage = computed(() => !this._nextRequest());

    public init(resource: string, options?: NiceTypeaheadInitOptions): void {
        this.fetchResources$.pipe(takeUntilDestroyed(this.destroyRef)).pipe(
            switchMap((request) => this.fetchResources(request))
        ).subscribe();

        this.fetchActive$.pipe(takeUntilDestroyed(this.destroyRef)).pipe(
            switchMap((request) => this.fetchActive(request))
        ).subscribe();

        const provider = this.resources.find((resources) => resources.resource === resource);
        if (!provider) {
            throw new Error("No provider found for resource " + resource);
        }

        this.resourceProvider = provider as NiceAsyncTypeaheadResourceProvider<T>;

        if (options?.autoSelectFirstValue) {
            this._autoSelectFirstValue.set(options.autoSelectFirstValue);
        }

        if (options?.searchOptions) {
            this._searchOptions.set(options.searchOptions);
        }
    }

    public setSearchOptions(options: object | null): void {
        this._searchOptions.set(options);
    }

    public patchSearchOptions(options: object | null): void {
        const currentOptions = this._searchOptions();
        this._searchOptions.set({ ...currentOptions, ...options });
    }

    public setActive(active: T | null): void {
        this._active.set(active);
    }

    public setActiveFromId(id: number | string): void {
        this.fetchActive$.next({ id });
    }

    public reload(): Observable<void> {
        const onFinish = new Subject<void>();
        this.fetchResources$.next({
            page: 0,
            searchQuery: this._request()?.searchQuery ?? "",
            onFinish
        });
        return onFinish.asObservable();
    }

    public reloadActive(): void {
        const active = this._active();
        if (!active || !("id" in active)) {
            return;
        }

        if (!(typeof active.id === "number" || typeof active.id === "string")) {
            return;
        }

        this.setActiveFromId(active.id);
    }

    public setItems(items: T[]): void {
        this._items.set(items);
    }

    public search(searchQuery: string): Observable<void> {
        const onFinish = new Subject<void>();
        this.fetchResources$.next({ searchQuery, page: 0, onFinish });
        return onFinish.asObservable();
    }

    public loadMore(): Observable<void> {
        const nextRequest = this._nextRequest();
        if (!nextRequest || this._loading()) {
            return EMPTY;
        }

        const onFinish = new Subject<void>();
        this.fetchResources$.next({ ...nextRequest, onFinish });
        return onFinish.asObservable();
    }

    public fetchActive(request: FetchActiveRequest): Observable<void> {
        return defer(() => {
            if (!this.resourceProvider) {
                return EMPTY;
            }

            this._loading.set(true);

            const localItem = this._items().find((item) => "id" in item && item.id === request.id);
            if (localItem) {
                this._loading.set(false);
                this._items.set([localItem]);
                this._active.set(localItem);
                return EMPTY;
            }

            return this.resourceProvider.getById(request.id)
        }).pipe(
            map((item) => {
                this._items.set([item]);
                this._active.set(item);
            }),
            catchError(() => EMPTY),
            finalize(() => {
                this._loading.set(false);
            })
        );
    }

    public fetchResources(request: AsyncTypeaheadRequests): Observable<void> {
        return defer(() => {
            if (!this.resourceProvider) {
                const error = new Error("Resource provider not initialized");
                if (request.onFinish) {
                    request.onFinish.error(error);
                    request.onFinish.complete();
                }

                return EMPTY;
            }

            this._loading.set(true);
            this._request.set(request);

            return this.resourceProvider.search(request.searchQuery ?? "", request.page, this._searchOptions() ?? {});
        }).pipe(
            map((result) => {
                if (request.page === 0) {
                    this._items.set(result.items as T[]);
                } else {
                    this._items.set([
                        ...this._items(),
                        ...(result.items as T[])
                    ]);
                }

                if (result.nextPage) {
                    this._nextRequest.set({
                        ...request,
                        page: result.nextPage
                    });
                } else {
                    this._nextRequest.set(null);
                }

                if (this._autoSelectFirstValue() && !this._preloaded()) {
                    this._preloaded.set(true);
                    this._active.set(result.items[0]);
                }
            }),
            tap({
                next: () => {
                    if (request.onFinish) {
                        request.onFinish.next();
                        request.onFinish.complete();
                    }
                },
                error: (error) => {
                    if (request.onFinish) {
                        request.onFinish.error(error);
                        request.onFinish.complete();
                    }
                },
                finalize: () => {
                    if (request.onFinish && !request.onFinish.closed) {
                        request.onFinish.complete();
                    }
                }
            }),
            catchError(() => EMPTY),
            finalize(() => {
                this._loading.set(false);
            })
        );
    }

    public formatLabel(item: T): string {
        if (!this.resourceProvider) {
            return "";
        }

        return this.resourceProvider.format(item);
    }
}
