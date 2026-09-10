# AI Assistant

Status: implemented (Phase 14). Code lives under `lib/ai/`, `app/(app)/ki/`, and
`app/admin/ki/`. Schema-level design decisions (confirm-before-mutate,
access gating) are documented in [database.md](./database.md#ai-confirm-before-mutate-libai)
— this page covers the parts that aren't schema.

## Access control

Two independent gates, both required (`lib/ai/access.ts`):

1. `SystemSettings.aiGloballyEnabled` — a single admin-controlled switch
   (`/admin/ki`), off by default.
2. A per-user `UserPermission` grant with key `AI_ACCESS`, issued from
   `/admin/benutzer` ("KI freigeben").

There is no `SYSTEM_ADMIN` bypass here, unlike `requireClassMember` —
every AI call costs real money, so an admin isn't implicitly exempt from
needing the same explicit grant as anyone else.

## Context

Before each reply, `lib/ai/context.ts` builds a plain-text summary of the
requesting user's own live data — open to-dos, open homework, upcoming
exams, upcoming events — and injects it into the system prompt. This is
what lets the assistant answer "was habe ich diese Woche auf?" with real
answers instead of guessing; it's read fresh on every message, never
cached, so it can't go stale mid-conversation.

## Confirm-before-mutate

The model is given exactly two tools: `propose_todo` and `propose_event`
(`lib/ai/tools.ts`). It never writes data directly — calling one of these
tools only records a proposal on the triggering `AIMessage` row
(`proposedAction` + `actionStatus: "PENDING"`). The user has to explicitly
confirm in the UI before anything is created; confirming re-validates the
proposal against the same Zod schemas (`createTodoSchema`/
`createEventSchema`) the real create forms use, and claims the message
atomically before creating anything (see database.md for why). Homework
isn't a proposable action in V1 — subject/class selection is the kind of
thing a model is more likely to get wrong than title/date fields, so it's
deliberately left out rather than shipped half-reliable.

Message history sent back to the model on later turns is reconstructed as
plain user/assistant text, not literal `tool_use`/`tool_result` blocks —
see the comment in `lib/ai/chat.ts` for why (sidesteps Anthropic's
tool-use turn-pairing requirement, at the cost of the model seeing a
paraphrase of an old proposal rather than its exact structured form on
later turns).

## Cost and budget

`lib/ai/pricing.ts` holds a small per-model EUR-per-million-token table
used only to estimate `AIUsageLog.estimatedCostEur` after each call —
there is no API to read back exact spend per request, so this is a
guardrail, not a billing feed. `lib/ai/budget.ts` sums a user's usage for
the current calendar month and refuses further calls once it reaches
`AI_MONTHLY_BUDGET_EUR` (env-configured, not per-user in the database —
one number applies to everyone).

## Rate limiting

`lib/ai/rate-limit.ts` caps a user to 30 messages/hour, the same
in-memory sliding-window approach as the login limiter
(`lib/auth/rate-limit.ts`) but a separate module since the limits serve a
different purpose (chat-abuse prevention, not brute-force protection) —
single-process only, revisit before running more than one app instance.

## Streaming

Responses are not streamed — `sendMessage` (`lib/ai/chat.ts`) calls
`client.messages.create` synchronously and waits for the full response
before persisting it and returning. This keeps the whole feature inside
the existing Server Action / `useActionState` pattern used everywhere
else in the app, rather than introducing a second architecture (a Route
Handler + SSE + client-side `EventSource`) just for this one feature. A
streaming UI is a plausible future enhancement, not a gap in what's here.

## What's not built

`AI_HINT` (`NotificationType`) has no trigger — reserved for a more
speculative "AI proactively notices something and surfaces it as a
notification" feature, the same way `TEACHER`/`SCHOOL_ADMIN` sit unused
in the `Role` enum. Nothing references it yet, so there's nothing
half-finished sitting behind it.
