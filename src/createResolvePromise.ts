import { IResolvePromise} from "./IResolvePromise"

type CallerFunction<ResultType> = (onFailed: (failed: null) => void, onResult: (result: ResultType) => void) => void

export type CallerObject<ResultType> = {
    onFailed: (failed: null) => void,
    onResult: (result: ResultType) => void
}

class ResolvePromiseImp<T> implements IResolvePromise<T> {
    private readonly callerFunction: CallerFunction<T>
    constructor(callerFunction: CallerFunction<T>) {
        this.callerFunction = callerFunction
    }
    public handlePromise(onFailed: (failed: null) => void, onResult: (result: T) => void): void {
        this.callerFunction(onFailed, onResult)
    }
    public map<NewType>(callback: (type: T) => NewType): IResolvePromise<NewType> {
        return new ResolvePromiseImp<NewType>((onNewError, onNewResult) => {
            this.callerFunction(
                _failed => onNewError(null),
                result => {
                    onNewResult(callback(result))
                },
            )
        })
    }
    public cast<NewType>(callback: (type: T) => [false] | [true, NewType]): IResolvePromise<NewType> {
        return new ResolvePromiseImp<NewType>((onNewError, onNewResult) => {
            this.callerFunction(
                _failed => onNewError(null),
                result => {
                    const castResult = callback(result)
                    if (castResult[0] === false) {
                        // tslint:disable-next-line: no-console
                        //console.log("wrong state")
                        onNewError(null)
                    } else {
                        onNewResult(castResult[1])
                    }
                },
            )
        })
    }
}

export function createResolvePromise<T>(cf: CallerFunction<T>): IResolvePromise<T> {
    return new ResolvePromiseImp<T>(cf)
}
