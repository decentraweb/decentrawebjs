declare module 'tr46' {
  interface Options {
    /**
     *  Default value: false When set to true, any bi-directional text within the input will be checked for validation.
     */
    checkBidi?: boolean;
    /**
     * Default value: false When set to true, the positions of any hyphen characters within the input will be checked for validation.
     */
    checkHyphens?: boolean;
    /**
     * Default value: false When set to true, any word joiner characters within the input will be checked for validation.
     */
    checkJoiners?: boolean;
    /**
     * Default value: "nontransitional" When set to "transitional", symbols within the input will be validated according to the older IDNA2003 protocol. When set to "nontransitional", the current IDNA2008 protocol will be used.
     */
    processingOption?: boolean;
    /**
     * Type: boolean Default value: false When set to true, input will be validated according to STD3 Rules.
     */
    useSTD3ASCIIRules?: boolean;
  }

  interface ToASCIIOptions extends Options {
    /**
     * Default value: false When set to true, the length of each DNS label within the input will be checked for validation.
     */
    verifyDNSLength?: boolean;
  }
  interface Result {
    domain: string;
    error: boolean;
  }

  function toUnicode(domain: string, options: Options): Result;
  function toASCII(domain: string, options: ToASCIIOptions): string;
}
