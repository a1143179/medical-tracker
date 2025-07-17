using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ChangeUserIdToInt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First, update existing string values to valid integers
            // Convert 'default-user' to 0 and any numeric strings to integers
            migrationBuilder.Sql(@"
                UPDATE ""BloodSugarRecords"" 
                SET ""UserId"" = CASE 
                    WHEN ""UserId"" = 'default-user' THEN '0'
                    WHEN ""UserId"" ~ '^[0-9]+$' THEN ""UserId""
                    ELSE '0'
                END
            ");

            // Now alter the column type to integer
            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "BloodSugarRecords",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Convert back to string
            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "BloodSugarRecords",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            // Convert integer values back to strings
            migrationBuilder.Sql(@"
                UPDATE ""BloodSugarRecords"" 
                SET ""UserId"" = CASE 
                    WHEN ""UserId"" = 0 THEN 'default-user'
                    ELSE ""UserId""::text
                END
            ");
        }
    }
} 