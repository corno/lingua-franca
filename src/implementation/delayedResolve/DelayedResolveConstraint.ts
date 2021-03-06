/* eslint
    "max-classes-per-file": off,
*/
import { ConstraintCastResult } from "../../interfaces/ConstraintCastResult"
import {
    IDelayedResolvableBuilder,
    IDelayedResolveConstrainedStateConstraint,
    IDelayedResolveConstraint,
    IDelayedResolveLookup,
    IDelayedResolveStateConstraint,
} from "../../interfaces/delayedResolve"
import { Dictionary } from "../../interfaces/Dictionary"
import { Constraint } from "../../interfaces/Reference"
import { IConstraintViolationReporter } from "../../reporters"
import { DelayedResolveStateConstraint } from "./delayedResolve"
import { DelayedResolveLookup } from "./DelayedResolveLookup"

interface IResolvedSubscriber<Type> {
    onSuccess: (value: Type) => void
    onFailed: () => void
}

export class XBuilder<Type> implements IDelayedResolvableBuilder<Type> {
    private resolvedValue: undefined | [false] | [true, Type]
    private readonly subscribers: IResolvedSubscriber<Type>[] = []
    public getValue(_p: {}) {
        return this.resolvedValue
    }

    //resolution methods
    public resolve(p: {
        readonly value: Type
    }) {
        this.resolvedValue = [true, p.value]
        this.subscribers.forEach(s => s.onSuccess(p.value))
    }
    public setToFailedResolve() {
        this.resolvedValue = [false]
        this.subscribers.forEach(s => s.onFailed())
    }

    //IDelayedResolveConstraint methods
    public castToConstraint<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => ConstraintCastResult<NewType>
        readonly reporter: IConstraintViolationReporter
    }): IDelayedResolveStateConstraint<NewType> {
        return this.castToConstrainedConstraint({
            callback: p.callback,
            reporter: p.reporter,
            getConstraints: () => ({}),
        })
    }

    //IDelayedResolveConstraint methods
    public castToConstrainedConstraint<NewType, Constraints>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => ConstraintCastResult<NewType>
        readonly reporter: IConstraintViolationReporter
        readonly getConstraints: (cp: {
            readonly builder: IDelayedResolvableBuilder<NewType>
        }) => Constraints
    }): IDelayedResolveConstrainedStateConstraint<NewType, Constraints> {
        const builder = new XBuilder<NewType>()
        const constraints = p.getConstraints({ builder: builder })
        const constraint = new DelayedResolveStateConstraint<NewType, Constraints>(builder, constraints)
        this.addSubscriber(
            () => {
                p.reporter.reportDependentConstraintViolation(true)
                builder.setToFailedResolve()
            },
            value => {
                const castResult = p.callback({ type: value })
                if (castResult[0] === false) {
                    p.reporter.reportConstraintViolation({
                        expectedState: castResult[1].expected,
                        foundState: castResult[1].found,
                    })
                    builder.setToFailedResolve()
                } else {
                    builder.resolve({ value: castResult[1] })
                }
            },
        )
        return constraint
    }
    public getLookup<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => Dictionary<NewType>
    }): IDelayedResolveLookup<NewType> {
        const lookup = new DelayedResolveLookup<NewType>()
        this.addSubscriber(
            () => {
                lookup.setToFailedResolve()
            },
            value => {
                lookup.resolve(p.callback({ type: value }))
            }
        )
        return lookup
    }
    public convert<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => NewType
    }): IDelayedResolveConstraint<NewType> {
        const builder = new XBuilder<NewType>()
        const newConstraint = new DelayedResolveConstraint<NewType>(builder)
        this.addSubscriber(
            () => {
                builder.setToFailedResolve()
            },
            value => {
                builder.resolve({ value: p.callback({ type: value }) })
            }
        )
        return newConstraint
    }
    private addSubscriber(onFailed: () => void, onSuccess: (value: Type) => void) {
        if (this.resolvedValue === undefined) {
            this.subscribers.push({
                onFailed: onFailed,
                onSuccess: onSuccess,
            })
        } else {
            if (this.resolvedValue[0] === false) {
                onFailed()
            } else {
                onSuccess(this.resolvedValue[1])
            }
        }

    }

}

export class DelayedResolveConstraint<Type> implements IDelayedResolveConstraint<Type> {
    public builder: IDelayedResolvableBuilder<Type>
    constructor(builder: IDelayedResolvableBuilder<Type>) {
        this.builder = builder
    }
    //Constraint methods

    public mapResolved<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => NewType
        readonly onNotResolved: (cp: {}) => NewType
    }) {
        const resolvedValue = this.builder.getValue({})
        if (resolvedValue === undefined) {
            if (p.onNotResolved === undefined) {
                throw new Error("IMPLEMENTATION ERROR: Entry was not resolved!!!!!!!")
            } else {
                console.error("IMPLEMENTATION ERROR: Entry was not resolved!!!!!!!")
                return p.onNotResolved({})
            }
        }
        if (resolvedValue[0] === false) {
            if (p.onNotResolved === undefined) {
                throw new Error("Reference was not resolved properly")
            } else {
                return p.onNotResolved({})
            }
        } else {
            return p.callback({ type: resolvedValue[1] })
        }
    }
    public withResolved(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => void
        readonly onNotResolved?: (cp: {}) => void
    }) {
        this.mapResolved({
            callback: p.callback,
            onNotResolved: p.onNotResolved === undefined
                ? () => {
                    //
                }
                : p.onNotResolved,
        })
    }
    public getResolved(_p: {}) {
        return this.mapResolved({
            callback: x => x,
            onNotResolved: () => {
                throw new Error("Reference failed to resolve")
            },
        }).type
    }
    public getConstraint<NewType>(_p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => Constraint<NewType>
    }): Constraint<NewType> {
        throw new Error("IMPLEMENT ME")
    }
    public getNonConstraint<NewType>(_p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => NewType
    }): Constraint<NewType> {
        throw new Error("IMPLEMENT ME")
    }

}
