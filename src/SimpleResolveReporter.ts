import { IResolveReporter } from "./IResolveReporter"

export class ResolveReporter implements IResolveReporter {
    private readonly reportError: (dependent: boolean, message: string) => void
    constructor(reportError: (dependent: boolean, message: string) => void) {
        this.reportError = reportError
    }
    public reportUnresolvedReference(type: string, key: string, options: string[]) {
        this.reportError(false, "unresolved reference: " + key + " (" + type + "). found entries: " + options.join(", "))
    }
    public reportDependentUnresolvedReference(type: string, key: string) {
        this.reportError(true, "unresolved reference: " + key + " (" + type + ")")
    }
    public reportUnresolvedForwardReference(type: string, key: string) {
        this.reportError(false, "unresolved forward reference: " + key + " (" + type + ")")
    }
    public reportDependentUnresolvedForwardReference(type: string, key: string) {
        this.reportError(true, "unresolved forward reference: " + key + " (" + type + ")")
    }
    public reportDependentUnresolvedDictionary(type: string) {
        this.reportError(true, "unmatched dictionary: " + type)
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
}
