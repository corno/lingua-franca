// tslint:disable: max-classes-per-file
import { DecoratingDictionary, FulfilledPair, FulfillingDictionary, OrderedDictionary, RequiringDictionary, Sanitizer } from "lingua-franca"
import { CallerObject, createResolvePromise } from "./createResolvePromise"
import { IDictionaryBuilder } from "./IDictionaryBuilder"
import { IIntermediateDecoratingDictionary, IIntermediateDictionary, IIntermediateFulfillingDictionary, IIntermediateOrderedDictionary } from "./IIntermediateDictionary"
import { EntryPromiseType, ILookup, IStackedLookup } from "./ILookup"
import { IResolvePromise } from "./IResolvePromise"
import { IResolveReporter } from "./IResolveReporter"
import { IUnsureReference } from "./IUnsure"

type RawDictionary<Type> = { [key: string]: Type }

//type KeyValuePair<Type> = { key: string; value: Type }

type FinishedInsertion = boolean

class DictionaryImp<Type> implements ILookup<Type>, IIntermediateDictionary<Type> {
    protected readonly dictionary: { [key: string]: Type } = {}
    constructor(dictionary: { [key: string]: Type }) {
        this.dictionary = dictionary
    }
    public getEntryOrEntryPromise(key: string): EntryPromiseType<Type> {
        const entry = this.getEntry(key)
        if (entry !== null) {
            return ["already registered", entry]
        }
        return ["not yet registered", createResolvePromise<Type>((onFailed, onResult) => {
            const entry2 = this.dictionary[key]
            if (entry2 === undefined) {
                onFailed(null)
            } else {
                onResult(entry2)
            }
        })]
    }
    public getEntry(key: string): null | Type {
        const entry = this.dictionary[key]
        if (entry === undefined) {
            return null
        } else {
            return entry
        }
    }
    public forEachAlphabetically(
        onElement: (element: Type, getKey: (sanitizer: Sanitizer) => string) => void,
        onSepartor?: () => void,
        onBeforeFirst?: () => void,
        onAfterLast?: () => void,
        onEmpty?: () => void,
    ) {
        this.forEachImp(this.getKeys(), onElement, onSepartor, onBeforeFirst, onAfterLast, onEmpty)
    }
    public has(key: string) {
        return this.dictionary[key] !== undefined
    }
    public getKeys() {
        return Object.keys(this.dictionary).sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
    }
    protected forEachImp(
        keys: string[],
        onElement: (element: Type, getKey: (sanitizer: Sanitizer) => string) => void,
        onSepartor?: () => void,
        onBeforeFirst?: () => void,
        onAfterLast?: () => void,
        onEmpty?: () => void,
    ) {
        const isEmpty = keys.length === 0
        if (isEmpty) {
            if (onEmpty !== undefined) {
                onEmpty()
            }
            return
        }
        if (isEmpty && onBeforeFirst !== undefined) {
            onBeforeFirst()
        }
        keys.forEach((key, index) => {
            if (index !== 0 && onSepartor !== undefined) {
                onSepartor()
            }
            onElement(this.dictionary[key], sanitizer => sanitizer(key))
        })
        if (!isEmpty && onAfterLast !== undefined) {
            onAfterLast()
        }
    }
    get isEmpty() {
        return this.getKeys().length === 0
    }
}

class DictionaryBuilder<Type> implements IDictionaryBuilder<Type> {
    public readonly dictionary: RawDictionary<Type> = {}
    private readonly subscribers: Array<{ key: string; caller: CallerObject<Type> }> = []
    private finalized = false
    private readonly resolveReporter: IResolveReporter
    private readonly missingEntryContext: null | MissingEntryContext<Type>
    private readonly typeInfo: string
    constructor(resolveReporter: IResolveReporter, missingEntryContext: null | MissingEntryContext<Type>, typeInfo: string) {
        this.resolveReporter = resolveReporter
        this.missingEntryContext = missingEntryContext
        this.typeInfo = typeInfo
    }
    public add(key: string, entry: Type) {
        if (this.finalized) {
            throw new Error("Already finalized")
        }
        if (this.dictionary[key] !== undefined) {
            this.resolveReporter.reportConflictingEntry(this.typeInfo, key)
            return
        }
        this.dictionary[key] = entry
    }
    public getEntryOrEntryPromise(key: string): EntryPromiseType<Type> {
        if (this.finalized) {
            throw new Error("DictionaryBuilder is already finalized, use the resulting dictionary")
        }
        const entry = this.getEntry(key)
        if (entry !== null) {
            return ["already registered", entry]
        }
        return ["not yet registered", createResolvePromise<Type>((onFailed, onResult) => {
            this.subscribers.push({
                key: key,
                caller: {
                    onFailed: onFailed,
                    onResult: onResult,
                },
            })
        })]
    }
    public getEntry(key: string): null | Type {
        const entry = this.dictionary[key]
        if (entry === undefined) {
            return null
        } else {
            return entry
        }
    }
    public getKeys() {
        return Object.keys(this.dictionary).sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
    }
    public finalize() {
        if (this.finalized) {
            throw new Error("Already finalized")
        }
        this.finalized = true
        this.subscribers.forEach(subscriber => {
            const entry = this.dictionary[subscriber.key]
            if (entry === undefined) {
                if (this.missingEntryContext !== null) {
                    const precedingEntry = this.missingEntryContext.referencedDictionary.getEntry(subscriber.key)
                    if (precedingEntry === null) {
                        subscriber.caller.onFailed(null)
                    } else {
                        subscriber.caller.onResult(precedingEntry)
                    }
                } else {
                    subscriber.caller.onFailed(null)
                }
            } else {
                subscriber.caller.onResult(entry)
            }
        })
    }
}

export function createDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IIntermediateDictionary<Type> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    return new DictionaryImp(dict.dictionary)
}

type MissingEntryContext<Type> = {
    referencedDictionary: ILookup<Type>
    missingEntryCreator: (key: string, previousEntry: Type) => Type
}

export function createHackedStackedDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IIntermediateDictionary<Type> {
    console.error("HACKED STACKED")
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    return new DictionaryImp(dict.dictionary)
}

export function createStackedDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
    referencedDictionary: IStackedLookup<Type>,
    missingEntryCreator: (key: string, previousEntry: Type) => Type,
): IIntermediateDictionary<Type> {
    const missingEntryContext: null | MissingEntryContext<Type> =
        referencedDictionary === null
            ? null
            : {
                referencedDictionary: referencedDictionary,
                missingEntryCreator: missingEntryCreator,
            }
    const dict = new DictionaryBuilder<Type>(resolveReporter, missingEntryContext, typeInfo)
    callback(dict)
    dict.finalize()
    return new DictionaryImp(dict.dictionary)
}

class OrderedDictionaryImp<Type> extends DictionaryImp<Type> implements OrderedDictionary<Type> {
    public readonly decorating = true
    private readonly orderedArray: Array<string>
    constructor(dictionary: RawDictionary<Type>, orderedArray: Array<string>) {
        super(dictionary)
        this.orderedArray = orderedArray
    }
    public forEach(
        onElement: (element: Type, getKey: (sanitizer: Sanitizer) => string) => void,
        onSepartor?: () => void,
        onBeforeFirst?: () => void,
        onAfterLast?: () => void,
        onEmpty?: () => void,
    ) {
        this.forEachImp(this.orderedArray, onElement, onSepartor, onBeforeFirst, onAfterLast, onEmpty)
    }
    public mapToArray<NewType>(callback: (entry: Type, key: string) => NewType) {
        return this.getKeys().map(key => ({
            key: key,
            value: callback(this.dictionary[key], key),
        }))
    }
}

export function createOrderedDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
    getDependencies: (entry: Type) => string[]
): IIntermediateOrderedDictionary<Type> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    const array: Array<string> = []
    const alreadyInserted: { [key: string]: FinishedInsertion } = {}
    const process = (key: string) => {
        const isInserted = alreadyInserted[key]
        if (isInserted === undefined) {
            const entry = dict.dictionary[key]
            if (entry === undefined) {
                //this can happen when the caller returns an invalid key upon getDependencies
                //console.error("Entry does not exist: " + key)
                return
            }
            alreadyInserted[key] = false
            getDependencies(entry).forEach(process)
            array.push(key)
        } else {
            if (!isInserted) {
                throw new Error("Circular dependency detected")
            }
        }
    }
    Object.keys(dict.dictionary).forEach(key => {
        process(key)
    })
    return new OrderedDictionaryImp(dict.dictionary, array)
}

class DecoratingDictionaryImp<Type> extends DictionaryImp<Type>
    implements DecoratingDictionary<Type> {
    public readonly decorating = true
}

export interface IUnsureDecoratableLookup<Type> {
    getDecoratableEntry(key: string, resolveReporter: IResolveReporter, type: string): IUnsureReference<Type>
}

// class UnresolvedDecoratableLookupImp<Type> implements IUnsureDecoratableLookup<Type> {
//     public getEntry(key: string, resolveReporter: IResolveReporter, type: string) {
//         resolveReporter.reportDependentUnresolvedDecoratingEntry(type, key)
//         return null
//     }
// }

// class ResolvedDecoratableLookupImp<Type> implements IUnsureDecoratableLookup<Type> {
//     public readonly lookup: ILookup<Type>
//     constructor(lookup: ILookup<Type>) {
//         this.lookup = lookup
//     }
//     public getEntry(key: string, resolveReporter: IResolveReporter, type: string) {
//         const entry = this.lookup.getEntry(key)
//         if (entry === null) {
//             resolveReporter.reportUnresolvedDecoratingEntry(type, key, this.lookup.getKeys())
//         }
//         return entry
//     }
// }


export function createDecoratingDictionary<Type, ReferencedType>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    referencedDictionary: IUnsureDecoratableLookup<ReferencedType>,
    callback: (dictBuilder: IDictionaryBuilder<Type>, referencedDictionary: IUnsureDecoratableLookup<ReferencedType>) => void,
): IIntermediateDecoratingDictionary<Type> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict, referencedDictionary)
    dict.finalize()
    return new DecoratingDictionaryImp<Type>(dict.dictionary)
}

class FulfillingDictionaryImp<Type, ReferencedType>
    extends DictionaryImp<FulfilledPair<Type, ReferencedType>>
    implements FulfillingDictionary<Type, ReferencedType> {
    public readonly fulfilling = true
    // public getMatchedEntry(key: string, _targetEntry: ReferencedType) {
    //     const entry = this.dictionary[key]
    //     if (entry === undefined) {
    //         throw new Error("missing entry in fulfiling dictionary")
    //     }
    // }
}

export function createFulfillingDictionary<Type, ReferencedType>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    referencedDictionary: IResolvePromise<RequiringDictionary<ReferencedType>> | false, //FIXME remove 'false' as a option. (TEMPORARY HACK)
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IIntermediateFulfillingDictionary<Type, ReferencedType> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    const pairedDictionary: RawDictionary<FulfilledPair<Type, ReferencedType>> = {}
    if (referencedDictionary === false) {
        console.error("FULFILLING DICTIONARY HACK")
        resolveReporter.reportDependentUnresolvedDictionary(typeInfo)
        const keys = Object.keys(dict.dictionary)
        keys.forEach(key => {
            //console.log(key, referencedDictionary.has(key), referencedKeys)
            pairedDictionary[key] = {
                entry: dict.dictionary[key],
                fulfilledEntry: null,
            }
        })
        return new FulfillingDictionaryImp<Type, ReferencedType>(pairedDictionary)
    }
    referencedDictionary.handlePromise(
        _error => {
            resolveReporter.reportDependentUnresolvedDictionary(typeInfo)
        },
        rd => {
            const keys = Object.keys(dict.dictionary)
            const referencedKeys = rd.getKeys()
            // if (keys.length < referencedKeys.length) {
            //     resolveReporter.reportMissingEntries(type, referencedDictionary.getKeys().filter(key => dict.dictionary[key] === undefined))
            // }
            // if (Object.keys(dict.dictionary).length > keys.length) {
            //     resolveReporter.reportSuperfluousEntries(type, keys.filter(key => referencedDictionary.has(key) === undefined))
            // }
            keys.forEach(key => {
                //console.log(key, referencedDictionary.has(key), referencedKeys)
                const referencedEntry = rd.getEntry(key)
                if (referencedEntry === null) {
                    resolveReporter.reportSuperfluousFulfillingEntry(typeInfo, key, referencedKeys)
                }
                pairedDictionary[key] = {
                    entry: dict.dictionary[key],
                    fulfilledEntry: referencedEntry,
                }
            })
            referencedKeys.forEach(key => {
                const entry = dict.dictionary[key]
                if (entry === undefined) {
                    resolveReporter.reportMissingRequiredEntry(typeInfo, key, keys)
                }
            })
        }
    )
    return new FulfillingDictionaryImp<Type, ReferencedType>(pairedDictionary)
}
