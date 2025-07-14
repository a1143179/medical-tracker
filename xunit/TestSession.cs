using Microsoft.AspNetCore.Http;
using System.Collections.Concurrent;

namespace Backend.Tests;

public class TestSession : ISession
{
    private readonly ConcurrentDictionary<string, byte[]> _store = new();
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public bool IsAvailable => true;
    public IEnumerable<string> Keys => _store.Keys;
    public void Clear() => _store.Clear();
    public Task CommitAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task LoadAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    public void Remove(string key) => _store.TryRemove(key, out _);
    public void Set(string key, byte[] value) => _store[key] = value;
    public bool TryGetValue(string key, out byte[] value) => _store.TryGetValue(key, out value);
    public void SetString(string key, string value) => Set(key, System.Text.Encoding.UTF8.GetBytes(value));
    public string? GetString(string key) => TryGetValue(key, out var val) ? System.Text.Encoding.UTF8.GetString(val) : null;
} 