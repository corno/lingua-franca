import { IResolved, IResolvedReference, IResolvedStateConstraint } from "../../interfaces/instantResolve"

class ConstraintImp<ReferencedType> implements IResolvedStateConstraint<ReferencedType> {
    public readonly imp: IResolved<ReferencedType>
    constructor(value: IResolved<ReferencedType>) {
        this.imp = value
    }
    public mapResolved<NewType>(
        callback: (type: ReferencedType) => NewType,
        onNotRolved: () => NewType
    ) {
        return this.imp.mapResolved(callback, onNotRolved)
    }
    public withResolved(callback: (type: ReferencedType) => void, onNotResolved?: () => void) {
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
}


export function createStateConstraint<ReferencedType>(value: IResolved<ReferencedType>) {
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

export function createReference<ReferencedType>(key: string, value: IResolved<ReferencedType>) {
    return new ReferenceImp(key, value)
}
