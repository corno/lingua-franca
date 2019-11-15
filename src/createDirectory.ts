// tslint:disable: max-classes-per-file
import { DecoratingDictionary, FulfillingDictionary, OrderedDictionary, RequiringDictionary, Sanitizer, TypePair } from "lingua-franca"
import { CallerObject, createResolvePromise } from "./createResolvePromise"
import { IDictionaryBuilder } from "./IDictionaryBuilder"
import { IIntermediateDecoratingDictionary, IIntermediateDictionary, IIntermediateFulfillingDictionary, IIntermediateOrderedDictionary } from "./IIntermediateDictionary"
import { ILookup, IStackedLookup } from "./ILookup"
import { IResolvePromise } from "./IResolvePromise"
import { IResolveReporter } from "./IResolveReporter"
import { IUnsure } from "./IUnsure"

type RawDictionary<Type> = { [key: string]: Type }

//type KeyValuePair<Type> = { key: string; value: Type }

type FinishedInsertion = boolean

class DictionaryImp<Type> implements ILookup<Type>, IIntermediateDictionary<Type> {
    protected readonly dictionary: { [key: string]: Type } = {}
    constructor(dictionary: { [key: string]: Type }) {
        this.dictionary = dictionary
    }
    public getEntryPromise(name: string): IResolvePromise<Type> {
        return createResolvePromise<Type>((onFailed, onResult) => {
            const entry = this.dictionary[name]
            if (entry === undefined) {
                onFailed(null)
            } else {
                onResult(entry)
            }
        })
    }
    public getEntry(name: string): null | Type {
        const entry = this.dictionary[name]
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
    private readonly subscribers: Array<{ name: string; caller: CallerObject<Type> }> = []
    private readonly possibleForwards: { [key: string]: null } = {}
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
        if (this.possibleForwards[key] !== undefined) {
            //@ts-ignore
            console.error(`found entry "${key}" after reference, change the order of the entries`)
        }
        if (this.dictionary[key] !== undefined) {
            this.resolveReporter.reportConflictingEntry(this.typeInfo, key)
            return
        }
        this.dictionary[key] = entry
    }
    public getEntryPromise(name: string): IResolvePromise<Type> {
        if (this.finalized) {
            throw new Error("DictionaryBuilder is already finalized, use the resulting dictionary")
        }
        return createResolvePromise<Type>((onFailed, onResult) => {
            this.subscribers.push({
                name: name,
                caller: {
                    onFailed: onFailed,
                    onResult: onResult,
                },
            })
        })
    }
    public getEntry(name: string): null | Type {
        const entry = this.dictionary[name]
        if (entry === undefined) {
            this.possibleForwards[name] = null
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
            const entry = this.dictionary[subscriber.name]
            if (entry === undefined) {
                if (this.missingEntryContext !== null) {
                    const precedingEntry = this.missingEntryContext.referencedDictionary.getEntry(subscriber.name)
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
    public mapToArray<NewType>(callback: (entry: Type, name: string) => NewType) {
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

class DecoratingDictionaryImp<Type, ReferencedType> extends DictionaryImp<TypePair<Type, ReferencedType>>
    implements DecoratingDictionary<Type, ReferencedType> {
    public readonly decorating = true
}

export function createDecoratingDictionary<Type, ReferencedType>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    referencedDictionary: IUnsure<IIntermediateDictionary<ReferencedType>>,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IIntermediateDecoratingDictionary<Type, ReferencedType> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()

    const dictionary: RawDictionary<TypePair<Type, ReferencedType>> = {}
    if (referencedDictionary.value !== null) {
        const refDict = referencedDictionary.value
        Object.keys(dict.dictionary).forEach(key => {
            const entry = dict.dictionary[key]
            const referencedEntry = refDict.getEntry(key)
            if (referencedEntry === null) {
                resolveReporter.reportSuperfluousDecoratingEntry(typeInfo, key, refDict.getKeys())
            }
            dictionary[key] = {
                entry: entry,
                referencedEntry: referencedEntry,
            }
        })
    } else {
        Object.keys(dict.dictionary).forEach(key => {
            const entry = dict.dictionary[key]
            dictionary[key] = {
                entry: entry,
                referencedEntry: null,
            }
        })
    }

    return new DecoratingDictionaryImp<Type, ReferencedType>(dictionary)
}

class FulfillingDictionaryImp<Type, ReferencedType> extends DictionaryImp<TypePair<Type, ReferencedType>> implements FulfillingDictionary<Type, ReferencedType> {
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
    const pairedDictionary: RawDictionary<TypePair<Type, ReferencedType>> = {}
    if (referencedDictionary === false) {
        console.error("FULFILLING DICTIONARY HACK")
        resolveReporter.reportDependentUnresolvedDictionary(typeInfo)
        const keys = Object.keys(dict.dictionary)
        keys.forEach(key => {
            //console.log(key, referencedDictionary.has(key), referencedKeys)
            pairedDictionary[key] = {
                entry: dict.dictionary[key],
                referencedEntry: null,
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
                    referencedEntry: referencedEntry,
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
