// tslint:disable: max-classes-per-file
import { Constraint, Dictionary } from "lingua-franca"
import { ConstraintCastResult } from "../../interfaces/ConstraintCastResult"
import { IDependentResolvedConstraintBuilder, ILookup, IResolvedConstrainedConstraint, IResolvedConstraint, Repeat } from "../../interfaces/instantResolve"
import { IConstraintViolationReporter } from "../../reporters"
import { createFailedLookup, createLookup } from "./lookup"
import { createConstraint, createStateConstraint } from "./referenceBaseClasses"

class ResolvedImp<Type> implements IDependentResolvedConstraintBuilder<Type> {
    public readonly value: Type
    constructor(value: Type) {
        this.value = value
    }
    public getLookup<NewType>(callback: (value: Type) => Dictionary<NewType>): ILookup<NewType> {
        return createLookup(callback(this.value))
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
    public castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter): IResolvedConstraint<NewType> {
        return this.castToConstrainedConstraint(callback, reporter, () => ({}))
    }
    public castToConstrainedConstraint<NewType, Constraints>(
        callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter, getConstraints: (current: IDependentResolvedConstraintBuilder<NewType>) => Constraints
    ): IResolvedConstrainedConstraint<NewType, Constraints> {
        const castResult = callback(this.value)
        if (castResult[0] === false) {
            reporter.reportConstraintViolation(castResult[1].expected, castResult[1].found)
            const failedResolved = createFailedResolvedBuilder<NewType>()
            return createStateConstraint(failedResolved, getConstraints(failedResolved))
        } else {
            const resolved = createResolveBuilder(castResult[1])
            return createStateConstraint(resolved, getConstraints(resolved))
        }
    }
    public navigateConstraint<NewType>(callback: (type: Type) => Constraint<NewType>, reporter: IConstraintViolationReporter) {
        const result = callback(this.value)
        return result.mapResolved({
            callback: value => {
                return createResolveBuilder(value)
            },
            onNotResolved: () => {
                reporter.reportDependentConstraintViolation(false)
                return createFailedResolvedBuilder<NewType>()
            },
        })
    }
    public repeatNavigate(callback: (type: Type) => Repeat<Type>, reporter: IConstraintViolationReporter) {
        let currentValue = this.value
        while (true) {
            const result = callback(currentValue)
            if (result[0] === false) {
                return createResolveBuilder(currentValue)
            } else {
                const mapResult = result[1].mapResolved<[false] | [true, Type]>({
                    callback: newValue => [true, newValue],
                    onNotResolved: () => [false],
                })
                if (mapResult[0] === false) {
                    reporter.reportDependentConstraintViolation(false)
                    return createFailedResolvedBuilder<Type>()
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
            callback: x => createConstraint(createResolveBuilder(x), {}),
            onNotResolved: () => createConstraint(createFailedResolvedBuilder(), {}),
        })
    }
    public getNonConstraint<NewType>(callback: (type: Type) => NewType) {
        return createConstraint(createResolveBuilder(callback(this.value)), {})
    }
}

export function createResolveBuilder<T>(t: T): IDependentResolvedConstraintBuilder<T> {
    return new ResolvedImp<T>(t)
}

class FailedResolved<Type> implements IDependentResolvedConstraintBuilder<Type> {
    public readonly value: null
    constructor() {
        //
    }
    public getLookup<NewType>(): ILookup<NewType> {
        return createFailedLookup()
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
        return createConstraint(createFailedResolvedBuilder(), {})
    }
    public getNonConstraint<NewType>(): IResolvedConstraint<NewType> {
        return createConstraint(createFailedResolvedBuilder(), {})
    }
    public castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter): IResolvedConstraint<NewType> {
        return this.castToConstrainedConstraint(callback, reporter, () => ({}))
    }
    public castToConstrainedConstraint<NewType, Constraints>(
        _callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter,
        getConstraints: (current: IDependentResolvedConstraintBuilder<NewType>) => Constraints
    ): IResolvedConstrainedConstraint<NewType, Constraints> {
        reporter.reportDependentConstraintViolation(false)
        const failedResolved = createFailedResolvedBuilder<NewType>()
        return createStateConstraint(failedResolved, getConstraints(failedResolved))
    }
    public navigateConstraint<NewType>(_callback: (type: Type) => Constraint<NewType>, reporter: IConstraintViolationReporter) {
        reporter.reportDependentConstraintViolation(false)
        return createFailedResolvedBuilder<NewType>()
    }
    public repeatNavigate(_callback: (type: Type) => Repeat<Type>, reporter: IConstraintViolationReporter) {
        reporter.reportDependentConstraintViolation(false)
        return createFailedResolvedBuilder<Type>()
    }
    public convert<NewType>(): IDependentResolvedConstraintBuilder<NewType> {
        return createFailedResolvedBuilder()
    }
}

export function createFailedResolvedBuilder<Type>(): IDependentResolvedConstraintBuilder<Type> {
    return new FailedResolved<Type>()
}
