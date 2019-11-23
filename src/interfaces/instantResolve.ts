
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


export interface IResolved<Type> extends Constraint<Type> {
    castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IResolvedStateConstraint<NewType>
    navigateConstraint<NewType>(callback: (type: Type) => Constraint<NewType>, typeInfo: string): IResolved<NewType>
    convert<NewType>(callback: (type: Type) => NewType): IResolved<NewType>
    getLookup<NewType>(callback: (value: Type) => Dictionary<NewType>): ILookup<NewType>
    mapResolved<NewType>(callback: (type: Type) => NewType, onNotResolved: () => NewType): NewType
    repeatNavigate(callback: (type: Type) => Repeat<Type>, typeInfo: string): IResolved<Type>
}

export interface IResolvedStateConstraint<ReferencedType> extends Constraint<ReferencedType> {
    imp: IResolved<ReferencedType>
}

export interface IResolvedReference<ReferencedType> extends Reference<ReferencedType> {
    imp: IResolved<ReferencedType>
}

export type MissingEntryCreator<Type> = (key: string) => null | Type

