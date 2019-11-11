
export interface IUnsure<Type> {
    value: Type | null
    convert<NewType>(callback: (value: Type) => NewType): IUnsure<NewType>
}
