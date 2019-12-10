import {
    Dictionary,
    List,
} from "lingua-franca"
import { IDelayedResolveLookup, IPossibleContext, IRootDelayedResolvableBuilder } from "../interfaces/delayedResolve"
import { IAutoCreateDictionary, IDictionaryBuilder } from "../interfaces/dictionary"
import { IBuildContext, IOrderingCreator } from "../interfaces/IBuildContext"
import { IListBuilder } from "../interfaces/IListBuilder"
import { IAutoCreateContext, IDependentResolvedConstraintBuilder, ILookup, MissingEntryCreator } from "../interfaces/instantResolve"
import { IResolveReporter } from "../IResolveReporter"
import { createDelayedResolvableBuilder } from "./delayedResolve/delayedResolve"
import { createExistingContext, createNonExistingContext } from "./delayedResolve/possibleContext"
import { createAutoCreateDictionary, createDelayedResolveFulfillingDictionary, createDictionary, createFulfillingDictionary, createOrderedDictionary } from "./dictionary/createDictionary"
import { createNonExistentAutoCreateContext } from "./instantResolve/autoCreateContext"
import { createFailedLookup, createLookup, createNonExistentLookupPlaceholder } from "./instantResolve/lookup"
import { createResolveBuilder } from "./instantResolve/resolved"
import { createList } from "./list"

class BuildContext implements IBuildContext {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public createAutoCreateDictionary<Type>(
        typeInfo: string, callback: (dictBuilder: IDictionaryBuilder<Type>) => void, missingEntryCreator: MissingEntryCreator<Type>, getParentKeys: () => string[]
    ): IAutoCreateDictionary<Type> {
        return createAutoCreateDictionary(typeInfo, this.resolveReporter, callback, missingEntryCreator, getParentKeys)
    }
    public createDelayedResolvableBuilder<Type>(): IRootDelayedResolvableBuilder<Type> {
        return createDelayedResolvableBuilder(this.resolveReporter)
    }
    public createDelayedResolveFulfillingDictionary<Type, ReferencedType>(
        typeInfo: string,
        delayedResolveLookup: IDelayedResolveLookup<ReferencedType>,
        callback: (dictBuilder: IDictionaryBuilder<Type>, delayedResolveLookup: IDelayedResolveLookup<ReferencedType>) => void,
        requiresExhaustive: boolean
    ): Dictionary<Type> {
        return createDelayedResolveFulfillingDictionary(typeInfo, this.resolveReporter, delayedResolveLookup, callback, requiresExhaustive)
    }
    public createFulfillingDictionary<Type, ReferencedType>(
        typeInfo: string, lookup: ILookup<ReferencedType>,
        callback: (dictBuilder: IDictionaryBuilder<Type>, lookup: ILookup<ReferencedType>) => void,
        requiresExhaustive: boolean
    ): Dictionary<Type> {
        return createFulfillingDictionary(typeInfo, this.resolveReporter, lookup, callback, requiresExhaustive)
    }
    public createDictionary<Type>(
        typeInfo: string, callback: (dictBuilder: IDictionaryBuilder<Type>) => void
    ): Dictionary<Type> {
        return createDictionary(typeInfo, this.resolveReporter, callback)
    }
    public createOrderedDictionary<Type, Orderings>(
        typeInfo: string,
        callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
        getOrderings: (orderingCreator: IOrderingCreator<Type>) => Orderings
    ) {
        return createOrderedDictionary(typeInfo, this.resolveReporter, callback, getOrderings)
    }
    public createExistingContext<Type>(): IPossibleContext<Type> {
        return createExistingContext(this.resolveReporter)
    }
    public createFailedLookup<Type>(): ILookup<Type> {
        return createFailedLookup(this.resolveReporter)
    }
    public createList<Type>(callback: (arrayBuilder: IListBuilder<Type>) => void): List<Type> {
        return createList(callback)
    }
    public createLookup<Type>(dict: Dictionary<Type>): ILookup<Type> {
        return createLookup(dict, this.resolveReporter)
    }
    public createNonExistentAutoCreateContext<Type>(): IAutoCreateContext<Type> {
        return createNonExistentAutoCreateContext(this.resolveReporter)
    }
    public createNonExistentContext<Type>(): IPossibleContext<Type> {
        return createNonExistingContext<Type>(this.resolveReporter)
    }
    public createNonExistentLookup<Type>(): ILookup<Type> {
        return createNonExistentLookupPlaceholder(this.resolveReporter)
    }
    public createResolveBuilder<Type>(value: Type): IDependentResolvedConstraintBuilder<Type> {
        return createResolveBuilder(value, this.resolveReporter)
    }
}

export function createBuildContext(resolveReporter: IResolveReporter) {
    return new BuildContext(resolveReporter)
}
