import { Dictionary } from "lingua-franca"
import { IDelayedResolveLookup } from "./delayedResolve"
import { IAutoCreateContext, ILookup } from "./instantResolve"

//result class(es)

export interface IAutoCreateDictionary<Type> extends Dictionary<Type> {
    createAutoCreateContext(): IAutoCreateContext<Type>
}

//Builder classes

export interface ICurrentDictionary<Type> {
    toLookup(): ILookup<Type>
    //toRequiringLookup(): IRequiringLookup<Type>
    toDelayedResolveLookup(): IDelayedResolveLookup<Type>
}

export interface IDictionaryBuilder<Type> extends ICurrentDictionary<Type> {
    add(key: string, entry: Type): void
}

export interface IFinalizableDictionaryBuilder<Type> extends IDictionaryBuilder<Type> {
    finalize(): void
    getKeys(): string[]
}
