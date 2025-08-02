namespace Backend.DTOs;

public class InvitationLoginDto
{
    public string InvitationCode { get; set; } = string.Empty;
    public bool RememberMe { get; set; } = false;
} 