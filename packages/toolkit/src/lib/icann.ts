import fs from "fs";
import path from "path";
import * as punycode from "punycode/";

export const ICANN_TLDS: Record<string, true> = fs.readFileSync(path.join(__dirname, '../../icann_tlds.txt'), 'utf-8')
  .split(/\s+/)
  .reduce((tlds: Record<string, true>, item: string) => {
    let tld = punycode.toUnicode(item.trim().toLowerCase());
    if (tld) {
      tlds[tld] = true;
    }
    return tlds;
  }, {});
