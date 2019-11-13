import { Dictionary, OrderedDictionary, TypePair } from "lingua-franca"
import { IForwardLookup, ILookup } from "./ILookup"

export interface IIntermediateDictionary<Type> extends Dictionary<Type>, ILookup<Type> , IForwardLookup<Type> {
    getKeys(): string[]
    has(key: string): boolean
}

export interface IIntermediateOrderedDictionary<Type> extends OrderedDictionary<Type>, IIntermediateDictionary<Type> {
}

export interface IIntermediateFulfillingDictionary<Type, ReferencedType> extends IIntermediateDictionary<TypePair<Type, ReferencedType>> {
    readonly fulfilling: true
    //getMatchedEntry(name: string, targetEntry: ReferencedType): void
}

export interface IIntermediateDecoratingDictionary<Type, ReferencedType>
    extends IIntermediateDictionary<TypePair<Type, ReferencedType>>,
        ILookup<TypePair<Type, ReferencedType>> {
    readonly decorating: true
}