import { DependentReference, IntraReference, Reference, StackedReference } from "lingua-franca"
import { IResolvePromise } from "./IResolvePromise"
import { IUnsure } from "./IUnsure"

export interface IIntermediateReference<ReferencedType> extends Reference<ReferencedType>, IUnsure<ReferencedType> {}
export interface IIntermediateStackedReference<ReferencedType> extends StackedReference<ReferencedType>, IUnsure<ReferencedType> {}
export interface IIntermediateDependentReference<ReferencedType> extends DependentReference<ReferencedType>, IUnsure<ReferencedType> {}
export interface IIntermediateIntraReference<ReferencedType> extends IntraReference<ReferencedType> {
  getResolvedEntryPromise(): IResolvePromise<ReferencedType>
}
