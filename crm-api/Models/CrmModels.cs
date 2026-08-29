namespace crm_api.Models;

public class Deal
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    
    public decimal DealValue { get; set; }
    public string Currency { get; set; } = "THB";
    
    // Invariant: StageTransitionsSequentialOrClosed
    public DealStage Stage { get; set; } = DealStage.LEAD;
    public int Probability { get; set; } = 10; // 10% for LEAD, 40% for QUALIFIED, 75% for PROPOSAL, 100% for WON, 0% for LOST

    // Invariant: LostRequiresReasonCode
    public string? LostReasonCode { get; set; } // e.g. PRICE_TOO_HIGH, COMPETITOR_CHOSEN, NO_BUDGET, TIMING_MISMATCH
    
    // Side Effect: AccountingBridge.CreateDraftQuotation
    public string? QuotationNumber { get; set; }
    
    public string OwnerName { get; set; } = "Alex Mercer (Senior Rep)";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    // JSONB Custom Attributes
    public string CustomAttributesJson { get; set; } = "{}";

    public List<ActivityLog> Activities { get; set; } = new();
}

public class ActivityLog
{
    public int Id { get; set; }
    public int DealId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ActivityType { get; set; } = "Note"; // StageChange, Email, Proposal, Won, Lost, Note
    public string Author { get; set; } = "System";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class InboundEmail
{
    public int Id { get; set; }
    public int? DealId { get; set; }
    public string From { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string BodySnippet { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public bool IsLinked { get; set; } = false;
}
