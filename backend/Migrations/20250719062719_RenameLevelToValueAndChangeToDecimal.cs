using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class RenameLevelToValueAndChangeToDecimal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add new Value column
            migrationBuilder.AddColumn<decimal>(
                name: "Value",
                table: "Records",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            // Copy data from Level to Value
            migrationBuilder.Sql("UPDATE \"Records\" SET \"Value\" = \"Level\"");

            // Drop the old Level column
            migrationBuilder.DropColumn(
                name: "Level",
                table: "Records");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Add back the Level column
            migrationBuilder.AddColumn<double>(
                name: "Level",
                table: "Records",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            // Copy data back from Value to Level
            migrationBuilder.Sql("UPDATE \"Records\" SET \"Level\" = \"Value\"");

            // Drop the Value column
            migrationBuilder.DropColumn(
                name: "Value",
                table: "Records");
        }
    }
}
