import { RequiringDictionary } from "lingua-franca"
//import { assertUnreachable } from "./assertUnreachable"
import { IntraResolvedImp } from "./createReference"
import { IIntermediateIntraConstraint} from "./IIntermediateReference"
import { EntryPromiseType } from "./ILookup"
import { IResolvePromise } from "./IResolvePromise"
//import { IResolveReporter } from "./IResolveReporter"

type CallerFunction<ResultType> = (onFailed: (failed: null) => void, onResult: (result: ResultType) => void) => void

export type CallerObject<ResultType> = {
    onFailed: (failed: null) => void,
    onResult: (result: ResultType) => void
}

// tslint:disable-next-line: max-classes-per-file
class IntraConstraintImp<ReferencedType> extends IntraResolvedImp<ReferencedType>
    implements IIntermediateIntraConstraint<ReferencedType> {
    public intraConstraint: true = true
    constructor(
        entryPromiseType: EntryPromiseType<ReferencedType>
    ) {
        super(entryPromiseType)
    }
}

// tslint:disable-next-line: max-classes-per-file
class ResolvePromiseImp<T> implements IResolvePromise<T> {
    private readonly callerFunction: CallerFunction<T>
    constructor(callerFunction: CallerFunction<T>) {
        this.callerFunction = callerFunction
    }
    public handlePromise(onFailed: (failed: null) => void, onResult: (result: T) => void): void {
        this.callerFunction(onFailed, onResult)
    }
    public getRequiringDictionary<NewType>(callback: (type: T) => RequiringDictionary<NewType>): IResolvePromise<RequiringDictionary<NewType>> {
        return new ResolvePromiseImp<RequiringDictionary<NewType>>((onNewError, onNewResult) => {
            this.callerFunction(
                _failed => onNewError(null),
                result => {
                    onNewResult(callback(result))
                },
            )
        })
    }
    public cast<NewType>(callback: (type: T) => [false] | [true, NewType]): IIntermediateIntraConstraint<NewType> {
        //const cf: CallerFunction<NewType> = null
        const x: EntryPromiseType<NewType> = [ "not yet registered", createResolvePromise((onFailed, onResolved) => {
            this.callerFunction(
                _failed => onFailed(null),
                result => {
                    const castResult = callback(result)
                    if (castResult[0] === false) {
                        // tslint:disable-next-line: no-console
                        //console.log("wrong state")
                        onFailed(null)
                    } else {
                        onResolved(castResult[1])
                    }
                },
            )
        })]
        return new IntraConstraintImp<NewType>(x)
    }
}

export function createResolvePromise<T>(cf: CallerFunction<T>): IResolvePromise<T> {
    return new ResolvePromiseImp<T>(cf)
}
