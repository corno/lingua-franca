// tslint:disable: max-classes-per-file
import { OrderedDictionary, Sanitizer } from "lingua-franca"
import { EntryPromiseResult, IResolvePromise } from "../interfaces/delayedResolve"
import { IDictionary, IDictionaryBuilder } from "../interfaces/dictionary"
import { ILookup, IRequiringLookup, IStackedLookup } from "../interfaces/instantResolve"
import { IResolveReporter } from "../IResolveReporter"
import { CallerObject, createResolvePromise } from "./createDelayedResolveReference"

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

class DictionaryImp<Type> implements ILookup<Type>, IDictionary<Type> {
    protected readonly dictionary: { [key: string]: Type } = {}
    constructor(dictionary: { [key: string]: Type }) {
        this.dictionary = dictionary
    }
    public getEntryPromise(): EntryPromiseResult<Type> {
        console.error("dictionary is already final")
        return [ "already final"]
    }
    public getEntry(key: string): null | Type {
        const entry = this.dictionary[key]
        if (entry === undefined) {
            return null
        } else {
            return entry
        }
    }
    public getEntryX(key: string, resolveReporter: IResolveReporter, typeInfo: string): null | Type {
        const entry = this.dictionary[key]
        if (entry === undefined) {
            resolveReporter.reportDependentUnresolvedReference(typeInfo, key, false)
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
    private readonly stackSubscribers: Array<{ key: string; caller: CallerObject<Type> }> = []
    private readonly failedGetEntries: RawDictionary<{}> = {}
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
        } else {
            const failedGetEntry = this.failedGetEntries[key]
            if (failedGetEntry !== null) {
                this.resolveReporter.reportShouldBeDeclaredForward(this.typeInfo, key)
            }
        }
        this.dictionary[key] = entry
    }
    public getEntryPromise(key: string): EntryPromiseResult<Type> {
        if (this.finalized) {
            return [ "already final"]
        }
        const entry = this.getEntryX(key)
        if (entry !== null) {
            return ["entry already registered"]
        }
        return ["awaiting", createResolvePromise<Type>((onFailed, onResult) => {
            this.stackSubscribers.push({
                key: key,
                caller: {
                    onFailed: onFailed,
                    onResult: onResult,
                },
            })
        })]
    }
    public getEntryX(key: string): null | Type {
        const entry = this.dictionary[key]
        if (entry === undefined) {
            this.failedGetEntries[key] = {}
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
        this.stackSubscribers.forEach(subscriber => {
            const entry = this.dictionary[subscriber.key]
            if (entry === undefined) {
                if (this.missingEntryContext !== null) {
                    const precedingEntry = this.missingEntryContext.referencedDictionary.getEntryX(subscriber.key, this.resolveReporter, this.typeInfo)
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
): IDictionary<Type> {
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
): IDictionary<Type> {
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
): IDictionary<Type> {
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
    dictionary: IDictionary<Type>,
    getDependencies: (entry: Type) => string[]
): OrderedDictionary<Type> {
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

export function createDelayedResolveFulfillingDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    delayedResolveLookup: IResolvePromise<IRequiringLookup>,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IDictionary<Type> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    delayedResolveLookup.handlePromise(
        _error => {
            resolveReporter.reportUnresolvedRequiringDictionary(typeInfo, true)
        },
        lookup => {
            const keys = Object.keys(dict.dictionary)
            const requiredKeys = lookup.getKeys()
            const missingEntries = requiredKeys.filter(key => dict.dictionary[key] === undefined)
            if (missingEntries.length > 0) {
                resolveReporter.reportMissingRequiredEntries(typeInfo, missingEntries, keys, true)
            }
            keys.forEach(key => {
                if (requiredKeys.indexOf(key) === -1) {
                    resolveReporter.reportUnresolvedReference(typeInfo, key, lookup.getKeys(), true)
                }
            })
        }
    )
    return new DictionaryImp<Type>(dict.dictionary)
}

export function createFulfillingDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    lookup: IRequiringLookup,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IDictionary<Type> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    const keys = Object.keys(dict.dictionary)
    const requiredKeys = lookup.getKeys()
    const missingEntries = requiredKeys.filter(key => dict.dictionary[key] === undefined)
    if (missingEntries.length > 0) {
        resolveReporter.reportMissingRequiredEntries(typeInfo, missingEntries, keys, false)
    }
    keys.forEach(key => {
        if (requiredKeys.indexOf(key) === -1) {
            resolveReporter.reportUnresolvedReference(typeInfo, key, lookup.getKeys(), false)
        }
    })
    return new DictionaryImp<Type>(dict.dictionary)
}

export function createHackFulfillingDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IDictionary<Type> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    console.error("FULFILLING DICTIONARY HACK")
    resolveReporter.reportUnresolvedRequiringDictionary(typeInfo, true)
    return new DictionaryImp<Type>(dict.dictionary)
}
