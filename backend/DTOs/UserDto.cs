namespace Backend.DTOs;

public class UserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int PreferredValueTypeId { get; set; } = 1;
}

public class UpdatePreferredValueTypeDto
{
    public int PreferredValueTypeId { get; set; }
} 