using crm_api.Data;
using crm_api.Features.Deals;
using crm_api.Hubs;
using crm_api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace crm_api.Tests;

public class DomainInvariantTests
{
    private CrmDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: $"CrmTestDb_{Guid.NewGuid()}")
            .Options;

        var db = new CrmDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    private IHubContext<CrmHub, ICrmClient> CreateMockHubContext()
    {
        var mockClients = new Mock<IHubClients<ICrmClient>>();
        var mockClient = new Mock<ICrmClient>();
        mockClients.Setup(c => c.All).Returns(mockClient.Object);

        var mockHubContext = new Mock<IHubContext<CrmHub, ICrmClient>>();
        mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);

        return mockHubContext.Object;
    }

    [Fact]
    public async Task Invariant_StageTransitionsSequentialOrClosed_RejectsSkippingStages()
    {
        using var db = CreateInMemoryDbContext();
        var hub = CreateMockHubContext();
        var handler = new MoveDealStageCommandHandler(db, hub, NullLogger<MoveDealStageCommandHandler>.Instance);

        // Deal 1 starts at LEAD
        var deal = await db.Deals.FindAsync(1);
        Assert.NotNull(deal);
        Assert.Equal(DealStage.LEAD, deal.Stage);

        // Attempting to transition directly from LEAD -> WON (violates sequential rule)
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new MoveDealStageCommand(deal.Id, DealStage.WON), CancellationToken.None)
        );

        Assert.Contains("StageTransitionsSequentialOrClosed", ex.Message);
    }

    [Fact]
    public async Task Invariant_LostRequiresReasonCode_RejectsMarkingLostWithoutReason()
    {
        using var db = CreateInMemoryDbContext();
        var hub = CreateMockHubContext();
        var handler = new MarkLostCommandHandler(db, hub, NullLogger<MarkLostCommandHandler>.Instance);

        // Attempting to mark deal 1 as LOST with empty ReasonCode
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            handler.Handle(new MarkLostCommand(1, ""), CancellationToken.None)
        );

        Assert.Contains("LostRequiresReasonCode", ex.Message);
    }

    [Fact]
    public async Task StateTransitions_SequentialPipelineAndMarkWon_WorksCorrectly()
    {
        using var db = CreateInMemoryDbContext();
        var hub = CreateMockHubContext();
        
        var moveHandler = new MoveDealStageCommandHandler(db, hub, NullLogger<MoveDealStageCommandHandler>.Instance);
        var proposalHandler = new SendProposalCommandHandler(db, hub, NullLogger<SendProposalCommandHandler>.Instance);
        var wonHandler = new MarkWonCommandHandler(db, hub, NullLogger<MarkWonCommandHandler>.Instance);

        // 1. LEAD -> QUALIFIED
        var d1 = await moveHandler.Handle(new MoveDealStageCommand(1, DealStage.QUALIFIED), CancellationToken.None);
        Assert.Equal(DealStage.QUALIFIED, d1.Stage);
        Assert.Equal(40, d1.Probability);

        // 2. QUALIFIED -> PROPOSAL (Side-effect: AccountingBridge.CreateDraftQuotation)
        var d2 = await proposalHandler.Handle(new SendProposalCommand(1), CancellationToken.None);
        Assert.Equal(DealStage.PROPOSAL, d2.Stage);
        Assert.NotNull(d2.QuotationNumber);
        Assert.StartsWith("QUO-", d2.QuotationNumber);

        // 3. PROPOSAL -> WON (Side-effects: SignalR.BroadcastWon, Forecast.Recalculate)
        var d3 = await wonHandler.Handle(new MarkWonCommand(1), CancellationToken.None);
        Assert.Equal(DealStage.WON, d3.Stage);
        Assert.Equal(100, d3.Probability);
        Assert.NotNull(d3.ClosedAt);
    }
}
