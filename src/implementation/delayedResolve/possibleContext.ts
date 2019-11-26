import { IPossibleContext } from "../../interfaces/delayedResolve";
import { IResolveReporter } from "../../IResolveReporter";
import { DelayedResolveConstraint, XBuilder } from "./delayedResolveConstraint";

class NonExistentContext<Type> implements IPossibleContext<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public validateExistence() {
        const builder = new XBuilder<Type>(this.resolveReporter)
        const constraint = new DelayedResolveConstraint<Type>(this.resolveReporter, builder)
        builder.setToFailedResolve()
        return constraint
    }
}

export function createNonExistingContext<Type>(resolveReporter: IResolveReporter) {
    return new NonExistentContext<Type>(resolveReporter)
}

// tslint:disable-next-line: max-classes-per-file
class ExistingContext<Type> implements IPossibleContext<Type> {
    private readonly resolveReporter: IResolveReporter
    private readonly subscribers: Array<XBuilder<Type>> = []
    private isSet = false
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public validateExistence() {
        if (this.isSet) {
            throw new Error("UNEXPECTED")
        }
        const builder = new XBuilder<Type>(this.resolveReporter)
        const constraint = new DelayedResolveConstraint<Type>(this.resolveReporter, builder)
        this.subscribers.push(builder)
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
