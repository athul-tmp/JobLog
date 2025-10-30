using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddChangeVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Purpose",
                table: "EmailVerifications",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "EmailVerifications",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerifications_UserId",
                table: "EmailVerifications",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_EmailVerifications_Users_UserId",
                table: "EmailVerifications",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EmailVerifications_Users_UserId",
                table: "EmailVerifications");

            migrationBuilder.DropIndex(
                name: "IX_EmailVerifications_UserId",
                table: "EmailVerifications");

            migrationBuilder.DropColumn(
                name: "Purpose",
                table: "EmailVerifications");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "EmailVerifications");
        }
    }
}
