import { ActiveDescendantKeyManager } from "@angular/cdk/a11y";
import { SelectionModel } from "@angular/cdk/collections";
import { DOWN_ARROW, ENTER, hasModifierKey, LEFT_ARROW, RIGHT_ARROW, SPACE, UP_ARROW } from "@angular/cdk/keycodes";
import { CdkConnectedOverlay, CdkOverlayOrigin } from "@angular/cdk/overlay";
import {
    AfterViewInit,
    ChangeDetectorRef,
    computed,
    DestroyRef,
    Directive,
    effect,
    ElementRef,
    inject,
    input,
    OnDestroy,
    OnInit,
    QueryList,
    signal,
    TemplateRef,
    viewChild,
    ViewChildren
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormBuilder, NgControl } from "@angular/forms";
import { _getOptionScrollPosition, MatOption, MatOptionSelectionChange } from "@angular/material/core";
import { MAT_FORM_FIELD, MatFormField, MatFormFieldControl } from "@angular/material/form-field";
import {
    debounceTime,
    defer,
    distinctUntilChanged,
    merge,
    Observable,
    startWith,
    Subject,
    switchMap,
    take,
    takeUntil
} from "rxjs";

/**
 * Implementation of the same panel and overlay logic as the official Angular MatSelect.
 * This used some of the logic from MatSelect to make this component look and feel like a MatSelect.
 */
@Directive()
export class NiceTypeaheadBase<T>
    implements
        MatFormFieldControl<T>,
        ControlValueAccessor,
        OnInit,
        AfterViewInit,
        OnDestroy
{
    @ViewChildren(MatOption)
    private readonly options!: QueryList<MatOption>;

    public readonly noItemsFoundLabel = input<string>("No items found");
    public readonly labelProperty = input<string>();
    public readonly formatLabelFn = input<((value: T) => string)>();
    public readonly optionTemplate = input<TemplateRef<{ $implicit: T }>>();
    public readonly panelClass = input<string | string[]>([]);
    public readonly canRemoveValue = input<boolean>(true);

    private static nextId = 0;

    protected readonly _input = viewChild<ElementRef<HTMLInputElement>>("input");
    protected readonly _panel = viewChild<ElementRef<HTMLElement>>("panel");
    protected readonly _overlayDir = viewChild(CdkConnectedOverlay);

    protected _focused = false;
    protected _required = false;
    protected _disabled = false;
    protected _panelOpen = false;
    protected _compareWith = (o1: T, o2: T) => o1 === o2;

    protected readonly _value = signal<T | null>(null);
    protected readonly _empty = computed(() => !this._value());
    protected readonly _placeholder = signal("");
    protected readonly _searchValue = signal("");

    protected readonly _elementRef = inject(ElementRef);
    protected readonly _destroyRef = inject(DestroyRef);
    protected readonly _changeDetectorRef = inject(ChangeDetectorRef);
    protected readonly _fb = inject(FormBuilder);

    protected readonly _searchControl = this._fb.nonNullable.control("");
    protected readonly _initialized = new Subject<void>();

    protected readonly _parentFormField = inject<MatFormField>(MAT_FORM_FIELD, { optional: true });

    public readonly id: string = `nice-typeahead-${NiceTypeaheadBase.nextId++}`;
    public readonly controlType: string = "nice-typeahead";
    public readonly stateChanges = new Subject<void>();
    public readonly optionSelectionChanges: Observable<MatOptionSelectionChange> = defer(() => {
        const options = this.options;

        if (options) {
            return options.changes.pipe(
                startWith(options),
                switchMap(() => merge(...options.map(option => option.onSelectionChange))),
            );
        }

        return this._initialized.pipe(switchMap(() => this.optionSelectionChanges));
    });

    public readonly ngControl = inject(NgControl, { optional: true, self: true });

    public readonly _panelDoneAnimatingStream = new Subject<string>();

    public _keyManager!: ActiveDescendantKeyManager<MatOption>;
    public _preferredOverlayOrigin?: CdkOverlayOrigin | ElementRef;
    public _overlayWidth!: string | number;
    public _selectionModel!: SelectionModel<MatOption>;
    public _onChange?: (value: T | null) => void;
    public _onTouch?: () => void;

    public get placeholder(): string {
        return this._placeholder();
    }

    public set placeholder(placeholder) {
        this._placeholder.set(placeholder);
        this.stateChanges.next();
    }

    public get focused(): boolean {
        return this._focused;
    }

    public set focused(isFocused: boolean) {
        this._focused = isFocused;
        this.stateChanges.next();
    }

    public get required(): boolean {
        return this._required;
    }

    public set required(isRequired: boolean) {
        this._required = isRequired;
        this.stateChanges.next();
    }

    public get disabled(): boolean {
        return this._disabled;
    }

    public set disabled(value: boolean) {
        this._disabled = value;
        this.stateChanges.next();
    }

    public get value(): T | null {
        return this._value();
    }

    public set value(value: T | null) {
        const hasAssigned = this._assignValue(value);

        if (hasAssigned) {
            this._onChange?.(value);
        }
    }

    public get empty(): boolean {
        return !this._value();
    }

    public get shouldLabelFloat(): boolean {
        return this.focused || !this.empty;
    }

    public get errorState(): boolean {
        return false; // Implement error state logic as needed
    }

    public get panelOpen(): boolean {
        return this._panelOpen;
    }

    constructor() {
        effect(() => {
            this._input()?.nativeElement.focus();
        });

        if (this.ngControl) {
            // Note: we provide the value accessor through here, instead of
            // the `providers` to avoid running into a circular import.
            this.ngControl.valueAccessor = this;
        }
    }

    public ngOnInit(): void {
        this._selectionModel = new SelectionModel<MatOption>();

        this._searchControl.valueChanges.pipe(
            takeUntilDestroyed(this._destroyRef),
            debounceTime(250),
            distinctUntilChanged()
        ).subscribe((value) => this._searchValue.set(value));
    }

    public ngAfterViewInit(): void {
        this._initialized.next();
        this._initialized.complete();

        this._initKeyManager();

        this.options.changes.pipe(startWith(null), takeUntilDestroyed(this._destroyRef)).subscribe(() => {
            this._resetOptions();
            this._initializeSelection();
        });
    }

    public ngOnDestroy(): void {
        this.stateChanges.complete();
    }

    public onContainerClick(event: MouseEvent): void {
        if (this.disabled) {
            return;
        }

        this.stateChanges.next();
        if ((event.target as Element).tagName.toLowerCase() !== "input") {
            this.onFocusChanged(true);
        }
    }

    public setDescribedByIds(ids: string[]): void {
        const controlElement = this._elementRef.nativeElement.querySelector(".nice-typeahead");
        if (!controlElement) {
            return;
        }

        controlElement.setAttribute("aria-describedby", ids.join(" "));
    }

    public onFocusChanged(isFocused: boolean): void {
        this.focused = isFocused;
        this.stateChanges.next();

        if (isFocused) {
            this.open();
        }
    }

    public writeValue(value: T): void {
        this._assignValue(value);
    }

    public registerOnChange(fn: (value: T | null) => void) {
        this._onChange = fn;
    }

    public registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }

    public setDisabledState(isDisabled: boolean): void {
        this._disabled = isDisabled;
        this._changeDetectorRef.markForCheck();
        this.stateChanges.next();
    }

    public formatLabel(item: T): string {
        if (typeof item === "string") {
            return item;
        }

        const fn = this.formatLabelFn();
        if (fn) {
            return fn(item);
        }

        const property = this.labelProperty();
        if (!property) {
            return item?.toString() ?? "";
        }

        if (!(typeof item === "object") || item === null) {
            return item?.toString() ?? "";
        }

        if (property in item) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return item[property];
        }

        return item.toString();
    }

    public removeActiveValue(): void {
        this.value = null;
        this._selectionModel.clear();
        this._keyManager.setActiveItem(-1);
        this._changeDetectorRef.markForCheck();
    }

    public open(): void {
        if (!this._canOpen()) {
            return;
        }

        // It's important that we read this as late as possible, because doing so earlier will
        // return a different element since it's based on queries in the form field which may
        // not have run yet. Also this needs to be assigned before we measure the overlay width.
        if (this._parentFormField) {
            this._preferredOverlayOrigin = this._parentFormField.getConnectedOverlayOrigin();
        }

        this._overlayWidth = this._getOverlayWidth(this._preferredOverlayOrigin);
        this._panelOpen = true;
        this._keyManager.withHorizontalOrientation(null);
        this._changeDetectorRef.markForCheck();

        // Required for the MDC form field to pick up when the overlay has been opened.
        this.stateChanges.next();
    }

    public close(): void {
        if (!this._panelOpen) {
            return;
        }

        this._focused = false;
        this._panelOpen = false;
        this._changeDetectorRef.markForCheck();

        this._searchValue.set("");

        // Required for the MDC form field to pick up when the overlay has been closed.
        this.stateChanges.next();
    }

    public focus(options?: FocusOptions): void {
        this._elementRef.nativeElement.focus(options);
    }

    public _handleKeydown(event: KeyboardEvent): void {
        if (this.disabled) {
            return;
        }

        if (this.panelOpen) {
            this._handleOpenKeydown(event);
        } else {
            this._handleClosedKeydown(event);
        }
    }

    public _handleScrollEnd(): void {
        console.log("scroll end")
    }

    protected _canOpen(): boolean {
        return !this._panelOpen && !this.disabled;
    }

    protected _onAttached(): void {
        this._overlayDir()?.positionChange.pipe(take(1)).subscribe(() => {
            this._changeDetectorRef.detectChanges();
            this._positioningSettled();
        });
    }

    protected _initKeyManager() {
        this._keyManager = new ActiveDescendantKeyManager<MatOption>(this.options)
            .withVerticalOrientation()
            .withHomeAndEnd()
            .withPageUpDown()
            .withAllowedModifierKeys(["shiftKey"])
            .skipPredicate(this._skipPredicate);

        this._keyManager.tabOut.subscribe(() => {
            if (this.panelOpen) {
                if (this._keyManager.activeItem) {
                    this._keyManager.activeItem._selectViaInteraction();
                }

                this.focus();
                this.close();
            }
        });

        this._keyManager.change.subscribe(() => {
            if (this._panelOpen && this._panel()) {
                this._scrollOptionIntoView(this._keyManager.activeItemIndex || 0);
            } else if (!this._panelOpen && this._keyManager.activeItem) {
                this._keyManager.activeItem._selectViaInteraction();
            }
        });
    }

    protected _getOverlayWidth(preferredOrigin?: ElementRef<ElementRef> | CdkOverlayOrigin): string | number {
        const refToMeasure =
            preferredOrigin instanceof CdkOverlayOrigin
                ? preferredOrigin.elementRef
                : preferredOrigin || this._elementRef;
        return refToMeasure.nativeElement.getBoundingClientRect().width;
    }

    protected _skipPredicate = (option: MatOption) => {
        if (this.panelOpen) {
            return false;
        }

        return option.disabled;
    };

    protected _positioningSettled() {
        this._scrollOptionIntoView(this._keyManager.activeItemIndex || 0);
    }

    protected _scrollOptionIntoView(index: number): void {
        const option = this.options.toArray()[index];
        if (!option) {
            return;
        }

        const panel = this._panel()?.nativeElement;
        if (!panel) {
            return;
        }

        const element = option._getHostElement();
        if (index === 0) {
            // If we've got one group label before the option and we're at the top option,
            // scroll the list to the top. This is better UX than scrolling the list to the
            // top of the option, because it allows the user to read the top group's label.
            panel.scrollTop = 0;
        } else {
            panel.scrollTop = _getOptionScrollPosition(
                element.offsetTop,
                element.offsetHeight,
                panel.scrollTop,
                panel.offsetHeight,
            );
        }
    }

    protected _resetOptions(): void {
        this.optionSelectionChanges.pipe(
            takeUntil(this.options.changes),
            takeUntilDestroyed(this._destroyRef)
        ).subscribe((event) => {
            this._onSelect(event.source);

            if (event.isUserInput && this._panelOpen) {
                this.close();
                this.focus();
            }
        });
    }

    protected _onSelect(option: MatOption): void {
        this.value = option.value;
        this._setSelectionByValue(option.value);
        this._selectOptionByValue(option.value);

        this.stateChanges.next();
    }

    protected _initializeSelection(): void {
        // Defer setting the value in order to avoid the "Expression
        // has changed after it was checked" errors from Angular.
        Promise.resolve().then(() => {
            if (this.ngControl) {
                this._value.set(this.ngControl.value);
            }

            const _value = this.value;
            if (_value) {
                this._selectOptionByValue(_value);
            }
            this._setSelectionByValue(_value);

            this._highlightCorrectOption();
            this.stateChanges.next();
        });
    }

    protected _setSelectionByValue(value: T | null): void {
        this.options.forEach(option => option.setInactiveStyles());
        this._selectionModel.clear();

        const correspondingOption = value ? this._selectOptionByValue(value) : null;

        // Shift focus to the active item. Note that we shouldn't do this in multiple
        // mode, because we don't know what option the user interacted with last.
        if (correspondingOption) {
            correspondingOption.select(false);
            this._keyManager.updateActiveItem(correspondingOption);
        } else if (!this.panelOpen) {
            // Otherwise reset the highlighted option. Note that we only want to do this while
            // closed, because doing it while open can shift the user's focus unnecessarily.
            this._keyManager.updateActiveItem(-1);
        }

        this._changeDetectorRef.markForCheck();
    }


    protected _selectOptionByValue(value: T): MatOption | undefined {
        const correspondingOption = this.options.find((option: MatOption) => {
            // Skip options that are already in the model. This allows us to handle cases
            // where the same primitive value is selected multiple times.
            if (this._selectionModel.isSelected(option)) {
                return false;
            }

            try {
                // Treat null as a special reset value.
                return option.value != null && this._compareWith(option.value, value);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                return false;
            }
        });

        if (correspondingOption) {
            this._selectionModel.select(correspondingOption);
        }

        return correspondingOption;
    }

    protected _highlightCorrectOption(): void {
        if (!this._keyManager) {
            return;
        }

        if (this.empty) {
            // Find the index of the first *enabled* option. Avoid calling `_keyManager.setActiveItem`
            // because it activates the first option that passes the skip predicate, rather than the
            // first *enabled* option.
            let firstEnabledOptionIndex = -1;
            for (let index = 0; index < this.options.length; index++) {
                const option = this.options.get(index)!;
                if (!option.disabled) {
                    firstEnabledOptionIndex = index;
                    break;
                }
            }

            this._keyManager.setActiveItem(firstEnabledOptionIndex);
        } else {
            this._keyManager.setActiveItem(this._selectionModel.selected[0]);
        }
    }


    protected _handleClosedKeydown(event: KeyboardEvent): void {
        const keyCode = event.keyCode;
        const isArrowKey =
            keyCode === DOWN_ARROW ||
            keyCode === UP_ARROW ||
            keyCode === LEFT_ARROW ||
            keyCode === RIGHT_ARROW;
        const isOpenKey = keyCode === ENTER || keyCode === SPACE;
        const manager = this._keyManager;

        // Open the select on ALT + arrow key to match the native <select>
        if (
            (!manager.isTyping() && isOpenKey && !hasModifierKey(event)) ||
            (event.altKey && isArrowKey)
        ) {
            event.preventDefault(); // prevents the page from scrolling down when pressing space
            this.open();
        }
    }

    protected _handleOpenKeydown(event: KeyboardEvent): void {
        const manager = this._keyManager;
        const keyCode = event.keyCode;
        const isArrowKey = keyCode === DOWN_ARROW || keyCode === UP_ARROW;
        const isTyping = manager.isTyping();

        if (isArrowKey && event.altKey) {
            // Close the select on ALT + arrow key to match the native <select>
            event.preventDefault();
            this.close();
            // Don't do anything in this case if the user is typing,
            // because the typing sequence can include the space key.
        } else if (
            !isTyping &&
            (keyCode === ENTER || keyCode === SPACE) &&
            manager.activeItem &&
            !hasModifierKey(event)
        ) {
            event.preventDefault();
            manager.activeItem._selectViaInteraction();
        } else {
            manager.onKeydown(event);
        }
    }

    protected _assignValue(newValue: T | null): boolean {
        // Always re-assign an array, because it might have been mutated.
        if (newValue !== this.value) {
            if (this.options) {
                this._setSelectionByValue(newValue);
            }

            this._value.set(newValue);
            return true;
        }
        return false;
    }
}
