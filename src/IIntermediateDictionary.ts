import { Dictionary, FulfillingData, FulfillingDictionary, OrderedDictionary, TypePair } from "lingua-franca"
import { IIntraLookup, ILookup } from "./ILookup"

export interface IIntermediateDictionary<Type> extends Dictionary<Type>, ILookup<Type>, IIntraLookup<Type> {
    getKeys(): string[]
    has(key: string): boolean
}

export interface IIntermediateOrderedDictionary<Type> extends OrderedDictionary<Type>, IIntermediateDictionary<Type> {
}

export interface IIntermediateFulfillingDictionary<Type, ReferencedType, Constraints>
    extends FulfillingDictionary<Type, ReferencedType, Constraints>, IIntermediateDictionary<FulfillingData<Type, ReferencedType, Constraints>> {
    readonly fulfilling: true
    //getMatchedEntry(name: string, targetEntry: ReferencedType): void
}

export interface IIntermediateDecoratingDictionary<Type, ReferencedType>
    extends IIntermediateDictionary<TypePair<Type, ReferencedType>>,
    ILookup<TypePair<Type, ReferencedType>> {
    readonly decorating: true
}
