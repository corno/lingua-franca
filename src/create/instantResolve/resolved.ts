// tslint:disable: max-classes-per-file
import { Dictionary } from "lingua-franca"
import { ConstraintCastResult  } from "../../interfaces/ConstraintCastResult"
import { ILookup, IResolved, IResolvedStateConstraint } from "../../interfaces/instantResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createFailedLookup, createLookup } from "./lookup"
import { createStateConstraint } from "./referenceBaseClasses"

class ResolvedImp<Type> implements IResolved<Type> {
    private readonly value: Type
    private readonly resolveReporter: IResolveReporter
    constructor(value: Type, resolveReporter: IResolveReporter) {
        this.value = value
        this.resolveReporter = resolveReporter
    }
    public getLookup<NewType>(callback: (value: Type) => Dictionary<NewType>): ILookup<NewType> {
        return createLookup(callback(this.value), this.resolveReporter)
    }
    public mapResolved<NewType>(
        callback: (type: Type) => NewType,
        _onNotRolved: () => NewType
    ) {
        return callback(this.value)
    }
    public withResolved(callback: (type: Type) => void, onNotResolved?: () => void) {
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
    public castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IResolvedStateConstraint<NewType> {
        const castResult = callback(this.value)
        if (castResult[0] === false) {
            this.resolveReporter.reportConstraintViolation(typeInfo, castResult[1].expected, castResult[1].found, false)
            return createStateConstraint<NewType>(createFailedResolved(this.resolveReporter))
        } else {
            return createStateConstraint<NewType>(wrapResolved(castResult[1], this.resolveReporter))
        }

    }
    public convert<NewType>(callback: (type: Type) => NewType): IResolved<NewType> {
        return wrapResolved(callback(this.value), this.resolveReporter)
    }
}

export function wrapResolved<T>(t: T, resolveReporter: IResolveReporter): IResolved<T> {
    return new ResolvedImp<T>(t, resolveReporter)
}

class FailedResolved<Type> implements IResolved<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public getLookup<NewType>(): ILookup<NewType> {
        return createFailedLookup(this.resolveReporter)
    }
    public mapResolved<NewType>(
        _callback: (type: Type) => NewType,
        onNotRolved: () => NewType
    ) {
        return onNotRolved()
    }
    public withResolved(_callback: (type: Type) => void, onNotResolved?: () => void) {
        if (onNotResolved !== undefined) {
            onNotResolved()
        }
    }
    public getResolved(): Type {
        throw new Error("Reference failed to resolve")
    }
    public castToConstraint<NewType>(_callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IResolvedStateConstraint<NewType> {
        this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
        return createStateConstraint<NewType>(createFailedResolved<NewType>(this.resolveReporter))
    }
    public convert<NewType>(): IResolved<NewType> {
        return createFailedResolved(this.resolveReporter)
    }
}

export function createFailedResolved<Type>(resolveReporter: IResolveReporter) {
    return new FailedResolved<Type>(resolveReporter)
}
