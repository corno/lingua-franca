// tslint:disable: interface-name

export interface Constraint<Type> {

    /**
     * only use this function after successful building of the AST.
     * if the reference was not successfully resolved, this function throws an exception
     */
    getResolved(p: {}): Type
    /**
     * @param callback is only called if the type was successfully resolved
     * @param onNotResolved optional, if provided, it will be called if the type was not succesfully resolved
     */
    withResolved(p: { readonly callback: (type: Type) => void, readonly onNotResolved?: () => void }): void
    /**
     *
     * @param callback this callback is called when the type was resolved successfully
     * @param onNotResolved this callback is called when the type was not resolved successfully
     */
    mapResolved<NewType>(p: { readonly callback: (type: Type) => NewType, readonly onNotResolved: () => NewType }): NewType

    getConstraint<NewType>(p: { readonly callback: (type: Type) => Constraint<NewType> }): Constraint<NewType>
    getNonConstraint<NewType>(p: { readonly callback: (type: Type) => NewType }): Constraint<NewType>
}

export interface ConstrainedConstraint<Type, Constraints> extends Constraint<Type> {
    getConstraints(p: {}): Constraints
}

export interface Reference<ReferencedType> extends Constraint<ReferencedType> {
    /**
     *
     * @param sanitizer callback to force the caller to be explicit on how the value should be printed
     */
    getKey(p: { sanitizer: (rawValue: string) => string }): string
}

export interface ConstrainedReference<ReferencedType, Constraints> extends Reference<ReferencedType>, ConstrainedConstraint<ReferencedType, Constraints> {
}
