import * as uts46 from 'idna-uts46-hx/dist/index.cjs';
import { ethers } from 'ethers';

export function hashName(inputName: string) {
  // Reject empty names:
  let node: string = '';
  for (let i = 0; i < 32; i++) {
    node += '00';
  }

  const name = normalizeName(inputName);

  if (name) {
    const labels = name.split('.');

    for (let i = labels.length - 1; i >= 0; i--) {
      const labelSha = ethers.utils.keccak256(Buffer.from(labels[i])).split('0x')[1];
      node = ethers.utils.keccak256(new Buffer(node + labelSha, 'hex')).split('0x')[1];
    }
  }

  return '0x' + node;
}

export function normalizeName(name: string) {
  return name ? uts46.toUnicode(name, { useStd3ASCII: true }) : name;
}
