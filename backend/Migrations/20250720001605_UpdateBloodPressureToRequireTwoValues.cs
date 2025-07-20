using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBloodPressureToRequireTwoValues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update Blood Pressure (ID 2) to require two values
            migrationBuilder.Sql(@"
                UPDATE ""ValueTypes"" 
                SET ""RequiresTwoValues"" = true, 
                    ""Unit"" = 'mmHg', 
                    ""Unit2"" = 'mmHg'
                WHERE ""Id"" = 2;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert Blood Pressure (ID 2) to not require two values
            migrationBuilder.Sql(@"
                UPDATE ""ValueTypes"" 
                SET ""RequiresTwoValues"" = false, 
                    ""Unit"" = 'mmHg', 
                    ""Unit2"" = NULL
                WHERE ""Id"" = 2;
            ");
        }
    }
}
