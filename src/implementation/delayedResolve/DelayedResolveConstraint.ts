// tslint:disable max-classes-per-file
import { Constraint, Dictionary } from "lingua-franca"
import { ConstraintCastResult } from "../../interfaces/ConstraintCastResult"
import { IDelayedResolvableBuilder, IDelayedResolveConstrainedStateConstraint, IDelayedResolveConstraint, IDelayedResolveLookup, IDelayedResolveStateConstraint } from "../../interfaces/delayedResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { DelayedResolveStateConstraint } from "./delayedResolve"
import { DelayedResolveLookup } from "./DelayedResolveLookup"

interface IResolvedSubscriber<Type> {
    onSuccess: (value: Type) => void,
    onFailed: () => void,
}

export class XBuilder<Type> implements IDelayedResolvableBuilder<Type> {
    private resolvedValue: undefined | [false] | [true, Type]
    private readonly subscribers: Array<IResolvedSubscriber<Type>> = []
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public getValue() {
        return this.resolvedValue
    }

    //resolution methods
    public resolve(value: Type) {
        this.resolvedValue = [true, value]
        this.subscribers.forEach(s => s.onSuccess(value))
    }
    public setToFailedResolve() {
        this.resolvedValue = [false]
        this.subscribers.forEach(s => s.onFailed())
    }

    //IDelayedResolveConstraint methods
    public castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IDelayedResolveStateConstraint<NewType> {
        return this.castToConstrainedConstraint(callback, typeInfo, () => ({}))
    }

    //IDelayedResolveConstraint methods
    public castToConstrainedConstraint<NewType, Constraints>(
        callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string, getConstraints: (builder: IDelayedResolvableBuilder<NewType>) => Constraints
    ): IDelayedResolveConstrainedStateConstraint<NewType, Constraints> {
        const builder = new XBuilder<NewType>(this.resolveReporter)
        const constraints = getConstraints(builder)
        const constraint = new DelayedResolveStateConstraint<NewType, Constraints>(this.resolveReporter, builder, constraints)
        this.addSubscriber(
            () => {
                this.resolveReporter.reportDependentConstraintViolation(typeInfo, true)
                builder.setToFailedResolve()
            },
            value => {
                const castResult = callback(value)
                if (castResult[0] === false) {
                    this.resolveReporter.reportConstraintViolation(typeInfo, castResult[1].expected, castResult[1].found, true)
                    builder.setToFailedResolve()
                } else {
                    builder.resolve(castResult[1])
                }
            },
        )
        return constraint
    }
    public getLookup<NewType>(callback: (type: Type) => Dictionary<NewType>): IDelayedResolveLookup<NewType> {
        const lookup = new DelayedResolveLookup<NewType>(this.resolveReporter)
        this.addSubscriber(
            () => {
                lookup.setToFailedResolve()
            },
            value => {
                lookup.resolve(callback(value))
            }
        )
        return lookup
    }
    public convert<NewType>(callback: (type: Type) => NewType): IDelayedResolveConstraint<NewType> {
        const builder = new XBuilder<NewType>(this.resolveReporter)
        const newConstraint = new DelayedResolveConstraint<NewType>(this.resolveReporter, builder)
        this.addSubscriber(
            () => {
                builder.setToFailedResolve()
            },
            value => {
                builder.resolve(callback(value))
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
    protected readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter, builder: IDelayedResolvableBuilder<Type>) {
        this.resolveReporter = resolveReporter
        this.builder = builder
    }
    //Constraint methods

    public mapResolved<NewType>(p: {
       readonly callback: (type: Type) => NewType,
       readonly onNotResolved: () => NewType
    }) {
        const resolvedValue = this.builder.getValue()
        if (resolvedValue === undefined) {
            if (p.onNotResolved === undefined) {
                throw new Error("IMPLEMENTATION ERROR: Entry was not resolved!!!!!!!")
            } else {
                console.error("IMPLEMENTATION ERROR: Entry was not resolved!!!!!!!")
                return p.onNotResolved()
            }
        }
        if (resolvedValue[0] === false) {
            if (p.onNotResolved === undefined) {
                throw new Error("Reference was not resolved properly")
            } else {
                return p.onNotResolved()
            }
        } else {
            return p.callback(resolvedValue[1])
        }
    }
    public withResolved(p: { readonly callback: (type: Type) => void, readonly onNotResolved?: () => void }) {
        this.mapResolved({ callback: p.callback, onNotResolved: p.onNotResolved === undefined ? () => { } : p.onNotResolved})
    }
    public getResolved(_p: {}) {
        return this.mapResolved({
         callback:   x => x,
         onNotResolved:   () => {
                throw new Error("Reference failed to resolve")
            }
        })
    }
    public getConstraint<NewType>(_p: { readonly callback: (type: Type) => Constraint<NewType>}): Constraint<NewType> {
        throw new Error("IMPLEMENT ME")
    }
    public getNonConstraint<NewType>(_p: { readonly callback: (type: Type) => NewType}): Constraint<NewType> {
        throw new Error("IMPLEMENT ME")
    }

}
