using crm_api.Data;
using crm_api.Features.Deals;
using crm_api.Hubs;
using crm_api.Models;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:5040");

// Add services
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// CORS for Next.js frontend (crm-web)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Database: PostgreSQL if connection string is set, else InMemory
var postgresConn = builder.Configuration.GetConnectionString("PostgresConnection");
if (!string.IsNullOrEmpty(postgresConn))
{
    builder.Services.AddDbContext<CrmDbContext>(opt =>
        opt.UseNpgsql(postgresConn));
}
else
{
    builder.Services.AddDbContext<CrmDbContext>(opt =>
        opt.UseInMemoryDatabase("CrmInMemoryDb"));
}

var app = builder.Build();

// Ensure Database is Created
app.Lifetime.ApplicationStarted.Register(async () =>
{
    for (int i = 0; i < 5; i++)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();
            await db.Database.EnsureCreatedAsync();
            app.Logger.LogInformation("CRM Database connected and verified successfully.");
            break;
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning("CRM DB initialization attempt {Attempt} failed: {Message}. Retrying...", i + 1, ex.Message);
            await Task.Delay(2000);
        }
    }
});

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Health Check
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    system = "08_CRM_ENGINE",
    timestamp = DateTime.UtcNow,
    engine = ".NET 10 + MediatR 12 + SignalR Core + MailKit + EF Core 10"
}));

// SignalR Hub Endpoint
app.MapHub<CrmHub>("/hubs/crm");

// Deals Listing & Creation
app.MapGet("/api/deals", async (CrmDbContext db) =>
{
    var deals = await db.Deals
        .Include(d => d.Activities)
        .OrderByDescending(d => d.CreatedAt)
        .ToListAsync();
    return Results.Ok(deals);
});

app.MapGet("/api/deals/{id:int}", async (int id, CrmDbContext db) =>
{
    var deal = await db.Deals
        .Include(d => d.Activities)
        .FirstOrDefaultAsync(d => d.Id == id);
    return deal != null ? Results.Ok(deal) : Results.NotFound();
});

app.MapPost("/api/deals", async (CreateDealDto dto, CrmDbContext db, IHubContext<CrmHub, ICrmClient> hub) =>
{
    var deal = new Deal
    {
        Title = dto.Title,
        CompanyName = dto.CompanyName,
        ContactPerson = dto.ContactPerson,
        Email = dto.Email,
        Phone = dto.Phone,
        DealValue = dto.DealValue,
        Currency = dto.Currency ?? "THB",
        Stage = DealStage.LEAD,
        Probability = 10,
        OwnerName = dto.OwnerName ?? "Alex Mercer",
        CreatedAt = DateTime.UtcNow,
        CustomAttributesJson = dto.CustomAttributesJson ?? "{}"
    };

    deal.Activities.Add(new ActivityLog
    {
        Title = "Deal Created",
        Description = $"New lead created with initial value {deal.DealValue:N2} {deal.Currency}",
        ActivityType = "StageChange",
        Author = deal.OwnerName
    });

    db.Deals.Add(deal);
    await db.SaveChangesAsync();

    await hub.Clients.All.BroadcastDealMoved(deal);
    return Results.Created($"/api/deals/{deal.Id}", deal);
});

// State Transitions via MediatR Commands
// 1. Move Stage (Invariant: StageTransitionsSequentialOrClosed)
app.MapPost("/api/deals/{id:int}/move", async (int id, MoveStageDto dto, IMediator mediator) =>
{
    try
    {
        var deal = await mediator.Send(new MoveDealStageCommand(id, dto.TargetStage));
        return Results.Ok(deal);
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// 2. Send Proposal (Side-effect: AccountingBridge.CreateDraftQuotation)
app.MapPost("/api/deals/{id:int}/proposal", async (int id, IMediator mediator) =>
{
    try
    {
        var deal = await mediator.Send(new SendProposalCommand(id));
        return Results.Ok(deal);
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
});

// 3. Mark Won (Side-effects: SignalR.BroadcastWon, Forecast.Recalculate)
app.MapPost("/api/deals/{id:int}/won", async (int id, IMediator mediator) =>
{
    try
    {
        var deal = await mediator.Send(new MarkWonCommand(id));
        return Results.Ok(deal);
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
});

// 4. Mark Lost (Invariant: LostRequiresReasonCode)
app.MapPost("/api/deals/{id:int}/lost", async (int id, MarkLostDto dto, IMediator mediator) =>
{
    try
    {
        var deal = await mediator.Send(new MarkLostCommand(id, dto.LostReasonCode));
        return Results.Ok(deal);
    }
    catch (KeyNotFoundException)
    {
        return Results.NotFound();
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Sales Revenue Forecast & Analytics
app.MapGet("/api/deals/forecast", async (CrmDbContext db) =>
{
    var deals = await db.Deals.ToListAsync();
    var activeDeals = deals.Where(d => d.Stage != DealStage.LOST && d.Stage != DealStage.WON).ToList();
    var wonDeals = deals.Where(d => d.Stage == DealStage.WON).ToList();
    var lostDeals = deals.Where(d => d.Stage == DealStage.LOST).ToList();

    var totalPipelineValue = activeDeals.Sum(d => d.DealValue);
    var weightedForecastValue = activeDeals.Sum(d => d.DealValue * (d.Probability / 100.0m));
    var closedWonValue = wonDeals.Sum(d => d.DealValue);

    var totalClosed = wonDeals.Count + lostDeals.Count;
    var winRatePercentage = totalClosed > 0 ? Math.Round((decimal)wonDeals.Count / totalClosed * 100, 1) : 0m;

    var lossReasons = lostDeals
        .GroupBy(d => d.LostReasonCode ?? "UNKNOWN")
        .Select(g => new { Reason = g.Key, Count = g.Count() })
        .ToList();

    return Results.Ok(new
    {
        totalDeals = deals.Count,
        activeDealsCount = activeDeals.Count,
        totalPipelineValue,
        weightedForecastValue,
        closedWonValue,
        winRatePercentage,
        lossReasons
    });
});

// Inbound Email Listener & Simulator
app.MapGet("/api/emails", async (CrmDbContext db) =>
{
    var emails = await db.InboundEmails.OrderByDescending(e => e.ReceivedAt).ToListAsync();
    return Results.Ok(emails);
});

app.MapPost("/api/emails/simulate", async (SimulateEmailDto dto, CrmDbContext db, IHubContext<CrmHub, ICrmClient> hub) =>
{
    var email = new InboundEmail
    {
        DealId = dto.DealId,
        From = dto.From,
        Subject = dto.Subject,
        BodySnippet = dto.BodySnippet,
        ReceivedAt = DateTime.UtcNow,
        IsLinked = dto.DealId.HasValue
    };

    db.InboundEmails.Add(email);

    if (dto.DealId.HasValue)
    {
        var deal = await db.Deals.FindAsync(dto.DealId.Value);
        if (deal != null)
        {
            deal.Activities.Add(new ActivityLog
            {
                DealId = deal.Id,
                Title = $"Inbound Email: {dto.Subject}",
                Description = dto.BodySnippet,
                ActivityType = "Email",
                Author = dto.From
            });
        }
    }

    await db.SaveChangesAsync();
    await hub.Clients.All.BroadcastEmailReceived(email);

    return Results.Ok(email);
});

app.Run();

public record CreateDealDto(
    string Title,
    string CompanyName,
    string ContactPerson,
    string Email,
    string Phone,
    decimal DealValue,
    string? Currency,
    string? OwnerName,
    string? CustomAttributesJson
);

public record MoveStageDto(DealStage TargetStage);
public record MarkLostDto(string LostReasonCode);
public record SimulateEmailDto(int? DealId, string From, string Subject, string BodySnippet);


