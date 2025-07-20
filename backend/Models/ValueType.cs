using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Models;

public class MedicalValueType
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty; // English name
    
    [Required]
    [MaxLength(50)]
    public string NameZh { get; set; } = string.Empty; // Chinese name
    
    [MaxLength(20)]
    public string Unit { get; set; } = string.Empty;
    
    // Second unit for measurements that need two values (e.g., blood pressure)
    [MaxLength(20)]
    public string? Unit2 { get; set; }
    
    // Indicates if this value type requires two values
    public bool RequiresTwoValues { get; set; } = false;
    
    public bool IsActive { get; set; } = true;
    
    // Navigation property - ignore in JSON to prevent circular reference
    [JsonIgnore]
    public ICollection<Record> Records { get; set; } = new List<Record>();
} 