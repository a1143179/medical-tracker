namespace Backend.Models;

public class BloodSugarRecord
{
    public int Id { get; set; }
    public double Level { get; set; }
    public DateTime MeasurementTime { get; set; }
    public string? Notes { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
} 