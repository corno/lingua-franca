import { ResolvePromise} from "lingua-franca"

export interface ILookup<Type> {
    getEntry(name: string): null | Type
    getKeys(): string[]
    filter<NewType>(callback: (entry: Type) => [false] | [ true, NewType]): ILookup<NewType>
}

export interface IForwardLookup<Type> {
    getEntryPromise(name: string): ResolvePromise<Type>
    //filter<NewType>(callback: (entry: Type) => [false] | [ true, NewType]): IForwardLookup<NewType>
}

export type UnsureLookup<Type> = null | ILookup<Type>

export type UnsureForwardLookup<Type> = null | IForwardLookup<Type>
