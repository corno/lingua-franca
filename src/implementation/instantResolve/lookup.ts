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
    public has(p: { key: string }) {
        return this.dictionary.getEntry({ key: p.key }) !== null
    }
    public createReference(p: { key: string, reporter: IReferenceResolveReporter }): IResolvedReference<Type> {
        return this.createConstrainedReference({
            key: p.key,
            reporter: p.reporter,
            getConstraints: () => ({}),
        })
    }
    public createConstrainedReference<Constraints>(p: {
        key: string, reporter: IReferenceResolveReporter, getConstraints: (reference: IDependentResolvedConstraintBuilder<Type>) => Constraints
    }): IResolvedConstrainedReference<Type, Constraints> {
        const entry = this.dictionary.getEntry({ key: p.key })
        if (entry === null) {
            p.reporter.reportUnresolvedReference({ key: p.key, options: this.dictionary.getKeys({}) })
            const failedResolved = createFailedResolvedBuilder<Type>()
            return createReference(p.key, failedResolved, p.getConstraints(failedResolved))
        }
        const resolved = createResolveBuilder(entry)
        return createReference(p.key, resolved, p.getConstraints(resolved))
    }

    public validateFulfillingEntries(p: { keys: string[], reporter: IFulfillingDictionaryReporter, requiresExhaustive: boolean }) {
        const requiredKeys = this.dictionary.getKeys({})
        if (p.requiresExhaustive) {
            const missingEntries = requiredKeys.filter(key => p.keys.indexOf(key) === -1)
            if (missingEntries.length > 0) {
                p.reporter.reportMissingRequiredEntries({
                    missingEntries: missingEntries,
                    foundEntries: p.keys,
                })
            }
        }
        p.keys.forEach(key => {
            if (requiredKeys.indexOf(key) === -1) {
                p.reporter.reportUnresolvedEntry({
                    key: key,
                    options: requiredKeys,
                })
            }
        })
    }
}

class NonExistentLookup<Type> implements ILookup<Type> {
    public has() {
        return false
    }
    public createReference(p: { key: string, reporter: IReferenceResolveReporter }): IResolvedReference<Type> {
        return this.createConstrainedReference({
            key: p.key,
            reporter: p.reporter,
            getConstraints: () => ({}),
        })
    }
    public createConstrainedReference<Constraints>(p: {
        key: string, reporter: IReferenceResolveReporter, getConstraints: (ref: IDependentResolvedConstraintBuilder<Type>) => Constraints
    }): IResolvedConstrainedReference<Type, Constraints> {
        p.reporter.reportLookupDoesNotExist({ key: p.key })
        const failedResolved = createFailedResolvedBuilder<Type>()
        return createReference(p.key, failedResolved, p.getConstraints(failedResolved))
    }
    public validateFulfillingEntries(p: { keys: string[], reporter: IFulfillingDictionaryReporter, requiresExhaustive: boolean }) {
        p.reporter.reportLookupDoesNotExist({ keys: p.keys })
    }
}

class FailedLookup<Type> implements ILookup<Type> {
    public has() {
        return false
    }
    public createReference(p: { key: string, reporter: IReferenceResolveReporter }): IResolvedReference<Type> {
        return this.createConstrainedReference({ key: p.key, reporter: p.reporter, getConstraints: () => ({}) })
    }
    public createConstrainedReference<Constraints>(p: {
        key: string, reporter: IReferenceResolveReporter, getConstraints: (ref: IDependentResolvedConstraintBuilder<Type>) => Constraints
    }): IResolvedConstrainedReference<Type, Constraints> {
        p.reporter.reportDependentUnresolvedReference({ key: p.key })
        const failedResolved = createFailedResolvedBuilder<Type>()
        return createReference(p.key, failedResolved, p.getConstraints(failedResolved))
    }
    public validateFulfillingEntries(p: { keys: string[], reporter: IFulfillingDictionaryReporter, requiresExhaustive: boolean }) {
        p.keys.forEach(key => {
            p.reporter.reportDependentUnresolvedEntry({ key: key })
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
