import { ConstrainedConstraint, ConstrainedReference, Constraint, Dictionary, Reference } from "lingua-franca"
import { ConstraintCastResult } from "./ConstraintCastResult"

export interface IDelayedResolveLookup<Type> {
    validateFulfillingEntries(keys: string[], typeInfo: string, requiresExhaustive: boolean): void
    createReference(
        key: string,
        typeInfo: string
    ): IDelayedResolveReference<Type>
    createConstrainedReference<Constraints>(
        key: string,
        typeInfo: string,
        getConstraints: (builder: IDelayedResolvableBuilder<Type>) => Constraints
    ): IDelayedResolveConstrainedReference<Type, Constraints>
}

export interface IDelayedResolvableBuilder<Type> {
    getValue(): undefined | [false] | [true, Type]
    castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IDelayedResolveStateConstraint<NewType>
    castToConstrainedConstraint<NewType, Constraints>(
        callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string, getConstraints: (builder: IDelayedResolvableBuilder<NewType>) => Constraints
    ): IDelayedResolveConstrainedStateConstraint<NewType, Constraints>
    getLookup<NewType>(callback: (type: Type) => Dictionary<NewType>): IDelayedResolveLookup<NewType>
    convert<NewType>(callback: (type: Type) => NewType): IDelayedResolveConstraint<NewType>
}

export interface IDelayedResolveConstraint<Type> extends Constraint<Type> {
    readonly builder: IDelayedResolvableBuilder<Type>
}

export interface IDelayedResolveReference<ReferencedType> extends IDelayedResolveConstraint<ReferencedType>, Reference<ReferencedType> { }
export interface IDelayedResolveConstrainedReference<ReferencedType, Constraints> extends IDelayedResolveReference<ReferencedType>, ConstrainedReference<ReferencedType, Constraints> { }

export interface IDelayedResolveStateConstraint<Type> extends IDelayedResolveConstraint<Type>, Constraint<Type> { }
export interface IDelayedResolveConstrainedStateConstraint<Type, Constraints> extends IDelayedResolveStateConstraint<Type>, ConstrainedConstraint<Type, Constraints> { }

export interface IRootDelayedResolvableBuilder<Type> {
    builder: IDelayedResolvableBuilder<Type>
    resolve(value: Type): void
}

export interface IPossibleContext<Type> {
    validateExistence(): IDelayedResolveConstraint<Type>
}
