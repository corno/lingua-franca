import { IConstraintViolationReporter, IFulfillingDictionaryReporter, IReferenceResolveReporter } from "../reporters"
import { ConstraintCastResult } from "./ConstraintCastResult"
import { Dictionary } from "./dictionary"
import { ConstrainedConstraint, ConstrainedReference, Constraint, Reference } from "./Reference"

export interface IDelayedResolveLookup<Type> {
    validateFulfillingEntries(keys: string[], mrer: IFulfillingDictionaryReporter, requiresExhaustive: boolean): void
    createReference(
        key: string,
        reporter: IReferenceResolveReporter
    ): IDelayedResolveReference<Type>
    createConstrainedReference<Constraints>(p: {
        readonly key: string
        readonly reporter: IReferenceResolveReporter
        readonly getConstraints: (cp: {
            readonly builder: IDelayedResolvableBuilder<Type>
        }) => Constraints
    }): IDelayedResolveConstrainedReference<Type, Constraints>
}

export interface IDelayedResolvableBuilder<Type> {
    getValue(p: {}): undefined | [false] | [true, Type]
    castToConstraint<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => ConstraintCastResult<NewType>
        readonly reporter: IConstraintViolationReporter
    }): IDelayedResolveStateConstraint<NewType>
    castToConstrainedConstraint<NewType, Constraints>(p: {
        readonly callback: (cp: {
readonly type: Type }) => ConstraintCastResult<NewType>
        readonly reporter: IConstraintViolationReporter
        readonly getConstraints: (cp: {
            readonly builder: IDelayedResolvableBuilder<NewType>
        }) => Constraints
    }): IDelayedResolveConstrainedStateConstraint<NewType, Constraints>
    getLookup<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => Dictionary<NewType>
    }): IDelayedResolveLookup<NewType>
    convert<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => NewType
    }): IDelayedResolveConstraint<NewType>
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
