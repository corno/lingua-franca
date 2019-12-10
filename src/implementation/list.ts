import { List} from "lingua-franca"
import { IListBuilder } from "../interfaces/IListBuilder"

class ListImp<Type> implements List<Type> {
    private readonly imp: Type[]
    constructor(imp: Type[])  {
        this.imp = imp
    }
    public map<NewType>(
        onElement: (element: Type) => NewType,
        onSepartor?: () => NewType
    ) {
        const target: Array<NewType> = []
        this.imp.forEach((element, index) => {
            if (index !== 0 && onSepartor !== undefined) {
                target.push(onSepartor())
            }
            target.push(onElement(element))
        })
        return target
    }
    public onEmpty<NewType>(
        onEmpty: () => NewType,
        onNotEmpty: () => NewType,
    ) {
        if (this.imp.length === 0) {
            return onEmpty()
        } else {
            return onNotEmpty()
        }
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

export function createList<Type>(callback: (arrayBuilder: IListBuilder<Type>) => void): List<Type> {
    const list = new ListBuilder<Type>()
    callback(list)
    return list.finalize()
}
