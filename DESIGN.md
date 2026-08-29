system: 08_CRM_ENGINE
tech_stack:
  frontend: "Next.js 16 + @dnd-kit/core + @microsoft/signalr + Lucide React"
  backend: ".NET 10 + MediatR 12 + MailKit/MimeKit + SignalR Core"
  orm: "EF Core 10 (Npgsql JSONB Support)"
  storage: "PostgreSQL 18 + Redis 7.2"
  protocols: "HTTPS, WSS, IMAP, SMTP"
spec:
  actors: [SalesRep, SalesManager, ImapMailListener]
  invariants: [StageTransitionsSequentialOrClosed, LostRequiresReasonCode]
  state_transitions:
    - { from: LEAD, to: QUALIFIED, trigger: QUALIFY, handler: "Deals.MoveStage" }
    - { from: QUALIFIED, to: PROPOSAL, trigger: SEND_PROPOSAL, handler: "Deals.SendProposal", side_effects: ["AccountingBridge.CreateDraftQuotation"] }
    - { from: PROPOSAL, to: WON, trigger: MARK_WON, handler: "Deals.MarkWon", side_effects: ["SignalR.BroadcastWon", "Forecast.Recalculate"] }
    - { from: ANY, to: LOST, trigger: MARK_LOST, handler: "Deals.MarkLost", validation: "LostReasonCode != null" }