using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Tests
{
    public class SimpleControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public SimpleControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the existing DbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    // Add in-memory database
                    services.AddDbContext<AppDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDatabase_" + Guid.NewGuid().ToString());
                    });

                    // Create a new service provider
                    var serviceProvider = services.BuildServiceProvider();

                    // Create a scope to obtain a reference to the database context
                    using (var scope = serviceProvider.CreateScope())
                    {
                        var scopedServices = scope.ServiceProvider;
                        var db = scopedServices.GetRequiredService<AppDbContext>();

                        // Ensure the database is created
                        db.Database.EnsureCreated();

                        try
                        {
                            // Seed the database with test data
                            SeedDatabase(db);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"An error occurred seeding the database: {ex.Message}");
                        }
                    }
                });
            });

            _client = _factory.CreateClient();
        }

        private void SeedDatabase(AppDbContext context)
        {
            // Add test users
            var testUser = new User
            {
                Id = 1,
                Email = "test@example.com",
                Name = "Test User",
                PreferredValueTypeId = 1
            };

            context.Users.Add(testUser);

            // Add test value types
            var bloodSugarType = new MedicalValueType
            {
                Id = 1,
                Name = "Blood Sugar",
                NameZh = "血糖",
                Unit = "mmol/L",
                RequiresTwoValues = false
            };

            var bloodPressureType = new MedicalValueType
            {
                Id = 2,
                Name = "Blood Pressure",
                NameZh = "血压",
                Unit = "mmHg",
                RequiresTwoValues = true
            };

            context.ValueTypes.AddRange(bloodSugarType, bloodPressureType);

            // Add test records
            var testRecords = new List<Backend.Models.Record>
            {
                new Backend.Models.Record
                {
                    Id = 1,
                    UserId = 1,
                    ValueTypeId = 1,
                    Value = 5.5m,
                    Value2 = null,
                    MeasurementTime = DateTime.UtcNow.AddHours(-1),
                    Notes = "Test record 1"
                },
                new Backend.Models.Record
                {
                    Id = 2,
                    UserId = 1,
                    ValueTypeId = 1,
                    Value = 6.2m,
                    Value2 = null,
                    MeasurementTime = DateTime.UtcNow.AddHours(-2),
                    Notes = "Test record 2"
                },
                new Backend.Models.Record
                {
                    Id = 3,
                    UserId = 1,
                    ValueTypeId = 2,
                    Value = 120m,
                    Value2 = 80m,
                    MeasurementTime = DateTime.UtcNow.AddHours(-3),
                    Notes = "Blood pressure record"
                }
            };

            context.Records.AddRange(testRecords);
            context.SaveChanges();
        }

        [Fact]
        public async Task HealthCheck_ReturnsOk()
        {
            // Act
            var response = await _client.GetAsync("/api/health");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetValueTypes_ReturnsAllValueTypes()
        {
            // Act
            var response = await _client.GetAsync("/api/value-types");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            var valueTypes = JsonSerializer.Deserialize<List<MedicalValueType>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(valueTypes);
            Assert.True(valueTypes.Count >= 2); // At least blood sugar and blood pressure
        }

        [Fact]
        public async Task GetRecords_WithoutAuth_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.GetAsync("/api/records");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task CreateRecord_WithoutAuth_ReturnsUnauthorized()
        {
            // Arrange
            var createDto = new CreateRecordDto
            {
                Value = 5.8m,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Test creation"
            };

            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/records", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task UpdateRecord_WithoutAuth_ReturnsUnauthorized()
        {
            // Arrange
            var updateDto = new CreateRecordDto
            {
                Value = 6.0m,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Updated record"
            };

            var json = JsonSerializer.Serialize(updateDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PutAsync("/api/records/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task DeleteRecord_WithoutAuth_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.DeleteAsync("/api/records/1");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetRecord_NonExistentRecord_ReturnsNotFound()
        {
            // Arrange
            var nonExistentId = 999;

            // Act
            var response = await _client.GetAsync($"/api/records/{nonExistentId}");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
} 