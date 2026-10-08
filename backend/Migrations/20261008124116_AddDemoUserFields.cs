using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDemoUserFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DemoExpiresAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDemo",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Retire the old shared demo account: mark it as an expired demo user so
            // DemoCleanupService deletes it (and its data) on its first run
            migrationBuilder.Sql(
                "UPDATE \"Users\" SET \"IsDemo\" = TRUE, \"DemoExpiresAt\" = NOW() WHERE \"Email\" = 'demo@joblog.com';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DemoExpiresAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsDemo",
                table: "Users");
        }
    }
}
