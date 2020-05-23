/* eslint
    "max-classes-per-file": off,
*/
import { IDependentResolvedConstraintBuilder, IResolvedConstrainedConstraint, IResolvedConstrainedReference, IResolvedConstraint } from "../../interfaces/instantResolve"
import { Constraint } from "../../interfaces/Reference"

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
        readonly callback: (cp: {
            readonly type: Type
        }) => NewType
        readonly onNotResolved: (cp: {}) => NewType
    }) {
        return this.builder.mapResolved({ callback: p.callback, onNotResolved: p.onNotResolved })
    }
    public withResolved(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => void
        readonly onNotResolved?: (cp: {}) => void
    }) {
        this.mapResolved({
            callback: p.callback,
            onNotResolved: p.onNotResolved === undefined
                ? () => {
                    //
                }
                : p.onNotResolved,
        })
    }
    public getResolved(_p: {}) {
        return this.mapResolved({
            callback: x => x,
            onNotResolved: () => {
                throw new Error("Reference failed to resolve")
            },
        }).type
    }
    public getConstraint<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => Constraint<NewType>
    }): Constraint<NewType> {
        return this.builder.getConstraint(p)
    }
    public getNonConstraint<NewType>(p: {
        readonly callback: (cp: {
            readonly type: Type
        }) => NewType
    }): Constraint<NewType> {
        return this.builder.getNonConstraint(p)
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
    public getKey() {
        return this.key
    }
}

export function createReference<ReferencedType, Constraints>(
    key: string, value: IDependentResolvedConstraintBuilder<ReferencedType>, constraints: Constraints
): IResolvedConstrainedReference<ReferencedType, Constraints> {
    return new ReferenceImp(key, value, constraints)
}
