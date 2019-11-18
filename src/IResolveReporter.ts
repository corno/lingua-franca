export interface IResolveReporter {
    //errors
    reportUnresolvedReference(type: string, key: string, options: string[]): void
    reportUnresolvedIntraReference(type: string, key: string): void
    reportIntraConstraintViolation(type: string): void
    reportUnresolvedDecoratingEntry(type: string, key: string, options: string[]): void
    reportSuperfluousFulfillingEntry(type: string, key: string, requiredEntries: string[]): void
    reportMissingRequiredEntry(type: string, key: string, foundEntries: string[]): void
    reportConflictingEntry(type: string, key: string): void
    //dependent Errors
    reportDependentUnresolvedReference(type: string, key: string): void
    reportDependentUnresolvedDecoratingEntry(type: string, key: string): void
    reportDependentUnresolvedIntraReference(type: string, key: string): void
    reportDependentUnresolvedDictionary(type: string): void
    //warnings
    reportShouldNotBeDeclaredForward(type: string, key: string): void
    reportShouldBeDeclaredForward(type: string, key: string): void

}
