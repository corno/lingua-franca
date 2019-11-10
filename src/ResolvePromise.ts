import { ResolvePromise} from "../Types"

type CallerFunction<ResultType> = (onFailed: (failed: null) => void, onResult: (result: ResultType) => void) => void

export type CallerObject<ResultType> = {
    onFailed: (failed: null) => void,
    onResult: (result: ResultType) => void
}

class ResolvePromiseImp<T> implements ResolvePromise<T> {
    private readonly callerFunction: CallerFunction<T>
    constructor(callerFunction: CallerFunction<T>) {
        this.callerFunction = callerFunction
    }
    public handlePromise(onFailed: (failed: null) => void, onResult: (result: T) => void): void {
        this.callerFunction(onFailed, onResult)
    }
    public map<NewType>(callback: (type: T) => NewType): ResolvePromise<NewType> {
        return new ResolvePromiseImp<NewType>((onNewError, onNewResult) => {
            this.callerFunction(
                _failed => onNewError(null),
                result => {
                    onNewResult(callback(result))
                },
            )
        })
    }
    public cast<NewType>(callback: (type: T) => [false] | [true, NewType]): ResolvePromise<NewType> {
        return new ResolvePromiseImp<NewType>((onNewError, onNewResult) => {
            this.callerFunction(
                _failed => onNewError(null),
                result => {
                    const castResult = callback(result)
                    if (castResult[0] === false) {
                        // tslint:disable-next-line: no-console
                        console.log("wrong state")
                        onNewError(null)
                    } else {
                        onNewResult(castResult[1])
                    }
                },
            )
        })
    }
}

export function makePromise<T>(t: null | T): ResolvePromise<T> {
    return new ResolvePromiseImp<T>((onFailed, onResolved) => {
        if (t !== null) {
            onResolved(t)
        } else {
            onFailed(null)
        }
    })
}

export function promisify<T>(cf: CallerFunction<T>): ResolvePromise<T> {
    return new ResolvePromiseImp<T>(cf)
}
