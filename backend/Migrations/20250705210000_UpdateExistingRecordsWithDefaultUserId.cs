using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateExistingRecordsWithDefaultUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update existing records with a default user ID
            migrationBuilder.Sql("UPDATE \"BloodSugarRecords\" SET \"UserId\" = 'default-user' WHERE \"UserId\" = '' OR \"UserId\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert the changes if needed
            migrationBuilder.Sql("UPDATE \"BloodSugarRecords\" SET \"UserId\" = '' WHERE \"UserId\" = 'default-user'");
        }
    }
} 