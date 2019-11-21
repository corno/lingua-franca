import { Constraint, Dictionary, Reference } from "lingua-franca"

export interface IDelayedResolveLookup<Type> {
    createReferenceToDelayedResolveLookup(
        key: string,
        typeInfo: string,
        isForwardDeclaration: boolean,
    ): IDelayedResolveReference<Type>
}


export interface IDelayedResolveRequiringLookup<Type> {
    validate(keys: string[], typeInfo: string): void
    _hack(): IDelayedResolveRequiringLookup<Type> //to enforce a type argument
}

export interface IDelayedResolvable<ReferencedType> {
    getRequiringLookup<Type>(callback: (type: ReferencedType) => Dictionary<Type>, requiresExhaustive: boolean): IResolvePromise<IDelayedResolveRequiringLookup<Type>>
    castToConstraint<NewType>(callback: (type: ReferencedType) => [false] | [true, NewType], typeInfo: string): IDelayedResolveConstraint<NewType>
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
