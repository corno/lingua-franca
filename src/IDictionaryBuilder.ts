import { IForwardLookup, ILookup } from "./ILookup"

export interface IDictionaryBuilder<Type> extends ILookup<Type>, IForwardLookup<Type> {
    add(key: string, entry: Type): void
}
