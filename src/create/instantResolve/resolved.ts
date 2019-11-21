// tslint:disable: max-classes-per-file
import { Dictionary } from "lingua-franca"
import { IDependentLookup, IResolved, IResolvedStateConstraint, IStackedLookup } from "../../interfaces/instantResolve"
import { IResolveReporter } from "../../IResolveReporter"
import { createDependentLookup, createNullLookup } from "./dependentLookup"
import { createStateConstraint } from "./referenceBaseClasses"
import { createNullRequiringLookup, createRequiringLookupWrapper } from "./requiringLookup"
import { createStackedLookup } from "./stackedLookup"

///

////


class ResolvedImp<Type> implements IResolved<Type> {
    private readonly value: Type
    private readonly resolveReporter: IResolveReporter
    constructor(value: Type, resolveReporter: IResolveReporter) {
        this.value = value
        this.resolveReporter = resolveReporter
    }
    public getLookup<NewType>(callback: (value: Type) => Dictionary<NewType>): IDependentLookup<NewType> {
        return createDependentLookup(callback(this.value), this.resolveReporter)
    }
    public getStackedLookup<NewType>(callback: (value: Type) => Dictionary<NewType>): IStackedLookup<NewType> {
        return createStackedLookup(callback(this.value), this.resolveReporter)
    }
    public getRequiringLookup<NewType>(callback: (value: Type) => Dictionary<NewType>, requiresExhaustive: boolean) {
        return createRequiringLookupWrapper(callback(this.value), this.resolveReporter, requiresExhaustive)
    }
    public mapResolved<NewType>(
        callback: (type: Type) => NewType,
        _onNotRolved: () => NewType
    ) {
        return callback(this.value)
    }
    public withResolved(callback: (type: Type) => void) {
        this.mapResolved(callback, () => { })
    }
    public getResolved() {
        return this.mapResolved(
            x => x,
            () => {
                throw new Error("Reference failed to resolve")
            }
        )
    }
    public castToConstraint<NewType>(callback: (type: Type) => [false] | [true, NewType], typeInfo: string): IResolvedStateConstraint<NewType> {
        const castResult = callback(this.value)
        if (castResult[0] === false) {
            this.resolveReporter.reportConstraintViolation(typeInfo, false)
            return createStateConstraint<NewType>(createNullResolved(this.resolveReporter))
        } else {
            return createStateConstraint<NewType>(wrapResolved(castResult[1], this.resolveReporter))
        }

    }
    public convert<NewType>(callback: (type: Type) => NewType): IResolved<NewType> {
        return wrapResolved(callback(this.value), this.resolveReporter)
    }
}

export function wrapResolved<T>(t: T, resolveReporter: IResolveReporter): IResolved<T> {
    return new ResolvedImp<T>(t, resolveReporter)
}

class NullResolved<Type> implements IResolved<Type> {
    private readonly resolveReporter: IResolveReporter
    constructor(resolveReporter: IResolveReporter) {
        this.resolveReporter = resolveReporter
    }
    public getLookup<NewType>(): IDependentLookup<NewType> {
        return createNullLookup(this.resolveReporter)

    }
    public getRequiringLookup<NewType>() {
        return createNullRequiringLookup<NewType>(this.resolveReporter, false)
    }
    public mapResolved<NewType>(
        _callback: (type: Type) => NewType,
        onNotRolved: () => NewType
    ) {
        return onNotRolved()
    }
    public withResolved() {
        //do nothing
    }
    public getResolved(): Type {
        throw new Error("Reference failed to resolve")
    }
    public castToConstraint<NewType>(_callback: (type: Type) => [false] | [true, NewType], typeInfo: string): IResolvedStateConstraint<NewType> {
        this.resolveReporter.reportDependentConstraintViolation(typeInfo, false)
        return createStateConstraint<NewType>(createNullResolved<NewType>(this.resolveReporter))
    }
    public convert<NewType>(): IResolved<NewType> {
        return createNullResolved(this.resolveReporter)
    }
}

export function createNullResolved<Type>(resolveReporter: IResolveReporter) {
    return new NullResolved<Type>(resolveReporter)
}
