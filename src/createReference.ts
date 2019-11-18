// tslint:disable: max-classes-per-file
import { DependentReference, StackedReference } from "lingua-franca"
import { assertUnreachable } from "./assertUnreachable"
import { CallerObject, createResolvePromise } from "./createResolvePromise"
import { IIntermediateDependentReference, IIntermediateIntraReference, IIntermediateIntraResolved, IIntermediateReference, IIntermediateStackedReference } from "./IIntermediateReference"
import { EntryPromiseType, IIntraLookup, ILookup, IStackedLookup } from "./ILookup"
import { IResolvePromise } from "./IResolvePromise"
import { IResolveReporter } from "./IResolveReporter"
import { IUnsureLookup } from "./IUnsure"

class UnresolvedLookupImp<Type> implements IUnsureLookup<Type> {
    public getEntry(key: string, resolveReporter: IResolveReporter, type: string) {
        resolveReporter.reportDependentUnresolvedReference(type, key)
        return null
    }
}

export function createEmptyUnsureLookup<Type>(): IUnsureLookup<Type> {
    return new UnresolvedLookupImp<Type>()
}

class ResolvedLookupImp<Type> implements IUnsureLookup<Type> {
    public readonly lookup: ILookup<Type>
    constructor(lookup: ILookup<Type>) {
        this.lookup = lookup
    }
    public getEntry(key: string, resolveReporter: IResolveReporter, type: string) {
        const entry = this.lookup.getEntry(key)
        if (entry === null) {
            resolveReporter.reportUnresolvedReference(type, key, this.lookup.getKeys())
        }
        return entry
    }
}

// tslint:disable-next-line: max-classes-per-file
class ReferenceBaseImp<ReferencedType> {
    public readonly value: null | ReferencedType
    private readonly key: string
    constructor(key: string, value: null | ReferencedType) {
        this.key = key
        this.value = value
    }
    public getLookup<NewType>(callback: (value: ReferencedType) => ILookup<NewType>): IUnsureLookup<NewType> {
        if (this.value === null) {
            return new UnresolvedLookupImp()
        } else {
            return new ResolvedLookupImp(callback(this.value))
        }
    }
    public mapResolved<NewType>(
        callback: (type: ReferencedType) => NewType,
        onNotRolved: () => NewType
    ) {
        if (this.value === null) {
            return onNotRolved()
        }
        return callback(this.value)
    }
    public withResolved(callback: (type: ReferencedType) => void) {
        this.mapResolved(callback, () => { })
    }
    public getResolved() {
        return this.mapResolved(
            x => x,
            () => {
                throw new Error("Reference failed to resolve")
            }
        )
    }
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key)
    }
}

class ReferenceImp<ReferencedType> extends ReferenceBaseImp<ReferencedType> implements IIntermediateReference<ReferencedType> {
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
    resolvedLookup: ILookup<ReferencedType>,
    resolver: IResolveReporter
): IIntermediateReference<ReferencedType> {
    const value = resolvedLookup.getEntry(key)
    if (value === null) {
        resolver.reportUnresolvedReference(typeInfo, key, resolvedLookup.getKeys())
    }

    return new ReferenceImp(key, value)
}

export function createDependentReference<ReferencedType>(
    typeInfo: string,
    key: string,
    unsureResolvedLookup: IUnsureLookup<ReferencedType>,
    resolver: IResolveReporter
): IIntermediateDependentReference<ReferencedType> {
    const entry = unsureResolvedLookup.getEntry(key, resolver, typeInfo)
    return new DependentReferenceImp(key, entry)

}

export function createReferenceToStackParent<ReferencedType>(
    typeInfo: string,
    key: string,
    stackedLookup: IStackedLookup<ReferencedType>,
    resolver: IResolveReporter
): IIntermediateStackedReference<ReferencedType> {
    if (stackedLookup === null) {
        resolver.reportDependentUnresolvedReference(typeInfo, key)
        return new StackedReferenceImp<ReferencedType>(key, null)
    }
    const value = stackedLookup.getEntry(key)
    if (value === null) {
        resolver.reportUnresolvedReference(typeInfo, key, stackedLookup.getKeys())
    }
    return new StackedReferenceImp(key, value)

}

// tslint:disable-next-line: max-classes-per-file
export class IntraResolvedImp<ReferencedType> implements IIntermediateIntraResolved<ReferencedType> { //FIXME don't export this class
    private readonly subscribers: Array<CallerObject<ReferencedType>> = []
    private resolvedEntry: undefined | null | ReferencedType
    constructor(
        entryPromiseType: EntryPromiseType<ReferencedType>,
    ) {
        switch (entryPromiseType[0]) {
            case "already registered": {
                const entry = entryPromiseType[1]
                this.resolvedEntry = entry
                this.subscribers.forEach(subscriber => subscriber.onResult(entry))
                break
            }
            case "not yet registered": {
                const promise = entryPromiseType[1]
                promise.handlePromise(
                    () => {
                        this.subscribers.forEach(subscriber => subscriber.onFailed(null))
                    },
                    entry => {
                        this.resolvedEntry = entry
                        this.subscribers.forEach(subscriber => subscriber.onResult(entry))
                    }
                )

                break
            }
            default:
                assertUnreachable(entryPromiseType[0])
                throw new Error("UNREACHABLE")
        }
    }
    public mapResolved<NewType>(
        callback: (type: ReferencedType) => NewType,
        onNotRolved: () => NewType
    ) {
        if (this.resolvedEntry === null || this.resolvedEntry === undefined) {
            if (onNotRolved === undefined) {
                throw new Error("Reference was not resolved properly")
            } else {
                return onNotRolved()
            }
        }
        return callback(this.resolvedEntry)
    }
    public withResolved(callback: (type: ReferencedType) => void) {
        this.mapResolved(callback, () => { })
    }
    public getResolved() {
        return this.mapResolved(
            x => x,
            () => {
                throw new Error("Reference failed to resolve")
            }
        )
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

// tslint:disable-next-line: max-classes-per-file
class IntraReferenceImp<ReferencedType> extends IntraResolvedImp<ReferencedType>
    implements IIntermediateIntraReference<ReferencedType> {
    public intraReference: true = true
    private readonly key: string
    constructor(
        key: string,
        entryPromiseType: EntryPromiseType<ReferencedType>
    ) {
        super(entryPromiseType)
        this.key = key
    }
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key)
    }
}

export function createIntraReference<ReferencedType>(
    typeInfo: string,
    key: string,
    resolvedLookup: IIntraLookup<ReferencedType>,
    resolver: IResolveReporter,
    entryIsDeclaredAfterMe: boolean,
): IIntermediateIntraReference<ReferencedType> {
    const entryPromiseType = resolvedLookup.getEntryOrEntryPromise(key)
    switch (entryPromiseType[0]) {
        case "already registered": {
            if (entryIsDeclaredAfterMe) {
                resolver.reportShouldNotBeDeclaredForward(typeInfo, key)
            }
            break
        }
        case "not yet registered": {
            const promise = entryPromiseType[1]
            promise.handlePromise(
                () => {
                    //not found
                    resolver.reportUnresolvedIntraReference(typeInfo, key)
                },
                _entry => {
                    if (!entryIsDeclaredAfterMe) {
                        resolver.reportShouldBeDeclaredForward(typeInfo, key)
                    }
                }
            )

            break
        }
        default:
            assertUnreachable(entryPromiseType[0])
            throw new Error("UNREACHABLE")
    }
    return new IntraReferenceImp(key, entryPromiseType)
}
