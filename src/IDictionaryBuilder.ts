import { IIntraLookup, ILookup } from "./ILookup"

export interface IDictionaryBuilder<Type> extends ILookup<Type>, IIntraLookup<Type> {
    add(key: string, entry: Type): void
}
