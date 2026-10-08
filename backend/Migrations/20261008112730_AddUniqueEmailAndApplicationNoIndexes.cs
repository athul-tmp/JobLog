using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueEmailAndApplicationNoIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JobApplications_UserId",
                table: "JobApplications");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_UserId_ApplicationNo",
                table: "JobApplications",
                columns: new[] { "UserId", "ApplicationNo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_JobApplications_UserId_ApplicationNo",
                table: "JobApplications");

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_UserId",
                table: "JobApplications",
                column: "UserId");
        }
    }
}
