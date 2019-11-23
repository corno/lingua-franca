import { Constraint, Dictionary, Reference } from "lingua-franca"
import { ConstraintCastResult  } from "./ConstraintCastResult"


export interface IDelayedResolveBaseLookup<Type> {
    createReference(
        key: string,
        typeInfo: string,
        isForwardDeclaration: boolean,
    ): IDelayedResolveReference<Type>
}

export interface IDelayedResolveSubLookup<Type> {
    validateFulfillingEntries(keys: string[], typeInfo: string, requiresExhaustive: boolean): void
    createReference(
        key: string,
        typeInfo: string
    ): IDelayedResolveReference<Type>
}

export interface IDelayedResolvable<ReferencedType> {
    getLookup<Type>(callback: (type: ReferencedType) => Dictionary<Type>): IResolvePromise<IDelayedResolveSubLookup<Type>>
    castToConstraint<NewType>(callback: (type: ReferencedType) => ConstraintCastResult<NewType>, typeInfo: string): IDelayedResolveConstraint<NewType>
    convert<NewType>(callback: (type: ReferencedType) => NewType): IDelayedResolvable<NewType>
}
export interface IDelayedResolveReference<ReferencedType> extends IDelayedResolvable<ReferencedType>, Reference<ReferencedType> { }
export interface IDelayedResolveConstraint<Type> extends IDelayedResolvable<Type>, Constraint<Type> { }

export interface IResolvePromise<T> {
    handlePromise(onFailed: (failed: null) => void, onResult: (result: T) => void): void
    //getRequiringDictionary<NewType>(callback: (type: T) => RequiringDictionary<NewType>): IResolvePromise<RequiringDictionary<NewType>>
    //cast<NewType>(callback: (type: T) => [false] | [true, NewType]): IIntermediateDelayedResolveConstraint<NewType>
    map<NewType>(callback: (x: T) => NewType): IResolvePromise<NewType>
}
