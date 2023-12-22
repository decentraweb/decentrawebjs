/**
 * Generate a random hex string n bytes long
 */
function getRandomHex(n: number): string {
  const crypto = self.crypto;
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

export default getRandomHex;
