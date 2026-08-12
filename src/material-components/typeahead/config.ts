export type NiceTypeaheadIconOptions = {
   /** Registered `MatIconRegistry` svg icon name for the trigger dropdown arrow. */
   arrow?: string
   /** Registered `MatIconRegistry` svg icon name for the trigger clear button. */
   remove?: string
   /** Registered `MatIconRegistry` svg icon name for the panel search field prefix. */
   search?: string
}


export type NiceTypeaheadConfig = {
    icons?: NiceTypeaheadIconOptions
};
