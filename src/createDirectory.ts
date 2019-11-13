// tslint:disable: max-classes-per-file
import { DecoratingDictionary, FulfillingDictionary, OrderedDictionary, RequiringDictionary, ResolvePromise, TypePair } from "lingua-franca"
import { CallerObject, createResolvePromise } from "./createResolvePromise"
import { IDictionaryBuilder } from "./IDictionaryBuilder"
import { IIntermediateDecoratingDictionary, IIntermediateDictionary, IIntermediateFulfillingDictionary, IIntermediateOrderedDictionary } from "./IIntermediateDictionary"
import { ILookup, IStackedLookup } from "./ILookup"
import { IResolveReporter } from "./IResolveReporter"
import { IUnsure } from "./IUnsure"

type RawDictionary<Type> = { [key: string]: Type }

type KeyValuePair<Type> = { key: string; value: Type }

type FinishedInsertion = boolean

class DictionaryImp<Type> implements ILookup<Type>, IIntermediateDictionary<Type> {
    protected readonly dictionary: { [key: string]: Type } = {}
    constructor(dictionary: { [key: string]: Type }) {
        this.dictionary = dictionary
    }
    public getEntryPromise(name: string): ResolvePromise<Type> {
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
    public filter<NewType>(): ILookup<NewType> {
        throw new Error("IMPLEMENT ME")
    }
    public forEachAlphabetically(callback: (entry: Type, isFirst: boolean) => void) {
        this.getKeys().forEach((key, index) => callback(this.dictionary[key], index === 0))
    }
    public forEachAlphabeticallyWithKey(sanitize: (rawKey: string) => string, callback: (entry: Type, key: string, isFirst: boolean) => void) {
        this.getKeys().forEach((key, index) => callback(this.dictionary[key], sanitize(key), index === 0))
    }
    public mapToArray<NewType>(callback: (entry: Type, name: string) => NewType) {
        return this.getKeys().map(key => callback(this.dictionary[key], key))
    }
    public has(key: string) {
        return this.dictionary[key] !== undefined
    }
    public getKeys() {
        return Object.keys(this.dictionary).sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
    }
    get isEmpty(): boolean {
        return this.getKeys().length === 0
    }
}

// class FilteredForwardLookup<OldType, NewType> implements IForwardLookup<NewType> {
//     private readonly oldLookup: IForwardLookup<OldType>
//     private readonly filterCallback: (entry: OldType) => [false] | [true, NewType]
//     constructor(oldLookup: IForwardLookup<OldType>, filterCallback: (entry: OldType) => [false] | [true, NewType]) {
//         this.oldLookup = oldLookup
//         this.filterCallback = filterCallback
//     }
//     public getEntryPromise(name: string): ResolvePromise<NewType> {
//         return promisify<NewType>((onNewFailed, onNewSuccess) => {
//             this.oldLookup.getEntryPromise(name).handlePromise(onNewFailed, oldEntry => {
//                 const filterResult = this.filterCallback(oldEntry)
//                 if (filterResult[0] === true) {
//                     onNewSuccess(filterResult[1])
//                 } else {
//                     // tslint:disable-next-line: no-console
//                     //console.log("The entry is there before filtering")
//                     onNewFailed(null)
//                 }
//             })
//         })
//     }
//     // public getKeys(): string[] {
//     //     const oldKeys = this.oldLookup.getKeys()
//     //     const newKeys: string[] = []
//     //     oldKeys.forEach(oldKey => {
//     //         const newEntry = this.getEntry(oldKey)
//     //         if (newEntry !== null) {
//     //             newKeys.push(oldKey)
//     //         }
//     //     })
//     //     return newKeys
//     // }
//     // public filter<EvenNewerType>(callback: (entry: NewType) => [false] | [true, EvenNewerType]): ILookup<EvenNewerType> {
//     //     return new FilteredLookup<NewType, EvenNewerType>(this, callback)
//     // }
// }

class FilteredLookup<OldType, NewType> implements ILookup<NewType> {
    private readonly oldLookup: ILookup<OldType>
    private readonly filterCallback: (entry: OldType) => [false] | [true, NewType]
    constructor(oldLookup: ILookup<OldType>, filterCallback: (entry: OldType) => [false] | [true, NewType]) {
        this.oldLookup = oldLookup
        this.filterCallback = filterCallback
    }
    public getEntry(key: string): NewType | null {
        const oldEntry = this.oldLookup.getEntry(key)
        if (oldEntry === null) {
            return null
        } else {
            const filterResult = this.filterCallback(oldEntry)
            if (filterResult[0] === true) {
                return filterResult[1]
            } else {
                return null
            }
        }
    }
    public getKeys(): string[] {
        const oldKeys = this.oldLookup.getKeys()
        const newKeys: string[] = []
        oldKeys.forEach(oldKey => {
            const newEntry = this.getEntry(oldKey)
            if (newEntry !== null) {
                newKeys.push(oldKey)
            }
        })
        return newKeys
    }
    public filter<EvenNewerType>(callback: (entry: NewType) => [false] | [true, EvenNewerType]): ILookup<EvenNewerType> {
        return new FilteredLookup<NewType, EvenNewerType>(this, callback)
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
    public getEntryPromise(name: string): ResolvePromise<Type> {
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
    public filter<NewType>(callback: (entry: Type) => [false] | [true, NewType]): ILookup<NewType> {
        return new FilteredLookup<Type, NewType>(this, callback)
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
    private readonly orderedArray: Array<KeyValuePair<Type>>
    constructor(dictionary: RawDictionary<Type>, orderedArray: Array<KeyValuePair<Type>>) {
        super(dictionary)
        this.orderedArray = orderedArray
    }
    public forEachWithKey(
        //getDependencies: (entry: Type) => string[],
        sanitizer: (rawKey: string) => string,
        callback: (entry: Type, key: string, isFirst: boolean) => void,
    ) {
        this.orderedArray.forEach((kvPair, index) => {
            callback(kvPair.value, sanitizer(kvPair.key), index === 0)
        })
    }
    public forEach(callback: (entry: Type, isFirst: boolean) => void) {
        this.forEachWithKey(key => key, (entry, _key, isFirst) => callback(entry, isFirst))
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
    const array: Array<KeyValuePair<Type>> = []
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
            array.push({ key: key, value: entry })
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
    referencedDictionary: IUnsure<RequiringDictionary<ReferencedType>>,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IIntermediateFulfillingDictionary<Type, ReferencedType> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    const pairedDictionary: RawDictionary<TypePair<Type, ReferencedType>> = {}
    if (referencedDictionary.value === null) {
        resolveReporter.reportDependentUnresolvedDictionary(typeInfo)
    } else {
        const rd = referencedDictionary.value
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
    return new FulfillingDictionaryImp<Type, ReferencedType>(pairedDictionary)
}
