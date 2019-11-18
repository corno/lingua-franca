import { IResolvePromise} from "./IResolvePromise"

export interface ILookup<Type> {
    getEntry(key: string): null | Type
    getKeys(): string[]
}

export type EntryPromiseType<Type> =
    ["already registered", Type] | [ "not yet registered", IResolvePromise<Type> ]

export interface IIntraLookup<Type> {
    getEntryOrEntryPromise(key: string): EntryPromiseType<Type>
}

export type IStackedLookup<Type> = null | ILookup<Type>

export function initializeStackedLookup() {
    return null
}
