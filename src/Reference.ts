import { ForwardReference, Reference, ResolvePromise } from "lingua-franca"
import { UnsureForwardLookup, UnsureLookup } from "."
import { CallerObject, promisify } from "./ResolvePromise"
import { IResolveReporter } from "./ResolveReporter"

// tslint:disable-next-line: max-classes-per-file
class ReferenceImp<ReferencedType> implements Reference<ReferencedType> {
    public readonly key: string
    public readonly resolvedEntry: null | ReferencedType
    constructor(name: string, resolvedLookup: UnsureLookup<ReferencedType>, resolver: IResolveReporter, typeInfo: string) {
        this.key = name
        if (resolvedLookup === null) {
            resolver.reportDependentUnresolvedReference(typeInfo, name)
            this.resolvedEntry = null
        } else {
            this.resolvedEntry = resolvedLookup.getEntry(name)
            if (this.resolvedEntry === null) {
                resolver.reportUnresolvedReference(typeInfo, name, resolvedLookup.getKeys())
            }
        }
    }
}

export function makeReference<ReferencedType>(
    typeInfo: string,
    key: string,
    resolvedLookup: UnsureLookup<ReferencedType>,
    resolver: IResolveReporter,
): Reference<ReferencedType> {
    return new ReferenceImp(key, resolvedLookup, resolver, typeInfo)
}


// tslint:disable-next-line: max-classes-per-file
class ForwardReferenceImp<ReferencedType> implements ForwardReference<ReferencedType> {
    public readonly key: string
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
    public getResolvedEntryPromise(): ResolvePromise<ReferencedType> {
        return promisify<ReferencedType>((onFailed, onResult) => {
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

export function makeForwardReference<ReferencedType>(
    typeInfo: string,
    key: string,
    resolvedLookup: UnsureForwardLookup<ReferencedType>,
    resolver: IResolveReporter,
): ForwardReference<ReferencedType> {
    return new ForwardReferenceImp(key, resolvedLookup, resolver, typeInfo)
}
