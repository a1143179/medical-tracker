namespace Backend.DTOs;

public class CreateRecordDto
{
    public decimal Value { get; set; }
    public decimal? Value2 { get; set; } // Second value for blood pressure
    public DateTime MeasurementTime { get; set; }
    public string? Notes { get; set; }
    public int? ValueTypeId { get; set; }
} 