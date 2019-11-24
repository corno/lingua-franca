// tslint:disable max-classes-per-file
import { Constraint, Dictionary } from "lingua-franca"
import { ConstraintCastResult } from "../../interfaces/ConstraintCastResult"
import { IDelayedResolveConstraint, IDelayedResolveLookup, IDelayedResolveStateConstraint } from "../../interfaces/delayedResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { DelayedResolveStateConstraint } from "./delayedResolve"
import { DelayedResolveLookup } from "./DelayedResolveLookup"

interface IResolvedSubscriber<Type> {
    onSuccess: (value: Type) => void,
    onFailed: () => void,
}

export class DelayedResolveConstraint<Type> implements IDelayedResolveConstraint<Type> {
    protected readonly resolveReporter: IResolveReporter
    private resolvedValue: undefined | [false] | [true, Type]
    private readonly subscribers: Array<IResolvedSubscriber<Type>> = []
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    //Constraint methods

    public mapResolved<NewType>(
        callback: (type: Type) => NewType,
        onNotRolved: () => NewType
    ) {
        if (this.resolvedValue === undefined) {
            if (onNotRolved === undefined) {
                throw new Error("IMPLEMENTATION ERROR: Entry was not resolved!!!!!!!")
            } else {
                console.error("IMPLEMENTATION ERROR: Entry was not resolved!!!!!!!")
                return onNotRolved()
            }
        }
        if (this.resolvedValue[0] === false) {
            if (onNotRolved === undefined) {
                throw new Error("Reference was not resolved properly")
            } else {
                return onNotRolved()
            }
        } else {
            return callback(this.resolvedValue[1])
        }
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
    public map<NewType>(_callback: (type: Type) => Constraint<NewType>): Constraint<NewType> {
        throw new Error("IMPLEMENT ME")
    }
    public mapX<NewType>(_callback: (type: Type) => NewType): Constraint<NewType> {
        throw new Error("IMPLEMENT ME")
    }

    //IDelayedResolveConstraint methods
    public castToConstraint<NewType>(callback: (type: Type) => ConstraintCastResult<NewType>, typeInfo: string): IDelayedResolveStateConstraint<NewType> {
        const constraint = new DelayedResolveStateConstraint<NewType>(this.resolveReporter)
        this.addSubscriber(
            () => {
                this.resolveReporter.reportDependentConstraintViolation(typeInfo, true)
                constraint.setToFailedResolve()
            },
            value => {
                const castResult = callback(value)
                if (castResult[0] === false) {
                    this.resolveReporter.reportConstraintViolation(typeInfo, castResult[1].expected, castResult[1].found, true)
                    constraint.setToFailedResolve()
                } else {
                    constraint.resolve(castResult[1])
                }
            },
        )
        return constraint
    }
    public convert<NewType>(callback: (type: Type) => NewType): IDelayedResolveConstraint<NewType> {
        const newConstraint = new DelayedResolveConstraint<NewType>(this.resolveReporter)
        this.addSubscriber(
            () => {
                newConstraint.setToFailedResolve()
            },
            value => {
                newConstraint.resolve(callback(value))
            }
        )
        return newConstraint
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

    //resolution methods
    public resolve(value: Type) {
        this.resolvedValue = [true, value]
        this.subscribers.forEach(s => s.onSuccess(value))
    }
    public setToFailedResolve() {
        this.resolvedValue = [false]
        this.subscribers.forEach(s => s.onFailed())
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
