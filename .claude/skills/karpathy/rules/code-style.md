# Karpathy Code Aesthetic: First-Principles & Readable

### 1. Minimal Dependencies
- Prefer standard library, raw NumPy/PyTorch, or plain C/C++ (`llm.c`) over heavy multi-layered wrapper frameworks.
- Understand every line of execution; no magic black boxes.

### 2. Explicit Math & Tensor Shapes
- Use standard notations consistently:
  - `B`: Batch size
  - `T`: Sequence length / time
  - `C`: Channel / embedding dimension
  - `NH`: Number of attention heads
  - `HS`: Head size (`C // NH`)
- Document tensor transformations with comments showing shape transitions:
  ```python
  # (B, T, C) -> (B, NH, T, HS)
  q = q.view(B, T, self.n_head, self.n_embd // self.n_head).transpose(1, 2)
  ```

### 3. Flat and Readable Control Flow
- Avoid deep inheritance trees and unnecessary design patterns (e.g. AbstractFactoryStrategyManager).
- Write functions and classes that can be read top-to-bottom in a single sitting (like `micrograd/engine.py` or `nanoGPT/model.py`).

### 4. Deterministic State & Logging
- Log exact metrics, loss values, learning rates, and step counts.
- Always include an easy way to run sanity checks, dry-runs, and unit tests.
