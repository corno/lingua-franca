export interface IResolveReporter {
    //errors
    reportUnresolvedReference(typeInfo: string, key: string, options: string[]): void
    reportUnresolvedIntraReference(typeInfo: string, key: string): void
    reportIntraConstraintViolation(typeInfo: string): void
    reportSuperfluousFulfillingEntry(typeInfo: string, key: string, requiredEntries: string[]): void
    reportMissingRequiredEntry(typeInfo: string, key: string, foundEntries: string[]): void
    reportConflictingEntry(typeInfo: string, key: string): void
    reportCircularDependency(typeInfo: string): void
    //dependent Errors
    reportDependentUnresolvedReference(typeInfo: string, key: string): void
    reportDependentUnresolvedIntraReference(typeInfo: string, key: string): void
    reportDependentUnresolvedDictionary(typeInfo: string): void
    //warnings
    reportShouldNotBeDeclaredForward(typeInfo: string, key: string): void
    reportShouldBeDeclaredForward(typeInfo: string, key: string): void

}
