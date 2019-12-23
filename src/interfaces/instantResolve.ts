
import { IConstraintViolationReporter, IFulfillingDictionaryReporter, IReferenceResolveReporter } from "../reporters"
import { ConstraintCastResult } from "./ConstraintCastResult"
import { Dictionary } from "./Dictionary"
import { ConstrainedConstraint, ConstrainedReference, Constraint, Reference } from "./Reference"

export interface ILookup<Type> {
    createReference(p: { key: string, reporter: IReferenceResolveReporter }): IResolvedReference<Type>
    createConstrainedReference<Constraints>(p: {
        key: string, reporter: IReferenceResolveReporter, getConstraints: (reference: IDependentResolvedConstraintBuilder<Type>) => Constraints
    }): IResolvedConstrainedReference<Type, Constraints>
    validateFulfillingEntries(p: { keys: string[], reporter: IFulfillingDictionaryReporter, requiresExhaustive: boolean }): void
    has(p: { key: string }): boolean
}

export interface IAutoCreateContext<Type> {
    tryToCreateReference(p: { key: string }): null | IResolvedReference<Type>
    toLookup(p: {}): ILookup<Type>
    getKeys(p: {}): string[]
    has(p: { key: string }): boolean
}


export type Repeat<Type> =
    | [false]
    | [true, Constraint<Type>]


export interface IDependentResolvedConstraintBuilder<Type> {
    readonly value: Type | null
    castToConstraint<NewType>(p: { callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter }): IResolvedConstraint<NewType>
    castToConstrainedConstraint<NewType, Constraints>(p: {
        callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter, getConstraints: (current: IDependentResolvedConstraintBuilder<NewType>) => Constraints
    }): IResolvedConstrainedConstraint<NewType, Constraints>
    navigateConstraint<NewType>(p: { callback: (type: Type) => Constraint<NewType>, reporter: IConstraintViolationReporter }): IDependentResolvedConstraintBuilder<NewType>
    //convert<NewType>(callback: (type: Type) => NewType): IResolvedConstraint<NewType>
    getLookup<NewType>(p: { callback: (value: Type) => Dictionary<NewType> }): ILookup<NewType>
    //mapResolved<NewType>(callback: (type: Type) => NewType, onNotResolved: () => NewType): NewType
    repeatNavigate(p: { callback: (type: Type) => Repeat<Type>, reporter: IConstraintViolationReporter }): IDependentResolvedConstraintBuilder<Type>

    mapResolved<NewType>(p: { callback: (type: Type) => NewType, onNotResolved: () => NewType }): NewType
    getConstraint<NewType>(p: { callback: (type: Type) => Constraint<NewType> }): IResolvedConstraint<NewType>
    getNonConstraint<NewType>(p: { callback: (type: Type) => NewType }): IResolvedConstraint<NewType>
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

