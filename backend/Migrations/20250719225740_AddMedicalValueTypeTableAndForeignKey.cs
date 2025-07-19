using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMedicalValueTypeTableAndForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ValueTypeId",
                table: "Records",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ValueTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ValueTypes", x => x.Id);
                });

            // Insert seed data
            migrationBuilder.InsertData(
                table: "ValueTypes",
                columns: new[] { "Id", "Name", "Unit", "IsActive" },
                values: new object[,]
                {
                    { 1, "Blood Sugar", "mmol/L", true },
                    { 2, "Blood Pressure", "mmHg", true },
                    { 3, "Body Fat %", "%", true },
                    { 4, "Weight", "kg", true }
                });

            // Update existing records to have ValueTypeId = 1 (Blood Sugar) BEFORE adding foreign key
            migrationBuilder.Sql("UPDATE \"Records\" SET \"ValueTypeId\" = 1 WHERE \"ValueTypeId\" = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Records_ValueTypeId",
                table: "Records",
                column: "ValueTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Records_ValueTypes_ValueTypeId",
                table: "Records",
                column: "ValueTypeId",
                principalTable: "ValueTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Records_ValueTypes_ValueTypeId",
                table: "Records");

            migrationBuilder.DropTable(
                name: "ValueTypes");

            migrationBuilder.DropIndex(
                name: "IX_Records_ValueTypeId",
                table: "Records");

            migrationBuilder.DropColumn(
                name: "ValueTypeId",
                table: "Records");
        }
    }
}
