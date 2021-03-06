import {BehaviorSubject, EMPTY, Observable, Subject, of} from "rxjs";
import {OnChanges, OnDestroy, SimpleChanges} from "@angular/core";
import {distinctUntilChanged, mergeMap, takeUntil} from "rxjs/operators";

export abstract class NgChangesObservableComponent implements OnChanges, OnDestroy {
    protected ngChanges = new BehaviorSubject<Partial<{ [k in keyof this]: this[k] }>>({});

    protected ngOnDestroy$ = new Subject();

    ngOnChanges(changes: SimpleChanges): void {
        const props: Record<keyof typeof changes, any> // eslint-disable-line @typescript-eslint/no-explicit-any
            = {};

        Object.assign(props, this.ngChanges.value);

        for (const propertyName of Object.keys(changes)) {
            props[propertyName] = changes[propertyName].currentValue;
        }

        this.ngChanges.next(
            props as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        );
    }

    ngOnDestroy(): void {
        this.ngChanges.complete();
        this.ngOnDestroy$.next();
        this.ngOnDestroy$.complete();
    }

    protected ngChangesObservable<K extends keyof this>(propertyName: K): Observable<this[K]> {
        return this.ngChanges.pipe(
            mergeMap((props) => {
                return propertyName in props
                    ? of(props[propertyName] as this[K])
                    : EMPTY;
            }),
            distinctUntilChanged(),
            takeUntil(this.ngOnDestroy$),
        );
    }
}
