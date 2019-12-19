import { Dictionary } from "lingua-franca"
//import { IDelayedResolveBaseLookup } from "./delayedResolve"
import { IAutoCreateContext, ILookup } from "./instantResolve"

//result class(es)

export interface IAutoCreateDictionary<Type> extends Dictionary<Type> {
    createAutoCreateContext(p: {}): IAutoCreateContext<Type>
}

//Builder classes

export interface ICurrentDictionary<Type> {
    toPrecedingEntriesLookup(p: {}): ILookup<Type>
    //toRequiringLookup(): IRequiringLookup<Type>
    //toDelayedResolveLookup(): IDelayedResolveBaseLookup<Type>
}

export interface IDictionaryBuilder<Type> extends ICurrentDictionary<Type> {
    add(p: { key: string, entry: Type }): void
}

export interface IFinalizableDictionaryBuilder<Type> extends IDictionaryBuilder<Type> {
    finalize(p: {}): void
    getKeys(p: {}): string[]
}
