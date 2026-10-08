import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock3, Loader2, MailOpen, MessageCircle, MessageSquare, RefreshCw, Send, UsersRound } from "lucide-react";
import { getAdminConversationMessages, getAdminConversations, refreshMessageUnreadCount, replyToAdminConversation } from "../api/messages";

const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime())
        ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date)
        : "";
};

function ErrorMessage({ children }) {
    return children ? (
        <p role="alert" className="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />{children}
        </p>
    ) : null;
}

export default function AdminMessages() {
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [loadingList, setLoadingList] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [threadError, setThreadError] = useState("");

    const selectedConversation = useMemo(
        () => conversations.find((conversation) => conversation.conversation_id === selectedId) || null,
        [conversations, selectedId],
    );
    const unreadTotal = conversations.reduce((total, conversation) => total + (conversation.unread_count || 0), 0);
    const activeContacts = conversations.filter((conversation) => conversation.total_message_count > 0).length;

    const loadConversations = useCallback(async () => {
        setLoadingList(true);
        setError("");
        try {
            const data = await getAdminConversations();
            if (!Array.isArray(data)) throw new Error("The conversations response is invalid.");
            setConversations(data);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    const openConversation = async (conversationId) => {
        setSelectedId(conversationId);
        setLoadingThread(true);
        setThreadError("");
        try {
            const data = await getAdminConversationMessages(conversationId);
            if (!Array.isArray(data)) throw new Error("The conversation messages response is invalid.");
            setMessages(data);
            setConversations((current) => current.map((conversation) => (
                conversation.conversation_id === conversationId
                    ? { ...conversation, unread_count: 0 }
                    : conversation
            )));
            refreshMessageUnreadCount();
        } catch (requestError) {
            setMessages([]);
            setThreadError(requestError.message);
        } finally {
            setLoadingThread(false);
        }
    };

    const submitReply = async (event) => {
        event.preventDefault();
        const message = draft.trim();
        if (!message || !selectedConversation || sending) return;
        setSending(true);
        setThreadError("");
        try {
            const sentMessage = await replyToAdminConversation(selectedId, message);
            setMessages((current) => [...current, sentMessage]);
            setDraft("");
            setConversations((current) => current.map((conversation) => (
                conversation.conversation_id === selectedId
                    ? {
                        ...conversation,
                        last_message: sentMessage.message,
                        last_message_at: sentMessage.created_at,
                    }
                    : conversation
            )));
            refreshMessageUnreadCount();
        } catch (requestError) {
            setThreadError(requestError.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="ad-message-hero flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#D9AE4B]/25 px-6 py-5 md:px-7">
                <div className="flex items-center gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#6B2034] text-[#F0D58A] shadow-lg shadow-[#6B2034]/20">
                        <MessageCircle size={23} />
                    </span>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ad-gold)]">Communication centre</p>
                        <h2 className="ad-display mt-1 text-2xl font-bold md:text-3xl">Messages</h2>
                        <p className="mt-1 text-sm text-[var(--ad-muted)]">A direct line to your field team.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {unreadTotal > 0 && <span className="rounded-full border border-[#862A42]/15 bg-[#862A42]/5 px-3 py-2 text-xs font-semibold text-[#862A42]">{unreadTotal} unread</span>}
                    <button type="button" onClick={loadConversations} disabled={loadingList} className="ad-message-refresh rounded-xl">
                        <RefreshCw size={16} className={loadingList ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: "Conversations", value: conversations.length, icon: MessageSquare, tone: "gold" },
                    { label: "Unread messages", value: unreadTotal, icon: MailOpen, tone: "rose" },
                    { label: "Active contacts", value: activeContacts, icon: UsersRound, tone: "green" },
                ].map((stat) => (
                    <div key={stat.label} className="ad-message-stat flex items-center gap-4 rounded-2xl border border-[var(--ad-line)] bg-[var(--ad-card)] p-4 shadow-sm">
                        <span className={`ad-message-stat-icon ad-message-stat-${stat.tone} grid size-11 place-items-center rounded-xl`}><stat.icon size={19} /></span>
                        <div><p className="text-xs font-medium text-[var(--ad-muted)]">{stat.label}</p><p className="ad-display mt-0.5 text-2xl font-bold">{stat.value}</p></div>
                    </div>
                ))}
            </div>
            <ErrorMessage>{error}</ErrorMessage>
            <div className="ad-message-inbox grid min-h-[560px] overflow-hidden rounded-2xl border border-[var(--ad-line)] bg-[var(--ad-card)] shadow-[0_16px_50px_-30px_rgba(55,20,25,.32)] lg:grid-cols-[330px_minmax(0,1fr)]">
                <section className="border-b border-[var(--ad-line)] lg:border-b-0 lg:border-r" aria-label="Conversations">
                    <div className="border-b border-[var(--ad-line)] bg-gradient-to-r from-[#F8F3E9] to-[var(--ad-card)] px-5 py-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ad-gold)]">Inbox</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                            <h3 className="font-bold">Field staff enquiries</h3>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--ad-muted)] shadow-sm">{conversations.length}</span>
                        </div>
                    </div>
                    {loadingList && conversations.length === 0 ? (
                        <p className="flex items-center gap-2 p-5 text-sm text-[var(--ad-muted)]"><Loader2 size={16} className="animate-spin" /> Loading conversations…</p>
                    ) : conversations.length ? (
                        <ul className="max-h-[620px] space-y-1 overflow-y-auto p-2.5">
                            {conversations.map((conversation) => {
                                const active = conversation.conversation_id === selectedId;
                                const staffName = conversation.field_staff_name || `Field staff #${conversation.field_staff_id}`;
                                const initials = staffName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
                                return (
                                    <li key={conversation.conversation_id}>
                                        <button type="button" onClick={() => openConversation(conversation.conversation_id)}
                                            aria-current={active ? "true" : undefined}
                                            className={`ad-conversation w-full rounded-xl border p-3.5 text-left transition ${active ? "ad-conversation-active" : "border-transparent hover:border-[var(--ad-line)] hover:bg-[var(--ad-bg)]"}`}>
                                            <span className="flex items-center gap-3">
                                                <span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? "bg-[#6B2034] text-[#F0D58A]" : "bg-[#F1E7D1] text-[#6B2034]"}`}>{initials}</span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center justify-between gap-2">
                                                        <span className="truncate text-sm font-semibold">{staffName}</span>
                                                        {conversation.unread_count > 0 && <span className="grid min-w-5 h-5 shrink-0 place-items-center rounded-full bg-[#862A42] px-1 text-[10px] font-bold text-white">{conversation.unread_count}</span>}
                                                    </span>
                                                    <span className="mt-1 block truncate text-xs text-[var(--ad-muted)]">{conversation.last_message || "No messages yet"}</span>
                                                    <span className="mt-2 flex items-center gap-1 text-[10px] text-[var(--ad-muted)]"><Clock3 size={11} />{formatDate(conversation.last_message_at) || "New conversation"}</span>
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : !error ? (
                        <div className="m-5 rounded-2xl border border-dashed border-[var(--ad-line)] p-8 text-center text-sm text-[var(--ad-muted)]">
                            <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-[#F1E7D1] text-[#6B2034]"><MessageSquare size={22} /></span>
                            <p className="font-semibold text-[var(--ad-text)]">Your inbox is clear</p>
                            <p className="mt-1 text-xs">New field staff enquiries will appear here.</p>
                        </div>
                    ) : null}
                </section>

                <section className="ad-message-thread flex min-h-[500px] min-w-0 flex-col" aria-label="Selected conversation">
                    {selectedConversation ? (
                        <>
                            <div className="flex items-center justify-between gap-3 border-b border-[var(--ad-line)] px-5 py-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#6B2034] text-[#F0D58A]"><UsersRound size={18} /></span>
                                    <div className="min-w-0">
                                        <h3 className="truncate font-bold">{selectedConversation.field_staff_name || `Field staff #${selectedConversation.field_staff_id}`}</h3>
                                        <p className="mt-0.5 text-xs text-[var(--ad-muted)]">Field staff · ID {selectedConversation.field_staff_id}</p>
                                    </div>
                                </div>
                                <span className="hidden rounded-full border border-[var(--ad-line)] px-3 py-1.5 text-[11px] font-medium text-[var(--ad-muted)] sm:inline-flex">
                                    {messages.length || selectedConversation.total_message_count || 0} messages
                                </span>
                            </div>
                            <ErrorMessage>{threadError}</ErrorMessage>
                            <div className="ad-message-history flex-1 space-y-4 overflow-y-auto p-5 md:p-7" aria-live="polite">
                                {loadingThread ? (
                                    <p className="flex items-center gap-2 text-sm text-[var(--ad-muted)]"><Loader2 size={16} className="animate-spin" /> Loading messages…</p>
                                ) : messages.length ? messages.map((message) => {
                                    const fromAdmin = message.sender_role?.toLowerCase() === "admin";
                                    return (
                                        <div key={message.id} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}>
                                            <article className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${fromAdmin ? "rounded-br-md bg-gradient-to-br from-[#862A42] to-[#5A1A2B] text-white" : "rounded-bl-md border border-[var(--ad-line)] bg-[var(--ad-card)]"}`}>
                                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">{fromAdmin ? "You" : selectedConversation.field_staff_name || "Field staff"}</p>
                                                <p className="whitespace-pre-wrap break-words">{message.message}</p>
                                                <time className="mt-2 block text-right text-[10px] opacity-65">{formatDate(message.created_at)}</time>
                                            </article>
                                        </div>
                                    );
                                }) : !threadError ? <p className="text-sm text-[var(--ad-muted)]">No messages in this conversation yet.</p> : null}
                            </div>
                            <form onSubmit={submitReply} className="flex items-end gap-3 border-t border-[var(--ad-line)] p-4">
                                <label className="sr-only" htmlFor="admin-message-draft">Write a reply</label>
                                <textarea id="admin-message-draft" rows={2} value={draft} onChange={(event) => setDraft(event.target.value)}
                                    placeholder="Write a reply…" className="min-h-12 flex-1 resize-y border border-[var(--ad-line)] bg-[var(--ad-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--ad-gold)]" />
                                <button type="submit" disabled={sending || !draft.trim() || loadingThread} className="ad-message-send">
                                    {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                                    <span className="hidden sm:inline">{sending ? "Sending…" : "Send"}</span>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="grid flex-1 place-items-center p-8 text-center">
                            <div className="max-w-xs">
                                <span className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-[#F4E9CF] to-[#F8F3E9] text-[#6B2034] shadow-inner"><MessageCircle size={29} /></span>
                                <p className="ad-display text-xl font-bold">Ready when you are</p>
                                <p className="mt-2 text-sm leading-relaxed text-[var(--ad-muted)]">Choose a field staff conversation to read the enquiry and send a reply.</p>
                                <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--ad-line)] bg-[var(--ad-card)] px-3 py-1.5 text-[11px] font-medium text-[var(--ad-muted)]"><MessageSquare size={13} /> {conversations.length} conversations in your inbox</span>
                            </div>
                        </div>
                    )}
                </section>
            </div>
            <style>{`
                .ad-message-hero{background:radial-gradient(360px 170px at 0% 0%,rgba(217,174,75,.13),transparent 75%),linear-gradient(115deg,#fffdf8,#fbf8f1)}
                .ad-message-stat{transition:transform .2s,box-shadow .2s}.ad-message-stat:hover{transform:translateY(-2px);box-shadow:0 12px 24px -18px rgba(55,20,25,.5)}
                .ad-message-stat-gold{background:#F5EDD9;color:#8A6420}.ad-message-stat-rose{background:#F5E7EA;color:#862A42}.ad-message-stat-green{background:#E9F0E9;color:#45684B}
                .ad-message-refresh,.ad-message-send{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 16px;border:1px solid var(--ad-line);font-size:13px;font-weight:600;transition:all .2s}
                .ad-message-refresh{background:var(--ad-card)} .ad-message-refresh:hover{border-color:var(--ad-gold);box-shadow:0 4px 12px -8px var(--ad-gold)}
                .ad-message-send{border:0;border-radius:12px;background:linear-gradient(135deg,#862A42,#5A1A2B);color:#fff}
                .ad-message-send:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px)}
                .ad-message-send:disabled,.ad-message-refresh:disabled{opacity:.55;cursor:not-allowed}
                .ad-conversation-active{border-color:rgba(176,130,37,.35);background:linear-gradient(110deg,rgba(217,174,75,.14),rgba(255,255,255,.55));box-shadow:inset 3px 0 #B08225,0 4px 14px -12px rgba(55,20,25,.45)}
                .ad-message-history{background:radial-gradient(ellipse at 50% 0%,rgba(217,174,75,.08),transparent 60%),#F8F6F1}
                .ad-message-thread form{background:linear-gradient(180deg,var(--ad-card),#FBF8F1)}
                @media(prefers-reduced-motion:reduce){.ad-message-stat,.ad-message-stat:hover{transition:none;transform:none}}
            `}</style>
        </div>
    );
}
