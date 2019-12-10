// tslint:disable max-classes-per-file
import { Sanitizer } from "lingua-franca"
import { IDelayedResolvableBuilder, IDelayedResolveReference, IDelayedResolveStateConstraint, IRootDelayedResolvableBuilder } from "../../interfaces/delayedResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { DelayedResolveConstraint, XBuilder } from "./delayedResolveConstraint"

export class DelayedResolveStateConstraint<Type, Constraints> extends DelayedResolveConstraint<Type> implements IDelayedResolveStateConstraint<Type> {
    private readonly constraints: Constraints
    constructor(resolveReporter: IResolveReporter, builder: IDelayedResolvableBuilder<Type>, constraints: Constraints) {
        super(resolveReporter, builder)
        this.constraints = constraints
    }
    public getConstraints() {
        return this.constraints
    }
}

export class DelayedResolveReference<Type, Constraints> extends DelayedResolveConstraint<Type> implements IDelayedResolveReference<Type> {
    private readonly key: string
    private readonly constraints: Constraints
    constructor(key: string, resolveReporter: IResolveReporter, builder: IDelayedResolvableBuilder<Type>, constraints: Constraints) {
        super(resolveReporter, builder)
        this.key = key
        this.constraints = constraints
    }
    public getKey(sanitizer: Sanitizer) {
        return sanitizer(this.key)
    }
    public getConstraints() {
        return this.constraints
    }
}

class DelayedResolvable<Type> implements IRootDelayedResolvableBuilder<Type> {
    public readonly builder: XBuilder<Type>
    constructor(builder: XBuilder<Type>) {
        this.builder = builder
    }
    public resolve(value: Type) {
        this.builder.resolve(value)
    }
}

export function createDelayedResolvableBuilder<T>(resolveReporter: IResolveReporter): IRootDelayedResolvableBuilder<T> {
    const builder = new XBuilder<T>(resolveReporter)
    return new DelayedResolvable<T>(builder)
}
