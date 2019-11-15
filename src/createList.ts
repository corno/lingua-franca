import { List} from "lingua-franca"
import { IIntermediateList } from "./IIntermediateList"
import { IListBuilder } from "./IListBuilder"

class ListImp<Type> implements List<Type> {
    private readonly imp: Type[]
    constructor(imp: Type[])  {
        this.imp = imp
    }
    public forEach(
        onElement: (element: Type) => void,
        onSepartor?: () => void,
        onBeforeFirst?: () => void,
        onAfterLast?: () => void,
        onEmpty?: () => void,
    ) {
        const isEmpty = this.imp.length === 0
        if (isEmpty) {
            if (onEmpty !== undefined) {
                onEmpty()
            }
            return
        }
        if (!isEmpty && onBeforeFirst !== undefined) {
            onBeforeFirst()
        }
        this.imp.forEach((element, index) => {
            if (index !== 0 && onSepartor !== undefined) {
                onSepartor()
            }
            onElement(element)
        })
        if (!isEmpty && onAfterLast !== undefined) {
            onAfterLast()
        }
    }
    public map<NewType>(onElement: (e: Type) => NewType) {
        return this.imp.map(onElement)
    }
    get isEmpty() {
        return this.imp.length === 0
    }
}

// tslint:disable-next-line: max-classes-per-file
class ListBuilder<Type> implements IListBuilder<Type> {
    private finalized = false
    private readonly array: Type[] = []
    public push(element: Type) {
        if (this.finalized) {
            throw new Error("array is finalized")
        }
        this.array.push(element)
    }
    public finalize() {
        this.finalized = true
        return new ListImp(this.array)
    }
}

export function createList<Type>(callback: (arrayBuilder: ListBuilder<Type>) => void): IIntermediateList<Type> {
    const list = new ListBuilder<Type>()
    callback(list)
    return list.finalize()
}
