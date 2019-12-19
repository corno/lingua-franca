import { ConstrainedConstraint, ConstrainedReference, Constraint, Dictionary, Reference } from "lingua-franca"
import { IConstraintViolationReporter, IFulfillingDictionaryReporter, IReferenceResolveReporter } from "../reporters"
import { ConstraintCastResult } from "./ConstraintCastResult"

export interface IDelayedResolveLookup<Type> {
    validateFulfillingEntries(keys: string[], mrer: IFulfillingDictionaryReporter, requiresExhaustive: boolean): void
    createReference(
        key: string,
        reporter: IReferenceResolveReporter
    ): IDelayedResolveReference<Type>
    createConstrainedReference<Constraints>(
        key: string,
        reporter: IReferenceResolveReporter,
        getConstraints: (builder: IDelayedResolvableBuilder<Type>) => Constraints
    ): IDelayedResolveConstrainedReference<Type, Constraints>
}

export interface IDelayedResolvableBuilder<Type> {
    getValue(p: {}): undefined | [false] | [true, Type]
    castToConstraint<NewType>(p: { callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter }): IDelayedResolveStateConstraint<NewType>
    castToConstrainedConstraint<NewType, Constraints>(p: {
        callback: (type: Type) => ConstraintCastResult<NewType>,
        reporter: IConstraintViolationReporter,
        getConstraints: (builder: IDelayedResolvableBuilder<NewType>) => Constraints
    }): IDelayedResolveConstrainedStateConstraint<NewType, Constraints>
    getLookup<NewType>(p: { callback: (type: Type) => Dictionary<NewType> }): IDelayedResolveLookup<NewType>
    convert<NewType>(p: { callback: (type: Type) => NewType }): IDelayedResolveConstraint<NewType>
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
    resolve(p: { value: Type }): void
}

export interface IPossibleContext<Type> {
    validateExistence(p: {}): IDelayedResolveConstraint<Type>
}
