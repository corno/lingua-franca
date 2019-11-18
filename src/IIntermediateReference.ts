import { DependentReference, IntraConstraint, IntraReference, Reference, StackedReference } from "lingua-franca"
import { IResolvePromise } from "./IResolvePromise"
import { IUnsureReference } from "./IUnsure"

export interface IIntermediateReference<ReferencedType> extends Reference<ReferencedType>, IUnsureReference<ReferencedType> { }
export interface IIntermediateStackedReference<ReferencedType> extends StackedReference<ReferencedType>, IUnsureReference<ReferencedType> { }
export interface IIntermediateDependentReference<ReferencedType> extends DependentReference<ReferencedType>, IUnsureReference<ReferencedType> { }
export interface IIntermediateIntraResolved<ReferencedType> {
  getResolvedEntryPromise(): IResolvePromise<ReferencedType>
}
export interface IIntermediateIntraReference<ReferencedType> extends IIntermediateIntraResolved<ReferencedType>, IntraReference<ReferencedType> { }
export interface IIntermediateIntraConstraint<Type> extends IIntermediateIntraResolved<Type>, IntraConstraint<Type> { }

