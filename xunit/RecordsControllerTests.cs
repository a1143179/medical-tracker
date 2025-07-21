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
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using System.Text.Encodings.Web;

namespace Backend.Tests
{
    public class RecordsControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public RecordsControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Test");
                builder.ConfigureServices(services =>
                {
                    // Remove all DbContext-related registrations
                    var dbContextDescriptors = services.Where(d => d.ServiceType.Name.Contains("DbContext")).ToList();
                    foreach (var descriptor in dbContextDescriptors)
                    {
                        services.Remove(descriptor);
                    }
                    
                    // Add in-memory database with unique name for each test
                    services.AddDbContext<AppDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDatabase_" + Guid.NewGuid().ToString());
                    });

                    // Authentication is already configured in Program.cs for Test environment

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
            var testRecord1 = new Backend.Models.Record
            {
                Id = 1,
                UserId = 1,
                ValueTypeId = 1,
                Value = 5.8m,
                Value2 = null,
                MeasurementTime = DateTime.UtcNow.AddHours(-1),
                Notes = "Test record 1"
            };

            var testRecord2 = new Backend.Models.Record
            {
                Id = 2,
                UserId = 1,
                ValueTypeId = 2,
                Value = 120m,
                Value2 = 80m,
                MeasurementTime = DateTime.UtcNow.AddHours(-2),
                Notes = "Test record 2"
            };

            context.Records.AddRange(testRecord1, testRecord2);
            context.SaveChanges();
        }

        private void AddAuthCookie(HttpClient client)
        {
            // 完全合法的Base64Url JWT
            var fakeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJl";
            client.DefaultRequestHeaders.Add("Cookie", $"MedicalTracker.Auth.JWT={fakeJwt}");
        }

        [Fact]
        public async Task GetRecords_ReturnsOkResult()
        {
            // Arrange
            AddAuthCookie(_client);
            
            // Set up test data in the current test's database
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            SeedDatabase(dbContext);

            // Act
            var response = await _client.GetAsync("/api/records");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Response content: {content}");
            
            var records = JsonSerializer.Deserialize<List<Backend.Models.Record>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(records);
            Console.WriteLine($"Records count: {records.Count}");
            Assert.True(records.Count > 0);
        }

        [Fact]
        public async Task GetRecords_WithUserId_ReturnsUserRecords()
        {
            // Arrange
            AddAuthCookie(_client);
            var userId = 1;

            // Act
            var response = await _client.GetAsync($"/api/records?userId={userId}");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            var records = JsonSerializer.Deserialize<List<Backend.Models.Record>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(records);
            Assert.All(records, record => Assert.Equal(userId, record.UserId));
        }

        [Fact]
        public async Task GetRecords_WithValueTypeId_ReturnsFilteredRecords()
        {
            // Arrange
            AddAuthCookie(_client);
            var valueTypeId = 1;

            // Act
            var response = await _client.GetAsync($"/api/records?valueTypeId={valueTypeId}");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            var records = JsonSerializer.Deserialize<List<Backend.Models.Record>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(records);
            Assert.All(records, record => Assert.Equal(valueTypeId, record.ValueTypeId));
        }

        [Fact]
        public async Task GetRecords_WithInvalidUserId_ReturnsEmptyList()
        {
            // Arrange
            AddAuthCookie(_client);
            var invalidUserId = 999;

            // Act
            var response = await _client.GetAsync($"/api/records?userId={invalidUserId}");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            var records = JsonSerializer.Deserialize<List<Backend.Models.Record>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(records);
            Assert.Empty(records);
        }

        [Fact]
        public async Task CreateRecord_ValidData_ReturnsCreated()
        {
            // Arrange
            AddAuthCookie(_client);
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 5.8m,
                Value2 = null,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Test creation"
            };

            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/records", content);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task CreateRecord_BloodPressure_ValidData_ReturnsCreated()
        {
            // Arrange
            AddAuthCookie(_client);
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 2,
                Value = 120m,
                Value2 = 80m,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Blood pressure test"
            };

            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/records", content);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task CreateRecord_InvalidUserId_ReturnsBadRequest()
        {
            // Arrange
            AddAuthCookie(_client);
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 5.8m,
                Value2 = null,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Test creation"
            };

            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/records", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task CreateRecord_InvalidValueTypeId_ReturnsBadRequest()
        {
            // Arrange
            AddAuthCookie(_client);
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 999, // Invalid value type
                Value = 5.8m,
                Value2 = null,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Test creation"
            };

            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/records", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task CreateRecord_NegativeValue_ReturnsBadRequest()
        {
            // Arrange
            AddAuthCookie(_client);
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = -5.8m, // Negative value
                Value2 = null,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Test creation"
            };

            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/records", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task CreateRecord_TooLargeValue_ReturnsBadRequest()
        {
            // Arrange
            AddAuthCookie(_client);
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 1000m, // Too large value
                Value2 = null,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Test creation"
            };

            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/records", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task CreateRecord_TooLongNotes_ReturnsBadRequest()
        {
            // Arrange
            AddAuthCookie(_client);
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 5.8m,
                Value2 = null,
                MeasurementTime = DateTime.UtcNow,
                Notes = new string('a', 1001) // Too long notes
            };

            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/records", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task UpdateRecord_ValidData_ReturnsOk()
        {
            // Arrange
            AddAuthCookie(_client);
            var updateDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 6.2m,
                Value2 = null,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Updated test record"
            };

            var json = JsonSerializer.Serialize(updateDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PutAsync("/api/records/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task UpdateRecord_NonExistentRecord_ReturnsNotFound()
        {
            // Arrange
            AddAuthCookie(_client);
            var updateDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 6.2m,
                Value2 = null,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Updated test record"
            };

            var json = JsonSerializer.Serialize(updateDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PutAsync("/api/records/999", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task DeleteRecord_ExistingRecord_ReturnsOk()
        {
            // Arrange
            AddAuthCookie(_client);

            // Act
            var response = await _client.DeleteAsync("/api/records/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task DeleteRecord_NonExistentRecord_ReturnsNotFound()
        {
            // Arrange
            AddAuthCookie(_client);

            // Act
            var response = await _client.DeleteAsync("/api/records/999");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetRecord_ExistingRecord_ReturnsOk()
        {
            // Arrange
            AddAuthCookie(_client);

            // Act
            var response = await _client.GetAsync("/api/records/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            var record = JsonSerializer.Deserialize<Backend.Models.Record>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(record);
            Assert.Equal(1, record.Id);
        }

        [Fact]
        public async Task GetRecord_NonExistentRecord_ReturnsNotFound()
        {
            // Arrange
            AddAuthCookie(_client);
            var nonExistentId = 999;

            // Act
            var response = await _client.GetAsync($"/api/records/{nonExistentId}");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetRecords_WithPagination_ReturnsCorrectResults()
        {
            // Arrange
            AddAuthCookie(_client);
            var page = 1;
            var pageSize = 2;

            // Act
            var response = await _client.GetAsync($"/api/records?page={page}&pageSize={pageSize}");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            var records = JsonSerializer.Deserialize<List<Backend.Models.Record>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(records);
            Assert.True(records.Count <= pageSize);
        }

        [Fact]
        public async Task GetRecords_WithDateRange_ReturnsFilteredResults()
        {
            // Arrange
            AddAuthCookie(_client);
            var startDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd");
            var endDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd");

            // Act
            var response = await _client.GetAsync($"/api/records?startDate={startDate}&endDate={endDate}");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            var records = JsonSerializer.Deserialize<List<Backend.Models.Record>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(records);
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
        public async Task GetRecords_WithSorting_ReturnsSortedResults()
        {
            // Arrange
            AddAuthCookie(_client);
            var sortBy = "measurementTime";
            var sortOrder = "desc";

            // Act
            var response = await _client.GetAsync($"/api/records?sortBy={sortBy}&sortOrder={sortOrder}");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            var records = JsonSerializer.Deserialize<List<Backend.Models.Record>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(records);
            Assert.True(records.Count > 1);
            
            // Verify sorting
            for (int i = 0; i < records.Count - 1; i++)
            {
                Assert.True(records[i].MeasurementTime >= records[i + 1].MeasurementTime);
            }
        }
    }
} 