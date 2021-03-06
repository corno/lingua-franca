/* eslint
    "max-classes-per-file": off
*/
import { IDelayedResolveLookup } from "../../interfaces/delayedResolve"
import { IAutoCreateDictionary, IDictionaryBuilder } from "../../interfaces/dictionaries"
import { Dictionary, DictionaryOrdering, OrderedDictionary } from "../../interfaces/Dictionary"
import { IOrderingCreator } from "../../interfaces/IBuildContext"
import { ILookup, MissingEntryCreator } from "../../interfaces/instantResolve"
import { ICircularDependencyReporter, IConflictingEntryReporter, IFulfillingDictionaryReporter } from "../../reporters"
import { createAutoCreateContext } from "../instantResolve/autoCreateContext"
import { RawDictionary } from "../RawDictionary"
import { createDictionaryBuilder } from "./dictionaryBuilder"

type KeyValuePair<Type> = { key: string; value: Type }

type FinishedInsertion = boolean

function orderedIterate<Type, NewType>(
    orderedElements: KeyValuePair<Type>[],
    onElement: (cp: {
        readonly element: Type
        readonly key: string
    }) => NewType,
    onSepartor?: (cp: {}) => NewType,
) {
    const target: NewType[] = []
    orderedElements.forEach((kvPair, index) => {
        if (index !== 0 && onSepartor !== undefined) {
            target.push(onSepartor({}))
        }
        target.push(onElement({ element: kvPair.value, key: kvPair.key }))
    })
    return target
}

class DictionaryImp<Type> implements Dictionary<Type> {
    private readonly dictionary: RawDictionary<Type>
    constructor(dictionary: RawDictionary<Type>) {
        this.dictionary = dictionary
    }
    public getEntry(p: {
        readonly key: string
    }): null | Type {
        return this.dictionary.get(p.key)
    }
    public getAlphabeticalOrdering(_p: {}): DictionaryOrdering<Type> {
        return new DictionaryOrderingImp(this.dictionary.map((entry, key) => ({ key: key, value: entry })).sort((a, b) => {
            return a.key.toLowerCase().localeCompare(b.key.toLowerCase())
        }))
    }
    public getKeys(_p: {}) {
        return this.dictionary.getKeys().sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
    }
}


export function wrapDictionary<Type>(dictionary: RawDictionary<Type>) {
    return new DictionaryImp(dictionary)
}

class AutoCreateDictionaryImp<Type> extends DictionaryImp<Type> implements IAutoCreateDictionary<Type> {
    private readonly rawDict: RawDictionary<Type>
    private readonly missingEntryCreator: MissingEntryCreator<Type>
    private readonly getParentKeys: () => string[]
    constructor(dictionary: RawDictionary<Type>, missingEntryCreator: MissingEntryCreator<Type>, getParentKeys: () => string[]) {
        super(dictionary)
        this.rawDict = dictionary
        this.missingEntryCreator = missingEntryCreator
        this.getParentKeys = getParentKeys
    }

    public createAutoCreateContext() {
        return createAutoCreateContext(this.rawDict, this.missingEntryCreator, this.getParentKeys)
    }
}


export function createAutoCreateDictionary<Type>(
    reporter: IConflictingEntryReporter,
    callback: (cp: { builder: IDictionaryBuilder<Type> }) => void,
    missingEntryCreator: MissingEntryCreator<Type>,
    getParentKeys: () => string[],
): IAutoCreateDictionary<Type> {
    const dict = new RawDictionary<Type>()
    const db = createDictionaryBuilder<Type>(
        dict,
        reporter,
    )
    callback({ builder: db })
    db.finalize({})
    return new AutoCreateDictionaryImp(dict, missingEntryCreator, getParentKeys)
}

class DictionaryOrderingImp<Type> implements DictionaryOrdering<Type> {
    //public readonly ordered = true
    private readonly orderedArray: KeyValuePair<Type>[]
    constructor(orderedArray: KeyValuePair<Type>[]) {
        this.orderedArray = orderedArray
    }
    public map<NewType>(p: {
        callback: (cp: {
            readonly element: Type
            readonly key: string
        }) => NewType
    }) {
        return orderedIterate(this.orderedArray, p.callback)
    }
    public mapWithSeparator<NewType>(p: {
        readonly onSeparator: (cp: {}) => NewType
        readonly onElement: (cp: {
            readonly element: Type
            readonly key: string
        }) => NewType
    }) {
        return orderedIterate(this.orderedArray, p.onElement, p.onSeparator)
    }
    public filter<NewType>(p: {
        readonly callback: (cp: {
            readonly element: Type
        }) => null | NewType
    }) {
        const target: KeyValuePair<NewType>[] = []
        this.orderedArray.forEach(kvPair => {
            const result = p.callback({ element: kvPair.value })
            if (result !== null) {
                target.push({
                    key: kvPair.key,
                    value: result,
                })
            }
        })
        return new DictionaryOrderingImp(target)
    }
    public onEmpty<NewType>(p: {
        readonly onEmpty: (cp: {}) => NewType
        readonly onNotEmpty: (cp: {
            readonly dictionaryOrdering: DictionaryOrdering<Type>
        }) => NewType
    }): NewType {
        if (this.orderedArray.length === 0) {
            return p.onEmpty({})
        } else {
            return p.onNotEmpty({ dictionaryOrdering: this })
        }
    }

}

export function createDelayedResolveFulfillingDictionary<Type, ReferencedType>(
    mrer: IFulfillingDictionaryReporter,
    cer: IConflictingEntryReporter,
    delayedResolveLookup: IDelayedResolveLookup<ReferencedType>,
    callback: (cp: {
        readonly builder: IDictionaryBuilder<Type>
        readonly lookup: IDelayedResolveLookup<ReferencedType>
    }) => void,
    requiresExhaustive: boolean,
): Dictionary<Type> {
    const dict = new RawDictionary<Type>()
    const db = createDictionaryBuilder<Type>(dict, cer)
    callback({ builder: db, lookup: delayedResolveLookup })
    db.finalize({})
    delayedResolveLookup.validateFulfillingEntries(db.getKeys({}), mrer, requiresExhaustive)
    return new DictionaryImp<Type>(dict)
}

export function createFulfillingDictionary<Type, ReferencedType>(
    mrer: IFulfillingDictionaryReporter,
    cer: IConflictingEntryReporter,
    lookup: ILookup<ReferencedType>,
    callback: (cp: {
        readonly builder: IDictionaryBuilder<Type>
        readonly lookup: ILookup<ReferencedType>
    }) => void,
    requiresExhaustive: boolean,
): Dictionary<Type> {
    const dict = new RawDictionary<Type>()
    const db = createDictionaryBuilder<Type>(dict, cer)
    callback({ builder: db, lookup: lookup })
    db.finalize({})
    lookup.validateFulfillingEntries({
        keys: db.getKeys({}),
        reporter: mrer,
        requiresExhaustive: requiresExhaustive,
    })
    return new DictionaryImp<Type>(dict)
}

export function createDictionary<Type>(
    reporter: IConflictingEntryReporter,
    callback: (cp: { builder: IDictionaryBuilder<Type> }) => void,
): Dictionary<Type> {
    const dict = new RawDictionary<Type>()
    const db = createDictionaryBuilder<Type>(dict, reporter)
    callback({ builder: db })
    db.finalize({})
    return new DictionaryImp<Type>(dict)
}


function createDictionaryOrdering<Type>(
    reporter: ICircularDependencyReporter,
    dictionary: RawDictionary<Type>,
    getDependencies: (cp: { entry: Type }) => string[],
): DictionaryOrdering<Type> {
    const array: KeyValuePair<Type>[] = []
    const alreadyInserted = new RawDictionary<FinishedInsertion>()
    const process = (key: string) => {
        const isInserted = alreadyInserted.get(key)
        if (isInserted === null) {
            const entry = dictionary.get(key)
            if (entry === null) {
                //this can happen when the caller returns an invalid key upon getDependencies
                //console.error("Entry does not exist: " + key)
                return
            }
            alreadyInserted.set(key, false)
            getDependencies({ entry: entry }).forEach(process)
            array.push({ key: key, value: entry })
            alreadyInserted.update(key, true)
        } else {
            if (!isInserted) {
                reporter.reportCircularDependency({ key: key })
            }
        }
    }
    dictionary.getKeys().forEach(process)
    return new DictionaryOrderingImp(array)
}

class OrderedDictionaryImp<Type, Orderings> extends DictionaryImp<Type> implements OrderedDictionary<Type, Orderings> {
    private readonly orderings: Orderings
    constructor(dictionary: RawDictionary<Type>, orderings: Orderings) {
        super(dictionary)
        this.orderings = orderings
    }
    public getOrderings() {
        return this.orderings
    }
}

class OrderingsCreator<Type> implements IOrderingCreator<Type> {
    private readonly dict: RawDictionary<Type>
    constructor(dict: RawDictionary<Type>) {
        this.dict = dict
    }
    public createBasedOnDependency(p: {
        reporter: ICircularDependencyReporter
        getDependencies: (cp: { entry: Type }) => string[]
    }) {
        return createDictionaryOrdering(p.reporter, this.dict, p.getDependencies)
    }
    public createBasedOnInsertionOrder(_p: {}): DictionaryOrdering<Type> {
        return new DictionaryOrderingImp(this.dict.map((value, key) => ({ key: key, value: value })))
    }
}

export function createOrderedDictionary<Type, Orderings>(
    reporter: IConflictingEntryReporter,
    callback: (cp: { builder: IDictionaryBuilder<Type> }) => void,
    getOrderings: (cp: { orderingCreator: IOrderingCreator<Type> }) => Orderings,
): OrderedDictionary<Type, Orderings> {
    const dict = new RawDictionary<Type>()
    const db = createDictionaryBuilder<Type>(dict, reporter)
    callback({ builder: db })
    db.finalize({})
    const orderings = getOrderings({
        orderingCreator: new OrderingsCreator<Type>(dict),
    })
    return new OrderedDictionaryImp<Type, Orderings>(dict, orderings)
}
