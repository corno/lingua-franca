import { Dictionary } from "lingua-franca"
import { IRequiringLookup, IResolved, IResolvedReference } from "../../interfaces/instantResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createReference } from "./referenceBaseClasses"
import { createNullResolved, wrapResolved } from "./resolved"

// tslint:disable-next-line: max-classes-per-file
class RequiringLookupImp<Type> implements IRequiringLookup<Type> {
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
    public getEntry(key: string, typeInfo: string): IResolved<Type> {
        const entry = this.dictionary.getEntry(key)
        if (entry === null) {
            this.resolveReporter.reportUnresolvedReference(typeInfo, key, this.dictionary.getKeys(), false)
            return createNullResolved(this.resolveReporter)
        } else {
            return wrapResolved(entry, this.resolveReporter)
        }
    }
    public validate(keys: string[], typeInfo: string) {
        const requiredKeys = this.dictionary.getKeys()
        if (this.requiresExhaustive) {
            const missingEntries = requiredKeys.filter(key => keys.indexOf(key) === -1)
            if (missingEntries.length > 0) {
                this.resolveReporter.reportMissingRequiredEntries(typeInfo, missingEntries, keys, false)
            }
        }
        keys.forEach(key => {
            if (requiredKeys.indexOf(key) === -1) {
                this.resolveReporter.reportUnresolvedFulfillingDictionaryEntry(typeInfo, key, requiredKeys, false)
            }
        })
    }
    public createDependentReference(
        key: string,
        typeInfo: string,
    ): IResolvedReference<Type> {
        const entry = this.getEntry(key, typeInfo)
        return createReference(key, entry)
    }

}

export function createRequiringLookupWrapper<Type>(dict: Dictionary<Type>, resolveReporter: IResolveReporter, requiresExhaustive: boolean): IRequiringLookup<Type> {
    return new RequiringLookupImp(dict, resolveReporter, requiresExhaustive)
}


// tslint:disable-next-line: max-classes-per-file
class NullRequiringLookup<Type> implements IRequiringLookup<Type> {
    private readonly delayed: boolean
    private readonly resolveReporter: IResolveReporter
    constructor(
        resolveReporter: IResolveReporter,
        delayed: boolean,
    ) {
        this.delayed = delayed
        this.resolveReporter = resolveReporter
    }
    public getEntry(key: string, typeInfo: string): IResolved<Type> {
        this.resolveReporter.reportDependentUnresolvedReference(typeInfo, key, this.delayed)
        return createNullResolved(this.resolveReporter)
    }
    public validate(keys: string[], typeInfo: string) {
        keys.forEach(key => {
            this.resolveReporter.reportDependentUnresolvedFulfillingDictionaryEntry(typeInfo, key, this.delayed)
        })
    }
    public createDependentReference(
        key: string,
        typeInfo: string,
    ): IResolvedReference<Type> {
        this.resolveReporter.reportDependentUnresolvedReference(typeInfo, key, false)
        return createReference(key, createNullResolved<Type>(this.resolveReporter))

    }

}


export function createNullRequiringLookup<Type>(resolveReporter: IResolveReporter, delayed: boolean): IRequiringLookup<Type> {
    return new NullRequiringLookup(resolveReporter, delayed)
}
