// tslint:disable: max-classes-per-file
import { IAutoCreateContext, IDependentResolvedConstraintBuilder, ILookup, IResolvedConstrainedReference, IResolvedReference, MissingEntryCreator } from "../../interfaces/instantResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { RawDictionary } from "../RawDictionary"
import { createReference } from "./referenceBaseClasses"
import { createFailedResolvedBuilder, wrapResolved } from "./resolved"

class AutoCreateLookup<Type> implements ILookup<Type> {
    private readonly autoCreateContext: IAutoCreateContext<Type>
    private readonly resolveReporter: IResolveReporter
    constructor(autoCreateContext: IAutoCreateContext<Type>, resolveReporter: IResolveReporter) {
        this.autoCreateContext = autoCreateContext
        this.resolveReporter = resolveReporter
    }
    public createReference(key: string, typeInfo: string): IResolvedReference<Type> {
        return this.createConstrainedReference(key, typeInfo, () => ({}))
    }
    public createConstrainedReference<Constraints>(
        key: string, typeInfo: string, getConstraints: (ref: IDependentResolvedConstraintBuilder<Type>) => Constraints
    ): IResolvedConstrainedReference<Type, Constraints> {
        const entry = this.autoCreateContext.tryToCreateReference(key)
        if (entry === null) {
            this.resolveReporter.reportUnresolvedReference(typeInfo, key, this.autoCreateContext.getKeys(), false)
            const failedResolved = createFailedResolvedBuilder<Type>(this.resolveReporter)
            return createReference(key, failedResolved, getConstraints(failedResolved))
        }
        return createReference(key, entry, getConstraints(entry))
    }
    public validateFulfillingEntries(keys: string[], typeInfo: string, requiresExhaustive: boolean) {
        const requiredKeys = this.autoCreateContext.getKeys()
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


class AutoCreateContext<Type> implements IAutoCreateContext<Type> {
    private readonly dict: RawDictionary<Type>
    private readonly missingEntryCreator: MissingEntryCreator<Type>
    private readonly resolveReporter: IResolveReporter
    private readonly getParentKeys: () => string[]
    constructor(rawDictionary: RawDictionary<Type>, resolveReporter: IResolveReporter, missingEntryCreator: MissingEntryCreator<Type>, getParentKeys: () => string[]) {
        this.dict = rawDictionary
        this.missingEntryCreator = missingEntryCreator
        this.getParentKeys = getParentKeys
        this.resolveReporter = resolveReporter
    }
    public tryToCreateReference(
        key: string
    ): null | IDependentResolvedConstraintBuilder<Type> {
        const entry = this.dict.get(key)
        if (entry !== null) {
            return wrapResolved(entry, this.resolveReporter)
        } else {
            //entry does not exist
            const possibleEntry = this.missingEntryCreator(key)
            if (possibleEntry === null) {
                return null
            } else {
                this.dict.set(key, possibleEntry)
                return wrapResolved(possibleEntry, this.resolveReporter)
            }
        }
    }
    public toLookup(): ILookup<Type> {
        return new AutoCreateLookup(this, this.resolveReporter)
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
    resolveReporter: IResolveReporter,
    missingEntryCreator: MissingEntryCreator<Type>,
    getParentKeys: () => string[]
): IAutoCreateContext<Type> {
    return new AutoCreateContext(dict, resolveReporter, missingEntryCreator, getParentKeys)
}

class NonExistentAutoCreateLookup<Type> implements ILookup<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public createReference(key: string, typeInfo: string): IResolvedReference<Type> {
        return this.createConstrainedReference(key, typeInfo, () => ({}))
    }
    public createConstrainedReference<Constraints>(
        key: string, typeInfo: string, getConstraints: (ref: IDependentResolvedConstraintBuilder<Type>) => Constraints
    ): IResolvedConstrainedReference<Type, Constraints> {
        this.resolveReporter.reportLookupDoesNotExistForReference(typeInfo, key)
        const failedResolved = createFailedResolvedBuilder<Type>(this.resolveReporter)
        return createReference(key, failedResolved, getConstraints(failedResolved))
    }
    public validateFulfillingEntries(keys: string[], typeInfo: string, _requiresExhaustive: boolean) {
        this.resolveReporter.reportLookupDoesNotExistForFulfillingDictionary(typeInfo, keys)
    }
}

class NonExistentAutoCreateContext<Type> implements IAutoCreateContext<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public tryToCreateReference() {
        return null
    }
    public toLookup() {
        return new NonExistentAutoCreateLookup<Type>(this.resolveReporter)
    }
    public getKeys() {
        return []
    }
}

export function createNonExistentAutoCreateContext<Type>(resolveReporter: IResolveReporter): IAutoCreateContext<Type> {
    return new NonExistentAutoCreateContext(resolveReporter)
}
