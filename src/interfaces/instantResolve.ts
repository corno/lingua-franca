
import { ConstrainedConstraint, ConstrainedReference, Constraint, Dictionary, Reference } from "lingua-franca"
import { ConstraintCastResult } from "./ConstraintCastResult"

export interface ILookup<Type> {
    createReference(key: string, typeInfo: string): IResolvedReference<Type>
    createConstrainedReference<Constraints>(
        key: string, typeInfo: string, getConstraints: (reference: IDependentResolvedConstraintBuilder<Type>) => Constraints
    ): IResolvedConstrainedReference<Type, Constraints>
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


export interface IDependentResolvedConstraintBuilder<Type> {
    readonly value: Type | null
    castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IResolvedConstraint<NewType>
    castToConstrainedConstraint<NewType, Constraints>(
        callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string, getConstraints: (current: IDependentResolvedConstraintBuilder<NewType>) => Constraints
    ): IResolvedConstrainedConstraint<NewType, Constraints>
    navigateConstraint<NewType>(callback: (type: Type) => Constraint<NewType>, typeInfo: string): IDependentResolvedConstraintBuilder<NewType>
    //convert<NewType>(callback: (type: Type) => NewType): IResolvedConstraint<NewType>
    getLookup<NewType>(callback: (value: Type) => Dictionary<NewType>): ILookup<NewType>
    //mapResolved<NewType>(callback: (type: Type) => NewType, onNotResolved: () => NewType): NewType
    repeatNavigate(callback: (type: Type) => Repeat<Type>, typeInfo: string): IDependentResolvedConstraintBuilder<Type>

    mapResolved<NewType>(callback: (type: Type) => NewType, onNotResolved: () => NewType): NewType
    getConstraint<NewType>(callback: (type: Type) => Constraint<NewType>): IResolvedConstraint<NewType>
    getNonConstraint<NewType>(callback: (type: Type) => NewType): IResolvedConstraint<NewType>
}

export interface IResolvedConstraint<ReferencedType> extends Constraint<ReferencedType> {
    builder: IDependentResolvedConstraintBuilder<ReferencedType>
}
export interface IResolvedConstrainedConstraint<ReferencedType, Constraints> extends IResolvedConstraint<ReferencedType>, ConstrainedConstraint<ReferencedType, Constraints> { }

export interface IResolvedReference<ReferencedType> extends Reference<ReferencedType> {
    builder: IDependentResolvedConstraintBuilder<ReferencedType>
}
export interface IResolvedConstrainedReference<Type, Constraints> extends IResolvedReference<Type>, ConstrainedReference<Type, Constraints> { }

export type MissingEntryCreator<Type> = (key: string) => null | Type

