

export class RawDictionary<Type> {
    private readonly data: { [key: string]: Type } = {}
    public set(key: string, entry: Type): void {
        if (this.data[key] !== undefined) {
            throw new Error("Key exists already")
        }
        this.data[key] = entry
    }
    public get(key: string):null | Type {
        const entry = this.data[key]
        if (entry === undefined) {
            return null
        } else {
            return entry
        }
    }
    public update(key: string, entry: Type): void {
        this.data[key] = entry
    }
    public has(key: string): boolean {
        return this.data[key] !== undefined
    }
    public getKeys(): string[] {
        return Object.keys(this.data)
    }
    public map<NewType>(callback: (entry: Type, key: string) => NewType): NewType[] {
        return this.getKeys().map(key => callback(this.data[key], key))
    }
    public isEmpty(): boolean {
        return this.getKeys().length === 0
    }
}
