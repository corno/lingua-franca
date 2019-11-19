
import { Constraint, DependentReference, Dictionary, Reference, StackedReference } from "lingua-franca"
import { IResolveReporter } from "../IResolveReporter"


export interface ILookup<Type> {
    getEntryX(key: string, resolveReporter: IResolveReporter, typeInfo: string): null | Type
}

export interface IRequiringLookup {
    getKeys(): string[]
}

export type IStackedLookup<Type> = null | ILookup<Type>

export function initializeStackedLookup() {
    return null
}

export interface IUnsureLookup<Type> {
    getEntry(key: string, resolveReporter: IResolveReporter, type: string): null | Type
}

export interface IResolved<ReferencedType> {
    cast<NewType>(callback: (type: ReferencedType) => [false] | [true, NewType], resolveReporter: IResolveReporter, typeInfo: string): IResolvedConstraint<NewType>
    getLookup<NewType>(callback: (value: ReferencedType) => Dictionary<NewType>): IUnsureLookup<NewType>
}

interface IResolvedReferenceBase<ReferencedType> extends IResolved<ReferencedType> {
    value: ReferencedType | null
}
export interface IResolvedReference<ReferencedType> extends Reference<ReferencedType>, IResolvedReferenceBase<ReferencedType> { }
export interface IResolvedStackedReference<ReferencedType> extends StackedReference<ReferencedType>, IResolvedReferenceBase<ReferencedType> { }
export interface IResolvedDependentReference<ReferencedType> extends DependentReference<ReferencedType>, IResolvedReferenceBase<ReferencedType> { }
export interface IResolvedConstraint<ReferencedType> extends Constraint<ReferencedType>, IResolved<ReferencedType> { }
