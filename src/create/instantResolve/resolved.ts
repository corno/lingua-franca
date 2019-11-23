// tslint:disable: max-classes-per-file
import { Constraint, Dictionary } from "lingua-franca"
import { ConstraintCastResult } from "../../interfaces/ConstraintCastResult"
import { ILookup, IResolved, IResolvedStateConstraint, Repeat } from "../../interfaces/instantResolve"
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
    public navigateConstraint<NewType>(callback: (type: Type) => Constraint<NewType>, typeInfo: string) {
        const result = callback(this.value)
        return result.mapResolved(
            value => {
                return wrapResolved(value, this.resolveReporter)
            },
            () => {
                this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
                return createFailedResolved<NewType>(this.resolveReporter)
            }
        )
    }
    public repeatNavigate(callback: (type: Type) => Repeat<Type>, typeInfo: string) {
        let currentValue = this.value
        while (true) {
            const result = callback(currentValue)
            if (result[0] === false) {
                return wrapResolved(currentValue, this.resolveReporter)
            } else {
                const mapResult = result[1].mapResolved<[false] | [true, Type]>(
                    newValue => [true, newValue],
                    () => [false]
                )
                if (mapResult[0] === false) {
                    this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
                    return createFailedResolved<Type>(this.resolveReporter)
                }
                currentValue = mapResult[1]
            }
        }
    }
    public convert<NewType>(callback: (type: Type) => NewType): IResolved<NewType> {
        return wrapResolved(callback(this.value), this.resolveReporter)
    }
    public map<NewType>(callback: (type: Type) => Constraint<NewType>) {
        return callback(this.value)
    }
    public mapX<NewType>(callback: (type: Type) => NewType) {
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
    public map<NewType>(): Constraint<NewType> {
        return createFailedResolved(this.resolveReporter)
    }
    public mapX<NewType>(): Constraint<NewType> {
        return createFailedResolved(this.resolveReporter)
    }
    public castToConstraint<NewType>(_callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IResolvedStateConstraint<NewType> {
        this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
        return createStateConstraint<NewType>(createFailedResolved<NewType>(this.resolveReporter))
    }
    public navigateConstraint<NewType>(_callback: (type: Type) => Constraint<NewType>, typeInfo: string) {
        this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
        return createFailedResolved<NewType>(this.resolveReporter)
    }
    public repeatNavigate(_callback: (type: Type) => Repeat<Type>, typeInfo: string) {
        this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
        return createFailedResolved<Type>(this.resolveReporter)
    }
    public convert<NewType>(): IResolved<NewType> {
        return createFailedResolved(this.resolveReporter)
    }
}

export function createFailedResolved<Type>(resolveReporter: IResolveReporter): IResolved<Type> {
    return new FailedResolved<Type>(resolveReporter)
}
