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
    public getLookup<NewType>(p: { callback: (value: Type) => Dictionary<NewType> }): ILookup<NewType> {
        return createLookup(p.callback(this.value))
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
    public castToConstraint<NewType>(p: { callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter }): IResolvedConstraint<NewType> {
        return this.castToConstrainedConstraint({
            callback: p.callback,
            reporter: p.reporter,
            getConstraints: () => ({}),
        })
    }
    public castToConstrainedConstraint<NewType, Constraints>(p: {
        callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter, getConstraints: (current: IDependentResolvedConstraintBuilder<NewType>) => Constraints
    }): IResolvedConstrainedConstraint<NewType, Constraints> {
        const castResult = p.callback(this.value)
        if (castResult[0] === false) {
            p.reporter.reportConstraintViolation({
                expectedState: castResult[1].expected,
                foundState: castResult[1].found,
            })
            const failedResolved = createFailedResolvedBuilder<NewType>()
            return createStateConstraint(failedResolved, p.getConstraints(failedResolved))
        } else {
            const resolved = createResolveBuilder(castResult[1])
            return createStateConstraint(resolved, p.getConstraints(resolved))
        }
    }
    public navigateConstraint<NewType>(p: { callback: (type: Type) => Constraint<NewType>, reporter: IConstraintViolationReporter }) {
        const result = p.callback(this.value)
        return result.mapResolved({
            callback: value => {
                return createResolveBuilder(value)
            },
            onNotResolved: () => {
                p.reporter.reportDependentConstraintViolation(false)
                return createFailedResolvedBuilder<NewType>()
            },
        })
    }
    public repeatNavigate(p: { callback: (type: Type) => Repeat<Type>, reporter: IConstraintViolationReporter }) {
        let currentValue = this.value
        while (true) {
            const result = p.callback(currentValue)
            if (result[0] === false) {
                return createResolveBuilder(currentValue)
            } else {
                const mapResult = result[1].mapResolved<[false] | [true, Type]>({
                    callback: newValue => [true, newValue],
                    onNotResolved: () => [false],
                })
                if (mapResult[0] === false) {
                    p.reporter.reportDependentConstraintViolation(false)
                    return createFailedResolvedBuilder<Type>()
                }
                currentValue = mapResult[1]
            }
        }
    }
    public mapResolved<NewType>(p: { callback: (type: Type) => NewType, onNotResolved: () => NewType }) {
        return p.callback(this.value)
    }
    public getConstraint<NewType>(p: { readonly callback: (type: Type) => Constraint<NewType> }): IResolvedConstraint<NewType> {
        const constraint = p.callback(this.value)
        return constraint.mapResolved({
            callback: x => createConstraint(createResolveBuilder(x), {}),
            onNotResolved: () => createConstraint(createFailedResolvedBuilder(), {}),
        })
    }
    public getNonConstraint<NewType>(p: { callback: (type: Type) => NewType }) {
        return createConstraint(createResolveBuilder(p.callback(this.value)), {})
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
    public mapResolved<NewType>(p: {
        callback: (type: Type) => NewType,
        onNotResolved: () => NewType
    }) {
        return p.onNotResolved()
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
    public castToConstraint<NewType>(p: { callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter }): IResolvedConstraint<NewType> {
        return this.castToConstrainedConstraint({ callback: p.callback, reporter: p.reporter, getConstraints: () => ({}) })
    }
    public castToConstrainedConstraint<NewType, Constraints>(p: {
        callback: (type: Type) => ConstraintCastResult<NewType>, reporter: IConstraintViolationReporter,
        getConstraints: (current: IDependentResolvedConstraintBuilder<NewType>) => Constraints
    }): IResolvedConstrainedConstraint<NewType, Constraints> {
        p.reporter.reportDependentConstraintViolation(false)
        const failedResolved = createFailedResolvedBuilder<NewType>()
        return createStateConstraint(failedResolved, p.getConstraints(failedResolved))
    }
    public navigateConstraint<NewType>(p: { callback: (type: Type) => Constraint<NewType>, reporter: IConstraintViolationReporter }) {
        p.reporter.reportDependentConstraintViolation(false)
        return createFailedResolvedBuilder<NewType>()
    }
    public repeatNavigate(p: { callback: (type: Type) => Repeat<Type>, reporter: IConstraintViolationReporter }) {
        p.reporter.reportDependentConstraintViolation(false)
        return createFailedResolvedBuilder<Type>()
    }
    public convert<NewType>(): IDependentResolvedConstraintBuilder<NewType> {
        return createFailedResolvedBuilder()
    }
}

export function createFailedResolvedBuilder<Type>(): IDependentResolvedConstraintBuilder<Type> {
    return new FailedResolved<Type>()
}
