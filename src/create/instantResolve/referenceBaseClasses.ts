import { Constraint } from "lingua-franca"
import { IResolved, IResolvedReference, IResolvedStateConstraint } from "../../interfaces/instantResolve"

class ConstraintImp<Type> implements IResolvedStateConstraint<Type> {
    public readonly imp: IResolved<Type>
    constructor(value: IResolved<Type>) {
        this.imp = value
    }
    public mapResolved<NewType>(
        callback: (type: Type) => NewType,
        onNotRolved: () => NewType
    ) {
        return this.imp.mapResolved(callback, onNotRolved)
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
    public map<NewType>(callback: (type: Type) => Constraint<NewType>): Constraint<NewType> {
        return this.imp.map(callback)
    }
    public mapX<NewType>(callback: (type: Type) => NewType): Constraint<NewType> {
        return this.imp.mapX(callback)
    }
}


export function createStateConstraint<ReferencedType>(value: IResolved<ReferencedType>): IResolvedStateConstraint<ReferencedType> {
    return new ConstraintImp(value)
}


// tslint:disable-next-line: max-classes-per-file
class ReferenceImp<ReferencedType> extends ConstraintImp<ReferencedType> implements IResolvedReference<ReferencedType> {
    private readonly key: string
    constructor(key: string, value: IResolved<ReferencedType>) {
        super(value)
        this.key = key
    }
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key)
    }
}

export function createReference<ReferencedType>(key: string, value: IResolved<ReferencedType>): IResolvedReference<ReferencedType> {
    return new ReferenceImp(key, value)
}
