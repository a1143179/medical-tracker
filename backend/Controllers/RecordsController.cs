using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend;

[ApiController]
[Route("api/[controller]")]
public class RecordsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RecordsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = HttpContext.Session.GetString("UserId");
        if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var id))
        {
            return Unauthorized();
        }

        var records = await _context.BloodSugarRecords
            .Where(r => r.UserId == id)
            .OrderByDescending(r => r.MeasurementTime)
            .ToListAsync();

        return Ok(records);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] CreateBloodSugarRecordDto dto)
    {
        var userId = HttpContext.Session.GetString("UserId");
        if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var id))
        {
            return Unauthorized();
        }

        if (dto.Level <= 0)
        {
            return BadRequest("Blood sugar level must be greater than 0");
        }

        var record = new BloodSugarRecord
        {
            Level = dto.Level,
            MeasurementTime = dto.MeasurementTime,
            Notes = dto.Notes,
            UserId = id
        };

        _context.BloodSugarRecords.Add(record);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = record.Id }, record);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromBody] CreateBloodSugarRecordDto dto)
    {
        var userId = HttpContext.Session.GetString("UserId");
        if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var userIdInt))
        {
            return Unauthorized();
        }

        if (dto.Level <= 0)
        {
            return BadRequest("Blood sugar level must be greater than 0");
        }

        var record = await _context.BloodSugarRecords
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userIdInt);

        if (record == null)
        {
            return NotFound();
        }

        record.Level = dto.Level;
        record.MeasurementTime = dto.MeasurementTime;
        record.Notes = dto.Notes;

        await _context.SaveChangesAsync();

        return Ok(record);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = HttpContext.Session.GetString("UserId");
        if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var userIdInt))
        {
            return Unauthorized();
        }

        var record = await _context.BloodSugarRecords
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userIdInt);

        if (record == null)
        {
            return NotFound();
        }

        _context.BloodSugarRecords.Remove(record);
        await _context.SaveChangesAsync();

        return Ok();
    }
} 