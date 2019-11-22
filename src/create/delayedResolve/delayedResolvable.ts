// tslint:disable-next-line: max-classes-per-file
import { Dictionary } from "lingua-franca"
import { ConstraintCastResult  } from "../../interfaces/ConstraintCastResult"
import { IDelayedResolvable, IDelayedResolveConstraint, IDelayedResolveReference, IDelayedResolveRequiringLookup, IResolvePromise } from "../../interfaces/delayedResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createDelayedResolveRequiringLookupWrapper } from "./requiringLookup"

// tslint:disable-next-line: max-classes-per-file
class DelayedResolvableImp<ReferencedType> implements IDelayedResolvable<ReferencedType> {
    private resolvedEntry: undefined | null | ReferencedType
    private readonly subscribers: Array<CallerObject<ReferencedType>> = []
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public mapResolved<NewType>(
        callback: (type: ReferencedType) => NewType,
        onNotRolved: () => NewType
    ) {
        if (this.resolvedEntry === undefined) {
            console.error("IMPLEMENTATION ERROR: Entry was not resolved!!!!!!!")
        }
        if (this.resolvedEntry === null || this.resolvedEntry === undefined) {
            if (onNotRolved === undefined) {
                throw new Error("Reference was not resolved properly")
            } else {
                return onNotRolved()
            }
        }
        return callback(this.resolvedEntry)
    }
    public withResolved(callback: (type: ReferencedType) => void, onNotResolved?: () => void) {
        this.mapResolved(callback, onNotResolved === undefined ? () => { } : onNotResolved)
    }
    public getResolved() {
        return this.mapResolved(
            x => x,
            () => {
                throw new Error("Reference failed to resolve")
            }
        )
    }
    public getRequiringLookup<NewType>(callback: (type: ReferencedType) => Dictionary<NewType>, requiresExhaustive: boolean): IResolvePromise<IDelayedResolveRequiringLookup<NewType>> {
        return this.getResolvedPromise(callback).map(dict => createDelayedResolveRequiringLookupWrapper(dict, this.resolveReporter, requiresExhaustive))
    }
    public castToConstraint<NewType>(callback: (type: ReferencedType) => ConstraintCastResult<NewType>, typeInfo: string): IDelayedResolveConstraint<NewType> {
        return new DelayedResolveConstraintImp<NewType>(this.getResolvedPromise(callback), this.resolveReporter, typeInfo)
    }
    public convert<NewType>(callback: (type: ReferencedType) => NewType): IDelayedResolvable<NewType> {
        return new ConvertedDelayedResolvableImp<NewType>(this.getResolvedPromise(callback), this.resolveReporter)
    }
    protected setResolvedEntryToNull() {
        this.resolvedEntry = null
        this.subscribers.forEach(s => s.onFailed(null))
    }
    protected setResolvedEntry(entry: ReferencedType) {
        this.resolvedEntry = entry
        this.subscribers.forEach(s => s.onResult(entry))
    }
    private getResolvedPromise<NewType>(callback: (value: ReferencedType) => NewType): IResolvePromise<NewType> {
        return createResolvePromise<NewType>((onFailed, onResult) => {
            if (this.resolvedEntry === undefined) {
                this.subscribers.push({
                    onFailed: onFailed,
                    onResult: result => onResult(callback(result)),
                })
            } else {
                if (this.resolvedEntry !== null) {
                    onResult(callback(this.resolvedEntry))
                } else {
                    onFailed(null)
                }
            }
        })
    }
}

// tslint:disable-next-line: max-classes-per-file
class DelayedResolveReferenceImp<ReferencedType> extends DelayedResolvableImp<ReferencedType>
    implements IDelayedResolveReference<ReferencedType> {
    public regularReference: true = true
    private readonly key: string
    constructor(
        key: string,
        entryPromise: IResolvePromise<GetEntryResult<ReferencedType>>,
        resolveReporter: IResolveReporter,
        typeInfo: string,
        isForwardDeclaration: boolean
    ) {
        super(resolveReporter)
        this.key = key
        entryPromise.handlePromise(
            () => {
                //not found
                resolveReporter.reportDependentUnresolvedReference(typeInfo, key, true)
                this.setResolvedEntryToNull()
            },
            entryResult => {
                if (isForwardDeclaration && entryResult.wasRegisteredBeforeRequest) {
                    resolveReporter.reportShouldNotBeDeclaredForward(typeInfo, key)
                }
                if (!isForwardDeclaration && !entryResult.wasRegisteredBeforeRequest) {
                    resolveReporter.reportShouldBeDeclaredForward(typeInfo, key)
                }
                this.setResolvedEntry(entryResult.entry)
            }
        )
    }
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key)
    }
}


export type GetEntryResult<Type> = {
    entry: Type
    wasRegisteredBeforeRequest: boolean
}

export function createReferenceToDelayedResolveLookup<ReferencedType>(
    key: string,
    entryPromiseResult: IResolvePromise<GetEntryResult<ReferencedType>>,
    resolveReporter: IResolveReporter,
    typeInfo: string,
    isForwardDeclaration: boolean,
): IDelayedResolveReference<ReferencedType> {
    return new DelayedResolveReferenceImp(key, entryPromiseResult, resolveReporter, typeInfo, isForwardDeclaration)
}

type CallerFunction<ResultType> = (onFailed: (failed: null) => void, onResult: (result: ResultType) => void) => void

export type CallerObject<ResultType> = {
    onFailed: (failed: null) => void,
    onResult: (result: ResultType) => void
}

// tslint:disable-next-line: max-classes-per-file
class DelayedResolveConstraintImp<ReferencedType> extends DelayedResolvableImp<ReferencedType>
    implements IDelayedResolveConstraint<ReferencedType> {
    public constraint: true = true
    constructor(
        resolvePromise: IResolvePromise<ConstraintCastResult<ReferencedType>>,
        resolveReporter: IResolveReporter,
        typeInfo: string,
    ) {
        super(resolveReporter)
        resolvePromise.handlePromise(
            _failed => {
                resolveReporter.reportDependentConstraintViolation(typeInfo, true)
                this.setResolvedEntryToNull()
            },
            result => {
                if (result[0] === false) {
                    resolveReporter.reportConstraintViolation(typeInfo, result[1].expected, result[1].found, true)
                    this.setResolvedEntryToNull()
                } else {
                    this.setResolvedEntry(result[1])
                }
            }
        )
    }
}

// tslint:disable-next-line: max-classes-per-file
class ConvertedDelayedResolvableImp<ReferencedType> extends DelayedResolvableImp<ReferencedType> {
    constructor(
        resolvePromise: IResolvePromise<ReferencedType>,
        resolveReporter: IResolveReporter,
    ) {
        super(resolveReporter)
        resolvePromise.handlePromise(
            _failed => {
                this.setResolvedEntryToNull()
            },
            result => {
                this.setResolvedEntry(result)
            }
        )
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
    public map<NewType>(callback: (value: T) => NewType): IResolvePromise<NewType> {
        return createResolvePromise<NewType>((onFailed, onResult) => {
            this.callerFunction(
                _failed => {
                    onFailed(null)
                },
                result => {
                    onResult(callback(result))
                }
            )
        })
    }
}

export function createResolvePromise<T>(cf: CallerFunction<T>): IResolvePromise<T> {
    return new ResolvePromiseImp<T>(cf)
}
