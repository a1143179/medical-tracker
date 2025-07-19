using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Models;

public class MedicalValueType
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string Unit { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
    
    // Navigation property - ignore in JSON to prevent circular reference
    [JsonIgnore]
    public ICollection<Record> Records { get; set; } = new List<Record>();
} 