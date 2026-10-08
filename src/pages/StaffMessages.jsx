import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Clock3, Loader2, MailOpen, MessageCircle, MessageSquare, RefreshCw, Send } from "lucide-react";
import { authenticatedStaffRequest } from "../api/staffAuth";
import { acknowledgeStaffConversationRead, getStaffConversations, getUnreadMessageCount, refreshMessageUnreadCount, sendStaffMessage } from "../api/messages";

const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime())
        ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date)
        : "";
};

function ErrorMessage({ children }) {
    return children ? (
        <p role="alert" className="flex items-start gap-2 border border-[var(--d-err)]/30 bg-[var(--d-err)]/5 px-4 py-3 text-sm text-[var(--d-err)]">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />{children}
        </p>
    ) : null;
}

export default function StaffMessages() {
    const [conversations, setConversations] = useState([]);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [threadError, setThreadError] = useState("");
    const readConversationIds = useRef(new Set());
    const acknowledgedUnreadRef = useRef(0);

    const hideReadConversations = (data) => data.map((conversation) => (
        readConversationIds.current.has(conversation.conversation_id)
            ? { ...conversation, unread_count: 0 }
            : conversation
    ));

    const selectedConversation = useMemo(
        () => conversations.find((conversation) => conversation.conversation_id === selectedId) || null,
        [conversations, selectedId],
    );
    const adminReplies = conversations.reduce(
        (total, conversation) => total + (conversation.messages || []).filter((message) => message.sender_role?.toLowerCase() === "admin").length,
        0,
    );

    const loadConversations = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [data, unreadCount] = await Promise.all([
                getStaffConversations(),
                getUnreadMessageCount(authenticatedStaffRequest),
            ]);
            if (!Array.isArray(data)) throw new Error("The conversations response is invalid.");
            setConversations(hideReadConversations(data));
            setUnreadTotal(Math.max(0, unreadCount - acknowledgedUnreadRef.current));
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    const openConversation = async (conversationId) => {
        setSelectedId(conversationId);
        setLoadingThread(true);
        setThreadError("");
        try {
            const data = await getStaffConversations();
            if (!Array.isArray(data)) throw new Error("The conversations response is invalid.");
            const conversationUnreadCount = readConversationIds.current.has(conversationId)
                ? 0
                : conversations.find((item) => item.conversation_id === conversationId)?.unread_count || 0;
            const conversation = data.find((item) => item.conversation_id === conversationId);
            if (!conversation) throw new Error("This conversation is no longer available.");
            const unreadCount = await getUnreadMessageCount(authenticatedStaffRequest);
            readConversationIds.current.add(conversationId);
            acknowledgedUnreadRef.current += conversationUnreadCount;
            setConversations(hideReadConversations(data));
            setUnreadTotal(Math.max(0, unreadCount - acknowledgedUnreadRef.current));
            setMessages(Array.isArray(conversation.messages) ? conversation.messages : []);
            acknowledgeStaffConversationRead(conversationUnreadCount);
        } catch (requestError) {
            setMessages([]);
            setThreadError(requestError.message);
        } finally {
            setLoadingThread(false);
        }
    };

    const submitMessage = async (event) => {
        event.preventDefault();
        const message = draft.trim();
        if (!message || sending) return;
        setSending(true);
        setThreadError("");
        try {
            const sentMessage = await sendStaffMessage(message);
            setDraft("");
            const data = await getStaffConversations();
            if (!Array.isArray(data)) throw new Error("The conversations response is invalid.");
            setConversations(hideReadConversations(data));
            const unreadCount = await getUnreadMessageCount(authenticatedStaffRequest);
            setUnreadTotal(Math.max(0, unreadCount - acknowledgedUnreadRef.current));
            const conversationId = sentMessage?.conversation_id ?? selectedId;
            const conversation = data.find((item) => item.conversation_id === conversationId);
            if (conversation) {
                setSelectedId(conversationId);
                setMessages(Array.isArray(conversation.messages) ? conversation.messages : []);
            } else if (sentMessage) {
                setSelectedId(sentMessage.conversation_id);
                setMessages((current) => [...current, sentMessage]);
            }
            refreshMessageUnreadCount();
        } catch (requestError) {
            setThreadError(requestError.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="afx-message-hero flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[var(--d-line)] px-6 py-5 md:px-7">
                <div className="flex items-center gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--d-gold)] to-[var(--d-gold-deep)] text-white shadow-lg shadow-[var(--d-glow)] dark:text-[#14110B]">
                        <MessageCircle size={23} />
                    </span>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--d-gold-deep)]">Communication centre</p>
                        <h2 className="afx-serif mt-1 text-2xl font-semibold md:text-3xl">Messages & enquiries</h2>
                        <p className="mt-1 text-sm text-[var(--d-muted)]">Stay connected with the admin team.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {unreadTotal > 0 && <span className="rounded-full border border-[var(--d-gold)]/25 bg-[var(--d-glow)] px-3 py-2 text-xs font-semibold text-[var(--d-gold-deep)]">{unreadTotal} unread</span>}
                    <button type="button" onClick={loadConversations} disabled={loading} className="afx-btn-ghost rounded-xl">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: "Conversations", value: conversations.length, icon: MessageSquare, tone: "gold" },
                    { label: "Unread messages", value: unreadTotal, icon: MailOpen, tone: "rose" },
                    { label: "Admin replies", value: adminReplies, icon: MessageCircle, tone: "green" },
                ].map((stat) => (
                    <div key={stat.label} className="afx-message-stat flex items-center gap-4 rounded-2xl border border-[var(--d-line)] bg-[var(--d-card)] p-4">
                        <span className={`afx-message-stat-icon afx-message-stat-${stat.tone} grid size-11 place-items-center rounded-xl`}><stat.icon size={19} /></span>
                        <div><p className="text-xs font-medium text-[var(--d-muted)]">{stat.label}</p><p className="afx-serif mt-0.5 text-2xl font-semibold">{stat.value}</p></div>
                    </div>
                ))}
            </div>
            <ErrorMessage>{error}</ErrorMessage>
            <div className="afx-message-inbox grid min-h-[560px] overflow-hidden rounded-2xl border border-[var(--d-line)] bg-[var(--d-card)] shadow-[0_16px_50px_-30px_rgba(55,40,5,.38)] lg:grid-cols-[330px_minmax(0,1fr)]">
                <section className="border-b border-[var(--d-line)] lg:border-b-0 lg:border-r" aria-label="Enquiries">
                    <div className="border-b border-[var(--d-line)] bg-gradient-to-r from-[var(--d-glow)] to-[var(--d-card)] px-5 py-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--d-gold-deep)]">Inbox</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                            <h3 className="font-semibold">Your enquiries</h3>
                            <span className="rounded-full bg-[var(--d-card)] px-2.5 py-1 text-[11px] font-semibold text-[var(--d-muted)] shadow-sm">{conversations.length}</span>
                        </div>
                    </div>
                    {loading && conversations.length === 0 ? (
                        <p className="flex items-center gap-2 p-5 text-sm text-[var(--d-muted)]"><Loader2 size={16} className="animate-spin" /> Loading enquiries…</p>
                    ) : conversations.length ? (
                        <ul className="max-h-[620px] space-y-1 overflow-y-auto p-2.5">
                            {conversations.map((conversation) => {
                                const lastMessage = conversation.messages?.at(-1);
                                const active = conversation.conversation_id === selectedId;
                                return (
                                    <li key={conversation.conversation_id}>
                                        <button type="button" onClick={() => openConversation(conversation.conversation_id)}
                                            aria-current={active ? "true" : undefined}
                                            className={`afx-conversation w-full rounded-xl border p-3.5 text-left transition ${active ? "afx-conversation-active" : "border-transparent hover:border-[var(--d-line)] hover:bg-[var(--d-glow)]"}`}>
                                            <span className="flex items-center gap-3">
                                                <span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? "bg-[var(--d-gold)] text-[#14110B]" : "bg-[var(--d-glow)] text-[var(--d-gold-deep)]"}`}><MessageCircle size={17} /></span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center justify-between gap-2">
                                                        <span className="truncate text-sm font-semibold">Admin team</span>
                                                        {conversation.unread_count > 0 && <span className="grid min-w-5 h-5 shrink-0 place-items-center rounded-full bg-[var(--d-gold)] px-1 text-[10px] font-bold text-white dark:text-[#14110B]">{conversation.unread_count}</span>}
                                                    </span>
                                                    <span className="mt-1 block truncate text-xs text-[var(--d-muted)]">{lastMessage?.message || "No messages yet"}</span>
                                                    <span className="mt-2 flex items-center gap-1 text-[10px] text-[var(--d-muted)]"><Clock3 size={11} />{formatDate(lastMessage?.created_at) || "New conversation"}</span>
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : !error ? (
                        <div className="m-5 rounded-2xl border border-dashed border-[var(--d-line)] p-8 text-center text-sm text-[var(--d-muted)]">
                            <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-[var(--d-glow)] text-[var(--d-gold-deep)]"><MessageSquare size={22} /></span>
                            <p className="font-semibold text-[var(--d-text)]">Start a conversation</p>
                            <p className="mt-1 text-xs">Send a message to the admin team below.</p>
                        </div>
                    ) : null}
                </section>

                <section className="afx-message-thread flex min-h-[500px] min-w-0 flex-col" aria-label="Selected enquiry">
                    {selectedConversation ? (
                        <>
                            <div className="flex items-center justify-between gap-3 border-b border-[var(--d-line)] px-5 py-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--d-gold)] to-[var(--d-gold-deep)] text-white dark:text-[#14110B]"><MessageCircle size={18} /><span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[var(--d-card)] bg-emerald-500" /></span>
                                    <div className="min-w-0">
                                        <h3 className="truncate font-semibold">Admin team</h3>
                                        <p className="mt-0.5 text-xs text-[var(--d-muted)]">Aurum FX support</p>
                                    </div>
                                </div>
                                <span className="hidden rounded-full border border-[var(--d-line)] px-3 py-1.5 text-[11px] font-medium text-[var(--d-muted)] sm:inline-flex">
                                    {messages.length || selectedConversation.total_message_count || 0} messages
                                </span>
                            </div>
                            <ErrorMessage>{threadError}</ErrorMessage>
                            <div className="afx-message-history flex-1 space-y-4 overflow-y-auto p-5 md:p-7" aria-live="polite">
                                {loadingThread ? (
                                    <p className="flex items-center gap-2 text-sm text-[var(--d-muted)]"><Loader2 size={16} className="animate-spin" /> Loading messages…</p>
                                ) : messages.length ? messages.map((message) => {
                                    const fromStaff = message.sender_role?.toLowerCase() !== "admin";
                                    return (
                                        <div key={message.id} className={`flex ${fromStaff ? "justify-end" : "justify-start"}`}>
                                            <article className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${fromStaff ? "rounded-br-md bg-gradient-to-br from-[var(--d-gold)] to-[var(--d-gold-deep)] text-white dark:text-[#14110B]" : "rounded-bl-md border border-[var(--d-line)] bg-[var(--d-card)]"}`}>
                                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">{fromStaff ? "You" : "Admin team"}</p>
                                                <p className="whitespace-pre-wrap break-words">{message.message}</p>
                                                <time className="mt-2 block text-right text-[10px] opacity-65">{formatDate(message.created_at)}</time>
                                            </article>
                                        </div>
                                    );
                                }) : !threadError ? <p className="text-sm text-[var(--d-muted)]">No messages in this conversation yet.</p> : null}
                            </div>
                            <form onSubmit={submitMessage} className="flex items-end gap-3 border-t border-[var(--d-line)] p-4">
                                <label className="sr-only" htmlFor="staff-message-draft">Write a message</label>
                                <textarea id="staff-message-draft" rows={2} value={draft} onChange={(event) => setDraft(event.target.value)}
                                    placeholder="Write a message to the admin team…" className="afx-input min-h-12 flex-1 resize-y" />
                                <button type="submit" disabled={sending || !draft.trim() || loadingThread} className="afx-btn">
                                    {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                                    <span className="hidden sm:inline">{sending ? "Sending…" : "Send"}</span>
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="afx-message-history grid flex-1 place-items-center p-8 text-center">
                                <div className="max-w-xs">
                                    <span className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-[var(--d-glow)] to-[var(--d-card)] text-[var(--d-gold-deep)] shadow-inner"><MessageCircle size={29} /></span>
                                    <p className="afx-serif text-xl font-semibold">Your support channel</p>
                                    <p className="mt-2 text-sm leading-relaxed text-[var(--d-muted)]">Choose an enquiry to continue, or send a message below to start a conversation.</p>
                                    <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--d-line)] bg-[var(--d-card)] px-3 py-1.5 text-[11px] font-medium text-[var(--d-muted)]"><MessageSquare size={13} /> Replies from the admin team appear here</span>
                                </div>
                            </div>
                            <ErrorMessage>{threadError}</ErrorMessage>
                            <form onSubmit={submitMessage} className="flex items-end gap-3 border-t border-[var(--d-line)] p-4">
                                <label className="sr-only" htmlFor="staff-new-message-draft">Write a new enquiry</label>
                                <textarea id="staff-new-message-draft" rows={2} value={draft} onChange={(event) => setDraft(event.target.value)}
                                    placeholder="Write a message to the admin team…" className="afx-input min-h-12 flex-1 resize-y" />
                                <button type="submit" disabled={sending || !draft.trim()} className="afx-btn">
                                    {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                                    <span className="hidden sm:inline">{sending ? "Sending…" : "Send"}</span>
                                </button>
                            </form>
                        </>
                    )}
                </section>
            </div>
            <style>{`
                .afx-message-hero{background:radial-gradient(360px 170px at 0% 0%,var(--d-glow),transparent 75%),linear-gradient(115deg,var(--d-card),var(--d-bg))}
                .dark .afx-message-hero{background:radial-gradient(360px 170px at 0% 0%,var(--d-glow),transparent 75%),linear-gradient(115deg,var(--d-card),var(--d-bg))}
                .afx-message-stat{transition:transform .2s,box-shadow .2s;box-shadow:0 8px 20px -18px rgba(60,40,5,.5)}
                .afx-message-stat:hover{transform:translateY(-2px);box-shadow:0 12px 24px -18px rgba(60,40,5,.5)}
                .afx-message-stat-gold{background:var(--d-glow);color:var(--d-gold-deep)}.afx-message-stat-rose{background:color-mix(in srgb,var(--d-err) 10%,var(--d-card));color:var(--d-err)}.afx-message-stat-green{background:#E9F0E9;color:#45684B}
                .dark .afx-message-stat-green{background:#263126;color:#A9C7A9}
                .afx-conversation-active{border-color:color-mix(in srgb,var(--d-gold) 45%,transparent);background:linear-gradient(110deg,var(--d-glow),var(--d-card));box-shadow:inset 3px 0 var(--d-gold),0 4px 14px -12px rgba(60,40,5,.55)}
                .afx-message-history{background:radial-gradient(ellipse at 50% 0%,var(--d-glow),transparent 60%),color-mix(in srgb,var(--d-bg) 72%,var(--d-card))}
                .afx-message-thread form{background:linear-gradient(180deg,var(--d-card),var(--d-bg))}
                @media(prefers-reduced-motion:reduce){.afx-message-stat,.afx-message-stat:hover{transition:none;transform:none}}
            `}</style>
        </div>
    );
}
