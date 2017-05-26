/* eslint-disable no-bitwise, no-underscore-dangle, no-restricted-properties */
export class RC4Rand {
  constructor(seed = null) {
    this.s = new Array(256).fill(0).map((x, i) => i);
    this.i = 0;
    this.j = 0;
    if (seed) this.mix(seed);
  }

  mix(seed) {
    seed = `${seed}`;
    let j = 0;
    for (let i = 0; i < this.s.length; i++) {
      const ch = seed.charCodeAt(i % seed.length) & 0xFF;
      j += this.s[i] + ch;
      j %= 256;
      this._swap(i, j);
    }
  }

  _swap(i, j) {
    const sj = this.s[j];
    const si = this.s[i];
    this.s[i] = sj;
    this.s[j] = si;
  }

  nextByte() {
    this.i = (this.i + 1) % 256;
    this.j = (this.j + this.s[this.i]) % 256;
    this._swap(this.i, this.j);
    return this.s[(this.s[this.i] + this.s[this.j]) % 256];
  }

  nextFloat() {
    const BYTES = 7;
    let output = 0;
    for (let i = 0; i < BYTES; i++) {
      output = output * 256 + this.nextByte();
    }
    return output / (Math.pow(2, BYTES * 8) - 1);
  }

  uniform(a, b) {
    if (b < a) {
      const na = a;
      a = b;
      b = na;
    }
    return a + this.nextFloat() * (b - a);
  }

  uniformInt(a, b) {
    return Math.floor(this.uniform(a, b));
  }
}

export class RandomFarm {
  constructor(seed) {
    this.seed = seed;
  }

  get(name) {
    return new RC4Rand(`${this.seed}+${name}`);
  }
}


export const rand = (a, b) => a + Math.random() * (b - a);
