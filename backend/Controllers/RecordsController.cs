using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecordsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public RecordsController(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        var records = await _context.Records
            .Include(r => r.ValueType)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.MeasurementTime)
            .ToListAsync();
        return Ok(records);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] CreateRecordDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        if (dto.Value <= 0)
        {
            return BadRequest("Value must be greater than 0");
        }
        var record = new Record
        {
            Value = dto.Value,
            Value2 = dto.Value2,
            MeasurementTime = dto.MeasurementTime,
            Notes = dto.Notes,
            UserId = userId,
            ValueTypeId = dto.ValueTypeId ?? 1 // Default to Blood Sugar
        };
        _context.Records.Add(record);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = record.Id }, record);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromBody] CreateRecordDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        if (dto.Value <= 0)
        {
            return BadRequest("Value must be greater than 0");
        }
        var record = await _context.Records
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (record == null)
        {
            return NotFound();
        }
        record.Value = dto.Value;
        record.Value2 = dto.Value2;
        record.MeasurementTime = dto.MeasurementTime;
        record.Notes = dto.Notes;
        record.ValueTypeId = dto.ValueTypeId ?? record.ValueTypeId;
        await _context.SaveChangesAsync();
        return Ok(record);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        var record = await _context.Records
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (record == null)
        {
            return NotFound();
        }
        _context.Records.Remove(record);
        await _context.SaveChangesAsync();
        return Ok();
    }
} 