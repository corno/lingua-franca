// tslint:disable: interface-name

export interface List<Type> {
    /**
     * iterates over the elements
     * @param onElement is called for every element in the list
     * @param onSeparator is called inbetween every element in the list
     */
    map<NewType>(p: {
        readonly callback: (element: Type) => NewType
    }): NewType[]
    /**
     * iterates over the elements
     * @param onElement is called for every element in the list
     * @param onSeparator is called inbetween every element in the list
     */
    mapWithSeparator<NewType>(p: {
        readonly onSeparator: () => NewType
        readonly onElement: (element: Type) => NewType
    }): NewType[]
    /**
     *
     * @param onEmpty called if the list is empty
     * @param onNotEmpty called if the list is not empty
     */
    onEmpty<NewType>(p: {
        readonly onEmpty: () => NewType
        readonly onNotEmpty: (list: List<Type>) => NewType
    }): NewType
    /**
     *
     * @param callback if the callback returns null, the element is excluded from the resulting List
     */
    filter<NewType>(p: { readonly callback: (element: Type) => null | NewType }): List<NewType>
}
