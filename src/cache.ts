
export interface Cache<Key, Value> {
    get: (key: Key) => Promise<Value | undefined>;
    set: (key: Key, value: Value) => Promise<void>;
    has: (key: Key) => Promise<boolean>;
    delete: (key: Key) => Promise<void>;
    clear: () => Promise<void>;
}

export type CacheFactory<Key, Value> = (cacheNamespace: string) => Cache<Key, Value>;

export function cacheFactory<Key, Value>(cacheNamespace: string) : Cache<Key, Value> {
    const factoryCaches = new Map<string, Cache<Key, Value>>();

    if (factoryCaches.has(cacheNamespace)) {
        return factoryCaches.get(cacheNamespace)!;
    }

    const cache = {
        _cache: new Map<Key, Value>(),
        async get(key) { return (this as any)._cache.get(key) },
        async set(key, value) { (this as any)._cache.set(key, value) },
        async has(key) { return (this as any)._cache.has(key) },
        async delete(key) { (this as any)._cache.delete(key) },
        async clear() { (this as any)._cache.clear() },
    } as Cache<Key, Value>;

    factoryCaches.set(cacheNamespace, cache);

    return cache;
}
