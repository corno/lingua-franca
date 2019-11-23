import { Dictionary } from "lingua-franca"
import { IDelayedResolveReference, IDelayedResolveSubLookup } from "../../interfaces/delayedResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createReferenceToDelayedResolveLookup, createResolvePromise } from "./delayedResolvable"

class FinishedDictionaryActingAsDelayedSubLookup<Type> implements IDelayedResolveSubLookup<Type> {
    private readonly dictionary: Dictionary<Type>
    private readonly resolveReporter: IResolveReporter
    private readonly isForwardDeclaration: boolean
    constructor(
        dictionary: Dictionary<Type>,
        resolveReporter: IResolveReporter,
        isForwardDeclaration: boolean,
    ) {
        this.dictionary = dictionary
        this.resolveReporter = resolveReporter
        this.isForwardDeclaration = isForwardDeclaration
    }
    // public getEntry(key: string, typeInfo: string): IResolved<Type> {
    //     const entry = this.dictionary.getEntry(key)
    //     if (entry === null) {
    //         this.resolveReporter.reportUnresolvedReference(typeInfo, key, this.dictionary.getKeys(), true)
    //         return createNullResolved(this.resolveReporter)
    //     } else {
    //         return wrapResolved(entry, this.resolveReporter)
    //     }
    // }
    public validateFulfillingEntries(keys: string[], typeInfo: string, requiresExhaustive: boolean) {
        const requiredKeys = this.dictionary.getKeys()
        if (requiresExhaustive) {
            const missingEntries = requiredKeys.filter(key => keys.indexOf(key) === -1)
            if (missingEntries.length > 0) {
                this.resolveReporter.reportMissingRequiredEntries(typeInfo, missingEntries, keys, true)
            }
        }
        keys.forEach(key => {
            if (requiredKeys.indexOf(key) === -1) {
                this.resolveReporter.reportUnresolvedFulfillingDictionaryEntry(typeInfo, key, requiredKeys, true)
            }
        })
    }
    public _hack() {
        return this
    }
    public createReference(
        key: string,
        typeInfo: string
    ): IDelayedResolveReference<Type> {
        const entry = this.dictionary.getEntry(key)
        if (entry === null) {
            this.resolveReporter.reportUnresolvedReference(typeInfo, key, this.dictionary.getKeys(), true)
            throw new Error("IMPLEMENT ME")
            //return createFai(key, createFailedResolved<Type>(this.resolveReporter))
        }
        return createReferenceToDelayedResolveLookup(
            key,
            createResolvePromise((_onFailed, _onResult) => {
                throw new Error("IMPLEMENT ME")

                // const entry = this.dictionary.getEntry(key)
                // if (entry === null) {
                //     onFailed(null)
                // } else {
                //     onResult(entry)
                // }
            }),
            this.resolveReporter,
            typeInfo,
            this.isForwardDeclaration,
        )
    }
}

export function createDelayedResolveLookupWrapper<Type>(
    dict: Dictionary<Type>,
    resolveReporter: IResolveReporter,
    isForwardDeclaration: boolean,
): IDelayedResolveSubLookup<Type> {
    return new FinishedDictionaryActingAsDelayedSubLookup(dict, resolveReporter, isForwardDeclaration)
}
