export interface IResolveReporter {
    reportUnresolvedReference(type: string, key: string, options: string[]): void
    reportDependentUnresolvedReference(type: string, key: string): void
    reportUnresolvedForwardReference(type: string, key: string): void
    reportDependentUnresolvedForwardReference(type: string, key: string): void
    reportDependentUnresolvedDictionary(type: string): void
    reportSuperfluousDecoratingEntry(type: string, key: string, options: string[]): void
    reportSuperfluousFulfillingEntry(type: string, key: string, requiredEntries: string[]): void
    reportMissingRequiredEntry(type: string, key: string, foundEntries: string[]): void
    reportConflictingEntry(type: string, key: string): void
}
export class ResolveReporter implements IResolveReporter {
    private _errorCount = 0
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
    get hasErrors() {
        return this.errorCount > 0
    }
    get errorCount() {
        return this._errorCount
    }
    private reportError(dependent: boolean, message: string) {
        if (dependent && !this.hasErrors) {
            console.error("Unexpected state, found dependent error, but not a source error")
            //throw new Error("Unexpected state, found dependent error, but not a source error")
        }
        //if (!dependent) {
        console.error(message)
        //}
        this._errorCount++
    }
}
