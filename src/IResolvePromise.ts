import { RequiringDictionary } from "lingua-franca"
import { IIntermediateIntraConstraint } from "./IIntermediateReference";

export interface IResolvePromise<T> {
    handlePromise(onFailed: (failed: null) => void, onResult: (result: T) => void): void
    getRequiringDictionary<NewType>(callback: (type: T) => RequiringDictionary<NewType>): IResolvePromise<RequiringDictionary<NewType>>
    cast<NewType>(callback: (type: T) => [false] | [true, NewType]): IIntermediateIntraConstraint<NewType>
}
