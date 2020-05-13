/* eslint
    "max-classes-per-file": off,
*/

import { IDelayedResolvableBuilder, IDelayedResolveReference, IDelayedResolveStateConstraint, IRootDelayedResolvableBuilder } from "../../interfaces/delayedResolve"
import { DelayedResolveConstraint, XBuilder } from "./DelayedResolveConstraint"

export class DelayedResolveStateConstraint<Type, Constraints> extends DelayedResolveConstraint<Type> implements IDelayedResolveStateConstraint<Type> {
    private readonly constraints: Constraints
    constructor(builder: IDelayedResolvableBuilder<Type>, constraints: Constraints) {
        super(builder)
        this.constraints = constraints
    }
    public getConstraints(_cp: {}) {
        return this.constraints
    }
}

export class DelayedResolveReference<Type, Constraints> extends DelayedResolveConstraint<Type> implements IDelayedResolveReference<Type> {
    private readonly key: string
    private readonly constraints: Constraints
    constructor(key: string, builder: IDelayedResolvableBuilder<Type>, constraints: Constraints) {
        super(builder)
        this.key = key
        this.constraints = constraints
    }
    public getKey() {
        return this.key
    }
    public getConstraints(_p: {}) {
        return this.constraints
    }
}

class DelayedResolvable<Type> implements IRootDelayedResolvableBuilder<Type> {
    public readonly builder: XBuilder<Type>
    constructor(builder: XBuilder<Type>) {
        this.builder = builder
    }
    public resolve(p: { value: Type }) {
        this.builder.resolve({ value: p.value })
    }
}

export function createDelayedResolvableBuilder<T>(): IRootDelayedResolvableBuilder<T> {
    const builder = new XBuilder<T>()
    return new DelayedResolvable<T>(builder)
}
