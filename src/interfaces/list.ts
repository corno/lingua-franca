
import { List } from "lingua-franca"

/**
 * IIntermediateList does not have to do anything.
 * This interface is provided for symmetry with the IntermediateDictionary interfaces
 */
export interface IList<Type> extends List<Type> {
}

export interface IListBuilder<Type> {
    push(element: Type): void
}
