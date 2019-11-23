import { Dictionary } from "lingua-franca"
import { IDelayedResolveBaseLookup, IDelayedResolveReference } from "../../interfaces/delayedResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createReferenceToDelayedResolveLookup, createResolvePromise, GetEntryResult } from "./delayedResolvable"

class DictionaryImp2<Type> implements IDelayedResolveBaseLookup<Type> {
    protected readonly dictionary: Dictionary<Type>
    private readonly resolveReporter: IResolveReporter
    constructor(dictionary: Dictionary<Type>, resolveReporter: IResolveReporter) {
        this.dictionary = dictionary
        this.resolveReporter = resolveReporter
    }
    public getKeys() {
        return this.dictionary.getKeys().sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
    }

    public createReference(
        key: string,
        typeInfo: string,
        isForwardDeclaration: boolean,
    ): IDelayedResolveReference<Type> {
        const promise = createResolvePromise<GetEntryResult<Type>>((onFailed, onResult) => {
            const entry = this.dictionary.getEntry(key)
            if (entry === null) {
                onFailed(null)
            } else {
                onResult({
                    wasRegisteredBeforeRequest: true,
                    entry: entry,
                })
            }
        })
        return createReferenceToDelayedResolveLookup(key, promise, this.resolveReporter, typeInfo, isForwardDeclaration)
    }
    get isEmpty() {
        return this.getKeys().length === 0
    }
}

export function castFinishedDictionaryToDelayedResolveLookup<Type>(dictionary: Dictionary<Type>, resolveReporter: IResolveReporter): IDelayedResolveBaseLookup<Type> {
    return new DictionaryImp2(dictionary, resolveReporter)
}
