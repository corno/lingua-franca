import {
    Dictionary,
    List,
} from "lingua-franca"
import { IDelayedResolveLookup, IPossibleContext, IRootDelayedResolvableBuilder } from "../interfaces/delayedResolve"
import { IAutoCreateDictionary, IDictionaryBuilder } from "../interfaces/dictionary"
import { IBuildContext, IOrderingCreator } from "../interfaces/IBuildContext"
import { IListBuilder } from "../interfaces/IListBuilder"
import { IAutoCreateContext, IDependentResolvedConstraintBuilder, ILookup, MissingEntryCreator } from "../interfaces/instantResolve"
import { IConflictingEntryReporter, IFulfillingDictionaryReporter } from "../reporters"
import { createDelayedResolvableBuilder } from "./delayedResolve/delayedResolve"
import { createExistingContext, createNonExistingContext } from "./delayedResolve/possibleContext"
import { createAutoCreateDictionary, createDelayedResolveFulfillingDictionary, createDictionary, createFulfillingDictionary, createOrderedDictionary } from "./dictionary/createDictionary"
import { createNonExistentAutoCreateContext } from "./instantResolve/autoCreateContext"
import { createFailedLookup, createLookup, createNonExistentLookupPlaceholder } from "./instantResolve/lookup"
import { createResolveBuilder } from "./instantResolve/resolved"
import { createList } from "./list"

class BuildContext implements IBuildContext {
    public createAutoCreateDictionary<Type>(
        reporter: IConflictingEntryReporter,
        callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
        missingEntryCreator: MissingEntryCreator<Type>,
        getParentKeys: () => string[]
    ): IAutoCreateDictionary<Type> {
        return createAutoCreateDictionary(reporter, callback, missingEntryCreator, getParentKeys)
    }
    public createDelayedResolvableBuilder<Type>(): IRootDelayedResolvableBuilder<Type> {
        return createDelayedResolvableBuilder()
    }
    public createDelayedResolveFulfillingDictionary<Type, ReferencedType>(
        mrer: IFulfillingDictionaryReporter,
        cer: IConflictingEntryReporter,
        delayedResolveLookup: IDelayedResolveLookup<ReferencedType>,
        callback: (dictBuilder: IDictionaryBuilder<Type>, delayedResolveLookup: IDelayedResolveLookup<ReferencedType>) => void,
        requiresExhaustive: boolean
    ): Dictionary<Type> {
        return createDelayedResolveFulfillingDictionary(mrer, cer, delayedResolveLookup, callback, requiresExhaustive)
    }
    public createFulfillingDictionary<Type, ReferencedType>(
        mrer: IFulfillingDictionaryReporter,
        cer: IConflictingEntryReporter,
        lookup: ILookup<ReferencedType>,
        callback: (dictBuilder: IDictionaryBuilder<Type>, lookup: ILookup<ReferencedType>) => void,
        requiresExhaustive: boolean
    ): Dictionary<Type> {
        return createFulfillingDictionary(mrer, cer, lookup, callback, requiresExhaustive)
    }
    public createDictionary<Type>(
        reporter: IConflictingEntryReporter,
        callback: (dictBuilder: IDictionaryBuilder<Type>) => void
    ): Dictionary<Type> {
        return createDictionary(reporter, callback)
    }
    public createOrderedDictionary<Type, Orderings>(
        reporter: IConflictingEntryReporter,
        callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
        getOrderings: (orderingCreator: IOrderingCreator<Type>) => Orderings
    ) {
        return createOrderedDictionary(reporter, callback, getOrderings)
    }
    public createExistingContext<Type>(): IPossibleContext<Type> {
        return createExistingContext()
    }
    public createFailedLookup<Type>(): ILookup<Type> {
        return createFailedLookup()
    }
    public createList<Type>(callback: (arrayBuilder: IListBuilder<Type>) => void): List<Type> {
        return createList(callback)
    }
    public createLookup<Type>(dict: Dictionary<Type>): ILookup<Type> {
        return createLookup(dict)
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
    public createResolveBuilder<Type>(value: Type): IDependentResolvedConstraintBuilder<Type> {
        return createResolveBuilder(value)
    }
}

export function createBuildContext() {
    return new BuildContext()
}
