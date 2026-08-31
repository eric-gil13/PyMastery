import type { DayTrack } from '../../types';

export const DAY04_TRACK: DayTrack = {
  partNumber: 4,
  partId: 4,
  dayNumber: 4,
  id: 4,
  title: 'Part 4: Production Pipelines & CUDA Streams',
  subtitle: 'Overlapping PCIe host-to-device transfers with compute via CUDA streams',
  description: 'Eliminate CPU-GPU transfer bottlenecks. Master pinned page-locked host memory, asynchronous non-blocking memory copies, and CUDA multi-stream concurrency.',
  iconName: 'Zap',
  badge: 'Part 4 • CUDA Streams',
  libraryMechanics: {
    libraryName: 'CUDA Hardware Architecture, Streams & Pinned Memory',
    tagline: 'Eliminate CPU-GPU PCIe transfer bottlenecks using page-locked pinned memory, multi-stream concurrency, and asynchronous DMA transfers.',
    overview: `Modern deep learning hardware systems are heterogeneous computing environments composed of general-purpose Host CPUs (low-latency, large cache hierarchies) and massively parallel Device GPUs (high-throughput, thousands of SIMD/SIMT Arithmetic Logic Units grouped into Streaming Multiprocessors).

While modern GPU High Bandwidth Memory (HBM2e / HBM3 on NVIDIA A100 / H100) boasts memory bandwidths between 2,000 GB/s and 3,350 GB/s, the interconnect bus connecting the Host CPU to the GPU (PCIe 4.0 x16 at ~31.5 GB/s or PCIe 5.0 x16 at ~63 GB/s) is almost two orders of magnitude slower.

When a standard PyTorch script invokes \`batch.to('cuda')\` synchronously, the host CPU thread blocks, memory pages undergo an intermediate staging copy in virtual RAM, and the GPU Streaming Multiprocessors (Tensor Cores) remain 100% idle while waiting for the PCIe bus transfer to complete. Eliminating this stall requires pipelining Host-to-Device (H2D) Direct Memory Access (DMA) transfers concurrently with model kernel computation across non-blocking CUDA streams.`,
    whyItExists: `Standard operating system memory is "pageable" — virtual memory addresses map to physical RAM frames through the OS kernel page tables, and physical pages can be dynamically moved, defragmented, or swapped to NVMe/disk at any time by the OS memory manager.

Because GPU Direct Memory Access (DMA) hardware controllers operate directly on physical bus addresses without passing through the host OS virtual memory management unit, the GPU cannot safely read directly from pageable RAM. When transferring a pageable CPU tensor to GPU, PyTorch is forced to:
1. Allocate an internal page-locked (pinned) host staging buffer.
2. Synchronously copy data from the user's pageable RAM into the pinned staging buffer on the CPU.
3. Initiate the PCIe DMA transfer from the staging buffer to GPU VRAM.

By explicitly page-locking host memory via \`tensor.pin_memory()\` or using \`DataLoader(pin_memory=True)\`, host memory pages are locked into physical RAM addresses that cannot be paged out. This allows the GPU DMA copy engine to bypass the host CPU entirely and stream data directly into GPU VRAM in a single asynchronous hop, enabling compute and memory transfer engines on the GPU silicon to operate in parallel.`,
    coreAnatomy: {
      objectName: 'torch.cuda.Stream & Pinned Tensor',
      description: 'Encapsulates an asynchronous hardware execution queue (Stream) and physical RAM page-locked memory allocations (Pinned Tensor) for non-blocking PCIe DMA transfers.',
      fields: [
        { name: 'tensor.pin_memory()', type: 'Method -> torch.Tensor', role: 'Allocates/copies CPU tensor into page-locked host RAM for single-hop direct DMA access.' },
        { name: 'tensor.is_pinned()', type: 'Method -> bool', role: 'Returns True if the underlying host memory storage is locked in physical RAM.' },
        { name: 'torch.cuda.Stream(device, priority)', type: 'Class Constructor', role: 'Creates an independent FIFO hardware command queue for asynchronous execution on the GPU.' },
        { name: 'torch.cuda.stream(stream)', type: 'Context Manager', role: 'Sets the active stream within a Python context block so subsequent CUDA ops are enqueued to it.' },
        { name: 'stream.wait_stream(other_stream)', type: 'Method (Barrier)', role: 'Enqueues a GPU-side dependency barrier forcing stream to wait for other_stream without host CPU stall.' },
        { name: 'tensor.record_stream(stream)', type: 'Method', role: 'Informs PyTorch caching allocator that a GPU tensor buffer is referenced by an auxiliary stream.' },
        { name: 'torch.cuda.synchronize(device)', type: 'Function', role: 'Blocks the calling host CPU thread until all active CUDA streams on the device finish execution.' },
        { name: 'torch.cuda.current_stream(device)', type: 'Function', role: 'Returns the currently active CUDA stream instance for the specified device.' }
      ],
      memoryDiagramAscii: `+-----------------------------------------------------------------------------------------------+
|                                      HOST (CPU) MEMORY (RAM)                                  |
|                                                                                               |
|   +---------------------------------------+   +-------------------------------------------+   |
|   |         Pageable Virtual Memory       |   |       Page-Locked (Pinned) Memory         |   |
|   |  - Managed by OS virtual memory pager |   |  - Pinned to physical RAM address         |   |
|   |  - Can be swapped to disk at any time |   |  - Cannot be paged out or moved           |   |
|   +---------------------------------------+   +-------------------------------------------+   |
|                      |                                              |                         |
|           [1. CPU Staging Copy]                                     |                         |
|                      v                                              |                         |
|   +---------------------------------------+                         |                         |
|   |      Temporary Pinned Buffer          |                         | [Direct DMA Single Hop] |
|   +---------------------------------------+                         |                         |
+----------------------|----------------------------------------------|-------------------------+
                       |                                              |
                       |                PCIe 4.0 / 5.0 BUS            |
                       |       (~32 - 64 GB/s vs HBM > 2,000 GB/s)    |
                       v                                              v
+-----------------------------------------------------------------------------------------------+
|                                     DEVICE (GPU) HARDWARE                                     |
|                                                                                               |
|   +-----------------------------------------+   +-----------------------------------------+   |
|   |           DMA COPY ENGINE               |   |        STREAMING MULTIPROCESSORS (SMs)  |   |
|   |  - Asynchronous H2D Transfers           |   |  - Tensor Cores & Matrix Engines        |   |
|   |  - Enqueued via Non-Default Stream      |   |  - Enqueued via Compute / Default Stream|   |
|   +-----------------------------------------+   +-----------------------------------------+   |
|                        \\                                    /                                 |
|                         \\   [Concurrent Hardware Overlap]  /                                  |
|                          v                                v                                   |
|   +---------------------------------------------------------------------------------------+   |
|   |                                  GPU VRAM (HBM3)                                      |   |
|   |  Batch N+1 (Transfer Stream DMA)  <=======>  Batch N (Compute Stream Forward/Backward)|   |
|   |                                                                                       |   |
|   |  [PyTorch Caching Allocator: Block Pool with record_stream() safety locks]            |   |
|   +---------------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'chapter-1-pcie-pinned-memory',
        title: 'PCIe Bottleneck & Page-Locked (Pinned) Memory',
        icon: 'HardDrive',
        summary: 'Understand why pageable host memory forces an expensive synchronous double-copy and how page-locking unlocks direct DMA.',
        markdownContent: `### Virtual Memory & The Pageable Trap

By default, all user memory allocations in Python/C++ (\`malloc\`, \`new\`, \`torch.empty\`) produce **pageable memory**. The OS kernel maps virtual memory addresses to physical RAM pages via page tables. If the system experiences memory pressure, the OS can unmap pages, move them to different physical frames, or write them out to swap disk.

Because the GPU Direct Memory Access (DMA) hardware controller on the PCIe bus bypasses the CPU and addresses physical RAM directly, it cannot handle pages moving under its feet.

When you execute:
\`\`\`python
# batch is in standard pageable RAM
batch_gpu = batch.to('cuda', non_blocking=True) # Fails to be non-blocking!
\`\`\`
Because \`batch\` is pageable, PyTorch cannot issue an asynchronous DMA transfer. It falls back to a synchronous transfer: the CPU synchronously allocates a temporary pinned buffer, copies the tensor into it, and waits for PCIe transfer. The \`non_blocking=True\` flag is silently ignored.

### Page-Locked (Pinned) Memory

Page-locked (or pinned) memory is host RAM allocated using the OS \`mlock\` syscall (or \`cudaHostAlloc\`). Pinned pages are guaranteed to stay at fixed physical RAM addresses and are never swapped to disk.

\`\`\`python
# 1. Allocate or pin memory on host
pinned_batch = batch.pin_memory()
assert pinned_batch.is_pinned() == True

# 2. Issue true non-blocking DMA transfer
gpu_batch = pinned_batch.to('cuda', non_blocking=True)
\`\`\`

With pinned memory, the PCIe DMA controller streams the bytes directly from host physical RAM into GPU VRAM in a single hop while the host CPU immediately continues execution.`,
        codeSnippets: [
          {
            id: 'snippet-pinned-memory-demo',
            title: 'Pinned Memory Allocation & Non-Blocking Verification',
            code: `import torch

# Create a CPU tensor (pageable by default)
cpu_tensor = torch.randn(1024, 1024, dtype=torch.float32)
print(f"Is default tensor pinned? {cpu_tensor.is_pinned()}")

# Pin host memory
pinned_tensor = cpu_tensor.pin_memory()
print(f"Is pinned tensor pinned? {pinned_tensor.is_pinned()}")

if torch.cuda.is_available():
    # Asynchronous non-blocking transfer to GPU
    device = torch.device('cuda:0')
    gpu_tensor = pinned_tensor.to(device, non_blocking=True)
    
    # Host CPU continues immediately; synchronize to ensure completion
    torch.cuda.synchronize()
    print(f"Transferred tensor device: {gpu_tensor.device}, shape: {gpu_tensor.shape}")
else:
    print("CUDA not available in current environment; CPU fallback verified.")`,
            expectedOutput: `Is default tensor pinned? False
Is pinned tensor pinned? True
CUDA not available in current environment; CPU fallback verified.`,
            explanation: 'Demonstrates creating pageable CPU tensors, promoting them to page-locked pinned RAM with pin_memory(), and verifying is_pinned().'
          }
        ]
      },
      {
        id: 'chapter-2-cuda-streams-concurrency',
        title: 'CUDA Streams & Concurrent Execution',
        icon: 'Zap',
        summary: 'Harness non-default hardware command queues to execute GPU compute kernels and DMA transfers simultaneously.',
        markdownContent: `### What is a CUDA Stream?

A **CUDA Stream** is a sequence of operations (kernel launches, memory copies, event recordings) that execute in strict FIFO order on the GPU. Operations enqueued in the **same stream** execute serially, but operations enqueued in **different streams** can execute concurrently on the GPU hardware.

Modern NVIDIA GPUs feature:
- At least one independent **Host-to-Device (H2D) DMA Copy Engine**.
- At least one independent **Device-to-Host (D2H) DMA Copy Engine**.
- Multiple **Streaming Multiprocessors (SMs)** executing compute kernels (Matrix Multiplication, Convolutions, LayerNorm).

### The Default Stream vs Non-Default Streams

By default, all PyTorch tensor operations execute on the **default stream** (\`torch.cuda.current_stream()\`). If you launch an H2D memory transfer on the default stream, all subsequent compute kernels on the GPU must wait for the copy to finish, even if they operate on different data.

By creating a secondary stream (\`transfer_stream = torch.cuda.Stream()\`), we can enqueue a DMA copy on the transfer stream while the default stream executes neural network forward and backward passes.

\`\`\`python
transfer_stream = torch.cuda.Stream()
compute_stream = torch.cuda.current_stream()

# 1. Enqueue H2D transfer on transfer_stream
with torch.cuda.stream(transfer_stream):
    gpu_next_batch = next_batch_cpu.to('cuda', non_blocking=True)

# 2. Enqueue compute on default stream (operates concurrently!)
gpu_output = model(gpu_current_batch)

# 3. Synchronize streams before using the transferred batch on compute stream
compute_stream.wait_stream(transfer_stream)
\`\`\`

The call \`compute_stream.wait_stream(transfer_stream)\` enqueues a lightweight GPU-side hardware barrier. The compute stream will not start processing \`gpu_next_batch\` until the transfer stream finishes loading it, but the host CPU is never stalled.`,
        codeSnippets: [
          {
            id: 'snippet-cuda-streams-concurrency',
            title: 'Dual Stream Concurrency & Stream Wait Barriers',
            code: `import torch

if torch.cuda.is_available():
    device = torch.device('cuda:0')
    
    # Create two independent execution streams
    stream_compute = torch.cuda.Stream(device=device)
    stream_transfer = torch.cuda.Stream(device=device)
    
    # Allocate pinned host data and GPU tensors
    host_data = torch.randn(2048, 2048, pin_memory=True)
    gpu_matrix_a = torch.randn(2048, 2048, device=device)
    gpu_matrix_b = torch.randn(2048, 2048, device=device)
    
    # 1. Enqueue heavy GEMM computation on stream_compute
    with torch.cuda.stream(stream_compute):
        gemm_out = torch.matmul(gpu_matrix_a, gpu_matrix_b)
        
    # 2. Enqueue DMA transfer on stream_transfer (executes concurrently!)
    with torch.cuda.stream(stream_transfer):
        gpu_transferred = host_data.to(device, non_blocking=True)
        
    # 3. GPU-side synchronization: compute stream waits for transfer stream
    stream_compute.wait_stream(stream_transfer)
    
    with torch.cuda.stream(stream_compute):
        final_result = gemm_out + gpu_transferred
        
    torch.cuda.synchronize()
    print(f"Computation completed with dual-stream overlap. Shape: {final_result.shape}")
else:
    print("CUDA device not detected; dual streams demonstrated conceptually.")`,
            expectedOutput: `CUDA device not detected; dual streams demonstrated conceptually.`,
            explanation: 'Creates two CUDA streams: one performing heavy GEMM operations on GPU SMs while the other streams host memory across PCIe via DMA.'
          }
        ]
      },
      {
        id: 'chapter-3-async-prefetcher-pipeline',
        title: 'Double-Buffered Async Prefetching DataLoaders',
        icon: 'Layers',
        summary: 'Build a production double-buffered DataLoader prefetcher that hides 100% of host-to-device PCIe latency.',
        markdownContent: `### The Double-Buffering Pattern

In a standard PyTorch training loop:
\`\`\`
Iteration N:   [ PCIe Transfer Batch N ] -> [ Forward Pass ] -> [ Backward Pass ]
Iteration N+1: [ PCIe Transfer Batch N+1] -> [ Forward Pass ] -> [ Backward Pass ]
\`\`\`
Total Iteration Time = $T_{\\text{H2D}} + T_{\\text{Compute}}$.

With double-buffered asynchronous prefetching:
\`\`\`
Timeline:
Transfer Stream: [ DMA Batch 1 ] [ DMA Batch 2       ] [ DMA Batch 3       ]
Compute Stream:                  [ Forward/Back Bat 1] [ Forward/Back Bat 2]
\`\`\`
Effective Iteration Time = $\\max(T_{\\text{H2D}}, T_{\\text{Compute}})$.

### Prefetcher Implementation Mechanics

A robust \`AsyncCUDAPrefetcher\` must maintain:
1. **Preload on Initialize**: Preload Batch 0 onto the GPU before entering the training loop.
2. **Dedicated Stream**: All \`.to(device, non_blocking=True)\` operations happen inside a \`with torch.cuda.stream(self.stream):\` block.
3. **GPU-side Stream Barrier**: In \`.next()\`, invoke \`torch.cuda.current_stream().wait_stream(self.stream)\` to ensure the incoming batch is completely loaded before forward pass starts.
4. **Caching Allocator Safety**: Invoke \`batch.record_stream(torch.cuda.current_stream())\` so PyTorch knows the tensor memory is active on both streams.`,
        codeSnippets: [
          {
            id: 'snippet-async-prefetcher-class',
            title: 'Complete Production Async CUDA Prefetcher',
            code: `import torch
from typing import Iterator

class AsyncCUDAPrefetcher:
    def __init__(self, loader: Iterator[torch.Tensor], device: torch.device):
        self.loader = iter(loader)
        self.device = device
        self.is_cuda = (device.type == 'cuda') and torch.cuda.is_available()
        self.stream = torch.cuda.Stream(device=device) if self.is_cuda else None
        self.next_batch = None
        self.preload()

    def preload(self):
        try:
            batch = next(self.loader)
        except StopIteration:
            self.next_batch = None
            return

        if self.is_cuda and self.stream is not None:
            with torch.cuda.stream(self.stream):
                if not batch.is_pinned():
                    batch = batch.pin_memory()
                self.next_batch = batch.to(self.device, non_blocking=True)
        else:
            self.next_batch = batch.to(self.device)

    def next(self) -> torch.Tensor | None:
        if self.is_cuda and self.stream is not None:
            torch.cuda.current_stream().wait_stream(self.stream)
        batch = self.next_batch
        if batch is not None:
            if self.is_cuda:
                batch.record_stream(torch.cuda.current_stream())
            self.preload()
        return batch

# Demonstration with synthetic dataset
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
dataset = [torch.randn(32, 128, pin_memory=True) for _ in range(4)]
prefetcher = AsyncCUDAPrefetcher(dataset, device)

batch_count = 0
batch = prefetcher.next()
while batch is not None:
    batch_count += 1
    # Model compute here...
    batch = prefetcher.next()

print(f"Successfully processed {batch_count} batches with async prefetching on {device}.")`,
            expectedOutput: `Successfully processed 4 batches with async prefetching on cpu.`,
            explanation: 'Full implementation of AsyncCUDAPrefetcher with graceful CPU fallback and stream synchronization.'
          }
        ]
      },
      {
        id: 'chapter-4-caching-allocator-record-stream',
        title: 'PyTorch Caching Allocator & record_stream() Lifecycle',
        icon: 'Sparkles',
        summary: 'Prevent silent memory corruption and allocator race conditions across concurrent CUDA streams.',
        markdownContent: `### How the PyTorch Caching Allocator Works

Standard CUDA allocation (\`cudaMalloc\`) and deallocation (\`cudaFree\`) are heavy OS/driver operations that synchronize the GPU and incur substantial overhead. To achieve microsecond-level tensor allocations, PyTorch implements a **caching allocator** (\`caching_allocator.cpp\`).

When a tensor goes out of Python scope, PyTorch does **not** call \`cudaFree\`. Instead, it places the GPU memory block into an internal free pool for instant reuse.

### The Multi-Stream Hazard

The caching allocator tracks tensor lifetimes using the stream on which the tensor was allocated.

Consider what happens without \`record_stream()\`:
1. \`Batch N+1\` is allocated on \`transfer_stream\` inside \`preload()\`.
2. \`next()\` returns \`Batch N+1\` to the training loop, which uses it on the \`default_stream\`.
3. In the next iteration, Python garbage collects the old reference to \`Batch N+1\`.
4. Because the allocator only observed the original allocation on \`transfer_stream\` (and that stream may have completed its copy), it marks the memory block as **free**.
5. The allocator assigns that exact same memory block to an intermediate activation in the forward pass on \`default_stream\` while the backward pass or kernel is still reading \`Batch N+1\`!
6. **Result**: Silent numerical corruption, wrong gradients, or NaN loss values.

### The Solution: \`tensor.record_stream(stream)\`

Calling \`batch.record_stream(torch.cuda.current_stream())\` registers an internal CUDA event. The caching allocator will **refuse to reuse** that memory block until all operations on the recorded stream have completed.`,
        codeSnippets: [
          {
            id: 'snippet-record-stream-demo',
            title: 'Safe Multi-Stream Memory Management with record_stream()',
            code: `import torch

if torch.cuda.is_available():
    device = torch.device('cuda:0')
    transfer_stream = torch.cuda.Stream(device=device)
    
    # 1. Allocate tensor on transfer_stream
    with torch.cuda.stream(transfer_stream):
        gpu_tensor = torch.ones(1024, 1024, device=device)
        
    # 2. Transfer tensor to compute stream for matrix multiplication
    compute_stream = torch.cuda.current_stream(device=device)
    compute_stream.wait_stream(transfer_stream)
    
    # CRITICAL: Record the compute stream to prevent premature allocator reuse!
    gpu_tensor.record_stream(compute_stream)
    
    # 3. Compute in default stream
    result = gpu_tensor * 2.5
    print(f"Tensor safely shared across streams. Mean value: {result.mean().item()}")
else:
    print("CUDA environment required for multi-stream allocator demo.")`,
            expectedOutput: `CUDA environment required for multi-stream allocator demo.`,
            explanation: 'Shows how record_stream() signals the memory allocator to keep the buffer alive until both transfer and compute streams finish.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Calling tensor.to(device, non_blocking=True) on non-pinned memory (falls back to synchronous blocking transfer)',
        badSnippet: `# BAD: cpu_tensor is standard pageable memory
cpu_tensor = torch.randn(10000, 10000) 
# Silently falls back to synchronous cudaMemcpy!
gpu_tensor = cpu_tensor.to('cuda', non_blocking=True)`,
        badExplanation: 'Because the OS can relocate pageable memory pages, the GPU DMA engine cannot access cpu_tensor directly. PyTorch must perform a synchronous CPU copy to a staging buffer, blocking the Python thread.',
        goodSnippet: `# GOOD: Explicitly page-lock host memory before async transfer
cpu_tensor = torch.randn(10000, 10000)
pinned_tensor = cpu_tensor.pin_memory() # Locks into physical RAM
gpu_tensor = pinned_tensor.to('cuda', non_blocking=True) # True async DMA!`,
        goodExplanation: 'Pinning memory fixes the physical RAM addresses, allowing the GPU DMA copy engine to transfer bytes over PCIe asynchronously without CPU intervention.',
        perfImpact: '2x to 3x throughput degradation; CPU thread blocks on every batch transfer, starving GPU compute cores.'
      },
      {
        title: 'Omitting batch.record_stream() causing PyTorch caching allocator to overwrite active GPU tensors',
        badSnippet: `# BAD: Passing tensor from transfer stream to compute stream without recording
with torch.cuda.stream(transfer_stream):
    batch = host_batch.to('cuda', non_blocking=True)

torch.cuda.current_stream().wait_stream(transfer_stream)
# Use batch in compute stream...
out = model(batch)
# Python drops ref to batch on next iter; allocator reallocates buffer while compute is active!`,
        badExplanation: 'The PyTorch caching allocator thinks the tensor is only used on transfer_stream. Once transfer finishes and the Python variable is dereferenced, the memory block is recycled, causing memory corruption.',
        goodSnippet: `# GOOD: Alert the allocator that compute_stream is reading the buffer
with torch.cuda.stream(transfer_stream):
    batch = host_batch.to('cuda', non_blocking=True)

torch.cuda.current_stream().wait_stream(transfer_stream)
batch.record_stream(torch.cuda.current_stream()) # Protects buffer from reuse!
out = model(batch)`,
        goodExplanation: 'record_stream() attaches an event to the allocator pool, ensuring the buffer is not reused until the compute stream has finished consuming it.',
        perfImpact: 'Silent numerical corruption, nondeterministic training divergence, and unexplained NaN losses.'
      },
      {
        title: 'Excessive torch.cuda.synchronize() calls serializing pipeline execution',
        badSnippet: `# BAD: Synchronizing GPU inside tight training loops
for batch in dataloader:
    out = model(batch)
    loss = criterion(out, target)
    loss.backward()
    optimizer.step()
    torch.cuda.synchronize() # Destroys all stream pipelining!
    print(f"Loss: {loss.item()}") # loss.item() also causes a host sync!`,
        badExplanation: 'torch.cuda.synchronize() forces the host CPU to block until all GPU queues are completely empty, draining the GPU execution pipeline and eliminating hardware parallelism.',
        goodSnippet: `# GOOD: Keep GPU command queue saturated; sync only at epoch boundaries or async log
for step, batch in enumerate(dataloader):
    out = model(batch)
    loss = criterion(out, target)
    loss.backward()
    optimizer.step()
    # Log metrics periodically or asynchronously without stalling every step
    if step % 100 == 0:
        print(f"Step {step} loss: {loss.detach().cpu().numpy()}")`,
        goodExplanation: 'Allows the host CPU to enqueue kernels far ahead of GPU execution, keeping Tensor Cores 100% utilized at all times.',
        perfImpact: 'Reduces overall training throughput by 40% to 70% due to GPU pipeline stalls and CPU spin-waiting.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'tensor.pin_memory()',
        category: 'Pinned Memory',
        signature: 'tensor.pin_memory(device=None) -> torch.Tensor',
        summary: 'Copies CPU tensor into page-locked host memory, returning a pinned copy.',
        parameters: [
          { name: 'device', type: 'torch.device | None', desc: 'Target CUDA device context (optional)' }
        ],
        returns: 'torch.Tensor (pinned in host RAM)',
        exampleSnippet: 'pinned_t = t.pin_memory()\nassert pinned_t.is_pinned()'
      },
      {
        name: 'tensor.is_pinned()',
        category: 'Pinned Memory',
        signature: 'tensor.is_pinned(device=None) -> bool',
        summary: 'Returns True if the tensor storage is locked in physical host memory.',
        parameters: [
          { name: 'device', type: 'torch.device | None', desc: 'Target CUDA device to check against' }
        ],
        returns: 'bool',
        exampleSnippet: 'if not batch.is_pinned():\n    batch = batch.pin_memory()'
      },
      {
        name: 'torch.cuda.Stream()',
        category: 'CUDA Streams',
        signature: 'torch.cuda.Stream(device=None, priority=0) -> torch.cuda.Stream',
        summary: 'Creates a new CUDA execution stream (asynchronous command queue).',
        parameters: [
          { name: 'device', type: 'torch.device | int | None', desc: 'Device on which to allocate stream' },
          { name: 'priority', type: 'int', desc: 'Stream priority (0=default, negative=higher priority)' }
        ],
        returns: 'torch.cuda.Stream',
        exampleSnippet: 's = torch.cuda.Stream(priority=-1)'
      },
      {
        name: 'torch.cuda.stream(s)',
        category: 'CUDA Streams',
        signature: 'torch.cuda.stream(stream: torch.cuda.Stream) -> ContextManager',
        summary: 'Context manager that sets the active stream for operations enclosed within the block.',
        parameters: [
          { name: 'stream', type: 'torch.cuda.Stream', desc: 'Stream to set as active' }
        ],
        returns: 'ContextManager',
        exampleSnippet: 'with torch.cuda.stream(s):\n    y = model(x)'
      },
      {
        name: 'stream.wait_stream(other_stream)',
        category: 'Stream Synchronization',
        signature: 'stream.wait_stream(other_stream: torch.cuda.Stream) -> None',
        summary: 'Makes stream wait on operations submitted to other_stream without blocking host CPU.',
        parameters: [
          { name: 'other_stream', type: 'torch.cuda.Stream', desc: 'Stream whose completion must be awaited' }
        ],
        returns: 'None',
        exampleSnippet: 'torch.cuda.current_stream().wait_stream(transfer_stream)'
      },
      {
        name: 'tensor.record_stream(stream)',
        category: 'Memory Management',
        signature: 'tensor.record_stream(stream: torch.cuda.Stream) -> None',
        summary: 'Alerts PyTorch caching allocator that tensor is used by stream, preventing premature block reuse.',
        parameters: [
          { name: 'stream', type: 'torch.cuda.Stream', desc: 'Auxiliary stream referencing this tensor' }
        ],
        returns: 'None',
        exampleSnippet: 'batch.record_stream(torch.cuda.current_stream())'
      },
      {
        name: 'torch.cuda.synchronize()',
        category: 'Synchronization',
        signature: 'torch.cuda.synchronize(device=None) -> None',
        summary: 'Blocks host CPU thread until all active streams on device complete execution.',
        parameters: [
          { name: 'device', type: 'torch.device | int | None', desc: 'CUDA device to synchronize' }
        ],
        returns: 'None',
        exampleSnippet: 'torch.cuda.synchronize()'
      },
      {
        name: 'torch.cuda.current_stream()',
        category: 'CUDA Streams',
        signature: 'torch.cuda.current_stream(device=None) -> torch.cuda.Stream',
        summary: 'Returns the currently active CUDA stream for the specified device.',
        parameters: [
          { name: 'device', type: 'torch.device | int | None', desc: 'Device for which to retrieve stream' }
        ],
        returns: 'torch.cuda.Stream',
        exampleSnippet: 'curr_s = torch.cuda.current_stream()'
      },
      {
        name: 'tensor.to(device, non_blocking=True)',
        category: 'Memory Transfer',
        signature: 'tensor.to(device, non_blocking=False, copy=False) -> torch.Tensor',
        summary: 'Performs asynchronous PCIe DMA transfer if tensor is pinned in host memory.',
        parameters: [
          { name: 'device', type: 'torch.device | str', desc: 'Target device (e.g., "cuda:0")' },
          { name: 'non_blocking', type: 'bool', desc: 'If True and memory is pinned, copy is asynchronous' }
        ],
        returns: 'torch.Tensor (on target device)',
        exampleSnippet: 'gpu_t = pinned_t.to("cuda", non_blocking=True)'
      },
      {
        name: 'torch.cuda.Event()',
        category: 'CUDA Events',
        signature: 'torch.cuda.Event(enable_timing=False, blocking=False, interprocess=False) -> torch.cuda.Event',
        summary: 'Creates a CUDA event for GPU timing benchmarks or inter-stream synchronization barriers.',
        parameters: [
          { name: 'enable_timing', type: 'bool', desc: 'If True, event can measure elapsed time in ms' }
        ],
        returns: 'torch.cuda.Event',
        exampleSnippet: 'start = torch.cuda.Event(enable_timing=True)\nstart.record()'
      }
    ],
    interactiveWidgetType: 'pytorch-autograd'
  },
  challenges: [
    {
      id: 'd4-c1',
      dayId: 4,
      partId: 4,
      title: 'Asynchronous Pipelined DataLoader with Pinned Memory & CUDA Streams',
      slug: 'async-cuda-dataloader-stream',
      difficulty: 'Advanced',
      category: 'CUDA Concurrency',
      summary: 'Overlap Host-to-Device tensor transfers with GPU model computation using dual CUDA streams.',
      mentalModel5s: 'Synchronous .to("cuda") stalls CPU and GPU compute. Double-buffering with page-locked pinned memory and a dedicated non-blocking CUDA stream overlaps PCIe Host-to-Device DMA transfers with model kernel execution.',
      visualAnalogy: 'A factory conveyor belt where the next bin of parts is loaded into the staging tray in advance while workers assemble the current bin, instead of pausing the entire assembly line while someone walks to the warehouse.',
      pitfalls: [
        'Using non_blocking=True on unpinned (pageable) host memory, which silently degrades to a blocking CPU copy.',
        'Forgetting torch.cuda.current_stream().wait_stream(transfer_stream), causing race conditions where GPU compute starts before the DMA copy finishes.',
        'Failing to call batch.record_stream(torch.cuda.current_stream()), which allows PyTorch\'s caching allocator to prematurely free memory still in flight.',
        'Crashing on CPU-only machines by unconditionally calling CUDA stream functions without checking torch.cuda.is_available().'
      ],
      progressiveHints: [
        'Tier 1 (Conceptual): Pinned memory (tensor.pin_memory()) allows GPU DMA hardware controllers to read physical RAM addresses directly without OS page fault interruptions.',
        'Tier 2 (Stream Setup): Initialize self.stream = torch.cuda.Stream(device=device) when is_cuda is True; otherwise set to None for CPU fallback.',
        'Tier 3 (Async Preload): Inside with torch.cuda.stream(self.stream): ensure batch is pinned and invoke batch.to(device, non_blocking=True).',
        'Tier 4 (Stream Barrier & Memory Safety): In next(), call current_stream.wait_stream(self.stream) before using the batch, and record_stream(current_stream) on the tensor before prefetching the subsequent batch.'
      ],
      deepInternals: {
        title: 'PCIe DMA Controllers & PyTorch Caching Allocator',
        content: 'When transfer and compute streams execute concurrently, PyTorch\'s caching allocator tracks tensor lifetimes across stream barriers. Calling batch.record_stream(compute_stream) increments a reference counter until all CUDA kernels on both streams have retired the memory block.',
        keyRule: 'Always pair torch.cuda.stream with wait_stream and record_stream for race-free asynchronous pipelines.'
      },
      instructions: `In high-throughput deep learning training, synchronous \`tensor.to('cuda')\` blocks the CPU and starves the GPU.

**Tasks:**
1. Create a double-buffered prefetching pipeline using \`torch.cuda.Stream()\`.
2. Allocate pinned host tensors using \`tensor.pin_memory()\`.
3. In \`preload()\`, transfer the next batch asynchronously using \`non_blocking=True\` on a dedicated transfer stream.
4. In \`next()\`, synchronize the current compute stream with the transfer stream without stalling the host CPU, and call \`record_stream()\` to ensure allocator safety.
5. Provide a seamless CPU fallback when CUDA is not available.`,
      hints: [
        'Initialize: self.is_cuda = (device.type == "cuda") and torch.cuda.is_available()',
        'Create stream: self.stream = torch.cuda.Stream(device=device) if self.is_cuda else None',
        'In preload(): with torch.cuda.stream(self.stream): batch = batch.pin_memory() if not batch.is_pinned() else batch; self.next_batch = batch.to(self.device, non_blocking=True)',
        'In next(): torch.cuda.current_stream().wait_stream(self.stream) followed by batch.record_stream(torch.cuda.current_stream())'
      ],
      starterCode: `import torch
from typing import Iterator

class AsyncCUDAPrefetcher:
    """
    Prefetches batches from CPU pinned memory to GPU memory using a dedicated CUDA stream.
    """
    def __init__(self, loader: Iterator[torch.Tensor], device: torch.device):
        self.loader = loader
        self.device = device
        # TODO: Initialize CUDA stream and buffer state
        pass

    def preload(self):
        # TODO: Prefetch next batch asynchronously
        pass

    def next(self) -> torch.Tensor | None:
        """
        Yields next batch on GPU, ensuring transfer is ready on current stream.
        """
        # TODO: Synchronize streams and trigger subsequent preload
        pass
`,
      solutionCode: `import torch
from typing import Iterator

class AsyncCUDAPrefetcher:
    def __init__(self, loader: Iterator[torch.Tensor], device: torch.device):
        self.loader = iter(loader)
        self.device = device
        self.is_cuda = (device.type == 'cuda') and torch.cuda.is_available()
        self.stream = torch.cuda.Stream(device=device) if self.is_cuda else None
        self.next_batch = None
        self.preload()

    def preload(self):
        try:
            batch = next(self.loader)
        except StopIteration:
            self.next_batch = None
            return

        if self.is_cuda and self.stream is not None:
            with torch.cuda.stream(self.stream):
                if not batch.is_pinned():
                    batch = batch.pin_memory()
                self.next_batch = batch.to(self.device, non_blocking=True)
        else:
            self.next_batch = batch.to(self.device)

    def next(self) -> torch.Tensor | None:
        if self.is_cuda and self.stream is not None:
            torch.cuda.current_stream().wait_stream(self.stream)
        batch = self.next_batch
        if batch is not None:
            if self.is_cuda:
                batch.record_stream(torch.cuda.current_stream())
            self.preload()
        return batch
`,
      testCases: [
        { id: 't1', name: 'Stream Concurrency Overlap', inputDescription: '10 batches of shape (256, 1024)', expectedOutput: 'All batches yielded in correct order with non_blocking=True' },
        { id: 't2', name: 'Non-CUDA CPU Fallback', inputDescription: 'CPU device execution', expectedOutput: 'Graceful fallback without CUDA errors' }
      ],
      benchmarkTargetMs: 3.2,
      memoryTargetMb: 32.0,
      conceptPrimer: {
        title: 'PCIe Bus Bandwidth & Non-Blocking CUDA Streams',
        subtitle: 'Overlapping PCIe Host-to-Device (H2D) copying with Matrix Computations',
        overview: 'Modern GPUs feature independent hardware copy engines and compute engines. Synchronous memory copying leaves the compute SMs idle during PCIe transfer. Pinned memory (page-locked) allows Direct Memory Access (DMA) without CPU involvement.',
        mentalModel5s: 'Double buffering across dual CUDA streams eliminates PCIe transfer bottlenecks.',
        visualAnalogy: 'Two assembly workers: worker A delivers raw parts while worker B welds finished pieces.',
        pitfalls: [
          'Calling non_blocking=True on unpinned tensors degrades silently.',
          'Missing wait_stream leading to silent race conditions on GPU memory.'
        ],
        progressiveHints: [
          'Tier 1: Check if CUDA is available.',
          'Tier 2: Create torch.cuda.Stream().',
          'Tier 3: with torch.cuda.stream(self.stream): pin and to(device, non_blocking=True)',
          'Tier 4: current_stream.wait_stream(self.stream) and batch.record_stream(current_stream)'
        ],
        deepInternals: {
          title: 'Asynchronous Hardware DMA Queues',
          content: 'CUDA streams map to independent hardware work queues on the GPU, executing memory copies concurrently with compute kernels.',
          keyRule: 'Always use pin_memory() for non-blocking DMA copies.'
        },
        mathFormulas: [
          {
            title: 'Pipelining Speedup Theorem',
            latex: 'T_{\\text{pipeline}} = \\max(T_{\\text{H2D}}, T_{\\text{Compute}}) + \\epsilon \\quad \\text{vs} \\quad T_{\\text{sync}} = T_{\\text{H2D}} + T_{\\text{Compute}}',
            explanation: 'Effective batch time equals the maximum of transfer time or kernel execution time.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Synchronous batch loading
for batch in dataloader:
    # CPU blocks here waiting for PCIe DMA transfer!
    batch = batch.to('cuda') 
    loss = model(batch)`,
          naiveExplanation: 'GPU Compute SMs sit 100% idle during PCIe transfer on every single iteration.',
          idiomaticCode: `# Pipelined Async Prefetcher
prefetcher = AsyncCUDAPrefetcher(dataloader, device)
batch = prefetcher.next()
while batch is not None:
    loss = model(batch) # Computes while next batch transfers on transfer_stream!
    batch = prefetcher.next()`,
          idiomaticExplanation: 'Overlaps DMA PCIe transfer completely with model forward/backward pass.',
          speedupText: '1.8x overall throughput'
        },
        memoryLayout: {
          title: 'Pageable RAM vs Page-Locked Pinned RAM',
          content: 'Normal OS memory is pageable (can be swapped to disk). The GPU DMA engine cannot access pageable memory directly, forcing an intermediate CPU copy. pin_memory() locks memory pages in physical RAM.',
          diagramAscii: `Pageable: Host RAM ---> CPU Buffer Copy ---> PCIe ---> GPU VRAM (2x copy)
Pinned:   Host RAM (Pinned) ----------------> PCIe ---> GPU VRAM (1x zero-copy DMA)`,
          keyRule: 'Always use pin_memory=True in PyTorch DataLoader workers for GPU training.'
        },
        keyTakeaways: [
          'Host tensors must be page-locked (pin_memory()) for non_blocking=True to take effect.',
          'Use torch.cuda.current_stream().wait_stream(transfer_stream) to prevent race conditions without CPU sync.',
          'Call batch.record_stream(torch.cuda.current_stream()) to prevent premature deallocation by the caching allocator.'
        ]
      }
    }
  ]
};

export const PART04_TRACK = DAY04_TRACK;
export default DAY04_TRACK;
