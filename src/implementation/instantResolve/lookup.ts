// tslint:disable: max-classes-per-file
import { Dictionary } from "lingua-franca"
import { IDependentResolvedConstraintBuilder, ILookup, IResolvedConstrainedReference, IResolvedReference } from "../../interfaces/instantResolve"
import { IFulfillingDictionaryReporter, IReferenceResolveReporter } from "../../reporters"
import { createReference } from "./referenceBaseClasses"
import { createFailedResolvedBuilder, createResolveBuilder } from "./resolved"

class LookupImp<Type> implements ILookup<Type> {
    private readonly dictionary: Dictionary<Type>
    constructor(dictionary: Dictionary<Type>) {
        this.dictionary = dictionary
    }
    public has(key: string) {
        return this.dictionary.getEntry({ key: key }) !== null
    }
    public createReference(key: string, reporter: IReferenceResolveReporter): IResolvedReference<Type> {
        return this.createConstrainedReference(key, reporter, () => ({}))
    }
    public createConstrainedReference<Constraints>(
        key: string, reporter: IReferenceResolveReporter, getConstraints: (reference: IDependentResolvedConstraintBuilder<Type>) => Constraints
    ): IResolvedConstrainedReference<Type, Constraints> {
        const entry = this.dictionary.getEntry({ key: key })
        if (entry === null) {
            reporter.reportUnresolvedReference(key, this.dictionary.getKeys({}))
            const failedResolved = createFailedResolvedBuilder<Type>()
            return createReference(key, failedResolved, getConstraints(failedResolved))
        }
        const resolved = createResolveBuilder(entry)
        return createReference(key, resolved, getConstraints(resolved))
    }

    public validateFulfillingEntries(keys: string[], mrer: IFulfillingDictionaryReporter, requiresExhaustive: boolean) {
        const requiredKeys = this.dictionary.getKeys({})
        if (requiresExhaustive) {
            const missingEntries = requiredKeys.filter(key => keys.indexOf(key) === -1)
            if (missingEntries.length > 0) {
                mrer.reportMissingRequiredEntries(missingEntries, keys)
            }
        }
        keys.forEach(key => {
            if (requiredKeys.indexOf(key) === -1) {
                mrer.reportUnresolvedEntry(key, requiredKeys)
            }
        })
    }
}

class NonExistentLookup<Type> implements ILookup<Type> {
    public has() {
        return false
    }
    public createReference(key: string, reporter: IReferenceResolveReporter): IResolvedReference<Type> {
        return this.createConstrainedReference(key, reporter, () => ({}))
    }
    public createConstrainedReference<Constraints>(
        key: string, reporter: IReferenceResolveReporter, getConstraints: (ref: IDependentResolvedConstraintBuilder<Type>) => Constraints
    ): IResolvedConstrainedReference<Type, Constraints> {
        reporter.reportLookupDoesNotExist(key)
        const failedResolved = createFailedResolvedBuilder<Type>()
        return createReference(key, failedResolved, getConstraints(failedResolved))
    }
    public validateFulfillingEntries(keys: string[], reporter: IFulfillingDictionaryReporter, _requiresExhaustive: boolean) {
        reporter.reportLookupDoesNotExist(keys)
    }
}

class FailedLookup<Type> implements ILookup<Type> {
    public has() {
        return false
    }
    public createReference(key: string, reporter: IReferenceResolveReporter): IResolvedReference<Type> {
        return this.createConstrainedReference(key, reporter, () => ({}))
    }
    public createConstrainedReference<Constraints>(
        key: string, reporter: IReferenceResolveReporter, getConstraints: (ref: IDependentResolvedConstraintBuilder<Type>) => Constraints
    ): IResolvedConstrainedReference<Type, Constraints> {
        reporter.reportDependentUnresolvedReference(key)
        const failedResolved = createFailedResolvedBuilder<Type>()
        return createReference(key, failedResolved, getConstraints(failedResolved))
    }
    public validateFulfillingEntries(keys: string[], reporter: IFulfillingDictionaryReporter, _requiresExhaustive: boolean) {
        keys.forEach(key => {
            reporter.reportDependentUnresolvedEntry(key)
        })
    }
}

export function createLookup<Type>(dict: Dictionary<Type>): ILookup<Type> {
    return new LookupImp(dict)
}

export function createNonExistentLookupPlaceholder<Type>(): ILookup<Type> {
    return new NonExistentLookup()
}

export function createFailedLookup<Type>(): ILookup<Type> {
    return new FailedLookup()
}
