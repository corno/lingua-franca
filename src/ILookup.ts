import { IResolvePromise} from "./IResolvePromise"
import { IUnsure } from "./IUnsure"

export interface ILookup<Type> {
    getEntry(name: string): null | Type
    getKeys(): string[]
}

export type EntryPromiseType<Type> =
    ["already registered", Type] | [ "not yet registered", IResolvePromise<Type> ]

export interface IIntraLookup<Type> {
    getEntryOrEntryPromise(name: string): EntryPromiseType<Type>
}

export interface IUnsureLookup<Type> extends IUnsure<ILookup<Type>> {}

export type IStackedLookup<Type> = null | ILookup<Type>

export function initializeStackedLookup() {
    return null
}
