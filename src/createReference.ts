import { ForwardReference, Reference } from "lingua-franca"
import { UnsureForwardLookup, UnsureLookup } from "./ILookup"
import { IUnsure } from "./IUnsure"
import { CallerObject } from "./createResolvePromise"
import { IResolveReporter } from "./ResolveReporter"

class UnsureImp<Type> implements IUnsure<Type> {
    public readonly value: null | Type
    constructor(value: null | Type) {
        this.value = value
    }
    public convert<NewType>(callback: (value: Type) => NewType | null): IUnsure<NewType> {
        if (this.value === null) {
            return new UnsureImp<NewType>(null)
        } else {
            return new UnsureImp(callback(this.value))
        }
    }
}

// tslint:disable-next-line: max-classes-per-file
class ReferenceImp<ReferencedType> implements Reference<ReferencedType> {
    public readonly nonForward: true = true
    public readonly value: null | ReferencedType
    private readonly key: string
    constructor(name: string, resolvedLookup: UnsureLookup<ReferencedType>, resolver: IResolveReporter, typeInfo: string) {
        this.key = name
        if (resolvedLookup === null) {
            resolver.reportDependentUnresolvedReference(typeInfo, name)
            this.value = null
        } else {
            this.value = resolvedLookup.getEntry(name)
            if (this.value === null) {
                resolver.reportUnresolvedReference(typeInfo, name, resolvedLookup.getKeys())
            }
        }
    }
    public convert<NewType>(callback: (value: ReferencedType) => NewType | null) {
        return new UnsureImp(this.value).convert(callback)
    }
    public mapResolved<NewType>(callback: (type: ReferencedType) => NewType, onNotRolved: () => NewType) {
        if (this.value === null) {
            return onNotRolved()
        }
        return callback(this.value)
    }
    public withResolved(callback: (type: ReferencedType) => void) {
        this.mapResolved(callback, () => { })
    }
    public getResolved() {
        return this.mapResolved(x => x, () => {
            throw new Error("Reference failed to resolve")
        })
    }
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key)
    }
}

export function createReference<ReferencedType>(
    typeInfo: string,
    key: string,
    resolvedLookup: UnsureLookup<ReferencedType>,
    resolver: IResolveReporter,
): Reference<ReferencedType> {
    return new ReferenceImp(key, resolvedLookup, resolver, typeInfo)
}

// tslint:disable-next-line: max-classes-per-file
class ForwardReferenceImp<ReferencedType> implements ForwardReference<ReferencedType> {
    public forward: true = true
    private readonly key: string
    private resolvedEntry: undefined | null | ReferencedType
    private readonly subscribers: Array<CallerObject<ReferencedType>> = []
    constructor(key: string, resolvedLookup: UnsureForwardLookup<ReferencedType>, resolver: IResolveReporter, typeInfo: string) {
        this.key = key
        if (resolvedLookup === null) {
            resolver.reportDependentUnresolvedForwardReference(typeInfo, key)
            this.resolvedEntry = null
        } else {
            resolvedLookup.getEntryPromise(key).handlePromise(
                () => {
                    //not found
                    resolver.reportUnresolvedForwardReference(typeInfo, key)
                    this.subscribers.forEach(subscriber => subscriber.onFailed(null))
                },
                entry => {
                    this.resolvedEntry = entry
                    this.subscribers.forEach(subscriber => subscriber.onResult(entry))
                },
            )
        }
    }
    public mapResolved<NewType>(callback: (type: ReferencedType) => NewType, onNotRolved: () => NewType) {
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
        this.mapResolved(callback, () => {})
    }
    public getResolved() {
        return this.mapResolved(x => x, () => {
            throw new Error("Reference failed to resolve")
        })
    }
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key)
    }
    // public getResolvedEntryPromise(): ResolvePromise<ReferencedType> {
    //     return promisify<ReferencedType>((onFailed, onResult) => {
    //         if (this.resolvedEntry === undefined) {
    //             this.subscribers.push({
    //                 onFailed: onFailed,
    //                 onResult: onResult,
    //             })
    //         } else {
    //             if (this.resolvedEntry !== null) {
    //                 onResult(this.resolvedEntry)
    //             } else {
    //                 onFailed(null)
    //             }
    //         }
    //     })
    // }
}

export function createForwardReference<ReferencedType>(
    typeInfo: string,
    key: string,
    resolvedLookup: UnsureForwardLookup<ReferencedType>,
    resolver: IResolveReporter,
): ForwardReference<ReferencedType> {
    return new ForwardReferenceImp(key, resolvedLookup, resolver, typeInfo)
}
