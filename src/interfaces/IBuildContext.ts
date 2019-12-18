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
    createBasedOnDependency(
        reporter: ICircularDependencyReporter, getDependencies: (entry: Type) => string[]
    ): DictionaryOrdering<Type>
    createBasedOnInsertionOrder(): DictionaryOrdering<Type>
}

export interface IBuildContext {
    createAutoCreateDictionary<Type>(
        reporter: IConflictingEntryReporter,
        callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
        missingEntryCreator: MissingEntryCreator<Type>, getParentKeys: () => string[]
    ): IAutoCreateDictionary<Type>

    createDelayedResolvableBuilder<Type>(): IRootDelayedResolvableBuilder<Type>
    createDelayedResolveFulfillingDictionary<Type, ReferencedType>(
        mrer: IFulfillingDictionaryReporter,
        cer: IConflictingEntryReporter,
        delayedResolveLookup: IDelayedResolveLookup<ReferencedType>,
        callback: (dictBuilder: IDictionaryBuilder<Type>, delayedResolveLookup: IDelayedResolveLookup<ReferencedType>) => void,
        requiresExhaustive: boolean
    ): Dictionary<Type>
    createFulfillingDictionary<Type, ReferencedType>(
        mrer: IFulfillingDictionaryReporter,
        cer: IConflictingEntryReporter,
        lookup: ILookup<ReferencedType>,
        callback: (dictBuilder: IDictionaryBuilder<Type>, lookup: ILookup<ReferencedType>) => void,
        requiresExhaustive: boolean
    ): Dictionary<Type>
    createDictionary<Type>(
        reporter: IConflictingEntryReporter,
        callback: (dictBuilder: IDictionaryBuilder<Type>) => void
    ): Dictionary<Type>
    createOrderedDictionary<Type, Orderings>(
        reporter: IConflictingEntryReporter,
        callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
        createOrderings: (orderingCreator: IOrderingCreator<Type>) => Orderings
    ): OrderedDictionary<Type, Orderings>
    createExistingContext<Type>(): IPossibleContext<Type>
    createFailedLookup<Type>(): ILookup<Type>
    createList<Type>(callback: (arrayBuilder: IListBuilder<Type>) => void): List<Type>
    createLookup<Type>(dict: Dictionary<Type>): ILookup<Type>
    createNonExistentAutoCreateContext<Type>(): IAutoCreateContext<Type>
    createNonExistentContext<Type>(): IPossibleContext<Type>
    createNonExistentLookup<Type>(): ILookup<Type>
    createResolveBuilder<Type>(value: Type): IDependentResolvedConstraintBuilder<Type>
}
