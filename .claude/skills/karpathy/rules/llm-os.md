# LLM as Operating System (Software 2.0 / 3.0)

Andrej Karpathy's framework for understanding and architecting LLM applications:

```
┌────────────────────────────────────────────────────────┐
│                   THE LLM OS MENTAL MODEL              │
├───────────────────────┬────────────────────────────────┤
│ CPU                   │ Large Language Model           │
│ RAM                   │ Context Window (Active Tokens) │
│ Disk / Secondary Store│ Vector DB, Filesystem, Memory  │
│ I/O Peripherals       │ Tool Calls, Web Search, APIs   │
│ Assembly / MachineCode│ Prompt Tokens & System Prompts │
└───────────────────────┴────────────────────────────────┘
```

### Key Engineering Rules for LLM Systems:
1. **Context Window is Precious RAM:** Don't dump entire codebases or unindexed documentation into the context; retrieve and compress relevant slices.
2. **Prompts are Programs:** Be precise, structured, and unambiguous. Use JSON schemas and explicit typed outputs.
3. **Keep Financial & Consequential Logic Outside the Model:** The LLM proposes, plans, translates, or reasons; deterministic application code verifies numbers, auth, and state transitions.
4. **Log the Raw Tokens & Raw API Responses:** Never mask errors behind vague exception handling. Inspect the raw text output to spot prompt injection, hallucination, or formatting errors.
