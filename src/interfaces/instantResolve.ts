
import { IConstraintViolationReporter, IFulfillingDictionaryReporter, IReferenceResolveReporter } from "../reporters"
import { ConstraintCastResult } from "./ConstraintCastResult"
import { Dictionary } from "./Dictionary"
import { ConstrainedConstraint, ConstrainedReference, Constraint, Reference } from "./Reference"

export interface ILookup<Type> {
    createReference(p: {
        readonly key: string
        readonly reporter: IReferenceResolveReporter
    }): IResolvedReference<Type>
    createConstrainedReference<Constraints>(p: {
        readonly key: string
        readonly reporter: IReferenceResolveReporter
        readonly getConstraints: (cp: { readonly reference: IDependentResolvedConstraintBuilder<Type> }) => Constraints
    }): IResolvedConstrainedReference<Type, Constraints>
    validateFulfillingEntries(p: {
        readonly keys: string[]
        readonly reporter: IFulfillingDictionaryReporter
        readonly requiresExhaustive: boolean
    }): void
    has(p: {
        readonly key: string
    }): boolean
}

export interface IAutoCreateContext<Type> {
    tryToCreateReference(p: {
        readonly key: string
    }): null | IResolvedReference<Type>
    toLookup(p: {}): ILookup<Type>
    getKeys(p: {}): string[]
    has(p: {
        readonly key: string
    }): boolean
}


export type Repeat<Type> =
    | [false]
    | [true, Constraint<Type>]


export interface IDependentResolvedConstraintBuilder<Type> {
    readonly value: Type | null
    castToConstraint<NewType>(p: {
        readonly callback: (cp: { readonly type: Type }) => ConstraintCastResult<NewType>
        readonly reporter: IConstraintViolationReporter
    }): IResolvedConstraint<NewType>
    castToConstrainedConstraint<NewType, Constraints>(p: {
        readonly callback: (cp: { type: Type }) => ConstraintCastResult<NewType>
        readonly reporter: IConstraintViolationReporter
        readonly getConstraints: (cp: {
            readonly current: IDependentResolvedConstraintBuilder<NewType>
        }) => Constraints
    }): IResolvedConstrainedConstraint<NewType, Constraints>
    navigateConstraint<NewType>(p: {
        readonly callback: (cp: { readonly type: Type }) => Constraint<NewType>
        readonly reporter: IConstraintViolationReporter
    }): IDependentResolvedConstraintBuilder<NewType>
    //convert<NewType>(callback: (type: Type) => NewType): IResolvedConstraint<NewType>
    getLookup<NewType>(p: {
        readonly callback: (cp: { readonly value: Type }) => Dictionary<NewType>
    }): ILookup<NewType>
    //mapResolved<NewType>(callback: (type: Type) => NewType, onNotResolved: () => NewType): NewType
    repeatNavigate(p: {
        readonly callback: (cp: { readonly type: Type }) => Repeat<Type>
        readonly reporter: IConstraintViolationReporter
    }): IDependentResolvedConstraintBuilder<Type>

    mapResolved<NewType>(p: {
        readonly callback: (cp: { readonly type: Type }) => NewType
        readonly onNotResolved: (cp: {}) => NewType
    }): NewType
    getConstraint<NewType>(p: {
        readonly callback: (cp: { readonly type: Type }) => Constraint<NewType>
    }): IResolvedConstraint<NewType>
    getNonConstraint<NewType>(p: {
        readonly callback: (cp: { readonly type: Type }) => NewType
    }): IResolvedConstraint<NewType>
}

export interface IResolvedConstraint<ReferencedType> extends Constraint<ReferencedType> {
    readonly builder: IDependentResolvedConstraintBuilder<ReferencedType>
}
export interface IResolvedConstrainedConstraint<ReferencedType, Constraints> extends IResolvedConstraint<ReferencedType>, ConstrainedConstraint<ReferencedType, Constraints> { }

export interface IResolvedReference<ReferencedType> extends Reference<ReferencedType> {
    readonly builder: IDependentResolvedConstraintBuilder<ReferencedType>
}
export interface IResolvedConstrainedReference<Type, Constraints> extends IResolvedReference<Type>, ConstrainedReference<Type, Constraints> { }

export type MissingEntryCreator<Type> = (cp: { readonly key: string }) => null | Type

