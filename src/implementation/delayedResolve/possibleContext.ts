import { IPossibleContext } from "../../interfaces/delayedResolve";
import { DelayedResolveConstraint, XBuilder } from "./delayedResolveConstraint";

class NonExistentContext<Type> implements IPossibleContext<Type> {
    public validateExistence() {
        const builder = new XBuilder<Type>()
        const constraint = new DelayedResolveConstraint<Type>(builder)
        builder.setToFailedResolve()
        return constraint
    }
}

export function createNonExistingContext<Type>() {
    return new NonExistentContext<Type>()
}

// tslint:disable-next-line: max-classes-per-file
class ExistingContext<Type> implements IPossibleContext<Type> {
    private readonly subscribers: Array<XBuilder<Type>> = []
    private isSet = false
    public validateExistence() {
        if (this.isSet) {
            throw new Error("UNEXPECTED")
        }
        const builder = new XBuilder<Type>()
        const constraint = new DelayedResolveConstraint<Type>(builder)
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

export function createExistingContext<Type>() {
    return new ExistingContext<Type>()
}
