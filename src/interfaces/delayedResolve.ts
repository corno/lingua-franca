import { Constraint, Dictionary, Reference } from "lingua-franca"
import { ConstraintCastResult  } from "./ConstraintCastResult"

export interface IDelayedResolveLookup<Type> {
    validateFulfillingEntries(keys: string[], typeInfo: string, requiresExhaustive: boolean): void
    createReference(
        key: string,
        typeInfo: string
    ): IDelayedResolveReference<Type>
}

export interface IDelayedResolveConstraint<Type> extends Constraint<Type> {
    getLookup<NewType>(callback: (type: Type) => Dictionary<NewType>): IDelayedResolveLookup<NewType>
    castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IDelayedResolveStateConstraint<NewType>
    convert<NewType>(callback: (type: Type) => NewType): IDelayedResolveConstraint<NewType>
}

export interface IDelayedResolveReference<ReferencedType> extends IDelayedResolveConstraint<ReferencedType>, Reference<ReferencedType> { }
export interface IDelayedResolveStateConstraint<Type> extends IDelayedResolveConstraint<Type>, Constraint<Type> { }

export interface IDelayedResolvable<Type> {
    getLookup<NewType>(callback: (type: Type) => Dictionary<NewType>): IDelayedResolveLookup<NewType>
}

export interface IDelayedResolvableBuilder<Type> extends IDelayedResolvable<Type> {
    resolve(value: Type): void
}

export interface IPossibleContext<Type> {
    validateExistence(): IDelayedResolveConstraint<Type>
}
