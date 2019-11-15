// tslint:disable: max-classes-per-file
import { DependentReference, Reference, StackedReference } from "lingua-franca";
import { CallerObject, createResolvePromise } from "./createResolvePromise";
import { IIntermediateDependentReference, IIntermediateForwardReference, IIntermediateReference, IIntermediateStackedReference } from "./IIntermediateReference";
import { IForwardLookup, ILookup, IStackedLookup, IUnsureLookup } from "./ILookup";
import { IResolvePromise } from "./IResolvePromise"
import { IResolveReporter } from "./IResolveReporter";
import { IUnsure } from "./IUnsure";

class UnsureImp<Type> implements IUnsure<Type> {
    public readonly value: null | Type;
    constructor(value: null | Type) {
        this.value = value;
    }
    public convert<NewType>(
        callback: (value: Type) => NewType | null
    ): IUnsure<NewType> {
        if (this.value === null) {
            return new UnsureImp<NewType>(null);
        } else {
            return new UnsureImp(callback(this.value));
        }
    }
}

// tslint:disable-next-line: max-classes-per-file
class ReferenceBaseImp<ReferencedType> {
    public readonly value: null | ReferencedType;
    private readonly key: string;
    constructor(name: string, value: null | ReferencedType) {
        this.key = name;
        this.value = value;
    }
    public convert<NewType>(callback: (value: ReferencedType) => NewType | null) {
        return new UnsureImp(this.value).convert(callback);
    }
    public mapResolved<NewType>(
        callback: (type: ReferencedType) => NewType,
        onNotRolved: () => NewType
    ) {
        if (this.value === null) {
            return onNotRolved();
        }
        return callback(this.value);
    }
    public withResolved(callback: (type: ReferencedType) => void) {
        this.mapResolved(callback, () => { });
    }
    public getResolved() {
        return this.mapResolved(
            x => x,
            () => {
                throw new Error("Reference failed to resolve");
            }
        );
    }
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key);
    }
}

class ReferenceImp<ReferencedType> extends ReferenceBaseImp<ReferencedType> implements Reference<ReferencedType> {
    public readonly regular: true = true
}

class DependentReferenceImp<ReferencedType> extends ReferenceBaseImp<ReferencedType> implements DependentReference<ReferencedType> {
    public readonly dependent: true = true
}

class StackedReferenceImp<ReferencedType> extends ReferenceBaseImp<ReferencedType> implements StackedReference<ReferencedType> {
    public readonly stacked: true = true
}

export function createReference<ReferencedType>(
    typeInfo: string,
    key: string,
    resolvedLookup: ILookup<ReferencedType> | false,
    resolver: IResolveReporter
): IIntermediateReference<ReferencedType> {
    if (resolvedLookup === false) {
        console.error("REMOVE LOOKUP HACK")
        resolver.reportUnresolvedReference(typeInfo, key, []);
        return new ReferenceImp<ReferencedType>(key, null);
    }
    const value = resolvedLookup.getEntry(key);
    if (value === null) {
        resolver.reportUnresolvedReference(typeInfo, key, resolvedLookup.getKeys());
    }

    return new ReferenceImp(key, value);
}

export function createDependentReference<ReferencedType>(
    typeInfo: string,
    key: string,
    unsureResolvedLookup: IUnsureLookup<ReferencedType>,
    resolver: IResolveReporter
): IIntermediateDependentReference<ReferencedType> {
    if (unsureResolvedLookup.value === null) {
        resolver.reportDependentUnresolvedReference(typeInfo, key)
        return new DependentReferenceImp<ReferencedType>(key, null)
    }
    const value = unsureResolvedLookup.value.getEntry(key);
    if (value === null) {
        resolver.reportUnresolvedReference(typeInfo, key, unsureResolvedLookup.value.getKeys());
    }
    return new DependentReferenceImp(key, value);

}

export function createStackedReference<ReferencedType>(
    typeInfo: string,
    key: string,
    unsureResolvedLookup: IStackedLookup<ReferencedType>,
    resolver: IResolveReporter
): IIntermediateStackedReference<ReferencedType> {
    if (unsureResolvedLookup === null) {
        resolver.reportDependentUnresolvedReference(typeInfo, key)
        return new StackedReferenceImp<ReferencedType>(key, null)
    }
    const value = unsureResolvedLookup.getEntry(key);
    if (value === null) {
        resolver.reportUnresolvedReference(typeInfo, key, unsureResolvedLookup.getKeys());
    }
    return new StackedReferenceImp(key, value);

}

// tslint:disable-next-line: max-classes-per-file
class ForwardReferenceImp<ReferencedType>
    implements IIntermediateForwardReference<ReferencedType> {
    public forward: true = true;
    private readonly key: string;
    private resolvedEntry: undefined | null | ReferencedType;
    private readonly subscribers: Array<CallerObject<ReferencedType>> = [];
    constructor(
        key: string,
        resolvedLookup: IForwardLookup<ReferencedType> | false, //FIX remove the false option, temporary hack
        resolver: IResolveReporter,
        typeInfo: string
    ) {
        this.key = key;
        if (resolvedLookup === false) {
            console.error("REMOVE LOOKUP HACK")
            resolver.reportUnresolvedForwardReference(typeInfo, key);
            this.subscribers.forEach(subscriber => subscriber.onFailed(null));
            return
        }
        resolvedLookup.getEntryPromise(key).handlePromise(
            () => {
                //not found
                resolver.reportUnresolvedForwardReference(typeInfo, key);
                this.subscribers.forEach(subscriber => subscriber.onFailed(null));
            },
            entry => {
                this.resolvedEntry = entry;
                this.subscribers.forEach(subscriber => subscriber.onResult(entry));
            }
        );
    }
    public mapResolved<NewType>(
        callback: (type: ReferencedType) => NewType,
        onNotRolved: () => NewType
    ) {
        if (this.resolvedEntry === null || this.resolvedEntry === undefined) {
            if (onNotRolved === undefined) {
                throw new Error("Reference was not resolved properly");
            } else {
                return onNotRolved();
            }
        }
        return callback(this.resolvedEntry);
    }
    public withResolved(callback: (type: ReferencedType) => void) {
        this.mapResolved(callback, () => { });
    }
    public getResolved() {
        return this.mapResolved(
            x => x,
            () => {
                throw new Error("Reference failed to resolve");
            }
        );
    }
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key);
    }
    public getResolvedEntryPromise(): IResolvePromise<ReferencedType> {
        return createResolvePromise<ReferencedType>((onFailed, onResult) => {
            if (this.resolvedEntry === undefined) {
                this.subscribers.push({
                    onFailed: onFailed,
                    onResult: onResult,
                })
            } else {
                if (this.resolvedEntry !== null) {
                    onResult(this.resolvedEntry)
                } else {
                    onFailed(null)
                }
            }
        })
    }
}

export function createForwardReference<ReferencedType>(
    typeInfo: string,
    key: string,
    resolvedLookup: IForwardLookup<ReferencedType> | false,
    resolver: IResolveReporter
): IIntermediateForwardReference<ReferencedType> {
    return new ForwardReferenceImp(key, resolvedLookup, resolver, typeInfo);
}
