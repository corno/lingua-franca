import { Constraint, Dictionary, Reference } from "lingua-franca"
import { IResolveReporter } from "../IResolveReporter"
import { IRequiringLookup } from "./instantResolve"

export type EntryPromiseResult<Type> =
    | ["awaiting", IResolvePromise<Type>]
    | ["already final"]
    | ["entry already registered"]

export interface IDelayedResolveLookup<Type> {
    getEntryPromise(key: string): EntryPromiseResult<Type>
}

export interface IDelayedResolvable<ReferencedType> {
    getRequiringLookup<Type>(callback: (type: ReferencedType) => Dictionary<Type>): IResolvePromise<IRequiringLookup>
    cast<NewType>(callback: (type: ReferencedType) => [false] | [true, NewType], resolveReporter: IResolveReporter, typeInfo: string): IDelayedResolveConstraint<NewType>
}
export interface IDelayedResolveReference<ReferencedType> extends IDelayedResolvable<ReferencedType>, Reference<ReferencedType> { }
export interface IDelayedResolveConstraint<Type> extends IDelayedResolvable<Type>, Constraint<Type> { }



export interface IResolvePromise<T> {
    handlePromise(onFailed: (failed: null) => void, onResult: (result: T) => void): void
    //getRequiringDictionary<NewType>(callback: (type: T) => RequiringDictionary<NewType>): IResolvePromise<RequiringDictionary<NewType>>
    //cast<NewType>(callback: (type: T) => [false] | [true, NewType]): IIntermediateDelayedResolveConstraint<NewType>
    map<NewType>(callback: (x: T) => NewType): IResolvePromise<NewType>
}
