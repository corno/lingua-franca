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
    public has(key: string) {
        return this.autoCreateContext.has(key)
    }
    public createReference(key: string, reporter: IReferenceResolveReporter): IResolvedReference<Type> {
        return this.createConstrainedReference(key, reporter, () => ({}))
    }
    public createConstrainedReference<Constraints>(
        key: string, reporter: IReferenceResolveReporter, getConstraints: (ref: IDependentResolvedConstraintBuilder<Type>) => Constraints
    ): IResolvedConstrainedReference<Type, Constraints> {
        const entry = this.autoCreateContext.tryToCreateReference(key)
        if (entry === null) {
            reporter.reportUnresolvedReference(key, this.autoCreateContext.getKeys())
            const failedResolved = createFailedResolvedBuilder<Type>()
            return createReference(key, failedResolved, getConstraints(failedResolved))
        }
        return createReference(key, entry.builder, getConstraints(entry.builder))
    }
    public validateFulfillingEntries(keys: string[], reporter: IFulfillingDictionaryReporter, requiresExhaustive: boolean) {
        const requiredKeys = this.autoCreateContext.getKeys()
        if (requiresExhaustive) {
            const missingEntries = requiredKeys.filter(key => keys.indexOf(key) === -1)
            if (missingEntries.length > 0) {
                reporter.reportMissingRequiredEntries(missingEntries, keys)
            }
        }
        keys.forEach(key => {
            if (requiredKeys.indexOf(key) === -1) {
                reporter.reportUnresolvedEntry(key, requiredKeys)
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
    public has(key: string) {
        return this.dict.has(key)
    }
    public tryToCreateReference(
        key: string
    ): null | IResolvedReference<Type> {
        const entry = this.dict.get(key)
        if (entry !== null) {
            return createReference(key, createResolvedBuilder(entry), {})
        } else {
            //entry does not exist
            const possibleEntry = this.missingEntryCreator(key)
            if (possibleEntry === null) {
                return null
            } else {
                this.dict.set(key, possibleEntry)
                return createReference(key, createResolvedBuilder(possibleEntry), {})
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

class NonExistentAutoCreateContext<Type> implements IAutoCreateContext<Type> {
    public has() {
        return false
    }
    public tryToCreateReference() {
        return null
    }
    public toLookup() {
        return new NonExistentAutoCreateLookup<Type>()
    }
    public getKeys() {
        return []
    }
}

export function createNonExistentAutoCreateContext<Type>(): IAutoCreateContext<Type> {
    return new NonExistentAutoCreateContext()
}
