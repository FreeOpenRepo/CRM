export type DealStage = 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
export type ActorRole = 'SalesRep' | 'SalesManager' | 'ImapMailListener';

export interface ActivityLog {
  id: number;
  dealId: number;
  title: string;
  description: string;
  activityType: string;
  author: string;
  createdAt: string;
}

export interface Deal {
  id: number;
  title: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  dealValue: number;
  currency: string;
  stage: DealStage;
  probability: number;
  lostReasonCode?: string;
  quotationNumber?: string;
  ownerName: string;
  createdAt: string;
  closedAt?: string;
  customAttributesJson?: string;
  activities?: ActivityLog[];
}

export interface InboundEmail {
  id: number;
  dealId?: number;
  from: string;
  subject: string;
  bodySnippet: string;
  receivedAt: string;
  isLinked: boolean;
}

export interface ForecastStats {
  totalDeals: number;
  activeDealsCount: number;
  totalPipelineValue: number;
  weightedForecastValue: number;
  closedWonValue: number;
  winRatePercentage: number;
  lossReasons: { reason: string; count: number }[];
}
