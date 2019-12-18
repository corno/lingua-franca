export interface IConflictingEntryReporter {
    /**
     * called when 2 entries in a dictionary have the same key
     */
    reportConflictingEntry(key: string): void
}

export interface ICircularDependencyReporter {
    /**
     * the entries in an ordered dictionary form a loop and therefor the ordered dictionary
     * cannot be ordered
     */
    reportCircularDependency(key: string): void
}

export interface IFulfillingDictionaryReporter {
    reportLookupDoesNotExist(key: string[]): void
    /**
     * missing entry in a fulfilling dictionary.
     * A fulfilling dictionary fulfils a requiring dictionary. All keys in a requiring dictionary have to be matched
     * by an entry in the fulfilling dictionary
     * @param reporter
     * @param key
     * @param foundEntries
     */
    reportMissingRequiredEntries(missingEntries: string[], foundEntries: string[]): void
    reportUnresolvedEntry(key: string, options: string[]): void
    reportDependentUnresolvedEntry(key: string): void
}

export interface IConstraintViolationReporter {
    reportConstraintViolation(expectedState: string, foundState: string): void
    reportDependentConstraintViolation(delayed: boolean): void
}

export interface IReferenceResolveReporter {
    reportLookupDoesNotExist(key: string): void
    reportUnresolvedReference(key: string, options: string[]): void
    reportDependentUnresolvedReference(key: string): void
}
