// tslint:disable: max-classes-per-file
import { IAutoCreateContext, IDependentResolvedConstraintBuilder, ILookup, IResolvedConstrainedReference, IResolvedReference, MissingEntryCreator } from "../../interfaces/instantResolve"
import { IFulfillingDictionaryReporter, IReferenceResolveReporter } from "../../reporters"
import { RawDictionary } from "../RawDictionary"
import { createReference } from "./referenceBaseClasses"
import { createFailedResolvedBuilder, createResolveBuilder as createResolvedBuilder } from "./resolved"

class AutoCreateLookup<Type> implements ILookup<Type> {
    private readonly autoCreateContext: IAutoCreateContext<Type>
    constructor(autoCreateContext: IAutoCreateContext<Type>) {
        this.autoCreateContext = autoCreateContext
    }
    public has(p: { key: string }) {
        return this.autoCreateContext.has({ key: p.key })
    }
    public createReference(p: { key: string, reporter: IReferenceResolveReporter }): IResolvedReference<Type> {
        return this.createConstrainedReference({
            key: p.key,
            reporter: p.reporter,
            getConstraints: () => ({}),
        })
    }
    public createConstrainedReference<Constraints>(p: {
        readonly key: string,
        readonly reporter: IReferenceResolveReporter,
        readonly getConstraints: (cp: { readonly reference: IDependentResolvedConstraintBuilder<Type> }) => Constraints
    }): IResolvedConstrainedReference<Type, Constraints> {
        const entry = this.autoCreateContext.tryToCreateReference({ key: p.key })
        if (entry === null) {
            p.reporter.reportUnresolvedReference({ key: p.key, options: this.autoCreateContext.getKeys({}) })
            const failedResolved = createFailedResolvedBuilder<Type>()
            return createReference(p.key, failedResolved, p.getConstraints({ reference: failedResolved }))
        }
        return createReference(p.key, entry.builder, p.getConstraints({ reference: entry.builder }))
    }
    public validateFulfillingEntries(p: { keys: string[], reporter: IFulfillingDictionaryReporter, requiresExhaustive: boolean }) {
        const requiredKeys = this.autoCreateContext.getKeys({})
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


class AutoCreateContext<Type> implements IAutoCreateContext<Type> {
    private readonly dict: RawDictionary<Type>
    private readonly missingEntryCreator: MissingEntryCreator<Type>
    private readonly getParentKeys: () => string[]
    constructor(rawDictionary: RawDictionary<Type>, missingEntryCreator: MissingEntryCreator<Type>, getParentKeys: () => string[]) {
        this.dict = rawDictionary
        this.missingEntryCreator = missingEntryCreator
        this.getParentKeys = getParentKeys
    }
    public has(p: { key: string }) {
        return this.dict.has(p.key)
    }
    public tryToCreateReference(p: {
        key: string
    }): null | IResolvedReference<Type> {
        const entry = this.dict.get(p.key)
        if (entry !== null) {
            return createReference(p.key, createResolvedBuilder(entry), {})
        } else {
            //entry does not exist
            const possibleEntry = this.missingEntryCreator({ key: p.key })
            if (possibleEntry === null) {
                return null
            } else {
                this.dict.set(p.key, possibleEntry)
                return createReference(p.key, createResolvedBuilder(possibleEntry), {})
            }
        }
    }
    public toLookup(): ILookup<Type> {
        return new AutoCreateLookup(this)
    }
    public getKeys() {
        function onlyUnique(value: string, index: number, array: string[]) {
            return array.indexOf(value) === index;
        }
        const localKeys = this.dict.getKeys()
        const parentKeys = this.getParentKeys()
        return localKeys.concat(parentKeys).filter(onlyUnique)
    }
}

export function createAutoCreateContext<Type>(
    dict: RawDictionary<Type>,
    missingEntryCreator: MissingEntryCreator<Type>,
    getParentKeys: () => string[]
): IAutoCreateContext<Type> {
    return new AutoCreateContext(dict, missingEntryCreator, getParentKeys)
}

class NonExistentAutoCreateLookup<Type> implements ILookup<Type> {
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
        readonly key: string,
        readonly reporter: IReferenceResolveReporter,
        readonly getConstraints: (cp: { readonly reference: IDependentResolvedConstraintBuilder<Type> }) => Constraints
    }): IResolvedConstrainedReference<Type, Constraints> {
        p.reporter.reportLookupDoesNotExist({ key: p.key })
        const failedResolved = createFailedResolvedBuilder<Type>()
        return createReference(p.key, failedResolved, p.getConstraints({ reference: failedResolved }))
    }
    public validateFulfillingEntries(p: { keys: string[], reporter: IFulfillingDictionaryReporter, requiresExhaustive: boolean }) {
        p.reporter.reportLookupDoesNotExist({ keys: p.keys })
    }
}

class NonExistentAutoCreateContext<Type> implements IAutoCreateContext<Type> {
    public has() {
        return false
    }
    public tryToCreateReference() {
        return null
    }
    public toLookup(_p: {}) {
        return new NonExistentAutoCreateLookup<Type>()
    }
    public getKeys() {
        return []
    }
}

export function createNonExistentAutoCreateContext<Type>(): IAutoCreateContext<Type> {
    return new NonExistentAutoCreateContext()
}
