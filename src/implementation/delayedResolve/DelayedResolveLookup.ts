// tslint:disable max-classes-per-file
import { Dictionary } from "lingua-franca"
import { IDelayedResolvableBuilder, IDelayedResolveConstrainedReference, IDelayedResolveLookup, IDelayedResolveReference } from "../../interfaces/delayedResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { DelayedResolveReference } from "./delayedResolve"
import { XBuilder } from "./delayedResolveConstraint"

interface IResolvedSubscriber<Type> {
    onSuccess: (value: Type) => void,
    onFailed: () => void,
}

export class DelayedResolveLookup<Type> implements IDelayedResolveLookup<Type> {
    private resolvedDictionary: undefined | null | Dictionary<Type>
    private readonly resolveReporter: IResolveReporter
    private readonly subscribers: Array<IResolvedSubscriber<Dictionary<Type>>> = []
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public validateFulfillingEntries(keys: string[], typeInfo: string, requiresExhaustive: boolean) {
        this.addSubscriber(
            () => {
                keys.forEach(key => {
                    this.resolveReporter.reportDependentUnresolvedFulfillingDictionaryEntry(typeInfo, key, true)
                })
            },
            dict => {
                const requiredKeys = dict.getKeys({})
                if (requiresExhaustive) {
                    const missingEntries = requiredKeys.filter(key => keys.indexOf(key) === -1)
                    if (missingEntries.length > 0) {
                        this.resolveReporter.reportMissingRequiredEntries(typeInfo, missingEntries, keys, true)
                    }
                }
                keys.forEach(key => {
                    if (requiredKeys.indexOf(key) === -1) {
                        this.resolveReporter.reportUnresolvedFulfillingDictionaryEntry(typeInfo, key, requiredKeys, true)
                    }
                })
            }
        )
    }
    public createReference(
        key: string,
        typeInfo: string
    ): IDelayedResolveReference<Type> {
        return this.createConstrainedReference(key, typeInfo, ()  => ({}))
    }
    public createConstrainedReference<Constraints>(
        key: string,
        typeInfo: string,
        getConstraints: (builder: IDelayedResolvableBuilder<Type>) => Constraints
    ): IDelayedResolveConstrainedReference<Type, Constraints> {
        const builder = new XBuilder<Type>(this.resolveReporter)
        const ref = new DelayedResolveReference<Type, Constraints>(key, this.resolveReporter, builder, getConstraints(builder))
        this.addSubscriber(
            () => {
                this.resolveReporter.reportDependentUnresolvedReference(typeInfo, key, true)
            },
            dict => {
            const entry = dict.getEntry({key: key})
            if (entry === null) {
                this.resolveReporter.reportUnresolvedReference(typeInfo, key, dict.getKeys({}), true)
                builder.setToFailedResolve()
            } else {
                builder.resolve(entry)
            }
        }
        )
        return ref
    }

    public resolve(dict: Dictionary<Type>) {
        if (this.resolvedDictionary !== undefined) {
            throw new Error("UNEXPECTED: already resolved")
        }
        this.resolvedDictionary = dict
        this.subscribers.forEach(s => s.onSuccess(dict))
    }
    public setToFailedResolve() {
        if (this.resolvedDictionary !== undefined) {
            throw new Error("UNEXPECTED: already resolved")
        }
        this.resolvedDictionary = null
        this.subscribers.forEach(s => s.onFailed())
    }
    private addSubscriber(onFailed: () => void, onSuccess: (value: Dictionary<Type>) => void) {
        if (this.resolvedDictionary === undefined) {
            this.subscribers.push({
                onFailed: onFailed,
                onSuccess: onSuccess,
            })
        } else {
            if (this.resolvedDictionary === null) {
                onFailed()
            } else {
                onSuccess(this.resolvedDictionary)
            }
        }

    }

}
