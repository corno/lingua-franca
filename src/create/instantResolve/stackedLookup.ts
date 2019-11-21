// tslint:disable: max-classes-per-file
import { Dictionary } from "lingua-franca"
import { IResolved, IResolvedReference, IStackedLookup, IStackParent } from "../../interfaces/instantResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createReference } from "./referenceBaseClasses"
import { createNullResolved, wrapResolved } from "./resolved"

class StackedLookupRoot<Type> implements IStackParent<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public getEntry(key: string, typeInfo: string) {
        this.resolveReporter.reportReferenceToNonExistentLookup(typeInfo, key)
        return null
    }
}

export function initializeStackedLookup<Type>(resolveReporter: IResolveReporter): IStackParent<Type> {
    return new StackedLookupRoot<Type>(resolveReporter)
}

class StackedLookupImp<Type> implements IStackedLookup<Type> {
    private readonly dictionary: Dictionary<Type>
    private readonly resolveReporter: IResolveReporter
    constructor(dictionary: Dictionary<Type>, resolveReporter: IResolveReporter) {
        this.dictionary = dictionary
        this.resolveReporter = resolveReporter
    }
    public createStackedReference(
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

export function createStackedLookup<Type>(dict: Dictionary<Type>, resolveReporter: IResolveReporter): IStackedLookup<Type> {
    return new StackedLookupImp(dict, resolveReporter)
}

class UnresolvedLookupImp<Type> implements IStackedLookup<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public createStackedReference(
        key: string,
        typeInfo: string,
    ): IResolvedReference<Type> {
        this.resolveReporter.reportDependentUnresolvedReference(typeInfo, key, false)
        return createReference(key, createNullResolved<Type>(this.resolveReporter))

    }
}

export function createStackedLookupRoot<Type>(resolveReporter: IResolveReporter): IStackedLookup<Type> {
    return new UnresolvedLookupImp<Type>(resolveReporter)
}
