# Workshop Application: Agentic SDLC

> Workshop Reference: [Agentic SDLC Handbook](https://github.com/danielmeppiel/agentic-sdlc-handbook)

---

## 1. What you explored, built, or changed

- **Multi-Agent Orchestration & Test-Driven Workflows ([prompt-pack](https://github.com/franciscosuca/prompt-pack) & [exan](https://github.com/franciscosuca/exan)):**
  - Explored agent patterns aligned with the Linux Foundation's Agentic AI Foundation ([AAIF / agents.md](https://agents.md/)).
  - Built an orchestrator workflow (`orchestrator-react`) that pairs two specialized agents: a `test-oracle` writing acceptance and edge-case tests upfront, and a `blind-implementer` writing clean code to meet those requirements without seeing the tests directly.
- **Agent Customization, Skills & Context Optimization ([prompt-pack](https://github.com/franciscosuca/prompt-pack)):**
  - Created reusable agent instructions and packaged helpful day-to-day routines with [Agent Skills](https://agentskills.io/home) (`SKILL.md`) to cut down repetitive context, keep agents focused, and save tokens.
  - Hooked up agents with Model Context Protocol (MCP) servers (GitHub, Figma, Miro, Chrome DevTools) to give them practical superpowers in UI design, code reviews, and browser testing.
- **Multimodal AI & Schema Integration ([exan](https://github.com/franciscosuca/exan)):**
  - Built an image-scanning and OCR analysis app powered by multimodal LLMs.
  - Crafted prompt structures and clean data contracts that bridge provider outputs with deterministic application schemas for reliable text extraction and similarity scoring.
- **Local LLM Benchmarking for Agentic Development ([ai4se-local-llm-guide](https://github.com/GEA-AIHub/ai4se-local-llm-guide/tree/main/contributions/setup-fco)):**
  - Experimented with open-weight multimodal models on local machines to find the sweet spot: figuring out what tasks (like quick ideation, drafting, and boilerplate) work great locally versus when it makes sense to bring in frontier cloud models.

---

## 2. What you learned, including challenges or limitations

- **Key Takeaways:**
  - Giving agents well-structured context (using `SKILL.md` and tailored `.agent.md` setups) makes their reasoning much more consistent while keeping prompts lean.
  - Separating test generation from code implementation keeps everything honest—preventing hallucinations and keeping coding goals razor-sharp.
- **Challenges:**
  - Guiding autonomous code generation smoothly without getting stuck in feedback loops or straying from the original intent.
  - Bridging the gap between creative multimodal outputs and strict, predictable software schemas.
- **Limitations:**
  - Local models can still struggle with large context windows, reliable tool calling, and complex multi-file reasoning compared to cloud frontier models.

---

## 3. Why you want to join the workshop

- I've really enjoyed following Daniel Meppiel's *Agentic SDLC Handbook*, and I'd love to take these hands-on experiments to the next level by turning them into dependable, production-ready workflows for our team.
- I'm super excited to meet up with Daniel and other practitioners in Düsseldorf to swap ideas, discuss real-world multi-agent coordination, and explore practical quality gates and governance together.

---

## 4. How you would contribute and help colleagues afterward

- Host lunch-and-learns and interactive sessions to help teammates level up from simple autocomplete to structured, test-driven agent workflows.
- Put together clear, practical guidelines on when to run models locally versus leveraging cloud agents for the best balance of speed, cost, and privacy.
