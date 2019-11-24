import {
    Dictionary,
    DictionaryOrdering,
    List,
} from "lingua-franca"
import { IDelayedResolvableBuilder, IDelayedResolveLookup, IPossibleContext } from "./delayedResolve";
import { IAutoCreateDictionary, IDictionaryBuilder } from "./dictionary";
import { IAutoCreateContext, ILookup, IResolvedConstraint, MissingEntryCreator } from "./instantResolve";
import { IListBuilder } from "./IListBuilder";


export interface IBuildContext {

    createAutoCreateDictionary<Type>(
        typeInfo: string, callback: (dictBuilder: IDictionaryBuilder<Type>) => void, missingEntryCreator: MissingEntryCreator<Type>, getParentKeys: () => string[]
    ): IAutoCreateDictionary<Type>
    createOrderedDictionary<Type>(
        typeInfo: string, dictionary: Dictionary<Type>, getDependencies: (entry: Type) => string[]
    ): DictionaryOrdering<Type>
    createDelayedResolvable<Type>(): IDelayedResolvableBuilder<Type>
    createDelayedResolveFulfillingDictionary<Type, ReferencedType>(
        typeInfo: string,
        delayedResolveLookup: IDelayedResolveLookup<ReferencedType>,
        callback: (dictBuilder: IDictionaryBuilder<Type>, delayedResolveLookup: IDelayedResolveLookup<ReferencedType>) => void,
        requiresExhaustive: boolean
    ): Dictionary<Type>
    createFulfillingDictionary<Type, ReferencedType>(
        typeInfo: string, lookup: ILookup<ReferencedType>,
        callback: (dictBuilder: IDictionaryBuilder<Type>, lookup: ILookup<ReferencedType>) => void,
        requiresExhaustive: boolean
    ): Dictionary<Type>
    createDictionary<Type>(
        typeInfo: string, callback: (dictBuilder: IDictionaryBuilder<Type>) => void
    ): Dictionary<Type>
    createExistingContext<Type>(): IPossibleContext<Type>
    createFailedLookup<Type>(): ILookup<Type>
    createList<Type>(callback: (arrayBuilder: IListBuilder<Type>) => void): List<Type>
    createLookup<Type>(dict: Dictionary<Type>): ILookup<Type>
    createNonExistentAutoCreateContext<Type>(): IAutoCreateContext<Type>
    createNonExistentContext<Type>(): IPossibleContext<Type>
    createNonExistentLookup<Type>(): ILookup<Type>
    wrapResolved<Type>(value: Type): IResolvedConstraint<Type>
}
