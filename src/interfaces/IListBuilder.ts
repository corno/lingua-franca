

export interface IListBuilder<Type> {
    push(p: { element: Type }): void
}
