import { toUnicode } from 'tr46';
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
  if (!name) {
    throw new Error(`Invalid name: ${name}`);
  }
  const result = toUnicode(name, { useSTD3ASCIIRules: true });
  if (result.error) {
    throw new Error(`Invalid name: ${name}`);
  }
  return result.domain;
}
