//import { IDelayedResolveReference } from "../../interfaces/delayedResolve"
import { IFinalizableDictionaryBuilder } from "../../interfaces/dictionary"
import { IResolveReporter } from "../../IResolveReporter"
import { createLookup } from "../instantResolve/lookup"
import { RawDictionary } from "../RawDictionary"
import { wrapDictionary } from "./createDictionary"

class DictionaryBuilder<Type> implements IFinalizableDictionaryBuilder<Type> {
    public readonly dictionary: RawDictionary<Type>
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
        if (this.dictionary.has(key)) {
            this.resolveReporter.reportConflictingEntry(this.typeInfo, key)
        } else {
            this.dictionary.set(key, entry)
        }
    }
    // public getValidatedEntry(key: string, resolveReporter: IResolveReporter, typeInfo: string): null | Type {
    //     const entry = this.dictionary.get(key)
    //     if (entry === null) {
    //         resolveReporter.reportUnresolvedReference(typeInfo, key, this.getKeys(), false)
    //         return null
    //     } else {
    //         return entry
    //     }
    // }
    public getKeys() {
        return this.dictionary.getKeys().sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
    }
    public toPrecedingEntriesLookup() {
        return createLookup(wrapDictionary(this.dictionary), this.resolveReporter)
    }
    // public toDelayedResolveLookup() {
    //     return this
    // }

    // public createReference(
    //     key: string,
    //     typeInfo: string,
    //     isForwardDeclaration: boolean,
    // ): IDelayedResolveReference<Type> {
    //     const promise = createResolvePromise<GetEntryResult<Type>>((onFailed, onResult) => {
    //         const entry = this.dictionary.get(key)
    //         if (entry !== null) {
    //             onResult({
    //                 entry: entry,
    //                 wasRegisteredBeforeRequest: true,
    //             })
    //         } else {
    //             this.subscribers.push({
    //                 key: key,
    //                 caller: {
    //                     onFailed: onFailed,
    //                     onResult: entry2 => onResult({
    //                         wasRegisteredBeforeRequest: false,
    //                         entry: entry2,
    //                     }),
    //                 },
    //             })
    //         }
    //     })
    //     return createReferenceToDelayedResolveLookup(key, promise, this.resolveReporter, typeInfo, isForwardDeclaration)
    // }
    public finalize() {
        if (this.finalized) {
            throw new Error("Already finalized")
        }
        this.finalized = true
    }
}

export function createDictionaryBuilder<Type>(
    dictionary: RawDictionary<Type>,
    resolveReporter: IResolveReporter,
    typeInfo: string
): IFinalizableDictionaryBuilder<Type> {
    return new DictionaryBuilder<Type>(dictionary, resolveReporter, typeInfo)
}
