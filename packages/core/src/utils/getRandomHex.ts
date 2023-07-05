const getRandomHex: (n: number) => string =
  typeof window !== 'undefined'
    ? function getRandomHex(n: number): string {
        //Browser
        const crypto = window.crypto;
        const QUOTA = 65536;
        const a = new Uint8Array(n);
        //crypto.getRandomValues can only generate up to 65536 random numbers at a time
        for (var i = 0; i < n; i += QUOTA) {
          crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)));
        }
        return Array.from(a)
          .map((e) => e.toString(16).padStart(2, '0'))
          .join('');
      }
    : function getRandomHex(n: number): string {
        //Node.js
        const crypto = require('crypto');
        return crypto.randomBytes(n).toString('hex');
      };

export default getRandomHex;
