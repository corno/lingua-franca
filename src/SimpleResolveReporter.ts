//tslint:disable: max-classes-per-file
import * as r from "./reporters"

export class SimpleCircularConstraintReporter implements r.ICircularDependencyReporter {
    private readonly typeInfo: string
    private readonly reportError: (dependent: boolean, message: string) => void
    constructor(typeInfo: string, reportError: (dependent: boolean, message: string) => void) {
        this.typeInfo = typeInfo
        this.reportError = reportError
    }
    public reportCircularDependency(key: string) {
        this.reportError(false, `circular dependency: ${key} (${this.typeInfo})`)
    }
}

export class SimpleConflictingEntryReporter implements r.IConflictingEntryReporter {
    private readonly typeInfo: string
    private readonly reportError: (dependent: boolean, message: string) => void
    constructor(typeInfo: string, reportError: (dependent: boolean, message: string) => void) {
        this.typeInfo = typeInfo
        this.reportError = reportError
    }
    public reportConflictingEntry(key: string) {
        this.reportError(false, `conflicting entry: ${key} (${this.typeInfo})`)
    }
}

export class SimpleConstraintViolationReporter implements r.IConstraintViolationReporter {
    private readonly typeInfo: string
    private readonly delayed: boolean
    private readonly reportError: (dependent: boolean, message: string) => void
    constructor(typeInfo: string, delayed: boolean, reportError: (dependent: boolean, message: string) => void) {
        this.typeInfo = typeInfo
        this.delayed = delayed
        this.reportError = reportError
    }
    public reportConstraintViolation(expectedState: string, foundState: string) {
        this.reportError(false, `${this.delayed ? "this.delayed " : ""}constraint violation: (${this.typeInfo}) expected '${expectedState}' but found '${foundState}'`)
    }
    public reportDependentConstraintViolation() {
        this.reportError(true, `unresolved dependent ${this.delayed ? "this.delayed " : ""}constraint violation (${this.typeInfo})`)
    }
}

export class SimpleFulfillingDictionaryReporter implements r.IFulfillingDictionaryReporter {
    private readonly typeInfo: string
    private readonly delayed: boolean
    private readonly reportError: (dependent: boolean, message: string) => void
    constructor(typeInfo: string, delayed: boolean, reportError: (dependent: boolean, message: string) => void) {
        this.typeInfo = typeInfo
        this.delayed = delayed
        this.reportError = reportError
    }
    public reportMissingRequiredEntries(missingEntries: string[], foundEntries: string[]) {
        this.reportError(false, `missing required ${this.delayed ? "this.delayed " : ""}entry: ${missingEntries.join(`, `)} (${this.typeInfo}). found entries: ${foundEntries.join(`, `)}`)
    }
    public reportLookupDoesNotExist(keys: string[]) {
        this.reportError(false, `lookup for ${keys.concat(", ")} does not exist (${this.typeInfo})`)
    }
    public reportDependentUnresolvedEntry(key: string) {
        this.reportError(true, `unresolved dependent ${this.delayed ? "this.delayed " : ""}fulfilling entry: ${key} (${this.typeInfo}).`)
    }
    public reportUnresolvedEntry(key: string, options: string[]) {
        this.reportError(false, `unresolved ${this.delayed ? "this.delayed " : ""}fulfilling entry: ${key} (${this.typeInfo}). found entries: ${options.join(`, `)}`)
    }

}

export class SimpleReferenceResolveReporter implements r.IReferenceResolveReporter {
    private readonly typeInfo: string
    private readonly delayed: boolean
    private readonly reportError: (dependent: boolean, message: string) => void
    constructor(typeInfo: string, delayed: boolean, reportError: (dependent: boolean, message: string) => void) {
        this.typeInfo = typeInfo
        this.delayed = delayed
        this.reportError = reportError
    }
    public reportUnresolvedReference(key: string, options: string[]) {
        this.reportError(false, `unresolved ${this.delayed ? "this.delayed " : ""}reference: ${key} (${this.typeInfo}). found entries: ${options.join(`, `)}`)
    }
    public reportDependentUnresolvedReference(key: string) {
        this.reportError(true, `unresolved dependent ${this.delayed ? "this.delayed " : ""}reference: ${key} (${this.typeInfo})`)
    }
    public reportLookupDoesNotExist(key: string) {
        this.reportError(false, `lookup for ${key} does not exist (${this.typeInfo})`)
    }
}

// export class SimpleResolveReporter implements IResolveReporter {
//     private readonly reportError: (dependent: boolean, message: string) => void
//     constructor(
//         reportError: (dependent: boolean, message: string) => void
//     ) {
//         this.reportError = reportError
//     }
    //errors

    //dependent errors
// }
