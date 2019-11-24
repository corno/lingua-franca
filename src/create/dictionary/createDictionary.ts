// tslint:disable: max-classes-per-file
import { Dictionary, DictionaryOrdering, Sanitizer } from "lingua-franca"
import { IDelayedResolveLookup } from "../../interfaces/delayedResolve"
import { IAutoCreateDictionary, IDictionaryBuilder } from "../../interfaces/dictionary"
import { ILookup, MissingEntryCreator } from "../../interfaces/instantResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { RawDictionary } from "../../RawDictionary"
import { createAutoCreateContext } from "../instantResolve/autoCreateContext"
import { createDictionaryBuilder } from "./dictionaryBuilder"

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

class DictionaryImp<Type> implements Dictionary<Type> {
    private readonly dictionary: RawDictionary<Type>
    constructor(dictionary: RawDictionary<Type>) {
        this.dictionary = dictionary
    }
    public getEntry(key: string): null | Type {
        return this.dictionary.get(key)
    }
    public forEachAlphabetically(
        onElement: (element: Type, getKey: (sanitizer: Sanitizer) => string) => void,
        onSepartor?: () => void,
        onBeforeFirst?: () => void,
        onAfterLast?: () => void,
        onEmpty?: () => void,
    ) {
        orderedIterate(this.dictionary.map((entry, key) => ({ key: key, value: entry })).sort((a, b) => {
            return a.key.toLowerCase().localeCompare(b.key.toLowerCase())
        }), onElement, onSepartor, onBeforeFirst, onAfterLast, onEmpty)
    }
    public getKeys() {
        return this.dictionary.getKeys().sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase())
        })
    }
    get isEmpty() {
        return this.getKeys().length === 0
    }
}


export function wrapDictionary<Type>(dictionary: RawDictionary<Type>) {
    return new DictionaryImp(dictionary)
}

class AutoCreateDictionaryImp<Type> extends DictionaryImp<Type> implements IAutoCreateDictionary<Type> {
    private readonly rawDict: RawDictionary<Type>
    private readonly missingEntryCreator: MissingEntryCreator<Type>
    private readonly resolveReporter: IResolveReporter
    private readonly getParentKeys: () => string[]
    constructor(dictionary: RawDictionary<Type>, missingEntryCreator: MissingEntryCreator<Type>, resolveReporter: IResolveReporter, getParentKeys: () => string[]) {
        super(dictionary)
        this.rawDict = dictionary
        this.missingEntryCreator = missingEntryCreator
        this.resolveReporter = resolveReporter
        this.getParentKeys = getParentKeys
    }

    public createAutoCreateContext() {
        return createAutoCreateContext(this.rawDict, this.resolveReporter, this.missingEntryCreator, this.getParentKeys)
    }
}


export function createAutoCreateDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
    missingEntryCreator: MissingEntryCreator<Type>,
    getParentKeys: () => string[],
): IAutoCreateDictionary<Type> {
    const dict = new RawDictionary<Type>()
    const db = createDictionaryBuilder<Type>(
        dict,
        resolveReporter,
        typeInfo
    )
    callback(db)
    db.finalize()
    return new AutoCreateDictionaryImp(dict, missingEntryCreator, resolveReporter, getParentKeys)
}

class DictionaryOrderingImp<Type> implements DictionaryOrdering<Type> {
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
    dictionary: Dictionary<Type>,
    getDependencies: (entry: Type) => string[],
): DictionaryOrdering<Type> {
    const array: Array<KeyValuePair<Type>> = []
    const alreadyInserted = new RawDictionary<FinishedInsertion>()
    const process = (key: string) => {
        const isInserted = alreadyInserted.get(key)
        if (isInserted === null) {
            const entry = dictionary.getEntry(key)
            if (entry === null) {
                //this can happen when the caller returns an invalid key upon getDependencies
                //console.error("Entry does not exist: " + key)
                return
            }
            alreadyInserted.set(key, false)
            getDependencies(entry).forEach(process)
            array.push({ key: key, value: entry })
            alreadyInserted.update(key, true)
        } else {
            if (!isInserted) {
                resolveReporter.reportCircularDependency(typeInfo, key)
            }
        }
    }
    dictionary.getKeys().forEach(process)
    return new DictionaryOrderingImp(array)
}

export function createDelayedResolveFulfillingDictionary<Type, ReferencedType>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    delayedResolveLookup: IDelayedResolveLookup<ReferencedType>,
    callback: (dictBuilder: IDictionaryBuilder<Type>, delayedResolveLookup: IDelayedResolveLookup<ReferencedType>) => void,
    requiresExhaustive: boolean,
): Dictionary<Type> {
    const dict = new RawDictionary<Type>()
    const db = createDictionaryBuilder<Type>(dict, resolveReporter, typeInfo)
    callback(db, delayedResolveLookup)
    db.finalize()
    delayedResolveLookup.validateFulfillingEntries(db.getKeys(), typeInfo, requiresExhaustive)
    return new DictionaryImp<Type>(dict)
}

export function createFulfillingDictionary<Type, ReferencedType>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    lookup: ILookup<ReferencedType>,
    callback: (dictBuilder: IDictionaryBuilder<Type>, lookup: ILookup<ReferencedType>) => void,
    requiresExhaustive: boolean,
): Dictionary<Type> {
    const dict = new RawDictionary<Type>()
    const db = createDictionaryBuilder<Type>(dict, resolveReporter, typeInfo)
    callback(db, lookup)
    db.finalize()
    lookup.validateFulfillingEntries(db.getKeys(), typeInfo, requiresExhaustive)
    return new DictionaryImp<Type>(dict)
}


export function createDictionary<Type>(
    typeInfo: string,
    resolveReporter: IResolveReporter,
    callback: (dictBuilder: IDictionaryBuilder<Type>) => void,
): Dictionary<Type> {
    const dict = new RawDictionary<Type>()
    const db = createDictionaryBuilder<Type>(dict, resolveReporter, typeInfo)
    callback(db)
    db.finalize()
    return new DictionaryImp<Type>(dict)
}
