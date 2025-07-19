using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecordsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public RecordsController(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    private int? GetUserId()
    {
        // Get JWT token from Authorization header or cookie
        var token = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "") 
                   ?? Request.Cookies["MedicalTracker.Auth.JWT"];
        
        if (string.IsNullOrEmpty(token))
        {
            return null;
        }

        var email = _jwtService.GetUserEmailFromToken(token);
        if (string.IsNullOrEmpty(email))
        {
            return null;
        }

        // Get user from database by email
        var user = _context.Users.FirstOrDefault(u => u.Email == email);
        return user?.Id;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var records = await _context.Records
            .Where(r => r.UserId == userId.Value)
            .OrderByDescending(r => r.MeasurementTime)
            .ToListAsync();

        return Ok(records);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] CreateRecordDto dto)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        if (dto.Value <= 0)
        {
            return BadRequest("Blood sugar value must be greater than 0");
        }

        var record = new Record
        {
            Value = dto.Value,
            MeasurementTime = dto.MeasurementTime,
            Notes = dto.Notes,
            UserId = userId.Value
        };

        _context.Records.Add(record);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = record.Id }, record);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromBody] CreateRecordDto dto)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        if (dto.Value <= 0)
        {
            return BadRequest("Blood sugar value must be greater than 0");
        }

        var record = await _context.Records
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);

        if (record == null)
        {
            return NotFound();
        }

        record.Value = dto.Value;
        record.MeasurementTime = dto.MeasurementTime;
        record.Notes = dto.Notes;

        await _context.SaveChangesAsync();

        return Ok(record);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var record = await _context.Records
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);

        if (record == null)
        {
            return NotFound();
        }

        _context.Records.Remove(record);
        await _context.SaveChangesAsync();

        return Ok();
    }
} 