using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class RemoveInvalidBloodSugarLevels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove records with blood sugar levels outside the valid range (0.1 to 100)
            migrationBuilder.Sql("DELETE FROM \"BloodSugarRecords\" WHERE \"Level\" < 0.1 OR \"Level\" > 100");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Note: Cannot restore deleted records in Down migration
            // The data cleanup is irreversible
        }
    }
}
