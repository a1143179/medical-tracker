using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddChineseNameToMedicalValueType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NameZh",
                table: "ValueTypes",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            // Update existing records with Chinese names
            migrationBuilder.Sql("UPDATE \"ValueTypes\" SET \"NameZh\" = '血糖' WHERE \"Id\" = 1");
            migrationBuilder.Sql("UPDATE \"ValueTypes\" SET \"NameZh\" = '血压' WHERE \"Id\" = 2");
            migrationBuilder.Sql("UPDATE \"ValueTypes\" SET \"NameZh\" = '体脂率' WHERE \"Id\" = 3");
            migrationBuilder.Sql("UPDATE \"ValueTypes\" SET \"NameZh\" = '体重' WHERE \"Id\" = 4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NameZh",
                table: "ValueTypes");
        }
    }
}
