using Microsoft.AspNetCore.SignalR;

namespace crm_api.Hubs;

public interface ICrmClient
{
    Task BroadcastDealMoved(object deal);
    Task BroadcastWon(object deal);
    Task BroadcastEmailReceived(object email);
}

public class CrmHub : Hub<ICrmClient>
{
}
