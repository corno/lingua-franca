
export type ConstraintCastResult<Type> =
| [false, {
    found: string
    expected: string
}]
| [true, Type]
