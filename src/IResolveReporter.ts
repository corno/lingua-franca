export interface IResolveReporter {
    //errors

    /**
     * called when 2 entries in a dictionary have the same key
     */
    reportConflictingEntry(typeInfo: string, key: string): void

    reportLookupDoesNotExistForReference(typeInfo: string, key: string): void
    reportLookupDoesNotExistForFulfillingDictionary(typeInfo: string, key: string[]): void


    reportUnresolvedReference(typeInfo: string, key: string, options: string[], delayed: boolean): void
    reportConstraintViolation(typeInfo: string, expectedState: string, foundState: string, delayed: boolean): void

    /**
     * missing entry in a fulfilling dictionary.
     * A fulfilling dictionary fulfils a requiring dictionary. All keys in a requiring dictionary have to be matched
     * by an entry in the fulfilling dictionary
     * @param typeInfo
     * @param key
     * @param foundEntries
     */
    reportMissingRequiredEntries(typeInfo: string, missingEntries: string[], foundEntries: string[], delayed: boolean): void

    reportUnresolvedFulfillingDictionaryEntry(typeInfo: string, key: string, options: string[], delayed: boolean): void

    /**
     * the entries in an ordered dictionary form a loop and therefor the ordered dictionary
     * cannot be ordered
     * @param typeInfo
     */
    reportCircularDependency(typeInfo: string, key: string): void

    /**
     *
     * @param typeInfo
     * @param key
     */
    reportReferenceToNonExistentLookup(typeInfo: string, key: string): void

    //dependent Errors
    reportDependentUnresolvedReference(typeInfo: string, key: string, delayed: boolean): void
    reportDependentConstraintViolation(typeInfo: string, delayed: boolean): void
    reportUnresolvedRequiringDictionary(typeInfo: string, delayed: boolean): void

    reportDependentUnresolvedFulfillingDictionaryEntry(typeInfo: string, key: string, delayed: boolean): void


    //warnings
    reportShouldNotBeDeclaredForward(typeInfo: string, key: string): void
    reportShouldBeDeclaredForward(typeInfo: string, key: string): void

}
