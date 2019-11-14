import { IResolvePromise} from "./IResolvePromise"
import { IUnsure } from "./IUnsure"

export interface ILookup<Type> {
    getEntry(name: string): null | Type
    getKeys(): string[]
}

export interface IForwardLookup<Type> {
    getEntryPromise(name: string): IResolvePromise<Type>
}

export interface IUnsureLookup<Type> extends IUnsure<ILookup<Type>> {}

export type IStackedLookup<Type> = null | ILookup<Type>

export function initializeStackedLookup() {
    return null
}
