import { Dictionary } from "lingua-franca"
import { IDelayedResolveRequiringLookup } from "../../interfaces/delayedResolve"
import { IResolveReporter } from "../../IResolveReporter"

class DelayedResolveRequiringLookupImp<Type> implements IDelayedResolveRequiringLookup<Type> {
    private readonly requiresExhaustive: boolean
    private readonly dictionary: Dictionary<Type>
    private readonly resolveReporter: IResolveReporter
    constructor(
        dictionary: Dictionary<Type>,
        resolveReporter: IResolveReporter,
        requiresExhaustive: boolean
    ) {
        this.dictionary = dictionary
        this.requiresExhaustive = requiresExhaustive
        this.resolveReporter = resolveReporter
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
    public validate(keys: string[], typeInfo: string) {
        const requiredKeys = this.dictionary.getKeys()
        if (this.requiresExhaustive) {
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
}

export function createDelayedResolveRequiringLookupWrapper<Type>(
    dict: Dictionary<Type>,
    resolveReporter: IResolveReporter,
    requiresExhaustive: boolean,
): IDelayedResolveRequiringLookup<Type> {
    return new DelayedResolveRequiringLookupImp(dict, resolveReporter, requiresExhaustive)
}
