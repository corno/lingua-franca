import { IDelayedResolveLookup } from "./delayedResolve"
import { IGuaranteedLookup } from "./instantResolve"

export interface IDictionaryBuilder<Type> {
    add(key: string, entry: Type): void
    toLookup(): IGuaranteedLookup<Type>
    //toRequiringLookup(): IRequiringLookup<Type>
    toDelayedResolveLookup(): IDelayedResolveLookup<Type>
}

export interface IDictionaryBuilderBase<Type> extends IDictionaryBuilder<Type> {
    finalize(): void
    getKeys(): string[]
}
