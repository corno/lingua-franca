// tslint:disable: max-classes-per-file
import { Dictionary } from "lingua-franca"
import { IGuaranteedLookup, IResolvedReference } from "../../interfaces/instantResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createReference } from "./referenceBaseClasses"
import { createNullResolved, wrapResolved } from "./resolved"

class GuaranteedLookupImp<Type> implements IGuaranteedLookup<Type> {
    private readonly dictionary: Dictionary<Type>
    private readonly resolveReporter: IResolveReporter
    constructor(dictionary: Dictionary<Type>, resolveReporter: IResolveReporter) {
        this.dictionary = dictionary
        this.resolveReporter = resolveReporter
    }
    public createReference(key: string, typeInfo: string): IResolvedReference<Type> {
        const entry = this.dictionary.getEntry(key)
        if (entry === null) {
            this.resolveReporter.reportUnresolvedReference(typeInfo, key, this.dictionary.getKeys(), false)
            return createReference(key, createNullResolved(this.resolveReporter))
        }
        return createReference(key, wrapResolved(entry, this.resolveReporter))

    }
}

class NullGuaranteedLookup<Type> implements IGuaranteedLookup<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public createReference(key: string, typeInfo: string): IResolvedReference<Type> {
        this.resolveReporter.reportLookupDoesNotExist(typeInfo, key)
        return createReference(key, createNullResolved(this.resolveReporter))
    }
}

export function createGuaranteedLookup<Type>(dict: Dictionary<Type>, resolveReporter: IResolveReporter): IGuaranteedLookup<Type> {
    return new GuaranteedLookupImp(dict, resolveReporter)
}

export function createNonExistantLookupPlaceholder<Type>(resolveReporter: IResolveReporter): IGuaranteedLookup<Type> {
    return new NullGuaranteedLookup(resolveReporter)
}
