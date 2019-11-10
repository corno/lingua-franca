export * from "./buildDictionary"
export * from "./buildList"
export * from "./Reference"
export * from "./ResolvePromise"
export * from "./ResolveReporter"
export * from "./assertUnreachable"



import { Dictionary, ResolvePromise, TypePair } from "../Types"

export interface IListBuilder<Type> {
    push(element: Type): void
}

export interface IDictionaryBuilder<Type> extends IForwardLookup<Type> {
    add(key: string, entry: Type): void
}

export interface ILookup<Type> {
    getEntry(name: string): null | Type
    getKeys(): string[]
}

export interface IForwardLookup<Type> {
    getEntryPromise(name: string): ResolvePromise<Type>
    filter<NewType>(callback: (entry: Type) => [false] | [ true, NewType]): IForwardLookup<NewType>
}

export type UnsureLookup<Type> = null | ILookup<Type>

export type UnsureForwardLookup<Type> = null | IForwardLookup<Type>

export interface IIntermediateDictionary<Type> extends Dictionary<Type>, ILookup<Type> {
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
