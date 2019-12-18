// tslint:disable max-classes-per-file
import { Dictionary } from "lingua-franca"
import { IDelayedResolvableBuilder, IDelayedResolveConstrainedReference, IDelayedResolveLookup, IDelayedResolveReference } from "../../interfaces/delayedResolve"
import { IFulfillingDictionaryReporter, IReferenceResolveReporter } from "../../reporters"
import { DelayedResolveReference } from "./delayedResolve"
import { XBuilder } from "./delayedResolveConstraint"

interface IResolvedSubscriber<Type> {
    onSuccess: (value: Type) => void,
    onFailed: () => void,
}

export class DelayedResolveLookup<Type> implements IDelayedResolveLookup<Type> {
    private resolvedDictionary: undefined | null | Dictionary<Type>
    private readonly subscribers: Array<IResolvedSubscriber<Dictionary<Type>>> = []
    public validateFulfillingEntries(keys: string[], reporter: IFulfillingDictionaryReporter, requiresExhaustive: boolean) {
        this.addSubscriber(
            () => {
                keys.forEach(key => {
                    reporter.reportDependentUnresolvedEntry(key)
                })
            },
            dict => {
                const requiredKeys = dict.getKeys({})
                if (requiresExhaustive) {
                    const missingEntries = requiredKeys.filter(key => keys.indexOf(key) === -1)
                    if (missingEntries.length > 0) {
                        reporter.reportMissingRequiredEntries(missingEntries, keys)
                    }
                }
                keys.forEach(key => {
                    if (requiredKeys.indexOf(key) === -1) {
                        reporter.reportUnresolvedEntry(key, requiredKeys)
                    }
                })
            }
        )
    }
    public createReference(
        key: string,
        reporter: IReferenceResolveReporter
    ): IDelayedResolveReference<Type> {
        return this.createConstrainedReference(key, reporter, () => ({}))
    }
    public createConstrainedReference<Constraints>(
        key: string,
        reporter: IReferenceResolveReporter,
        getConstraints: (builder: IDelayedResolvableBuilder<Type>) => Constraints
    ): IDelayedResolveConstrainedReference<Type, Constraints> {
        const builder = new XBuilder<Type>()
        const ref = new DelayedResolveReference<Type, Constraints>(key, builder, getConstraints(builder))
        this.addSubscriber(
            () => {
                reporter.reportDependentUnresolvedReference(key)
            },
            dict => {
                const entry = dict.getEntry({ key: key })
                if (entry === null) {
                    reporter.reportUnresolvedReference(key, dict.getKeys({}))
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
