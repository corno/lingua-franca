
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


export type Repeat<Type> =
| [false]
| [true, Constraint<Type>]


export interface IResolvedConstraint<Type> extends Constraint<Type> {
    castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IResolvedStateConstraint<NewType>
    navigateConstraint<NewType>(callback: (type: Type) => Constraint<NewType>, typeInfo: string): IResolvedConstraint<NewType>
    convert<NewType>(callback: (type: Type) => NewType): IResolvedConstraint<NewType>
    getLookup<NewType>(callback: (value: Type) => Dictionary<NewType>): ILookup<NewType>
    mapResolved<NewType>(callback: (type: Type) => NewType, onNotResolved: () => NewType): NewType
    repeatNavigate(callback: (type: Type) => Repeat<Type>, typeInfo: string): IResolvedConstraint<Type>
}

export interface IResolvedStateConstraint<ReferencedType> extends Constraint<ReferencedType> {
    imp: IResolvedConstraint<ReferencedType>
}

export interface IResolvedReference<ReferencedType> extends Reference<ReferencedType> {
    imp: IResolvedConstraint<ReferencedType>
}

export type MissingEntryCreator<Type> = (key: string) => null | Type

