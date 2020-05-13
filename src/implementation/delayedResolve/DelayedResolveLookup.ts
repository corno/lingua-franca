// tslint:disable max-classes-per-file
import { IDelayedResolvableBuilder, IDelayedResolveConstrainedReference, IDelayedResolveLookup, IDelayedResolveReference } from "../../interfaces/delayedResolve"
import { Dictionary } from "../../interfaces/dictionary"
import { IFulfillingDictionaryReporter, IReferenceResolveReporter } from "../../reporters"
import { DelayedResolveReference } from "./delayedResolve"
import { XBuilder } from "./DelayedResolveConstraint"

interface IResolvedSubscriber<Type> {
    onSuccess: (value: Type) => void
    onFailed: () => void
}

export class DelayedResolveLookup<Type> implements IDelayedResolveLookup<Type> {
    private resolvedDictionary: undefined | null | Dictionary<Type>
    private readonly subscribers: IResolvedSubscriber<Dictionary<Type>>[] = []
    public validateFulfillingEntries(keys: string[], reporter: IFulfillingDictionaryReporter, requiresExhaustive: boolean) {
        this.addSubscriber(
            () => {
                keys.forEach(key => {
                    reporter.reportDependentUnresolvedEntry({ key: key })
                })
            },
            dict => {
                const requiredKeys = dict.getKeys({})
                if (requiresExhaustive) {
                    const missingEntries = requiredKeys.filter(key => keys.includes(key))
                    if (missingEntries.length > 0) {
                        reporter.reportMissingRequiredEntries({
                            missingEntries: missingEntries,
                            foundEntries: keys,
                        })
                    }
                }
                keys.forEach(key => {
                    if (requiredKeys.includes(key)) {
                        reporter.reportUnresolvedEntry({
                            key: key,
                            options: requiredKeys,
                        })
                    }
                })
            }
        )
    }
    public createReference(
        key: string,
        reporter: IReferenceResolveReporter
    ): IDelayedResolveReference<Type> {
        return this.createConstrainedReference({
            key: key,
            reporter: reporter,
            getConstraints: () => ({}),
        })
    }
    public createConstrainedReference<Constraints>(p: {
        readonly key: string
        readonly reporter: IReferenceResolveReporter
        readonly getConstraints: (cp: {
readonly builder: IDelayedResolvableBuilder<Type> }) => Constraints
    }): IDelayedResolveConstrainedReference<Type, Constraints> {
        const builder = new XBuilder<Type>()
        const ref = new DelayedResolveReference<Type, Constraints>(p.key, builder, p.getConstraints({ builder: builder }))
        this.addSubscriber(
            () => {
                p.reporter.reportDependentUnresolvedReference({ key: p.key })
            },
            dict => {
                const entry = dict.getEntry({ key: p.key })
                if (entry === null) {
                    p.reporter.reportUnresolvedReference({
                        key: p.key,
                        options: dict.getKeys({}),
                    })
                    builder.setToFailedResolve()
                } else {
                    builder.resolve({ value: entry })
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
