import { computed, DestroyRef, inject, Injectable, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, defer, EMPTY, finalize, map, Observable, Subject, switchMap } from "rxjs";
import { NICE_ASYNC_TYPEAHEAD_RESOURCES_PROVIDER } from "../constants";
import { NiceAsyncTypeaheadResourceProvider } from "./async-typeahead.provider";

export type AsyncTypeaheadRequests = {
    page: number;
    searchQuery?: string;
};

export type FetchActiveRequest = {
    id: number | string;
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
    private readonly _loading = signal(true);

    public readonly items = this._items.asReadonly();
    public readonly active = this._active.asReadonly();
    public readonly loading = this._loading.asReadonly();
    public readonly isLastPage = computed(() => !this._nextRequest());

    public init(resource: string): void {
        this.fetchResources$.pipe(takeUntilDestroyed(this.destroyRef)).pipe(
            switchMap((request) => this.fetchResources(request))
        ).subscribe();
        this.fetchActive$.pipe(takeUntilDestroyed(this.destroyRef)).pipe(
            switchMap((request) => this.fetchActive(request))
        ).subscribe();

        const provider = this.resources.find((resources) => resources.resource === resource);
        if (provider) {
            this.resourceProvider = provider as NiceAsyncTypeaheadResourceProvider<T>;
        }
    }

    public setSearchOptions(options: object | null): void {
        this._searchOptions.set(options);
    }

    public setActive(active: T | null): void {
        this._active.set(active);
    }

    public setActiveFromId(id: number | string): void {
        this.fetchActive$.next({ id });
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

    public search(searchQuery: string): void {
        this.fetchResources$.next({
            searchQuery,
            page: 0
        });
    }

    public loadMore(): void {
        const nextRequest = this._nextRequest();
        if (!nextRequest || this._loading()) {
            return;
        }

        this.fetchResources$.next(nextRequest);
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
