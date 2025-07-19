namespace Backend.DTOs;

public class CreateRecordDto
{
    public decimal Value { get; set; }
    public DateTime MeasurementTime { get; set; }
    public string? Notes { get; set; }
    public int? ValueTypeId { get; set; }
} 