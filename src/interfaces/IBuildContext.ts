import { ICircularDependencyReporter, IConflictingEntryReporter, IFulfillingDictionaryReporter } from "../reporters"
import { IDelayedResolveLookup, IPossibleContext, IRootDelayedResolvableBuilder } from "./delayedResolve"
import { IAutoCreateDictionary, IDictionaryBuilder } from "./dictionaries"
import { Dictionary, DictionaryOrdering, OrderedDictionary } from "./Dictionary"
import { IListBuilder } from "./IListBuilder"
import { IAutoCreateContext, IDependentResolvedConstraintBuilder, ILookup } from "./instantResolve"
import { List } from "./List"


export interface IOrderingCreator<Type> {
    createBasedOnDependency(p: {
        readonly reporter: ICircularDependencyReporter
        readonly getDependencies: (cp: {
            readonly entry: Type
        }) => string[]
    }): DictionaryOrdering<Type>
    createBasedOnInsertionOrder(p: {}): DictionaryOrdering<Type>
}

export interface IBuildContext {
    createAutoCreateDictionary<Type>(p: {
        readonly reporter: IConflictingEntryReporter
        readonly callback: (cp: {
            readonly builder: IDictionaryBuilder<Type>
        }) => void
        readonly missingEntryCreator: (cp: {
            readonly key: string
        }) => null | Type
        readonly getParentKeys: (cp: {}) => string[]
    }): IAutoCreateDictionary<Type>

    createDelayedResolvableBuilder<Type>(p: {}): IRootDelayedResolvableBuilder<Type>
    createDelayedResolveFulfillingDictionary<Type, ReferencedType>(p: {
        readonly mrer: IFulfillingDictionaryReporter
        readonly cer: IConflictingEntryReporter
        readonly delayedResolveLookup: IDelayedResolveLookup<ReferencedType>
        readonly callback: (cp: {
            readonly builder: IDictionaryBuilder<Type>
            readonly lookup: IDelayedResolveLookup<ReferencedType>
        }) => void
        readonly requiresExhaustive: boolean
    }): Dictionary<Type>
    createFulfillingDictionary<Type, ReferencedType>(p: {
        readonly mrer: IFulfillingDictionaryReporter
        readonly cer: IConflictingEntryReporter
        readonly lookup: ILookup<ReferencedType>
        readonly callback: (cp: {
            readonly builder: IDictionaryBuilder<Type>
            readonly lookup: ILookup<ReferencedType>
        }) => void
        readonly requiresExhaustive: boolean
    }): Dictionary<Type>
    createDictionary<Type>(p: {
        readonly reporter: IConflictingEntryReporter
        readonly callback: (cp: {
            readonly builder: IDictionaryBuilder<Type>
        }) => void
    }): Dictionary<Type>
    createOrderedDictionary<Type, Orderings>(p: {
        readonly reporter: IConflictingEntryReporter
        readonly callback: (cp: {
            readonly builder: IDictionaryBuilder<Type>
        }) => void
        readonly createOrderings: (cp: {
            readonly orderingCreator: IOrderingCreator<Type>
        }) => Orderings
    }): OrderedDictionary<Type, Orderings>
    createExistingContext<Type>(p: {}): IPossibleContext<Type>
    createFailedLookup<Type>(p: {}): ILookup<Type>
    createList<Type>(p: {
        readonly callback: (cp: {
            readonly builder: IListBuilder<Type>
        }) => void
    }): List<Type>
    createLookup<Type>(p: {
        readonly dict: Dictionary<Type>
    }): ILookup<Type>
    createNonExistentAutoCreateContext<Type>(p: {}): IAutoCreateContext<Type>
    createNonExistentContext<Type>(p: {}): IPossibleContext<Type>
    createNonExistentLookup<Type>(p: {}): ILookup<Type>
    createResolveBuilder<Type>(p: {
        readonly value: Type
    }): IDependentResolvedConstraintBuilder<Type>
}
