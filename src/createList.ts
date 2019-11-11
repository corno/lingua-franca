import { List} from "lingua-franca"
import { IListBuilder } from "./IList"

class ListImp<Type> implements List<Type> {
    private readonly imp: Type[]
    constructor(imp: Type[])  {
        this.imp = imp
    }
    public forEach(callback: (element: Type, isFirst: boolean) => void) {
        this.imp.forEach((element, index) => callback(element, index === 0))
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

export function createList<Type>(callback: (arrayBuilder: ListBuilder<Type>) => void): ListImp<Type> {
    const list = new ListBuilder<Type>()
    callback(list)
    return list.finalize()
}
