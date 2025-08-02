using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? GoogleId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // User's preferred medical value type
    public int PreferredValueTypeId { get; set; } = 1; // Default to Blood Sugar (ID 1)
    
    // Invitation code for login
    [StringLength(10)]
    public string? InvitationCode { get; set; }
} 