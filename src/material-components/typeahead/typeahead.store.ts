import { signal } from "@angular/core";

export class NiceTypeaheadStore<T> {
    private readonly _items = signal<T[]>([]);
    private readonly _active = signal<T | null>(null);
    private readonly _loading = signal(true);

    public readonly items = this._items.asReadonly();
    public readonly active = this._active.asReadonly();
    public readonly loading = this._loading.asReadonly();

    public setActive(active: T | null): void {
        this._active.set(active);
    }

    public setItems(items: T[]): void {
        this._items.set(items);
    }
}
