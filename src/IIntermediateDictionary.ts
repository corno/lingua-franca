import { Dictionary, FulfilledPair, FulfillingDictionary, OrderedDictionary } from "lingua-franca"
import { IIntraLookup, ILookup } from "./ILookup"

export interface IIntermediateDictionary<Type> extends Dictionary<Type>, ILookup<Type>, IIntraLookup<Type> {
    getKeys(): string[]
    temp_getKeysInInsertionOrder(): string[]
    has(key: string): boolean
}

export interface IIntermediateOrderedDictionary<Type> extends OrderedDictionary<Type> {
}

export interface IIntermediateFulfillingDictionary<Type, ReferencedType>
    extends FulfillingDictionary<Type, ReferencedType>, IIntermediateDictionary<FulfilledPair<Type, ReferencedType>> {
    readonly fulfilling: true
    //getMatchedEntry(key: string, targetEntry: ReferencedType): void
}
