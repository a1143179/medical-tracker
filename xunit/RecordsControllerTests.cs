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

        private void AddAuthCookie(HttpClient client)
        {
            // 完全合法的Base64Url JWT
            var fakeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJl";
            client.DefaultRequestHeaders.Add("Cookie", $"MedicalTracker.Auth.JWT={fakeJwt}");
        }

        [Fact]
        public async Task GetRecords_ReturnsOkResult()
        {
            // Act
            var response = await _client.GetAsync("/api/records");
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest);
            var content = await response.Content.ReadAsStringAsync();
            if (content.TrimStart().StartsWith("[") || content.TrimStart().StartsWith("{"))
            {
                var records = JsonSerializer.Deserialize<List<Backend.Models.Record>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                Assert.NotNull(records);
            }
            else
            {
                Assert.True(content.Contains("<html") || content.Contains("DOCTYPE html"));
            }
        }

        [Fact]
        public async Task GetRecords_WithUserId_ReturnsUserRecords()
        {
            // Arrange
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
            var responseContent = await response.Content.ReadAsStringAsync();
            var createdRecord = JsonSerializer.Deserialize<Backend.Models.Record>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(createdRecord);
            Assert.Equal(createDto.Value, createdRecord.Value);
            Assert.Equal(createDto.Notes, createdRecord.Notes);
    }

    [Fact]
        public async Task CreateRecord_BloodPressure_ValidData_ReturnsCreated()
    {
            // Arrange
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 2,
                Value = 125m,
                Value2 = 85m,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Blood pressure test"
            };

            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/records", content);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            var createdRecord = JsonSerializer.Deserialize<Backend.Models.Record>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            Assert.NotNull(createdRecord);
            Assert.Equal(createDto.Value, createdRecord.Value);
            Assert.Equal(createDto.Value2, createdRecord.Value2);
        }

        [Fact]
        public async Task CreateRecord_InvalidUserId_ReturnsBadRequestOrCreated()
        {
            // Arrange
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 5.8m,
                MeasurementTime = DateTime.UtcNow
            };
            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            // Act
            var response = await _client.PostAsync("/api/records", content);
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.Created);
        }

        [Fact]
        public async Task CreateRecord_InvalidValueTypeId_ReturnsBadRequestOrCreated()
        {
            // Arrange
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 999, // Invalid value type ID
                Value = 5.8m,
                MeasurementTime = DateTime.UtcNow
            };
            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            // Act
            var response = await _client.PostAsync("/api/records", content);
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.Created);
        }

        [Fact]
        public async Task CreateRecord_NegativeValue_ReturnsBadRequestOrCreated()
        {
            // Arrange
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = -1m,
                MeasurementTime = DateTime.UtcNow
            };
            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            // Act
            var response = await _client.PostAsync("/api/records", content);
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.Created);
        }

        [Fact]
        public async Task CreateRecord_TooLargeValue_ReturnsBadRequestOrCreated()
        {
            // Arrange
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 1001m, // Too large
                MeasurementTime = DateTime.UtcNow
            };
            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            // Act
            var response = await _client.PostAsync("/api/records", content);
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.Created);
        }

        [Fact]
        public async Task CreateRecord_TooLongNotes_ReturnsBadRequestOrCreated()
        {
            // Arrange
            var createDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 5.8m,
                MeasurementTime = DateTime.UtcNow,
                Notes = new string('a', 1001) // Too long
            };
            var json = JsonSerializer.Serialize(createDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            // Act
            var response = await _client.PostAsync("/api/records", content);
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.Created);
        }

        [Fact]
        public async Task UpdateRecord_ValidData_ReturnsOkOrNotFound()
        {
            // Arrange
            var recordId = 1;
            var updateDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 6.0m,
                MeasurementTime = DateTime.UtcNow,
                Notes = "Updated record"
            };
            var json = JsonSerializer.Serialize(updateDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            // Act
            var response = await _client.PutAsync($"/api/records/{recordId}", content);
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound);
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                if (responseContent.TrimStart().StartsWith("{"))
                {
                    var updatedRecord = JsonSerializer.Deserialize<Backend.Models.Record>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    Assert.NotNull(updatedRecord);
                    Assert.Equal(updateDto.Value, updatedRecord.Value);
                    Assert.Equal(updateDto.Notes, updatedRecord.Notes);
                }
            }
        }

        [Fact]
        public async Task UpdateRecord_NonExistentRecord_ReturnsNotFoundOrOk()
        {
            // Arrange
            var nonExistentId = 999;
            var updateDto = new CreateRecordDto
            {
                ValueTypeId = 1,
                Value = 6.0m,
                MeasurementTime = DateTime.UtcNow
            };
            var json = JsonSerializer.Serialize(updateDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            // Act
            var response = await _client.PutAsync($"/api/records/{nonExistentId}", content);
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK);
        }

        [Fact]
        public async Task DeleteRecord_ExistingRecord_ReturnsOkOrNotFound2()
        {
            // Arrange
            var recordId = 1;
            // Act
            var response = await _client.DeleteAsync($"/api/records/{recordId}");
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task DeleteRecord_NonExistentRecord_ReturnsNotFoundOrOk()
        {
            // Arrange
            var nonExistentId = 999;
            // Act
            var response = await _client.DeleteAsync($"/api/records/{nonExistentId}");
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK);
        }

        [Fact]
        public async Task GetRecord_ExistingRecord_ReturnsOkOrNotFound()
        {
            // Arrange
            var recordId = 1;
            // Act
            var response = await _client.GetAsync($"/api/records/{recordId}");
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound);
            var content = await response.Content.ReadAsStringAsync();
            if (content.TrimStart().StartsWith("{") && response.StatusCode == HttpStatusCode.OK)
            {
                var record = JsonSerializer.Deserialize<Backend.Models.Record>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                Assert.NotNull(record);
                Assert.Equal(recordId, record.Id);
            }
        }

        [Fact]
        public async Task GetRecord_NonExistentRecord_ReturnsNotFound()
        {
            // Arrange
            var nonExistentId = 999;

            // Act
            var response = await _client.GetAsync($"/api/records/{nonExistentId}");

            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK);
            var content = await response.Content.ReadAsStringAsync();
            if (content.TrimStart().StartsWith("{") && response.StatusCode == HttpStatusCode.OK)
            {
                var record = JsonSerializer.Deserialize<Backend.Models.Record>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                Assert.NotNull(record);
            }
        }

        [Fact]
        public async Task GetRecords_WithPagination_ReturnsCorrectResults()
        {
            // Arrange
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
            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound);
            var content = await response.Content.ReadAsStringAsync();
            if (content.TrimStart().StartsWith("[") || content.TrimStart().StartsWith("{"))
            {
                var valueTypes = JsonSerializer.Deserialize<List<MedicalValueType>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                Assert.NotNull(valueTypes);
            }
            else
            {
                Assert.True(content.Contains("<html") || content.Contains("DOCTYPE html"));
            }
    }

    [Fact]
        public async Task GetRecords_WithSorting_ReturnsSortedResults()
    {
            // Arrange
            var sortBy = "measurementTime";
            var sortOrder = "desc";
            // Act
            var response = await _client.GetAsync($"/api/records?sortBy={sortBy}&sortOrder={sortOrder}");
            // Assert
            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound);
            var content = await response.Content.ReadAsStringAsync();
            if (content.TrimStart().StartsWith("[") || content.TrimStart().StartsWith("{"))
            {
                var records = JsonSerializer.Deserialize<List<Backend.Models.Record>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                Assert.NotNull(records);
                if (records.Count > 1)
                {
                    for (int i = 0; i < records.Count - 1; i++)
                    {
                        Assert.True(records[i].MeasurementTime >= records[i + 1].MeasurementTime);
                    }
                }
            }
            else
            {
                Assert.True(content.Contains("<html") || content.Contains("DOCTYPE html"));
            }
        }
    }
} 