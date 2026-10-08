import { authenticatedAdminRequest } from "./adminLogin";
import { authenticatedStaffRequest } from "./staffAuth";

export function getAdminConversations() {
    return authenticatedAdminRequest("/api/messages/conversations");
}

export function getAdminConversationMessages(conversationId) {
    return authenticatedAdminRequest(`/api/messages/conversations/${conversationId}`);
}

export function replyToAdminConversation(conversationId, message) {
    return authenticatedAdminRequest(`/api/messages/${conversationId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
    });
}

export function getStaffConversations() {
    return authenticatedStaffRequest("/api/messages/my");
}

export function sendStaffMessage(message) {
    return authenticatedStaffRequest("/api/messages/send", {
        method: "POST",
        body: JSON.stringify({ message }),
    });
}

export async function getUnreadMessageCount(request) {
    const response = await request("/api/messages/unread-count");
    const count = response?.unread_count;
    if (!Number.isInteger(count) || count < 0) {
        throw new Error("The unread message count response is invalid.");
    }
    return count;
}

export function refreshMessageUnreadCount() {
    window.dispatchEvent(new Event("messages:unread-count-refresh"));
}

export function acknowledgeStaffConversationRead(unreadCount) {
    window.dispatchEvent(new CustomEvent("messages:staff-conversation-read", {
        detail: { unreadCount },
    }));
}
