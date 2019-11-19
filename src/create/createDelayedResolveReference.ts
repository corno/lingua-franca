// tslint:disable-next-line: max-classes-per-file
import { Dictionary } from "lingua-franca"
import { assertUnreachable } from "../assertUnreachable"
import { EntryPromiseResult, IDelayedResolvable, IDelayedResolveConstraint, IDelayedResolveLookup, IDelayedResolveReference, IResolvePromise } from "../interfaces/delayedResolve"
import { IRequiringLookup } from "../interfaces/instantResolve"
import { IResolveReporter } from "../IResolveReporter"
//import { IResolveReporter } from "./IResolveReporter"

export type FilterResult<Type> = [false] | [true, Type]

class RequiringLookupImp<Type> implements IRequiringLookup {
    private readonly dictionary: Dictionary<Type>
    constructor(
        dictionary: Dictionary<Type>
    ) {
        this.dictionary = dictionary
    }
    public getKeys() {
        return this.dictionary.getKeys()
    }
}

// tslint:disable-next-line: max-classes-per-file
class DelayedResolvableImp<ReferencedType> implements IDelayedResolvable<ReferencedType> {
    protected resolvedEntry: undefined | null | ReferencedType
    private readonly subscribers: Array<CallerObject<ReferencedType>> = []
    public mapResolved<NewType>(
        callback: (type: ReferencedType) => NewType,
        onNotRolved: () => NewType
    ) {
        if (this.resolvedEntry === null || this.resolvedEntry === undefined) {
            if (onNotRolved === undefined) {
                throw new Error("Reference was not resolved properly")
            } else {
                return onNotRolved()
            }
        }
        return callback(this.resolvedEntry)
    }
    public withResolved(callback: (type: ReferencedType) => void) {
        this.mapResolved(callback, () => { })
    }
    public getResolved() {
        return this.mapResolved(
            x => x,
            () => {
                throw new Error("Reference failed to resolve")
            }
        )
    }
    public getRequiringLookup<Type>(callback: (type: ReferencedType) => Dictionary<Type>): IResolvePromise<IRequiringLookup> {
        return this.getResolvedPromise(callback).map(dict => new RequiringLookupImp(dict))
    }
    public cast<NewType>(callback: (type: ReferencedType) => FilterResult<NewType>, resolveReporter: IResolveReporter, typeInfo: string): IDelayedResolveConstraint<NewType> {
        return new DelayedResolveConstraintImp<NewType>(this.getResolvedPromise(callback), resolveReporter, typeInfo)
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
        entryPromiseResult: EntryPromiseResult<ReferencedType>,
        resolver: IResolveReporter,
        typeInfo: string,
        isForwardDeclaration: boolean
    ) {
        super()
        this.key = key
        switch (entryPromiseResult[0]) {
            case "entry already registered": {
                if (isForwardDeclaration) {
                    resolver.reportShouldNotBeDeclaredForward(typeInfo, key)
                }
                this.resolvedEntry = null
                break
            }
            case "already final": {
                if (isForwardDeclaration) {
                    resolver.reportShouldNotBeDeclaredForward(typeInfo, key)
                }
                this.resolvedEntry = null
                break
            }
            case "awaiting": {
                const promise = entryPromiseResult[1]
                promise.handlePromise(
                    () => {
                        //not found
                        resolver.reportDependentUnresolvedReference(typeInfo, key, true)
                        this.resolvedEntry = null
                    },
                    entry => {
                        if (!isForwardDeclaration) {
                            resolver.reportShouldBeDeclaredForward(typeInfo, key)
                        }
                        this.resolvedEntry = entry
                    }
                )
                break
            }
            default:
                assertUnreachable(entryPromiseResult[0])
                throw new Error("UNREACHABLE")
        }
    }
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key)
    }
}

export function createReferenceToDelayedResolveLookup<ReferencedType>(
    typeInfo: string,
    key: string,
    resolvedLookup: IDelayedResolveLookup<ReferencedType>,
    resolver: IResolveReporter,
    isForwardDeclaration: boolean,
): IDelayedResolveReference<ReferencedType> {
    const entryPromiseResult = resolvedLookup.getEntryPromise(key)

    return new DelayedResolveReferenceImp(key, entryPromiseResult, resolver, typeInfo, isForwardDeclaration)
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
        resolvePromise: IResolvePromise<FilterResult<ReferencedType>>,
        resolver: IResolveReporter,
        typeInfo: string,
    ) {
        super()
        resolvePromise.handlePromise(
            _failed => {
                resolver.reportDependentConstraintViolation(typeInfo, true)
                this.resolvedEntry = null
            },
            result => {
                if (result[0] === false) {
                    resolver.reportConstraintViolation(typeInfo, true)
                    this.resolvedEntry = null
                } else {
                    this.resolvedEntry = result[1]
                }
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
