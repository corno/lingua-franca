import { Dictionary, FulfilledPair, FulfillingDictionary, OrderedDictionary } from "lingua-franca"
import { IIntraLookup, ILookup } from "./ILookup"

export interface IIntermediateDictionary<Type> extends Dictionary<Type>, ILookup<Type>, IIntraLookup<Type> {
    getKeys(): string[]
    has(key: string): boolean
}

export interface IIntermediateOrderedDictionary<Type> extends OrderedDictionary<Type>, IIntermediateDictionary<Type> {
}

export interface IIntermediateFulfillingDictionary<Type, ReferencedType>
    extends FulfillingDictionary<Type, ReferencedType>, IIntermediateDictionary<FulfilledPair<Type, ReferencedType>> {
    readonly fulfilling: true
    //getMatchedEntry(key: string, targetEntry: ReferencedType): void
}

export interface IIntermediateDecoratingDictionary<Type>
    extends IIntermediateDictionary<Type>,
    ILookup<Type> {
    readonly decorating: true
}
