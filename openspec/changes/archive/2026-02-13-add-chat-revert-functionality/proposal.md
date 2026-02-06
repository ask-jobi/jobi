# Change: Add Chat Revert Functionality

## Why

Currently, when AI makes modifications to a resume through chat tool calls, users have no way to undo these changes if they later decide they prefer the original content. The existing approval flow only controls whether a change is applied before execution, but provides no mechanism to revert changes after they have been applied.

## What Changes

- Add revert capability to the chat interface that allows users to revert all tool results from a selected message
- Track tool execution history with original values to enable accurate reversion
- Implement UI controls (revert button) on assistant messages containing tool results
- Store original values before modifications to enable accurate reversion
- Create a new API endpoint to handle revert requests
- Modify the resume store to support undo operations

## Impact

- Affected specs: `resume-chat`
- Affected code:
  - `components/agent/chat-interface.tsx` - Add revert UI
  - `lib/store/resume.ts` - Add undo functionality
  - `lib/agent/chat-history.ts` - Track tool execution history
  - `app/api/chat/resume/` - Add revert endpoint
  - `lib/hooks/use-chat.ts` - Integrate revert functionality
