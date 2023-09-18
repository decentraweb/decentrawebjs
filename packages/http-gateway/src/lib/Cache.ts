interface CacheRecord<V = any> {
  exp: number;
  value: V;
}

export default class Cache<V = any> {
  readonly ttl: number;
  private data: Map<string, CacheRecord<V>> = new Map();

  constructor(defaultTTL: number) {
    this.ttl = defaultTTL;
    setInterval(() => this.cleanup(), 10000);
  }

  async write(key: string, value: V, ttl?: number) {
    this.data.set(key, {
      exp: Date.now() + (ttl || this.ttl),
      value
    });
  }

  async read(key: string): Promise<V | undefined> {
    const record = this.data.get(key);
    return record && record.exp > Date.now() ? record.value : undefined;
  }

  private cleanup() {
    const now = Date.now();
    this.data.forEach((record, key) => {
      if (record.exp < now) {
        this.data.delete(key);
      }
    });
  }
}
