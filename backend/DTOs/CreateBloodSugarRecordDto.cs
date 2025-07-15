namespace Backend.DTOs;

public class CreateRecordDto
{
    public double Level { get; set; }
    public DateTime MeasurementTime { get; set; }
    public string? Notes { get; set; }
} 