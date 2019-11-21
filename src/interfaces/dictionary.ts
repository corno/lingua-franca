import { Dictionary } from "lingua-franca"
import { IDelayedResolveLookup } from "./delayedResolve"
import { IAutoCreateLookup, ILookup } from "./instantResolve"

export interface IAutoCreateDictionary<Type> extends Dictionary<Type> {
    createAutoCreateLookup(): IAutoCreateLookup<Type>
}

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
