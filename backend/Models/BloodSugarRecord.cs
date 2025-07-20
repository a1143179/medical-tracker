namespace Backend.Models;

public class Record
{
    public int Id { get; set; }
    public decimal Value { get; set; }
    
    // Second value for measurements that need two values (e.g., blood pressure)
    public decimal? Value2 { get; set; }
    
    public DateTime MeasurementTime { get; set; }
    public string? Notes { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // New foreign key for MedicalValueType
    public int ValueTypeId { get; set; } = 1; // Default to Blood Sugar (ID 1)
    public MedicalValueType ValueType { get; set; } = null!;
} 