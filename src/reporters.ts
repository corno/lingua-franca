export interface IConflictingEntryReporter {
    /**
     * called when 2 entries in a dictionary have the same key
     */
    reportConflictingEntry(p: { key: string }): void
}

export interface ICircularDependencyReporter {
    /**
     * the entries in an ordered dictionary form a loop and therefor the ordered dictionary
     * cannot be ordered
     */
    reportCircularDependency(p: { key: string }): void
}

export interface IFulfillingDictionaryReporter {
    reportLookupDoesNotExist(p: { keys: string[] }): void
    /**
     * missing entry in a fulfilling dictionary.
     * A fulfilling dictionary fulfils a requiring dictionary. All keys in a requiring dictionary have to be matched
     * by an entry in the fulfilling dictionary
     * @param reporter
     * @param key
     * @param foundEntries
     */
    reportMissingRequiredEntries(p: {
        readonly missingEntries: string[]
        readonly foundEntries: string[]
    }): void
    reportUnresolvedEntry(p: {
        readonly key: string,
        readonly options: string[]
    }): void
    reportDependentUnresolvedEntry(p: {
        readonly key: string
    }): void
}

export interface IConstraintViolationReporter {
    reportConstraintViolation(p: {
        readonly expectedState: string,
        readonly foundState: string
    }): void
    reportDependentConstraintViolation(p: {}): void
}

export interface IReferenceResolveReporter {
    reportLookupDoesNotExist(p: {
        readonly key: string
    }): void
    reportUnresolvedReference(p: {
        readonly key: string,
        readonly options: string[]
    }): void
    reportDependentUnresolvedReference(p: {
        readonly key: string
    }): void
}
