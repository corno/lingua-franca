// tslint:disable: max-classes-per-file
import { Dictionary } from "lingua-franca"
import { ILookup, IResolvedReference } from "../../interfaces/instantResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createReference } from "./referenceBaseClasses"
import { createFailedResolved, wrapResolved } from "./resolved"

class LookupImp<Type> implements ILookup<Type> {
    protected readonly resolveReporter: IResolveReporter
    private readonly dictionary: Dictionary<Type>
    constructor(dictionary: Dictionary<Type>, resolveReporter: IResolveReporter) {
        this.dictionary = dictionary
        this.resolveReporter = resolveReporter
    }
    public createReference(key: string, typeInfo: string): IResolvedReference<Type> {
        const entry = this.dictionary.getEntry(key)
        if (entry === null) {
            this.resolveReporter.reportUnresolvedReference(typeInfo, key, this.dictionary.getKeys(), false)
            return createReference(key, createFailedResolved(this.resolveReporter))
        }
        return createReference(key, wrapResolved(entry, this.resolveReporter))
    }
    public validateFulfillingEntries(keys: string[], typeInfo: string, requiresExhaustive: boolean) {
        const requiredKeys = this.dictionary.getKeys()
        if (requiresExhaustive) {
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
}

class NonExistentLookup<Type> implements ILookup<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public createReference(key: string, typeInfo: string): IResolvedReference<Type> {
        this.resolveReporter.reportLookupDoesNotExistForReference(typeInfo, key)
        return createReference(key, createFailedResolved(this.resolveReporter))
    }
    public validateFulfillingEntries(keys: string[], typeInfo: string, _requiresExhaustive: boolean) {
        this.resolveReporter.reportLookupDoesNotExistForFulfillingDictionary(typeInfo, keys)
    }
}

class FailedLookup<Type> implements ILookup<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public createReference(key: string, typeInfo: string): IResolvedReference<Type> {
        this.resolveReporter.reportDependentUnresolvedReference(typeInfo, key, false)
        return createReference(key, createFailedResolved(this.resolveReporter))
    }
    public validateFulfillingEntries(keys: string[], typeInfo: string, _requiresExhaustive: boolean) {
        keys.forEach(key => {
            this.resolveReporter.reportDependentUnresolvedFulfillingDictionaryEntry(typeInfo, key, false)
        })
    }
}

export function createLookup<Type>(dict: Dictionary<Type>, resolveReporter: IResolveReporter): ILookup<Type> {
    return new LookupImp(dict, resolveReporter)
}

export function createNonExistentLookupPlaceholder<Type>(resolveReporter: IResolveReporter): ILookup<Type> {
    return new NonExistentLookup(resolveReporter)
}

export function createFailedLookup<Type>(resolveReporter: IResolveReporter): ILookup<Type> {
    return new FailedLookup(resolveReporter)
}
