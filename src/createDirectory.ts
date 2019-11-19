// tslint:disable: max-classes-per-file
import { FulfilledPair, FulfillingDictionary, OrderedDictionary, RequiringDictionary, Sanitizer } from "lingua-franca"
import { CallerObject, createResolvePromise } from "./createResolvePromise"
import { IDictionaryBuilder } from "./IDictionaryBuilder"
import { IIntermediateDictionary, IIntermediateFulfillingDictionary, IIntermediateOrderedDictionary } from "./IIntermediateDictionary"
import { EntryPromiseType, ILookup, IStackedLookup } from "./ILookup"
import { IResolvePromise } from "./IResolvePromise"
import { IResolveReporter } from "./IResolveReporter"

type RawDictionary<Type> = { [key: string]: Type }

type KeyValuePair<Type> = { key: string; value: Type }

type FinishedInsertion = boolean


function orderedIterate<Type>(
    orderedElements: Array<KeyValuePair<Type>>,
    onElement: (element: Type, getKey: (sanitizer: Sanitizer) => string) => void,
    onSepartor?: () => void,
    onBeforeFirst?: () => void,
    onAfterLast?: () => void,
    onEmpty?: () => void,
) {
    const isEmpty = orderedIterate.length === 0
    if (isEmpty) {
        if (onEmpty !== undefined) {
            onEmpty()
        }
        return
    }
    if (isEmpty && onBeforeFirst !== undefined) {
        onBeforeFirst()
    }
    orderedElements.forEach((kvPair, index) => {
        if (index !== 0 && onSepartor !== undefined) {
            onSepartor()
        }
        onElement(kvPair.value, sanitizer => sanitizer(kvPair.key))
    })
    if (!isEmpty && onAfterLast !== undefined) {
        onAfterLast()
    }
}

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
        orderedIterate(this.getKeys().map(key => ({ key: key, value: this.dictionary[key] })), onElement, onSepartor, onBeforeFirst, onAfterLast, onEmpty)
    }
    public has(key: string) {
        return this.dictionary[key] !== undefined
    }
    public getKeys() {
        return Object.keys(this.dictionary).sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
    }
    public temp_getKeysInInsertionOrder() {
        return Object.keys(this.dictionary)
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

class OrderedDictionaryImp<Type> implements OrderedDictionary<Type> {
    //public readonly ordered = true
    private readonly orderedArray: Array<KeyValuePair<Type>>
    constructor(orderedArray: Array<KeyValuePair<Type>>) {
        this.orderedArray = orderedArray
    }
    public forEach(
        onElement: (element: Type, getKey: (sanitizer: Sanitizer) => string) => void,
        onSepartor?: () => void,
        onBeforeFirst?: () => void,
        onAfterLast?: () => void,
        onEmpty?: () => void,
    ) {
        orderedIterate(this.orderedArray, onElement, onSepartor, onBeforeFirst, onAfterLast, onEmpty)
    }
    public mapToArray<NewType>(callback: (entry: Type, key: string) => NewType) {
        return this.orderedArray.map(kvPair => callback(kvPair.value, kvPair.key))
    }
}

export function createOrderedDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    dictionary: IIntermediateDictionary<Type>,
    getDependencies: (entry: Type) => string[]
): IIntermediateOrderedDictionary<Type> {
    const array: Array<KeyValuePair<Type>> = []
    const alreadyInserted: { [key: string]: FinishedInsertion } = {}
    const process = (key: string) => {
        const isInserted = alreadyInserted[key]
        if (isInserted === undefined) {
            const entry = dictionary.getEntry(key)
            if (entry === null) {
                //this can happen when the caller returns an invalid key upon getDependencies
                //console.error("Entry does not exist: " + key)
                return
            }
            alreadyInserted[key] = false
            getDependencies(entry).forEach(process)
            array.push({key: key, value: entry})
        } else {
            if (!isInserted) {
                resolveReporter.reportCircularDependency(typeInfo)
            }
        }
    }
    dictionary.temp_getKeysInInsertionOrder().forEach(key => {
        process(key)
    })
    return new OrderedDictionaryImp(array)
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
    referencedDictionary: IResolvePromise<RequiringDictionary<ReferencedType>>,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IIntermediateFulfillingDictionary<Type, ReferencedType> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    const pairedDictionary: RawDictionary<FulfilledPair<Type, ReferencedType>> = {}
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

export function createHackFulfillingDictionary<Type, ReferencedType>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IIntermediateFulfillingDictionary<Type, ReferencedType> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    const pairedDictionary: RawDictionary<FulfilledPair<Type, ReferencedType>> = {}
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
