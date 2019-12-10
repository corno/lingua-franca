

export class RawDictionary<Type> {
    private readonly data: { [key: string]: Type } = {}
    public set(key: string, entry: Type) {
        if (this.data[key] !== undefined) {
            throw new Error("Key exists already")
        }
        this.data[key] = entry
    }
    public get(key: string) {
        const entry = this.data[key]
        if (entry === undefined) {
            return null
        } else {
            return entry
        }
    }
    public update(key: string, entry: Type) {
        this.data[key] = entry
    }
    public has(key: string) {
        return this.data[key] !== undefined
    }
    public getKeys() {
        return Object.keys(this.data)
    }
    public map<NewType>(callback: (entry: Type, key: string) => NewType) {
        return this.getKeys().map(key => callback(this.data[key], key))
    }
    public isEmpty() {
        return this.getKeys().length === 0
    }
}
