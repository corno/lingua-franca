
import { Constraint, Dictionary, Reference } from "lingua-franca"
import { ConstraintCastResult  } from "./ConstraintCastResult"

export interface ILookup<Type> {
    createReference(key: string, typeInfo: string): IResolvedReference<Type>
    validateFulfillingEntries(keys: string[], typeInfo: string, requiresExhaustive: boolean): void
}

export interface IAutoCreateContext<Type> {
    tryToCreateReference(key: string): null | IResolvedReference<Type>
    toLookup(): ILookup<Type>
    getKeys(): string[]
}

export interface IResolved<Type> {
    castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IResolvedStateConstraint<NewType>
    convert<NewType>(callback: (type: Type) => NewType): IResolved<NewType>
    getLookup<NewType>(callback: (value: Type) => Dictionary<NewType>): ILookup<NewType>
    mapResolved<NewType>(callback: (type: Type) => NewType, onNotResolved: () => NewType): NewType
}

export interface IResolvedStateConstraint<ReferencedType> extends Constraint<ReferencedType> {
    imp: IResolved<ReferencedType>
}

export interface IResolvedReference<ReferencedType> extends Reference<ReferencedType> {
    imp: IResolved<ReferencedType>
}

export type MissingEntryCreator<Type> = (key: string) => null | Type

