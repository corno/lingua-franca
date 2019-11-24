import { IPossibleContext } from "../../interfaces/delayedResolve";
import { IResolveReporter } from "../../IResolveReporter";
import { DelayedResolveConstraint } from "./delayedResolveConstraint";

class NonExistentContext<Type> implements IPossibleContext<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public validateExistence() {
        const constraint = new DelayedResolveConstraint<Type>(this.resolveReporter)
        constraint.setToFailedResolve()
        return constraint
    }
}

export function createNonExistingContext<Type>(resolveReporter: IResolveReporter) {
    return new NonExistentContext<Type>(resolveReporter)
}

// tslint:disable-next-line: max-classes-per-file
class ExistingContext<Type> implements IPossibleContext<Type> {
    private readonly resolveReporter: IResolveReporter
    private readonly subscribers: Array<DelayedResolveConstraint<Type>> = []
    private isSet = false
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public validateExistence() {
        if (this.isSet) {
            throw new Error("UNEXPECTED")
        }
        const constraint = new DelayedResolveConstraint<Type>(this.resolveReporter)
        this.subscribers.push(constraint)
        return constraint
    }
    public set(value: Type) {
        if (this.isSet) {
            throw new Error("UNEXPECTED")
        }
        this.isSet = true
        this.subscribers.forEach(s => s.resolve(value))
    }
}

export function createExistingContext<Type>(resolveReporter: IResolveReporter) {
    return new ExistingContext<Type>(resolveReporter)
}
