
import { Constraint, Dictionary, Reference } from "lingua-franca"
import { ConstraintCastResult  } from "./ConstraintCastResult"

export interface IGuaranteedLookup<Type> {
    createReference(key: string, typeInfo: string): IResolvedReference<Type>
}

export interface IDependentLookup<Type> {
    createDependentReference(key: string, typeInfo: string): IResolvedReference<Type>
}

export interface IStackedLookup<Type> {
    createStackedReference(key: string, typeInfo: string): IResolvedReference<Type>
}

export interface IStackParent<Type> {
    getEntry(key: string, typeInfo: string): null | Type
}

export interface IRequiringLookup<Type> {
    getEntry(key: string, typeInfo: string): IResolved<Type>
    validate(keys: string[], typeInfo: string): void
    createDependentReference(key: string, typeInfo: string): IResolvedReference<Type>
}

export interface IResolved<Type> {
    castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IResolvedStateConstraint<NewType>
    convert<NewType>(callback: (type: Type) => NewType): IResolved<NewType>
    getLookup<NewType>(callback: (value: Type) => Dictionary<NewType>): IDependentLookup<NewType>
    getRequiringLookup<NewType>(callback: (value: Type) => Dictionary<NewType>, requiresExhaustive: boolean): IRequiringLookup<NewType>
    mapResolved<NewType>(callback: (type: Type) => NewType, onNotResolved: () => NewType): NewType
}

export interface IResolvedStateConstraint<ReferencedType> extends Constraint<ReferencedType> {
    imp: IResolved<ReferencedType>
}

export interface IResolvedReference<ReferencedType> extends Reference<ReferencedType> {
    imp: IResolved<ReferencedType>
}
