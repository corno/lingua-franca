// tslint:disable: max-classes-per-file
import { DependentReference, Dictionary, Resolvable, StackedReference } from "lingua-franca"
import { ILookup, IResolvedConstraint, IResolvedDependentReference, IResolvedReference, IResolvedStackedReference, IStackedLookup, IUnsureLookup } from "../interfaces/instantResolve"
import { IResolveReporter } from "../IResolveReporter"

///

class NonExistentLookupImp<Type> implements IUnsureLookup<Type> {
    public getEntry(key: string, resolveReporter: IResolveReporter, type: string) {
        resolveReporter.reportReferenceToNonExistentLookup(type, key)
        return null
    }
}

export function createNonExistentUnsureLookup<Type>(): IUnsureLookup<Type> {
    return new NonExistentLookupImp<Type>()
}

////

class ResolvedLookupImp<Type> implements IUnsureLookup<Type> {
    public readonly dictionary: Dictionary<Type>
    constructor(dictionary: Dictionary<Type>) {
        this.dictionary = dictionary
    }
    public getEntry(key: string, resolveReporter: IResolveReporter, typeInfo: string) {
        const entry = this.dictionary.getEntry(key)
        if (entry === null) {
            resolveReporter.reportUnresolvedReference(typeInfo, key, this.dictionary.getKeys(), false)
        }
        return entry
    }
}

class UnresolvedLookupImp<Type> implements IUnsureLookup<Type> {
    public getEntry(key: string, resolveReporter: IResolveReporter, typeInfo: string) {
        resolveReporter.reportDependentUnresolvedReference(typeInfo, key, false)
        return null
    }
}

class ResolvableImp<ReferencedType> implements Resolvable<ReferencedType> {
    public readonly value: null | ReferencedType
    constructor(value: null | ReferencedType) {
        this.value = value
    }
    public getLookup<NewType>(callback: (value: ReferencedType) => Dictionary<NewType>): IUnsureLookup<NewType> {
        if (this.value === null) {
            return new UnresolvedLookupImp()
        } else {
            return new ResolvedLookupImp(callback(this.value))
        }
    }
    public mapResolved<NewType>(
        callback: (type: ReferencedType) => NewType,
        onNotRolved: () => NewType
    ) {
        if (this.value === null) {
            return onNotRolved()
        }
        return callback(this.value)
    }
    public withResolved(callback: (type: ReferencedType) => void) {
        this.mapResolved(callback, () => { })
    }
    public getResolved() {
        return this.mapResolved(
            x => x,
            () => {
                throw new Error("Reference failed to resolve")
            }
        )
    }
    public cast<NewType>(callback: (type: ReferencedType) => [false] | [true, NewType], resolveReporter: IResolveReporter, typeInfo: string): IResolvedConstraint<NewType> {
        if (this.value === null) {
            return new ConstraintImp<NewType>(null)
        } else {
            const castResult = callback(this.value)

            if (castResult[0] === false) {
                resolveReporter.reportConstraintViolation(typeInfo, false)
                return new ConstraintImp<NewType>(null)
            } else {
                return new ConstraintImp<NewType>(castResult[1])
            }
        }
    }
}


// tslint:disable-next-line: max-classes-per-file
class ReferenceBaseImp<ReferencedType> extends ResolvableImp<ReferencedType> {
    private readonly key: string
    constructor(key: string, value: null | ReferencedType) {
        super(value)
        this.key = key
    }
    public getKey(sanitize: (rawKey: string) => string) {
        return sanitize(this.key)
    }
}

class ReferenceImp<ReferencedType> extends ReferenceBaseImp<ReferencedType> implements IResolvedReference<ReferencedType> {
    public readonly regularReference: true = true
}

class ConstraintImp<ReferencedType> extends ResolvableImp<ReferencedType> implements IResolvedConstraint<ReferencedType> {
    public readonly constraint: true = true
}

class DependentReferenceImp<ReferencedType> extends ReferenceBaseImp<ReferencedType> implements DependentReference<ReferencedType> {
    public readonly dependentReference: true = true
}

class StackedReferenceImp<ReferencedType> extends ReferenceBaseImp<ReferencedType> implements StackedReference<ReferencedType> {
    public readonly stackedReference: true = true
}

export function createResolvedReference<ReferencedType>(
    typeInfo: string,
    key: string,
    resolvedLookup: ILookup<ReferencedType>,
    resolveReporter: IResolveReporter
): IResolvedReference<ReferencedType> {
    const value = resolvedLookup.getEntryX(key, resolveReporter, typeInfo)
    return new ReferenceImp(key, value)
}

export function createDependentReference<ReferencedType>(
    typeInfo: string,
    key: string,
    unsureResolvedLookup: IUnsureLookup<ReferencedType>,
    resolver: IResolveReporter
): IResolvedDependentReference<ReferencedType> {
    const entry = unsureResolvedLookup.getEntry(key, resolver, typeInfo)
    return new DependentReferenceImp(key, entry)

}

export function createReferenceToStackParent<ReferencedType>(
    typeInfo: string,
    key: string,
    stackedLookup: IStackedLookup<ReferencedType>,
    resolveReporter: IResolveReporter
): IResolvedStackedReference<ReferencedType> {
    if (stackedLookup === null) {
        resolveReporter.reportDependentUnresolvedReference(typeInfo, key, false)
        return new StackedReferenceImp<ReferencedType>(key, null)
    }
    const value = stackedLookup.getEntryX(key, resolveReporter, typeInfo)
    return new StackedReferenceImp(key, value)

}
