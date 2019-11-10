// tslint:disable: max-classes-per-file
import { DecoratingDictionary, FulfillingDictionary, RequiringDictionary, ResolvePromise, TypePair } from "lingua-franca"
import {
    IDictionaryBuilder,
    IForwardLookup,
    IIntermediateDecoratingDictionary,
    IIntermediateDictionary,
    IIntermediateFulfillingDictionary,
    ILookup,
} from "."
import { CallerObject, promisify } from "./ResolvePromise"
import { IResolveReporter } from "./ResolveReporter"

type RawDictionary<Type> = { [key: string]: Type }

//type KeyValuePair<Type> = { key: string; value: Type }

class DictionaryImp<Type> implements ILookup<Type>, IIntermediateDictionary<Type> {
    protected readonly dictionary: { [key: string]: Type } = {}
    constructor(dictionary: { [key: string]: Type }) {
        this.dictionary = dictionary
    }
    public getEntryPromise(name: string): ResolvePromise<Type> {
        return promisify<Type>((onFailed, onResult) => {
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
    public forEachAlphabetically(callback: (entry: Type, key: string, isFirst: boolean) => void) {
        this.getKeys().forEach((key, index) => callback(this.dictionary[key], key, index === 0))
    }
    public forEachOrdered(_getDependencies: (entry: Type) => Type[], _callback: (entry: Type, key: string, isFirst: boolean) => void) {
        throw new Error("IMPLEMENT ME")
    }
    public mapToArray<NewType>(callback: (entry: Type, name: string) => NewType) {
        return this.getKeys().map(key => callback(this.dictionary[key], key))
    }
    public has(key: string) {
        return this.dictionary[key] !== undefined
    }
    public getKeys() {
        return Object.keys(this.dictionary).sort()
    }
    get isEmpty(): boolean {
        return this.getKeys().length === 0
    }
}

class DecoratingDictionaryImp<Type, ReferencedType> extends DictionaryImp<TypePair<Type, ReferencedType>>
    implements DecoratingDictionary<Type, ReferencedType> {
    public readonly decorating = true
}

class FulfillingDictionaryImp<Type, ReferencedType> extends DictionaryImp<Type> implements FulfillingDictionary<Type, ReferencedType> {
    public readonly fulfilling = true
    public getMatchedEntry(key: string, _targetEntry: ReferencedType) {
        const entry = this.dictionary[key]
        if (entry === undefined) {
            throw new Error("missing entry in fulfiling dictionary")
        }
    }
}

class FilteredForwardLookup<OldType, NewType> implements IForwardLookup<NewType> {
    private readonly oldLookup: IForwardLookup<OldType>
    private readonly filterCallback: (entry: OldType) => [false] | [true, NewType]
    constructor(oldLookup: IForwardLookup<OldType>, filterCallback: (entry: OldType) => [false] | [true, NewType]) {
        this.oldLookup = oldLookup
        this.filterCallback = filterCallback
    }
    public getEntryPromise(name: string): ResolvePromise<NewType> {
        return promisify<NewType>((onNewFailed, onNewSuccess) => {
            this.oldLookup.getEntryPromise(name).handlePromise(onNewFailed, oldEntry => {
                const filterResult = this.filterCallback(oldEntry)
                if (filterResult[0] === true) {
                    onNewSuccess(filterResult[1])
                } else {
                    // tslint:disable-next-line: no-console
                    //console.log("The entry is there before filtering")
                    onNewFailed(null)
                }
            })
        })
    }
    public filter<EvenNewerType>(callback: (entry: NewType) => [false] | [true, EvenNewerType]): IForwardLookup<EvenNewerType> {
        return new FilteredForwardLookup<NewType, EvenNewerType>(this, callback)
    }
}

class DictionaryBuilder<Type> implements IDictionaryBuilder<Type> {
    public readonly dictionary: RawDictionary<Type> = {}
    private readonly subscribers: Array<{ name: string; caller: CallerObject<Type> }> = []
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
    public getEntryPromise(name: string): ResolvePromise<Type> {
        if (this.finalized) {
            throw new Error("DictionaryBuilder is already finalized, use the resulting dictionary")
        }
        return promisify<Type>((onFailed, onResult) => {
            this.subscribers.push({
                name: name,
                caller: {
                    onFailed: onFailed,
                    onResult: onResult,
                },
            })
        })
    }
    public filter<NewType>(callback: (entry: Type) => [false] | [true, NewType]): IForwardLookup<NewType> {
        return new FilteredForwardLookup<Type, NewType>(this, callback)
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

export function buildDictionary<Type>(
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
    referencedDictionary: IIntermediateDictionary<Type>
    missingEntryCreator: (key: string, previousEntry: Type) => Type
}

export function buildStackedDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
    referencedDictionary: null | IIntermediateDictionary<Type>,
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

export function buildDecoratingDictionary<Type, ReferencedType>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    referencedDictionary: null | DictionaryImp<ReferencedType>,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IIntermediateDecoratingDictionary<Type, ReferencedType> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()

    const dictionary: RawDictionary<TypePair<Type, ReferencedType>> = {}
    if (referencedDictionary !== null) {
        Object.keys(dict.dictionary).forEach(key => {
            const entry = dict.dictionary[key]
            const referencedEntry = referencedDictionary.getEntry(key)
            if (referencedEntry === null) {
                resolveReporter.reportSuperfluousDecoratingEntry(typeInfo, key, referencedDictionary.getKeys())
            }
            dictionary[key] = {
                type: entry,
                referencedEntry: referencedEntry,
            }
        })
    } else {
        Object.keys(dict.dictionary).forEach(key => {
            const entry = dict.dictionary[key]
            dictionary[key] = {
                type: entry,
                referencedEntry: null,
            }
        })
    }

    return new DecoratingDictionaryImp<Type, ReferencedType>(dictionary)
}

export function buildFulfillingDictionary<Type, ReferencedType>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    referencedDictionaryPromise: ResolvePromise<RequiringDictionary<ReferencedType>>,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): IIntermediateFulfillingDictionary<Type, ReferencedType> {
    const dict = new DictionaryBuilder<Type>(resolveReporter, null, typeInfo)
    callback(dict)
    dict.finalize()
    referencedDictionaryPromise.handlePromise(
        _failed => {
            resolveReporter.reportDependentUnresolvedDictionary(typeInfo)
        },
        referencedDictionary => {
            const keys = Object.keys(dict.dictionary)
            const referencedKeys = referencedDictionary.getKeys()
            // if (keys.length < referencedKeys.length) {
            //     resolveReporter.reportMissingEntries(type, referencedDictionary.getKeys().filter(key => dict.dictionary[key] === undefined))
            // }
            // if (Object.keys(dict.dictionary).length > keys.length) {
            //     resolveReporter.reportSuperfluousEntries(type, keys.filter(key => referencedDictionary.has(key) === undefined))
            // }
            keys.forEach(key => {
                //console.log(key, referencedDictionary.has(key), referencedKeys)
                if (!referencedDictionary.has(key)) {
                    resolveReporter.reportSuperfluousFulfillingEntry(typeInfo, key, referencedKeys)
                }
            })
            referencedKeys.forEach(key => {
                const entry = dict.dictionary[key]
                if (entry === undefined) {
                    resolveReporter.reportMissingRequiredEntry(typeInfo, key, keys)
                }
            })
        },
    )
    return new FulfillingDictionaryImp<Type, ReferencedType>(dict.dictionary)
}
