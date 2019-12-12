import { Constraint } from "lingua-franca"
import { IDependentResolvedConstraintBuilder, IResolvedConstrainedConstraint, IResolvedConstrainedReference, IResolvedConstraint } from "../../interfaces/instantResolve"

class ConstraintImp<Type, Constraints> implements IResolvedConstrainedConstraint<Type, Constraints> {
    public readonly builder: IDependentResolvedConstraintBuilder<Type>
    private readonly constraints: Constraints
    constructor(builder: IDependentResolvedConstraintBuilder<Type>, constraints: Constraints) {
        this.builder = builder
        this.constraints = constraints
    }
    public getConstraints() {
        return this.constraints
    }
    public mapResolved<NewType>(p: {
        readonly callback: (type: Type) => NewType
        readonly onNotResolved: () => NewType
    }) {
        return this.builder.mapResolved(p.callback, p.onNotResolved)
    }
    public withResolved(p: { readonly callback: (type: Type) => void, readonly onNotResolved?: () => void }) {
        this.mapResolved({
            callback: p.callback,
            onNotResolved: p.onNotResolved === undefined ? () => { } : p.onNotResolved,
        })
    }
    public getResolved(_p: {}) {
        return this.mapResolved({
            callback: x => x,
            onNotResolved: () => {
                throw new Error("Reference failed to resolve")
            },
        })
    }
    public getConstraint<NewType>(p: { readonly callback: (type: Type) => Constraint<NewType> }): Constraint<NewType> {
        return this.builder.getConstraint(p.callback)
    }
    public getNonConstraint<NewType>(p: { readonly callback: (type: Type) => NewType }): Constraint<NewType> {
        return this.builder.getNonConstraint(p.callback)
    }
}


export function createConstraint<ReferencedType, Constraints>(
    builder: IDependentResolvedConstraintBuilder<ReferencedType>, constraints: Constraints
): IResolvedConstraint<ReferencedType> {
    return new ConstraintImp(builder, constraints)
}

export function createStateConstraint<ReferencedType, Constraints>(
    value: IDependentResolvedConstraintBuilder<ReferencedType>, constraints: Constraints
): IResolvedConstrainedConstraint<ReferencedType, Constraints> {
    return new ConstraintImp(value, constraints)
}

// tslint:disable-next-line: max-classes-per-file
class ReferenceImp<ReferencedType, Constraints> extends ConstraintImp<ReferencedType, Constraints> implements IResolvedConstrainedReference<ReferencedType, Constraints> {
    private readonly key: string
    constructor(key: string, value: IDependentResolvedConstraintBuilder<ReferencedType>, constraints: Constraints) {
        super(value, constraints)
        this.key = key
    }
    public getKey(p: { readonly sanitizer: (rawKey: string) => string}) {
        return p.sanitizer(this.key)
    }
}

export function createReference<ReferencedType, Constraints>(
    key: string, value: IDependentResolvedConstraintBuilder<ReferencedType>, constraints: Constraints
): IResolvedConstrainedReference<ReferencedType, Constraints> {
    return new ReferenceImp(key, value, constraints)
}
