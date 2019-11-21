// tslint:disable: max-classes-per-file
import { Dictionary } from "lingua-franca"
import { IDependentLookup, IResolved, IResolvedReference } from "../../interfaces/instantResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createReference } from "./referenceBaseClasses"
import { createNullResolved, wrapResolved } from "./resolved"

// class NonExistentLookupImp<Type> implements IDependentLookup<Type> {
//     private readonly resolveReporter: IResolveReporter
//     constructor(resolveReporter: IResolveReporter) {
//         this.resolveReporter = resolveReporter
//     }
//     public createDependentReference(
//         key: string,
//         typeInfo: string,
//     ): IResolvedDependentReference<Type> {
//         this.resolveReporter.reportReferenceToNonExistentLookup(typeInfo, key)
//         return new DependentReferenceImp(key, createNullResolved<Type>(this.resolveReporter))

//     }
// }

// export function createNonExistentLookup<Type>(resolveReporter: IResolveReporter): IDependentLookup<Type> {
//     return new NonExistentLookupImp<Type>(resolveReporter)
// }


class DependentLookupImp<Type> implements IDependentLookup<Type> {
    private readonly dictionary: Dictionary<Type>
    private readonly resolveReporter: IResolveReporter
    constructor(dictionary: Dictionary<Type>, resolveReporter: IResolveReporter) {
        this.dictionary = dictionary
        this.resolveReporter = resolveReporter
    }
    public createDependentReference(
        key: string,
        typeInfo: string,
    ): IResolvedReference<Type> {
        const entry = this.getEntryX(key, this.resolveReporter, typeInfo)
        return createReference(key, entry)
    }
    private getEntryX(key: string, resolveReporter: IResolveReporter, typeInfo: string): IResolved<Type> {
        const entry = this.dictionary.getEntry(key)
        if (entry === null) {
            resolveReporter.reportUnresolvedReference(typeInfo, key, this.dictionary.getKeys(), false)
            return createNullResolved(this.resolveReporter)
        }
        return wrapResolved(entry, this.resolveReporter)
    }
}

export function createDependentLookup<Type>(dict: Dictionary<Type>, resolveReporter: IResolveReporter): IDependentLookup<Type> {
    return new DependentLookupImp(dict, resolveReporter)
}

class UnresolvedLookupImp<Type> implements IDependentLookup<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public createDependentReference(
        key: string,
        typeInfo: string,
    ): IResolvedReference<Type> {
        this.resolveReporter.reportDependentUnresolvedReference(typeInfo, key, false)
        return createReference(key, createNullResolved<Type>(this.resolveReporter))

    }
}

export function createNullLookup<Type>(resolveReporter: IResolveReporter): IDependentLookup<Type> {
    return new UnresolvedLookupImp<Type>(resolveReporter)
}
