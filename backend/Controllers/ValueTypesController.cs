using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ValueTypesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ValueTypesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var valueTypes = await _context.ValueTypes
            .Where(vt => vt.IsActive)
            .OrderBy(vt => vt.Name)
            .ToListAsync();

        return Ok(valueTypes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var valueType = await _context.ValueTypes
            .FirstOrDefaultAsync(vt => vt.Id == id && vt.IsActive);

        if (valueType == null)
        {
            return NotFound();
        }

        return Ok(valueType);
    }
} 