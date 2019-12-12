// tslint:disable: max-classes-per-file
import { Constraint, Dictionary } from "lingua-franca"
import { ConstraintCastResult } from "../../interfaces/ConstraintCastResult"
import { IDependentResolvedConstraintBuilder, ILookup, IResolvedConstrainedConstraint, IResolvedConstraint, Repeat } from "../../interfaces/instantResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createFailedLookup, createLookup } from "./lookup"
import { createConstraint, createStateConstraint } from "./referenceBaseClasses"

class ResolvedImp<Type> implements IDependentResolvedConstraintBuilder<Type> {
    public readonly value: Type
    private readonly resolveReporter: IResolveReporter
    constructor(value: Type, resolveReporter: IResolveReporter) {
        this.value = value
        this.resolveReporter = resolveReporter
    }
    public getLookup<NewType>(callback: (value: Type) => Dictionary<NewType>): ILookup<NewType> {
        return createLookup(callback(this.value), this.resolveReporter)
    }
    // public mapResolved<NewType>(
    //     callback: (type: Type) => NewType,
    //     _onNotResolved: () => NewType
    // ) {
    //     return callback(this.value)
    // }
    // public withResolved(callback: (type: Type) => void, onNotResolved?: () => void) {
    //     this.mapResolved(callback, onNotResolved === undefined ? () => { } : onNotResolved)
    // }
    // public getResolved() {
    //     return this.mapResolved(s
    //         x => x,
    //         () => {
    //             throw new Error("Reference failed to resolve")
    //         }
    //     )
    // }
    public castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IResolvedConstraint<NewType> {
        return this.castToConstrainedConstraint(callback, typeInfo, () => ({}))
    }
    public castToConstrainedConstraint<NewType, Constraints>(
        callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string, getConstraints: (current: IDependentResolvedConstraintBuilder<NewType>) => Constraints
    ): IResolvedConstrainedConstraint<NewType, Constraints> {
        const castResult = callback(this.value)
        if (castResult[0] === false) {
            this.resolveReporter.reportConstraintViolation(typeInfo, castResult[1].expected, castResult[1].found, false)
            const failedResolved = createFailedResolvedBuilder<NewType>(this.resolveReporter)
            return createStateConstraint(failedResolved, getConstraints(failedResolved))
        } else {
            const resolved = createResolveBuilder(castResult[1], this.resolveReporter)
            return createStateConstraint(resolved, getConstraints(resolved))
        }
    }
    public navigateConstraint<NewType>(callback: (type: Type) => Constraint<NewType>, typeInfo: string) {
        const result = callback(this.value)
        return result.mapResolved({
            callback: value => {
                return createResolveBuilder(value, this.resolveReporter)
            },
            onNotResolved: () => {
                this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
                return createFailedResolvedBuilder<NewType>(this.resolveReporter)
            },
        })
    }
    public repeatNavigate(callback: (type: Type) => Repeat<Type>, typeInfo: string) {
        let currentValue = this.value
        while (true) {
            const result = callback(currentValue)
            if (result[0] === false) {
                return createResolveBuilder(currentValue, this.resolveReporter)
            } else {
                const mapResult = result[1].mapResolved<[false] | [true, Type]>({
                    callback: newValue => [true, newValue],
                    onNotResolved: () => [false],
                })
                if (mapResult[0] === false) {
                    this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
                    return createFailedResolvedBuilder<Type>(this.resolveReporter)
                }
                currentValue = mapResult[1]
            }
        }
    }
    public mapResolved<NewType>(callback: (type: Type) => NewType, _onNotResolved: () => NewType) {
        return callback(this.value)
    }
    public getConstraint<NewType>(callback: (type: Type) => Constraint<NewType>): IResolvedConstraint<NewType> {
        const constraint = callback(this.value)
        return constraint.mapResolved({
            callback: x => createConstraint(createResolveBuilder(x, this.resolveReporter), {}),
            onNotResolved: () => createConstraint(createFailedResolvedBuilder(this.resolveReporter), {}),
        })
    }
    public getNonConstraint<NewType>(callback: (type: Type) => NewType) {
        return createConstraint(createResolveBuilder(callback(this.value), this.resolveReporter), {})
    }
}

export function createResolveBuilder<T>(t: T, resolveReporter: IResolveReporter): IDependentResolvedConstraintBuilder<T> {
    return new ResolvedImp<T>(t, resolveReporter)
}

class FailedResolved<Type> implements IDependentResolvedConstraintBuilder<Type> {
    public readonly value: null
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public getLookup<NewType>(): ILookup<NewType> {
        return createFailedLookup(this.resolveReporter)
    }
    public mapResolved<NewType>(
        _callback: (type: Type) => NewType,
        onNotResolved: () => NewType
    ) {
        return onNotResolved()
    }
    // public withResolved(_callback: (type: Type) => void, onNotResolved?: () => void) {
    //     if (onNotResolved !== undefined) {
    //         onNotResolved()
    //     }
    // }
    // public getResolved(): Type {
    //     throw new Error("Reference failed to resolve")
    // }
    public getConstraint<NewType>(): IResolvedConstraint<NewType> {
        return createConstraint(createFailedResolvedBuilder(this.resolveReporter), {})
    }
    public getNonConstraint<NewType>(): IResolvedConstraint<NewType> {
        return createConstraint(createFailedResolvedBuilder(this.resolveReporter), {})
    }
    public castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IResolvedConstraint<NewType> {
        return this.castToConstrainedConstraint(callback, typeInfo, () => ({}))
    }
    public castToConstrainedConstraint<NewType, Constraints>(
        _callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string,
        getConstraints: (current: IDependentResolvedConstraintBuilder<NewType>) => Constraints
    ): IResolvedConstrainedConstraint<NewType, Constraints> {
        this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
        const failedResolved = createFailedResolvedBuilder<NewType>(this.resolveReporter)
        return createStateConstraint(failedResolved, getConstraints(failedResolved))
    }
    public navigateConstraint<NewType>(_callback: (type: Type) => Constraint<NewType>, typeInfo: string) {
        this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
        return createFailedResolvedBuilder<NewType>(this.resolveReporter)
    }
    public repeatNavigate(_callback: (type: Type) => Repeat<Type>, typeInfo: string) {
        this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
        return createFailedResolvedBuilder<Type>(this.resolveReporter)
    }
    public convert<NewType>(): IDependentResolvedConstraintBuilder<NewType> {
        return createFailedResolvedBuilder(this.resolveReporter)
    }
}

export function createFailedResolvedBuilder<Type>(resolveReporter: IResolveReporter): IDependentResolvedConstraintBuilder<Type> {
    return new FailedResolved<Type>(resolveReporter)
}
