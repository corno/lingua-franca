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
    public reportUnresolvedReference(type: string, key: string, options: string[]) {
        this.reportError(false, "unresolved reference: " + key + " (" + type + "). found entries: " + options.join(", "))
    }
    public reportUnresolvedIntraReference(type: string, key: string) {
        this.reportError(false, "unresolved forward reference: " + key + " (" + type + ")")
    }
    public reportSuperfluousDecoratingEntry(type: string, key: string, options: string[]) {
        this.reportError(false, "superfluous decorating entry: " + key + " (" + type + "). found entries: " + options.join(", "))
    }
    public reportSuperfluousFulfillingEntry(type: string, key: string, requiredEntries: string[]) {
        this.reportError(false, "superfluous fulfilling entry: " + key + " (" + type + "). found entries: " + requiredEntries.join(", "))
    }
    public reportMissingRequiredEntry(type: string, key: string, foundEntries: string[]) {
        this.reportError(false, "missing required entry: " + key + " (" + type + "). found entries: " + foundEntries.join(", "))
    }
    public reportConflictingEntry(type: string, key: string) {
        this.reportError(false, "conflicting entry: " + key + " (" + type + ")")
    }
    //dependent errors
    public reportDependentUnresolvedReference(type: string, key: string) {
        this.reportError(true, "unresolved reference: " + key + " (" + type + ")")
    }
    public reportDependentUnresolvedIntraReference(type: string, key: string) {
        this.reportError(true, "unresolved forward reference: " + key + " (" + type + ")")
    }
    public reportDependentUnresolvedDictionary(type: string) {
        this.reportError(true, "unmatched dictionary: " + type)
    }
    //warnings
    public reportShouldNotBeDeclaredForward(type: string, key: string) {
        this.reportWarning("entry should *not* be marked 'forward': " + key + " (" + type + ")")
    }
    public reportShouldBeDeclaredForward(type: string, key: string) {
        this.reportWarning("entry should be marked 'forward': " + key + " (" + type + ")")
    }
}
