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
    public reportUnresolvedReference(typeInfo: string, key: string, options: string[]) {
        this.reportError(false, "unresolved reference: " + key + " (" + typeInfo + "). found entries: " + options.join(", "))
    }
    public reportUnresolvedIntraReference(typeInfo: string, key: string) {
        this.reportError(false, "unresolved forward reference: " + key + " (" + typeInfo + ")")
    }
    public reportIntraConstraintViolation(typeInfo: string) {
        this.reportError(false, "constraint violation: (" + typeInfo + ")")
    }
    public reportSuperfluousFulfillingEntry(typeInfo: string, key: string, requiredEntries: string[]) {
        this.reportError(false, "superfluous fulfilling entry: " + key + " (" + typeInfo + "). found entries: " + requiredEntries.join(", "))
    }
    public reportMissingRequiredEntry(typeInfo: string, key: string, foundEntries: string[]) {
        this.reportError(false, "missing required entry: " + key + " (" + typeInfo + "). found entries: " + foundEntries.join(", "))
    }
    public reportConflictingEntry(typeInfo: string, key: string) {
        this.reportError(false, "conflicting entry: " + key + " (" + typeInfo + ")")
    }
    public reportCircularDependency(typeInfo: string) {
        this.reportError(false, "circular dependency: (" + typeInfo + ")")
    }
    //dependent errors
    public reportDependentUnresolvedReference(typeInfo: string, key: string) {
        this.reportError(true, "unresolved reference: " + key + " (" + typeInfo + ")")
    }
    public reportDependentUnresolvedIntraReference(typeInfo: string, key: string) {
        this.reportError(true, "unresolved forward reference: " + key + " (" + typeInfo + ")")
    }
    public reportDependentUnresolvedDictionary(typeInfo: string) {
        this.reportError(true, "unmatched dictionary: " + typeInfo)
    }
    //warnings
    public reportShouldNotBeDeclaredForward(typeInfo: string, key: string) {
        this.reportWarning("entry should *not* be marked 'forward': " + key + " (" + typeInfo + ")")
    }
    public reportShouldBeDeclaredForward(typeInfo: string, key: string) {
        this.reportWarning("entry should be marked 'forward': " + key + " (" + typeInfo + ")")
    }
}
