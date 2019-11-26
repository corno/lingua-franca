import { Constraint } from "lingua-franca"
import { IDependentResolvedConstraintBuilder,  IResolvedConstrainedConstraint, IResolvedConstrainedReference, IResolvedConstraint } from "../../interfaces/instantResolve"

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
    public mapResolved<NewType>(
        callback: (type: Type) => NewType,
        onNotRolved: () => NewType
    ) {
        return this.builder.mapResolved(callback, onNotRolved)
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
    public getConstraint<NewType>(callback: (type: Type) => Constraint<NewType>): Constraint<NewType> {
        return this.builder.getConstraint(callback)
    }
    public getNonConstraint<NewType>(callback: (type: Type) => NewType): Constraint<NewType> {
        return this.builder.getNonConstraint(callback)
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
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key)
    }
}

export function createReference<ReferencedType, Constraints>(
    key: string, value: IDependentResolvedConstraintBuilder<ReferencedType>, constraints: Constraints
): IResolvedConstrainedReference<ReferencedType, Constraints> {
    return new ReferenceImp(key, value, constraints)
}
