import { ResolvePromise} from "lingua-franca"
import { IUnsure } from "./IUnsure"

export interface ILookup<Type> {
    getEntry(name: string): null | Type
    getKeys(): string[]
    filter<NewType>(callback: (entry: Type) => [false] | [ true, NewType]): ILookup<NewType>
}

export interface IForwardLookup<Type> {
    getEntryPromise(name: string): ResolvePromise<Type>
    //filter<NewType>(callback: (entry: Type) => [false] | [ true, NewType]): IForwardLookup<NewType>
}

export interface IUnsureLookup<Type> extends IUnsure<ILookup<Type>> {}

export type IStackedLookup<Type> = null | ILookup<Type>

export function initializeStackedLookup() {
    return null
}
