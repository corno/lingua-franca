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
