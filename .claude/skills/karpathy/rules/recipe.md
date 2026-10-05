# The Karpathy Recipe for AI / ML Systems

Based on Andrej Karpathy's foundational methodology for building and debugging learning systems:

## Stage 1: Become One with the Data
- Spend hours scanning raw inputs, images, text, and labels.
- Look for duplicate data, corrupt samples, class imbalance, and weird formatting.
- Write simple data filtering/cleaning scripts before model code.

## Stage 2: Set Up End-to-End Skeleton + Dumb Baselines
- Fix all seeds (`torch.manual_seed(1337)`, `random.seed(1337)`, `np.random.seed(1337)`).
- Verify loss at initialization matches theoretical expectation (e.g. `-ln(1/vocab_size)` for cross-entropy).
- Train a simple, dumb baseline first (e.g. bag of words, logistic regression, single-layer MLP).
- Measure metric precisely on validation set.

## Stage 3: Overfit on a Single Batch / Tiny Slice
- Take 1–5 samples and overfit them until error is 0.00 / loss approaches 0.
- Verify that data labels, loss backward pass, optimizer steps, and zeroing gradients all work properly.
- If it cannot overfit 1 batch, stop immediately: you have a bug in backprop, data pipeline, or architecture.

## Stage 4: Regularize & Scale Capacity
- Increase model size / capacity until it overfits the full training set.
- Add regularization step-by-step: Weight decay, Dropout, Data augmentation, LayerNorm.
- Verify training and validation loss curves at every checkpoint.

## Stage 5: Fine-Tune & Optimize
- Learning rate warmup and cosine decay.
- Check gradient norms to prevent exploding/vanishing gradients.
- Profile latency, throughput, and memory consumption.
