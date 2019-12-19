import { List } from "lingua-franca"
import { IListBuilder } from "../interfaces/IListBuilder"

class ListImp<Type> implements List<Type> {
    private readonly imp: Type[]
    constructor(imp: Type[]) {
        this.imp = imp
    }
    public map<NewType>(p: {
        readonly callback: (element: Type) => NewType
    }) {
        return this.imp.map(p.callback)
    }
    public mapWithSeparator<NewType>(p: {
        readonly onSepartor: () => NewType
        readonly onElement: (element: Type) => NewType
    }) {
        const target: Array<NewType> = []
        this.imp.forEach((element, index) => {
            if (index !== 0 && p.onSepartor !== undefined) {
                target.push(p.onSepartor())
            }
            target.push(p.onElement(element))
        })
        return target
    }
    public onEmpty<NewType>(p: {
      readonly  onEmpty: () => NewType
      readonly  onNotEmpty: (list: List<Type>) => NewType
    }): NewType {
        if (this.imp.length === 0) {
            return p.onEmpty()
        } else {
            return p.onNotEmpty(this)
        }
    }
    public filter<NewType>(p: {
       readonly callback: (element: Type) => null | NewType
    }) {
        const target: Array<NewType> = []
        this.imp.forEach(element => {
            const result = p.callback(element)
            if (result !== null) {
                target.push(result)
            }
        })
        return new ListImp(target)
    }
}

// tslint:disable-next-line: max-classes-per-file
class ListBuilder<Type> implements IListBuilder<Type> {
    private finalized = false
    private readonly array: Type[] = []
    public push(p: { element: Type }) {
        if (this.finalized) {
            throw new Error("array is finalized")
        }
        this.array.push(p.element)
    }
    public finalize() {
        this.finalized = true
        return new ListImp(this.array)
    }
}

export function createList<Type>(callback: (cp: { builder: IListBuilder<Type> }) => void): List<Type> {
    const list = new ListBuilder<Type>()
    callback({ builder: list })
    return list.finalize()
}
