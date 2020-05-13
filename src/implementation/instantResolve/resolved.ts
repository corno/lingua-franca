/* eslint
    "max-classes-per-file": off,
*/
import { ConstraintCastResult } from "../../interfaces/ConstraintCastResult"
import { Dictionary } from "../../interfaces/dictionary"
import { IDependentResolvedConstraintBuilder, ILookup, IResolvedConstrainedConstraint, IResolvedConstraint, Repeat } from "../../interfaces/instantResolve"
import { Constraint } from "../../interfaces/Reference"
import { IConstraintViolationReporter } from "../../reporters"
import { createFailedLookup, createLookup } from "./lookup"
import { createConstraint, createStateConstraint } from "./referenceBaseClasses"

class ResolvedImp<Type> implements IDependentResolvedConstraintBuilder<Type> {
    public readonly value: Type
    constructor(value: Type) {
        this.value = value
    }
    public getLookup<NewType>(p: {
        readonly callback: (cp: {
            readonly value: Type
        }) => Dictionary<NewType>
    }): ILookup<NewType> {
        return createLookup(p.callback({ value: this.value }))
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
    public castToConstraint<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => ConstraintCastResult<NewType>
        readonly reporter: IConstraintViolationReporter
    }): IResolvedConstraint<NewType> {
        return this.castToConstrainedConstraint({
            callback: p.callback,
            reporter: p.reporter,
            getConstraints: () => ({}),
        })
    }
    public castToConstrainedConstraint<NewType, Constraints>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => ConstraintCastResult<NewType>
        readonly reporter: IConstraintViolationReporter
        readonly getConstraints: (cp: {
            readonly current: IDependentResolvedConstraintBuilder<NewType>
        }) => Constraints
    }): IResolvedConstrainedConstraint<NewType, Constraints> {
        const castResult = p.callback({ type: this.value })
        if (castResult[0] === false) {
            p.reporter.reportConstraintViolation({
                expectedState: castResult[1].expected,
                foundState: castResult[1].found,
            })
            const failedResolved = createFailedResolvedBuilder<NewType>()
            return createStateConstraint(failedResolved, p.getConstraints({ current: failedResolved }))
        } else {
            const resolved = createResolveBuilder(castResult[1])
            return createStateConstraint(resolved, p.getConstraints({ current: resolved }))
        }
    }
    public navigateConstraint<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => Constraint<NewType>
        readonly reporter: IConstraintViolationReporter
    }) {
        const result = p.callback({ type: this.value })
        return result.mapResolved({
            callback: cp => {
                return createResolveBuilder(cp.type)
            },
            onNotResolved: _cp => {
                p.reporter.reportDependentConstraintViolation(false)
                return createFailedResolvedBuilder<NewType>()
            },
        })
    }
    public repeatNavigate(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => Repeat<Type>
        readonly reporter: IConstraintViolationReporter
    }) {
        let currentValue = this.value
        while (true) {
            const result = p.callback({ type: currentValue })
            if (result[0] === false) {
                return createResolveBuilder(currentValue)
            } else {
                const mapResult = result[1].mapResolved<[false] | [true, Type]>({
                    callback: cp => [true, cp.type],
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
    public mapResolved<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => NewType
        readonly onNotResolved: (cp: {}) => NewType
    }) {
        return p.callback({ type: this.value })
    }
    public getConstraint<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => Constraint<NewType>
    }): IResolvedConstraint<NewType> {
        const constraint = p.callback({ type: this.value })
        return constraint.mapResolved({
            callback: cp => createConstraint(createResolveBuilder(cp.type), {}),
            onNotResolved: () => createConstraint(createFailedResolvedBuilder(), {}),
        })
    }
    public getNonConstraint<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => NewType
    }) {
        return createConstraint(createResolveBuilder(p.callback({ type: this.value })), {})
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
        readonly callback: (cp: {
            readonly type: Type
        }) => NewType
        readonly onNotResolved: (cp: {}) => NewType
    }) {
        return p.onNotResolved({})
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
    public castToConstraint<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => ConstraintCastResult<NewType>
        readonly reporter: IConstraintViolationReporter
    }): IResolvedConstraint<NewType> {
        return this.castToConstrainedConstraint({
            callback: p.callback,
            reporter: p.reporter, getConstraints: () => ({}),
        })
    }
    public castToConstrainedConstraint<NewType, Constraints>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => ConstraintCastResult<NewType>
        readonly reporter: IConstraintViolationReporter
        readonly getConstraints: (cp: {
            readonly current: IDependentResolvedConstraintBuilder<NewType>
        }) => Constraints
    }): IResolvedConstrainedConstraint<NewType, Constraints> {
        p.reporter.reportDependentConstraintViolation(false)
        const failedResolved = createFailedResolvedBuilder<NewType>()
        return createStateConstraint(failedResolved, p.getConstraints({ current: failedResolved }))
    }
    public navigateConstraint<NewType>(p: {
        readonly callback: (cp: { type: Type }) => Constraint<NewType>
        readonly reporter: IConstraintViolationReporter
    }) {
        p.reporter.reportDependentConstraintViolation(false)
        return createFailedResolvedBuilder<NewType>()
    }
    public repeatNavigate(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => Repeat<Type>
        readonly reporter: IConstraintViolationReporter
    }) {
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
