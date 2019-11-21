import { Dictionary } from "lingua-franca"
import { IDelayedResolveLookup, IDelayedResolveReference } from "../../interfaces/delayedResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createReferenceToDelayedResolveLookup, createResolvePromise, GetEntryResult } from "./delayedResolvable"

class DictionaryImp2<Type> implements IDelayedResolveLookup<Type> {
    protected readonly dictionary: Dictionary<Type>
    private readonly resolveReporter: IResolveReporter
    constructor(dictionary: Dictionary<Type>, resolveReporter: IResolveReporter) {
        this.dictionary = dictionary
        this.resolveReporter = resolveReporter
    }
    public getKeys() {
        return Object.keys(this.dictionary).sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
    }

    public createReferenceToDelayedResolveLookup(
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

export function castFinishedDictionaryToDelayedResolveLookup<Type>(dictionary: Dictionary<Type>, resolveReporter: IResolveReporter) {
    return new DictionaryImp2(dictionary, resolveReporter)
}
