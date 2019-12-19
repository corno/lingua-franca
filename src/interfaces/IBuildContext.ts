import {
    Dictionary,
    DictionaryOrdering,
    List,
    OrderedDictionary,
} from "lingua-franca"
import { ICircularDependencyReporter, IConflictingEntryReporter, IFulfillingDictionaryReporter } from "../reporters"
import { IDelayedResolveLookup, IPossibleContext, IRootDelayedResolvableBuilder } from "./delayedResolve"
import { IAutoCreateDictionary, IDictionaryBuilder } from "./dictionary"
import { IListBuilder } from "./IListBuilder"
import { IAutoCreateContext, IDependentResolvedConstraintBuilder, ILookup, MissingEntryCreator } from "./instantResolve"


export interface IOrderingCreator<Type> {
    createBasedOnDependency(p: {
        reporter: ICircularDependencyReporter,
        getDependencies: (entry: Type) => string[]
    }): DictionaryOrdering<Type>
    createBasedOnInsertionOrder(p: {}): DictionaryOrdering<Type>
}

export interface IBuildContext {
    createAutoCreateDictionary<Type>(p: {
        reporter: IConflictingEntryReporter,
        callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
        missingEntryCreator: MissingEntryCreator<Type>, getParentKeys: () => string[]
    }): IAutoCreateDictionary<Type>

    createDelayedResolvableBuilder<Type>(p: {}): IRootDelayedResolvableBuilder<Type>
    createDelayedResolveFulfillingDictionary<Type, ReferencedType>(p: {
        mrer: IFulfillingDictionaryReporter,
        cer: IConflictingEntryReporter,
        delayedResolveLookup: IDelayedResolveLookup<ReferencedType>,
        callback: (dictBuilder: IDictionaryBuilder<Type>, delayedResolveLookup: IDelayedResolveLookup<ReferencedType>) => void,
        requiresExhaustive: boolean
    }): Dictionary<Type>
    createFulfillingDictionary<Type, ReferencedType>(p: {
        mrer: IFulfillingDictionaryReporter,
        cer: IConflictingEntryReporter,
        lookup: ILookup<ReferencedType>,
        callback: (dictBuilder: IDictionaryBuilder<Type>, lookup: ILookup<ReferencedType>) => void,
        requiresExhaustive: boolean
    }): Dictionary<Type>
    createDictionary<Type>(p: {
        reporter: IConflictingEntryReporter,
        callback: (dictBuilder: IDictionaryBuilder<Type>) => void
    }): Dictionary<Type>
    createOrderedDictionary<Type, Orderings>(p: {
        reporter: IConflictingEntryReporter,
        callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
        createOrderings: (orderingCreator: IOrderingCreator<Type>) => Orderings
    }): OrderedDictionary<Type, Orderings>
    createExistingContext<Type>(p: {}): IPossibleContext<Type>
    createFailedLookup<Type>(p: {}): ILookup<Type>
    createList<Type>(p: { callback: (arrayBuilder: IListBuilder<Type>) => void }): List<Type>
    createLookup<Type>(p: { dict: Dictionary<Type>}): ILookup<Type>
    createNonExistentAutoCreateContext<Type>(p: {}): IAutoCreateContext<Type>
    createNonExistentContext<Type>(p: {}): IPossibleContext<Type>
    createNonExistentLookup<Type>(p: {}): ILookup<Type>
    createResolveBuilder<Type>(p: { value: Type }): IDependentResolvedConstraintBuilder<Type>
}
