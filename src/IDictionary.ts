import { Dictionary, TypePair } from "lingua-franca"
import { IForwardLookup, ILookup } from "./ILookup"

export interface IDictionaryBuilder<Type> extends ILookup<Type>, IForwardLookup<Type> {
    add(key: string, entry: Type): void
}

export interface IIntermediateDictionary<Type> extends Dictionary<Type>, ILookup<Type> , IForwardLookup<Type> {
    getKeys(): string[]
    has(key: string): boolean
}

export interface IIntermediateFulfillingDictionary<Type, ReferencedType> extends IIntermediateDictionary<Type>, ILookup<Type> {
    readonly fulfilling: true
    getMatchedEntry(name: string, targetEntry: ReferencedType): void
}

export interface IIntermediateDecoratingDictionary<Type, ReferencedType>
    extends IIntermediateDictionary<TypePair<Type, ReferencedType>>,
        ILookup<TypePair<Type, ReferencedType>> {
    readonly decorating: true
}
