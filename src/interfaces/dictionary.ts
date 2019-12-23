// tslint:disable: interface-name

export interface Dictionary<Type> {
    getAlphabeticalOrdering(p: {}): DictionaryOrdering<Type>

    getEntry(p: { readonly key: string }): null | Type
    getKeys(p: {}): string[]
}

export interface OrderedDictionary<Type, Orderings> extends Dictionary<Type> {
    getOrderings(p: {}): Orderings
}

export interface DictionaryOrdering<Type> {
    /**
     * iterates over the elements
     * @param onElement is called for every element in the list
     * @param onSeparator is called inbetween every element in the list
     */
    map<NewType>(p: {
        readonly callback: (element: Type, key: string) => NewType
    }): NewType[]
    /**
     * iterates over the elements
     * @param onElement is called for every element in the list
     * @param onSeparator is called inbetween every element in the list
     */
    mapWithSeparator<NewType>(p: {
        readonly onSeparator: () => NewType
        readonly onElement: (element: Type, key: string) => NewType
    }): NewType[]
    onEmpty<NewType>(p: {
        readonly onEmpty: () => NewType
        readonly onNotEmpty: (dictionaryOrdering: DictionaryOrdering<Type>) => NewType
    }): NewType
    /**
     *
     * @param callback if the callback returns null, the element is excluded from the resulting List
     */
    filter<NewType>(p: { readonly callback: (element: Type) => null | NewType }): DictionaryOrdering<NewType>
}
