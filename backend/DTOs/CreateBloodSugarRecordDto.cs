namespace Backend.DTOs;

public class CreateBloodSugarRecordDto
{
    public double Level { get; set; }
    public DateTime MeasurementTime { get; set; }
    public string? Notes { get; set; }
} 