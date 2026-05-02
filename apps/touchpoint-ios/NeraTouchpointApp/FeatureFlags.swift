enum FeatureFlags {
    #if NERA_DEV_FEATURES
    static let devTools = true
    #else
    static let devTools = false
    #endif
}
