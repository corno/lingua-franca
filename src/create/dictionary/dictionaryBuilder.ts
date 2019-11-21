import { IDelayedResolveLookup, IDelayedResolveReference } from "../../interfaces/delayedResolve"
import { IFinalizableDictionaryBuilder } from "../../interfaces/dictionary"
import { IResolveReporter } from "../../IResolveReporter"
import { CallerObject, createReferenceToDelayedResolveLookup, createResolvePromise, GetEntryResult } from "../delayedResolve/delayedResolvable"
import { createLookup } from "../instantResolve/lookup"
import { wrapDictionary } from "./createDictionary"

export type RawDictionary<Type> = { [key: string]: Type }

class DictionaryBuilder<Type> implements IFinalizableDictionaryBuilder<Type>, IDelayedResolveLookup<Type> {
    public readonly dictionary: RawDictionary<Type>
    private readonly subscribers: Array<{ key: string; caller: CallerObject<Type> }> = []
    private finalized = false
    private readonly resolveReporter: IResolveReporter
    private readonly typeInfo: string
    constructor(dictionary: RawDictionary<Type>, resolveReporter: IResolveReporter, typeInfo: string) {
        this.dictionary = dictionary
        this.resolveReporter = resolveReporter
        this.typeInfo = typeInfo
    }
    public add(key: string, entry: Type) {
        if (this.finalized) {
            throw new Error("Already finalized")
        }
        if (this.dictionary[key] !== undefined) {
            //it already exists
            this.resolveReporter.reportConflictingEntry(this.typeInfo, key)
            return
        }
        this.dictionary[key] = entry
    }
    public getValidatedEntry(key: string, resolveReporter: IResolveReporter, typeInfo: string): null | Type {
        const entry = this.dictionary[key]
        if (entry === undefined) {
            resolveReporter.reportUnresolvedReference(typeInfo, key, this.getKeys(), false)
            return null
        } else {
            return entry
        }
    }
    public getKeys() {
        return Object.keys(this.dictionary).sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
    }
    public toLookup() {
        return createLookup(wrapDictionary(this.dictionary), this.resolveReporter)
    }
    public toDelayedResolveLookup() {
        return this
    }

    public createReferenceToDelayedResolveLookup(
        key: string,
        typeInfo: string,
        isForwardDeclaration: boolean,
    ): IDelayedResolveReference<Type> {
        const promise = createResolvePromise<GetEntryResult<Type>>((onFailed, onResult) => {
            const entry = this.dictionary[key]
            if (entry !== undefined) {
                onResult({
                    entry: entry,
                    wasRegisteredBeforeRequest: true,
                })
            } else {
                this.subscribers.push({
                    key: key,
                    caller: {
                        onFailed: onFailed,
                        onResult: entry2 => onResult({
                            wasRegisteredBeforeRequest: false,
                            entry: entry2,
                        }),
                    },
                })
            }
        })
        return createReferenceToDelayedResolveLookup(key, promise, this.resolveReporter, typeInfo, isForwardDeclaration)
    }
    public finalize() {
        if (this.finalized) {
            throw new Error("Already finalized")
        }
        this.finalized = true
        this.subscribers.forEach(subscriber => {
            const entry = this.dictionary[subscriber.key]
            if (entry === undefined) {
                subscriber.caller.onFailed(null)
            } else {
                subscriber.caller.onResult(entry)
            }
        })

    }
}



export function createDictionaryBuilder<Type>(
    dictionary: RawDictionary<Type>,
    resolveReporter: IResolveReporter,
    typeInfo: string
): IFinalizableDictionaryBuilder<Type> {
    return new DictionaryBuilder<Type>(dictionary, resolveReporter, typeInfo)
}