import { IResolveReporter } from "./IResolveReporter"

export class SimpleResolveReporter implements IResolveReporter {
    private readonly reportError: (dependent: boolean, message: string) => void
    private readonly reportWarning: (message: string) => void
    constructor(
        reportError: (dependent: boolean, message: string) => void,
        reportWarning: (message: string) => void,
    ) {
        this.reportError = reportError
        this.reportWarning = reportWarning
    }
    //errors
    public reportUnresolvedReference(typeInfo: string, key: string, options: string[], delayed: boolean) {
        this.reportError(false, `unresolved ${delayed ? "delayed " : ""}reference: ${key} (${typeInfo}). found entries: ${options.join(`, `)}`)
    }
    public reportConstraintViolation(typeInfo: string, expectedState: string, foundState: string, delayed: boolean) {
        this.reportError(false, `${delayed ? "delayed " : ""}constraint violation: (${typeInfo}) expected '${expectedState}' but found '${foundState}'`)
    }
    public reportMissingRequiredEntries(typeInfo: string, missingEntries: string[], foundEntries: string[], delayed: boolean) {
        this.reportError(false, `missing required ${delayed ? "delayed " : ""}entry: ${missingEntries.join(`, `)} (${typeInfo}). found entries: ${foundEntries.join(`, `)}`)
    }
    public reportLookupDoesNotExistForReference(typeInfo: string, key: string) {
        this.reportError(false, `lookup for ${key} does not exist (${typeInfo})`)
    }
    public reportLookupDoesNotExistForFulfillingDictionary(typeInfo: string, key: string[]) {
        this.reportError(false, `lookup for ${Object.keys(key).concat(", ")} does not exist (${typeInfo})`)
    }

    public reportUnresolvedFulfillingDictionaryEntry(typeInfo: string, key: string, options: string[], delayed: boolean) {
        this.reportError(false, `unresolved ${delayed ? "delayed " : ""}fulfilling entry: ${key} (${typeInfo}). found entries: ${options.join(`, `)}`)
    }
    public reportConflictingEntry(typeInfo: string, key: string) {
        this.reportError(false, `conflicting entry: ${key} (${typeInfo})`)
    }
    public reportCircularDependency(typeInfo: string, key: string) {
        this.reportError(false, `circular dependency: ${key} (${typeInfo})`)
    }
    public reportReferenceToNonExistentLookup(typeInfo: string) {
        this.reportError(false, `referencing non existent lookup: (${typeInfo})`)
    }
    //dependent errors
    public reportDependentUnresolvedReference(typeInfo: string, key: string, delayed: boolean) {
        this.reportError(true, `unresolved dependent ${delayed ? "delayed " : ""}reference: ${key} (${typeInfo})`)
    }
    public reportDependentConstraintViolation(typeInfo: string, delayed: boolean) {
        this.reportError(true, `unresolved dependent ${delayed ? "delayed " : ""}constraint violation (${typeInfo})`)
    }
    public reportUnresolvedRequiringDictionary(typeInfo: string, delayed: boolean) {
        this.reportError(true, `unresolved ${delayed ? "delayed " : ""}requiring dictionary: (${typeInfo})`)
    }
    public reportDependentUnresolvedFulfillingDictionaryEntry(typeInfo: string, key: string, delayed: boolean) {
        this.reportError(true, `unresolved dependent ${delayed ? "delayed " : ""}fulfilling entry: ${key} (${typeInfo}).`)
    }
    //warnings
    public reportShouldNotBeDeclaredForward(typeInfo: string, key: string) {
        this.reportWarning(`entry should *not* be marked as forward: ${key} (${typeInfo})`)
    }
    public reportShouldBeDeclaredForward(typeInfo: string, key: string) {
        this.reportWarning(`entry should be marked as forward: ${key} (${typeInfo})`)
    }
}
