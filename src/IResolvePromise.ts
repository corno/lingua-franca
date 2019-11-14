
export interface IResolvePromise<T> {
    handlePromise(onFailed: (failed: null) => void, onResult: (result: T) => void): void
    map<NewType>(callback: (type: T) => NewType): IResolvePromise<NewType>
    //cast<NewType>(callback: (type: T) => [false] | [true, NewType]): ResolvePromise<NewType>
}
