using crm_api.Data;
using crm_api.Hubs;
using crm_api.Models;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace crm_api.Features.Deals;

// 1. Move Stage Command
public record MoveDealStageCommand(int DealId, DealStage TargetStage) : IRequest<Deal>;

public class MoveDealStageCommandHandler : IRequestHandler<MoveDealStageCommand, Deal>
{
    private readonly CrmDbContext _db;
    private readonly IHubContext<CrmHub, ICrmClient> _hub;
    private readonly ILogger<MoveDealStageCommandHandler> _logger;

    public MoveDealStageCommandHandler(
        CrmDbContext db,
        IHubContext<CrmHub, ICrmClient> hub,
        ILogger<MoveDealStageCommandHandler> logger)
    {
        _db = db;
        _hub = hub;
        _logger = logger;
    }

    public async Task<Deal> Handle(MoveDealStageCommand request, CancellationToken cancellationToken)
    {
        var deal = await _db.Deals.FindAsync(request.DealId)
            ?? throw new KeyNotFoundException($"Deal ID {request.DealId} not found.");

        var current = deal.Stage;
        var target = request.TargetStage;

        if (current == target) return deal;

        // Invariant: StageTransitionsSequentialOrClosed
        bool isValid = target switch
        {
            DealStage.LOST => true, // Allowed from any stage
            DealStage.QUALIFIED when current == DealStage.LEAD => true,
            DealStage.PROPOSAL when current == DealStage.QUALIFIED => true,
            DealStage.WON when current == DealStage.PROPOSAL => true,
            _ => false
        };

        if (!isValid)
        {
            throw new InvalidOperationException(
                $"Invariant violation [StageTransitionsSequentialOrClosed]: Cannot transition deal from '{current}' directly to '{target}'. Transitions must be sequential (LEAD -> QUALIFIED -> PROPOSAL -> WON) or to LOST."
            );
        }

        deal.Stage = target;
        deal.Probability = target switch
        {
            DealStage.LEAD => 10,
            DealStage.QUALIFIED => 40,
            DealStage.PROPOSAL => 75,
            DealStage.WON => 100,
            DealStage.LOST => 0,
            _ => deal.Probability
        };

        if (target == DealStage.WON || target == DealStage.LOST)
        {
            deal.ClosedAt = DateTime.UtcNow;
        }

        deal.Activities.Add(new ActivityLog
        {
            DealId = deal.Id,
            Title = $"Stage Moved to {target}",
            Description = $"Deal moved from {current} to {target} (Probability: {deal.Probability}%)",
            ActivityType = "StageChange",
            Author = deal.OwnerName
        });

        await _db.SaveChangesAsync(cancellationToken);

        // SignalR Real-time Broadcast
        await _hub.Clients.All.BroadcastDealMoved(new
        {
            dealId = deal.Id,
            title = deal.Title,
            stage = deal.Stage.ToString(),
            probability = deal.Probability,
            dealValue = deal.DealValue
        });

        _logger.LogInformation("Deal {Id} ({Title}) moved to {Stage}", deal.Id, deal.Title, target);
        return deal;
    }
}

// 2. Send Proposal Command (Side-effect: AccountingBridge.CreateDraftQuotation)
public record SendProposalCommand(int DealId) : IRequest<Deal>;

public class SendProposalCommandHandler : IRequestHandler<SendProposalCommand, Deal>
{
    private readonly CrmDbContext _db;
    private readonly IHubContext<CrmHub, ICrmClient> _hub;
    private readonly ILogger<SendProposalCommandHandler> _logger;

    public SendProposalCommandHandler(
        CrmDbContext db,
        IHubContext<CrmHub, ICrmClient> hub,
        ILogger<SendProposalCommandHandler> logger)
    {
        _db = db;
        _hub = hub;
        _logger = logger;
    }

    public async Task<Deal> Handle(SendProposalCommand request, CancellationToken cancellationToken)
    {
        var deal = await _db.Deals.FindAsync(request.DealId)
            ?? throw new KeyNotFoundException($"Deal ID {request.DealId} not found.");

        deal.Stage = DealStage.PROPOSAL;
        deal.Probability = 75;

        // Side-effect: AccountingBridge.CreateDraftQuotation
        if (string.IsNullOrEmpty(deal.QuotationNumber))
        {
            deal.QuotationNumber = $"QUO-{DateTime.UtcNow.Year}-{(Random.Shared.Next(1000, 9999))}";
            _logger.LogInformation("Side-effect [AccountingBridge.CreateDraftQuotation]: Generated {Quo} for {Company} ({Val:N2} THB)",
                deal.QuotationNumber, deal.CompanyName, deal.DealValue);
        }

        deal.Activities.Add(new ActivityLog
        {
            DealId = deal.Id,
            Title = $"Formal Proposal Sent ({deal.QuotationNumber})",
            Description = $"Accounting quotation draft {deal.QuotationNumber} generated and dispatched via email.",
            ActivityType = "Proposal",
            Author = deal.OwnerName
        });

        await _db.SaveChangesAsync(cancellationToken);

        await _hub.Clients.All.BroadcastDealMoved(new
        {
            dealId = deal.Id,
            title = deal.Title,
            stage = deal.Stage.ToString(),
            quotationNumber = deal.QuotationNumber
        });

        return deal;
    }
}

// 3. Mark Won Command (Side-effects: SignalR.BroadcastWon, Forecast.Recalculate)
public record MarkWonCommand(int DealId) : IRequest<Deal>;

public class MarkWonCommandHandler : IRequestHandler<MarkWonCommand, Deal>
{
    private readonly CrmDbContext _db;
    private readonly IHubContext<CrmHub, ICrmClient> _hub;
    private readonly ILogger<MarkWonCommandHandler> _logger;

    public MarkWonCommandHandler(
        CrmDbContext db,
        IHubContext<CrmHub, ICrmClient> hub,
        ILogger<MarkWonCommandHandler> logger)
    {
        _db = db;
        _hub = hub;
        _logger = logger;
    }

    public async Task<Deal> Handle(MarkWonCommand request, CancellationToken cancellationToken)
    {
        var deal = await _db.Deals.FindAsync(request.DealId)
            ?? throw new KeyNotFoundException($"Deal ID {request.DealId} not found.");

        deal.Stage = DealStage.WON;
        deal.Probability = 100;
        deal.ClosedAt = DateTime.UtcNow;

        deal.Activities.Add(new ActivityLog
        {
            DealId = deal.Id,
            Title = "🏆 Deal Closed Won!",
            Description = $"Contract signed by {deal.ContactPerson}. Value: {deal.DealValue:N2} {deal.Currency}",
            ActivityType = "Won",
            Author = deal.OwnerName
        });

        await _db.SaveChangesAsync(cancellationToken);

        // Side-effect 1: SignalR.BroadcastWon
        await _hub.Clients.All.BroadcastWon(new
        {
            dealId = deal.Id,
            title = deal.Title,
            companyName = deal.CompanyName,
            dealValue = deal.DealValue,
            ownerName = deal.OwnerName,
            closedAt = deal.ClosedAt
        });

        // Side-effect 2: Forecast.Recalculate
        _logger.LogInformation("Side-effect [Forecast.Recalculate]: Pipeline forecast updated with won revenue {Val:N2} THB", deal.DealValue);

        return deal;
    }
}

// 4. Mark Lost Command (Invariant: LostRequiresReasonCode)
public record MarkLostCommand(int DealId, string LostReasonCode) : IRequest<Deal>;

public class MarkLostCommandHandler : IRequestHandler<MarkLostCommand, Deal>
{
    private readonly CrmDbContext _db;
    private readonly IHubContext<CrmHub, ICrmClient> _hub;
    private readonly ILogger<MarkLostCommandHandler> _logger;

    public MarkLostCommandHandler(
        CrmDbContext db,
        IHubContext<CrmHub, ICrmClient> hub,
        ILogger<MarkLostCommandHandler> logger)
    {
        _db = db;
        _hub = hub;
        _logger = logger;
    }

    public async Task<Deal> Handle(MarkLostCommand request, CancellationToken cancellationToken)
    {
        var deal = await _db.Deals.FindAsync(request.DealId)
            ?? throw new KeyNotFoundException($"Deal ID {request.DealId} not found.");

        // Invariant Validation: LostRequiresReasonCode
        if (string.IsNullOrWhiteSpace(request.LostReasonCode))
        {
            throw new ArgumentException(
                "Invariant violation [LostRequiresReasonCode]: Marking a deal as LOST strictly requires a valid LostReasonCode."
            );
        }

        deal.Stage = DealStage.LOST;
        deal.Probability = 0;
        deal.LostReasonCode = request.LostReasonCode;
        deal.ClosedAt = DateTime.UtcNow;

        deal.Activities.Add(new ActivityLog
        {
            DealId = deal.Id,
            Title = $"❌ Deal Closed Lost ({request.LostReasonCode})",
            Description = $"Deal marked as lost. Reason code: {request.LostReasonCode}",
            ActivityType = "Lost",
            Author = deal.OwnerName
        });

        await _db.SaveChangesAsync(cancellationToken);

        await _hub.Clients.All.BroadcastDealMoved(new
        {
            dealId = deal.Id,
            title = deal.Title,
            stage = deal.Stage.ToString(),
            lostReason = deal.LostReasonCode
        });

        _logger.LogInformation("Deal {Id} marked as LOST. Reason: {Reason}", deal.Id, request.LostReasonCode);
        return deal;
    }
}
