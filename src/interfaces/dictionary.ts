import { Dictionary } from "lingua-franca"
import { IDelayedResolveLookup } from "./delayedResolve"
import { ILookup } from "./instantResolve"

export interface IDictionary<Type> extends Dictionary<Type>, ILookup<Type>, IDelayedResolveLookup<Type> {
    getKeys(): string[]
    temp_getKeysInInsertionOrder(): string[]
    has(key: string): boolean
}

export interface IDictionaryBuilder<Type> extends ILookup<Type>, IDelayedResolveLookup<Type> {
    add(key: string, entry: Type): void
}
