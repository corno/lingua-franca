//tslint:disable: max-classes-per-file
import * as r from "./reporters"

export class SimpleCircularConstraintReporter implements r.ICircularDependencyReporter {
    private readonly typeInfo: string
    private readonly reportError: (dependent: boolean, message: string) => void
    constructor(p: { typeInfo: string, reportError: (dependent: boolean, message: string) => void }) {
        this.typeInfo = p.typeInfo
        this.reportError = p.reportError
    }
    public reportCircularDependency(p: { key: string }) {
        this.reportError(false, `circular dependency: ${p.key} (${this.typeInfo})`)
    }
}

export class SimpleConflictingEntryReporter implements r.IConflictingEntryReporter {
    private readonly typeInfo: string
    private readonly reportError: (dependent: boolean, message: string) => void
    constructor(p: { typeInfo: string, reportError: (dependent: boolean, message: string) => void }) {
        this.typeInfo = p.typeInfo
        this.reportError = p.reportError
    }
    public reportConflictingEntry(p: { key: string }) {
        this.reportError(false, `conflicting entry: ${p.key} (${this.typeInfo})`)
    }
}

export class SimpleConstraintViolationReporter implements r.IConstraintViolationReporter {
    private readonly typeInfo: string
    private readonly delayed: boolean
    private readonly reportError: (dependent: boolean, message: string) => void
    constructor(p: { typeInfo: string, delayed: boolean, reportError: (dependent: boolean, message: string) => void }) {
        this.typeInfo = p.typeInfo
        this.delayed = p.delayed
        this.reportError = p.reportError
    }
    public reportConstraintViolation(p: { expectedState: string, foundState: string }) {
        this.reportError(false, `${this.delayed ? "this.delayed " : ""}constraint violation: (${this.typeInfo}) expected '${p.expectedState}' but found '${p.foundState}'`)
    }
    public reportDependentConstraintViolation() {
        this.reportError(true, `unresolved dependent ${this.delayed ? "this.delayed " : ""}constraint violation (${this.typeInfo})`)
    }
}

export class SimpleFulfillingDictionaryReporter implements r.IFulfillingDictionaryReporter {
    private readonly typeInfo: string
    private readonly delayed: boolean
    private readonly reportError: (dependent: boolean, message: string) => void
    constructor(p: { typeInfo: string, delayed: boolean, reportError: (dependent: boolean, message: string) => void }) {
        this.typeInfo = p.typeInfo
        this.delayed = p.delayed
        this.reportError = p.reportError
    }
    public reportMissingRequiredEntries(p: { missingEntries: string[], foundEntries: string[] }) {
        this.reportError(false, `missing required ${this.delayed ? "this.delayed " : ""}entry: ${p.missingEntries.join(`, `)} (${this.typeInfo}). found entries: ${p.foundEntries.join(`, `)}`)
    }
    public reportLookupDoesNotExist(p: { keys: string[] }) {
        this.reportError(false, `lookup for ${p.keys.concat(", ")} does not exist (${this.typeInfo})`)
    }
    public reportDependentUnresolvedEntry(p: { key: string }) {
        this.reportError(true, `unresolved dependent ${this.delayed ? "this.delayed " : ""}fulfilling entry: ${p.key} (${this.typeInfo}).`)
    }
    public reportUnresolvedEntry(p: { key: string, options: string[] }) {
        this.reportError(false, `unresolved ${this.delayed ? "this.delayed " : ""}fulfilling entry: ${p.key} (${this.typeInfo}). found entries: ${p.options.join(`, `)}`)
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
    public reportUnresolvedReference(p: { key: string, options: string[] }) {
        this.reportError(false, `unresolved ${this.delayed ? "this.delayed " : ""}reference: ${p.key} (${this.typeInfo}). found entries: ${p.options.join(`, `)}`)
    }
    public reportDependentUnresolvedReference(p: { key: string }) {
        this.reportError(true, `unresolved dependent ${this.delayed ? "this.delayed " : ""}reference: ${p.key} (${this.typeInfo})`)
    }
    public reportLookupDoesNotExist(p: { key: string }) {
        this.reportError(false, `lookup for ${p.key} does not exist (${this.typeInfo})`)
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
