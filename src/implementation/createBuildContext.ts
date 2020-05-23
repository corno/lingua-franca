import { IDelayedResolveLookup, IPossibleContext, IRootDelayedResolvableBuilder } from "../interfaces/delayedResolve"
import { IAutoCreateDictionary, IDictionaryBuilder } from "../interfaces/dictionaries"
import { Dictionary } from "../interfaces/Dictionary"
import { IBuildContext, IOrderingCreator } from "../interfaces/IBuildContext"
import { IListBuilder } from "../interfaces/IListBuilder"
import { IAutoCreateContext, IDependentResolvedConstraintBuilder, ILookup, MissingEntryCreator } from "../interfaces/instantResolve"
import { List } from "../interfaces/List"
import { IConflictingEntryReporter, IFulfillingDictionaryReporter } from "../reporters"
import { createDelayedResolvableBuilder } from "./delayedResolve/delayedResolve"
import { createExistingContext, createNonExistingContext } from "./delayedResolve/possibleContext"
import { createAutoCreateDictionary, createDelayedResolveFulfillingDictionary, createDictionary, createFulfillingDictionary, createOrderedDictionary } from "./dictionary/createDictionary"
import { createNonExistentAutoCreateContext } from "./instantResolve/autoCreateContext"
import { createFailedLookup, createLookup, createNonExistentLookupPlaceholder } from "./instantResolve/lookup"
import { createResolveBuilder } from "./instantResolve/resolved"
import { createList } from "./list"

class BuildContext implements IBuildContext {
    public createAutoCreateDictionary<Type>(p: {
        reporter: IConflictingEntryReporter
        callback: (cp: { builder: IDictionaryBuilder<Type> }) => void
        missingEntryCreator: MissingEntryCreator<Type>
        getParentKeys: () => string[]
    }): IAutoCreateDictionary<Type> {
        return createAutoCreateDictionary(p.reporter, p.callback, p.missingEntryCreator, p.getParentKeys)
    }
    public createDelayedResolvableBuilder<Type>(): IRootDelayedResolvableBuilder<Type> {
        return createDelayedResolvableBuilder()
    }
    public createDelayedResolveFulfillingDictionary<Type, ReferencedType>(p: {
        mrer: IFulfillingDictionaryReporter
        cer: IConflictingEntryReporter
        delayedResolveLookup: IDelayedResolveLookup<ReferencedType>
        callback: (cp: {
            readonly builder: IDictionaryBuilder<Type>
            readonly lookup: IDelayedResolveLookup<ReferencedType>
        }) => void
        requiresExhaustive: boolean
    }): Dictionary<Type> {
        return createDelayedResolveFulfillingDictionary(p.mrer, p.cer, p.delayedResolveLookup, p.callback, p.requiresExhaustive)
    }
    public createFulfillingDictionary<Type, ReferencedType>(p: {
        mrer: IFulfillingDictionaryReporter
        cer: IConflictingEntryReporter
        lookup: ILookup<ReferencedType>
        callback: (p: {
            readonly builder: IDictionaryBuilder<Type>
            readonly lookup: ILookup<ReferencedType>
        }) => void
        requiresExhaustive: boolean
    }): Dictionary<Type> {
        return createFulfillingDictionary(p.mrer, p.cer, p.lookup, p.callback, p.requiresExhaustive)
    }
    public createDictionary<Type>(p: {
        readonly reporter: IConflictingEntryReporter
        readonly callback: (p: { builder: IDictionaryBuilder<Type> }) => void
    }): Dictionary<Type> {
        return createDictionary(p.reporter, p.callback)
    }
    public createOrderedDictionary<Type, Orderings>(p: {
        reporter: IConflictingEntryReporter
        callback: (cp: { builder: IDictionaryBuilder<Type> }) => void
        createOrderings: (cp: { orderingCreator: IOrderingCreator<Type> }) => Orderings
    }) {
        return createOrderedDictionary(p.reporter, p.callback, p.createOrderings)
    }
    public createExistingContext<Type>(_p: {}): IPossibleContext<Type> {
        return createExistingContext({})
    }
    public createFailedLookup<Type>(): ILookup<Type> {
        return createFailedLookup()
    }
    public createList<Type>(p: { callback: (cp: { builder: IListBuilder<Type> }) => void }): List<Type> {
        return createList(p.callback)
    }
    public createLookup<Type>(p: { dict: Dictionary<Type> }): ILookup<Type> {
        return createLookup(p.dict)
    }
    public createNonExistentAutoCreateContext<Type>(): IAutoCreateContext<Type> {
        return createNonExistentAutoCreateContext()
    }
    public createNonExistentContext<Type>(): IPossibleContext<Type> {
        return createNonExistingContext<Type>()
    }
    public createNonExistentLookup<Type>(): ILookup<Type> {
        return createNonExistentLookupPlaceholder()
    }
    public createResolveBuilder<Type>(p: { value: Type }): IDependentResolvedConstraintBuilder<Type> {
        return createResolveBuilder(p.value)
    }
}

export function createBuildContext(): IBuildContext {
    return new BuildContext()
}
