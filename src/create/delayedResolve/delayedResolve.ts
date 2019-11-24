// tslint:disable max-classes-per-file
import { Dictionary, Sanitizer } from "lingua-franca"
import { IDelayedResolvable, IDelayedResolvableBuilder, IDelayedResolveLookup, IDelayedResolveReference, IDelayedResolveStateConstraint } from "../../interfaces/delayedResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { DelayedResolveConstraint } from "./delayedResolveConstraint"
import { DelayedResolveLookup } from "./DelayedResolveLookup"

export class DelayedResolveStateConstraint<Type> extends DelayedResolveConstraint<Type> implements IDelayedResolveStateConstraint<Type> {
    constructor(resolveReporter: IResolveReporter) {
        super(resolveReporter)
    }
}

export class DelayedResolveReference<Type> extends DelayedResolveConstraint<Type> implements IDelayedResolveReference<Type> {
    private readonly key: string
    constructor(key: string, resolveReporter: IResolveReporter) {
        super(resolveReporter)
        this.key = key
    }
    public getKey(sanitizer: Sanitizer) {
        return sanitizer(this.key)
    }
}

class DelayedResolvable<Type> implements IDelayedResolvable<Type> {
    private readonly resolveReporter: IResolveReporter
    private readonly subscribers: Array<(value: Type) => void> = []
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public getLookup<NewType>(callback: (type: Type) => Dictionary<NewType>): IDelayedResolveLookup<NewType> {
        const lookup = new DelayedResolveLookup<NewType>(this.resolveReporter)
        this.subscribers.push(value => {
            lookup.resolve(callback(value))
        })
        return lookup
    }
    public resolve(value: Type) {
        this.subscribers.forEach(s => s(value))
    }
}

export function createDelayedResolvable<T>(resolveReporter: IResolveReporter): IDelayedResolvableBuilder<T> {
    return new DelayedResolvable<T>(resolveReporter)
}
