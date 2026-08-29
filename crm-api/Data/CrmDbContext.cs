using Microsoft.EntityFrameworkCore;
using crm_api.Models;

namespace crm_api.Data;

public class CrmDbContext : DbContext
{
    public CrmDbContext(DbContextOptions<CrmDbContext> options) : base(options)
    {
    }

    public DbSet<Deal> Deals => Set<Deal>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<InboundEmail> InboundEmails => Set<InboundEmail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Seed initial deals across pipeline stages
        modelBuilder.Entity<Deal>().HasData(
            new Deal
            {
                Id = 1,
                Title = "Cloud Infrastructure Modernization (200 Seats)",
                CompanyName = "Siam Retail Group PCL",
                ContactPerson = "Kittipong Chaiyaphum (VP of IT)",
                Email = "kittipong@siamretail.co.th",
                Phone = "+66 2 555 1234",
                DealValue = 1850000.0m,
                Currency = "THB",
                Stage = DealStage.LEAD,
                Probability = 10,
                OwnerName = "Alex Mercer",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                CustomAttributesJson = "{\"industry\":\"Retail\",\"employees\":2500}"
            },
            new Deal
            {
                Id = 2,
                Title = "Next-Gen POS & KDS Fleet Deployment",
                CompanyName = "Bangkok Hospitality Partners",
                ContactPerson = "Siriporn Wattana (Director of Ops)",
                Email = "siriporn@bkhospitality.com",
                Phone = "+66 81 999 8877",
                DealValue = 920000.0m,
                Currency = "THB",
                Stage = DealStage.QUALIFIED,
                Probability = 40,
                OwnerName = "Alex Mercer",
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                CustomAttributesJson = "{\"industry\":\"Food & Beverage\",\"outlets\":18}"
            },
            new Deal
            {
                Id = 3,
                Title = "ERP Double-Entry Accounting Engine Integration",
                CompanyName = "Apex Manufacturing Co., Ltd.",
                ContactPerson = "Thanawat Sukhum (CFO)",
                Email = "thanawat@apexmanuf.com",
                Phone = "+66 38 777 4433",
                DealValue = 2400000.0m,
                Currency = "THB",
                Stage = DealStage.PROPOSAL,
                Probability = 75,
                QuotationNumber = "QUO-2026-0891",
                OwnerName = "Sarah Jenkins",
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                CustomAttributesJson = "{\"industry\":\"Industrial\",\"revenue\":150000000}"
            },
            new Deal
            {
                Id = 4,
                Title = "Automated High-Bay WMS Engine",
                CompanyName = "Eastern Logistics Hub",
                ContactPerson = "Somchai Prasert (Warehouse GM)",
                Email = "somchai@easternlogistics.co.th",
                Phone = "+66 38 123 9999",
                DealValue = 3500000.0m,
                Currency = "THB",
                Stage = DealStage.WON,
                Probability = 100,
                QuotationNumber = "QUO-2026-0744",
                OwnerName = "Sarah Jenkins",
                CreatedAt = DateTime.UtcNow.AddDays(-20),
                ClosedAt = DateTime.UtcNow.AddDays(-1),
                CustomAttributesJson = "{\"industry\":\"Logistics\",\"squareMeters\":45000}"
            }
        );

        // Seed initial inbound emails
        modelBuilder.Entity<InboundEmail>().HasData(
            new InboundEmail
            {
                Id = 1,
                DealId = 1,
                From = "kittipong@siamretail.co.th",
                Subject = "Inquiry regarding multi-tenant cloud migration timeline",
                BodySnippet = "Hi Alex, our board reviewed the initial presentation. Can you clarify if the migration can be completed before Q4 peak season?",
                ReceivedAt = DateTime.UtcNow.AddHours(-4),
                IsLinked = true
            },
            new InboundEmail
            {
                Id = 2,
                DealId = 3,
                From = "thanawat@apexmanuf.com",
                Subject = "Re: Quotation QUO-2026-0891 (Tax Invoice / VAT)",
                BodySnippet = "We reviewed the quotation from your accounting bridge. Please send the final contract for legal review.",
                ReceivedAt = DateTime.UtcNow.AddHours(-2),
                IsLinked = true
            }
        );
    }
}
