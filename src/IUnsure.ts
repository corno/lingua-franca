import { ILookup } from "./ILookup"
import { IResolveReporter } from "./IResolveReporter";

export interface IUnsureReference<Type> {
    value: Type | null
    getLookup<NewType>(callback: (value: Type) => ILookup<NewType>): IUnsureLookup<NewType>
}

export interface IUnsureLookup<Type> {
    getEntry(key: string, resolveReporter: IResolveReporter, type: string): null | Type
}
