import React, { useState } from 'react';
import {
  Boxes,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

type MemoryScenario = 'pointers' | 'copy' | 'mutability' | 'legb';

interface VisualizerState {
  code: string;
  variables: Array<{ name: string; targetId: string }>;
  objects: Array<{
    id: string;
    address: string;
    type: string;
    refCount: number;
    valueRepr: string;
    mutable: boolean;
    highlighted?: boolean;
  }>;
  explanation: string;
}

export const InteractivePythonMemoryVisualizer: React.FC = () => {
  const [scenario, setScenario] = useState<MemoryScenario>('pointers');
  const [step, setStep] = useState<number>(1);
  const [hoveredVar, setHoveredVar] = useState<string | null>(null);

  // Scenario 1: Reference assignment (a = [1, 2, 3]; b = a; a.append(4))
  const getPointersState = (): VisualizerState => {
    if (step === 1) {
      return {
        code: `a = [1, 2, 3]\n# 'a' references heap list at 0x7fa1`,
        variables: [{ name: 'a', targetId: 'obj1' }],
        objects: [
          {
            id: 'obj1',
            address: '0x7fa1',
            type: 'list',
            refCount: 1,
            valueRepr: '[1, 2, 3]',
            mutable: true,
          },
        ],
        explanation: "Python variables do not store values directly. Variable 'a' is simply a name tag holding a pointer to the list object in heap memory.",
      };
    }
    if (step === 2) {
      return {
        code: `a = [1, 2, 3]\nb = a  # Pointer copy! No new list created!`,
        variables: [
          { name: 'a', targetId: 'obj1' },
          { name: 'b', targetId: 'obj1' },
        ],
        objects: [
          {
            id: 'obj1',
            address: '0x7fa1',
            type: 'list',
            refCount: 2,
            valueRepr: '[1, 2, 3]',
            mutable: true,
            highlighted: true,
          },
        ],
        explanation: "Assignment ('b = a') merely binds a new name to the exact same heap address! ob_refcnt increases to 2.",
      };
    }
    return {
      code: `a = [1, 2, 3]\nb = a\na.append(4)  # Mutates object in-place!\nprint(b)     # Prints [1, 2, 3, 4]!`,
      variables: [
        { name: 'a', targetId: 'obj1' },
        { name: 'b', targetId: 'obj1' },
      ],
      objects: [
        {
          id: 'obj1',
          address: '0x7fa1',
          type: 'list',
          refCount: 2,
          valueRepr: '[1, 2, 3, 4]',
          mutable: true,
          highlighted: true,
        },
      ],
      explanation: "Because 'a' and 'b' reference the identical PyObject, mutating via 'a.append(4)' is immediately visible via 'b'!",
    };
  };

  // Scenario 2: Shallow Copy vs Deep Copy
  const getCopyState = (): VisualizerState => {
    if (step === 1) {
      return {
        code: `import copy\na = [[1, 2], [3, 4]]\n# Outer list points to inner lists`,
        variables: [{ name: 'a', targetId: 'outer_a' }],
        objects: [
          { id: 'outer_a', address: '0x1000', type: 'list (outer)', refCount: 1, valueRepr: '[->0x1010, ->0x1020]', mutable: true },
          { id: 'inner_1', address: '0x1010', type: 'list (inner 1)', refCount: 1, valueRepr: '[1, 2]', mutable: true },
          { id: 'inner_2', address: '0x1020', type: 'list (inner 2)', refCount: 1, valueRepr: '[3, 4]', mutable: true },
        ],
        explanation: "A nested list consists of an outer container holding references to independent child list objects.",
      };
    }
    if (step === 2) {
      return {
        code: `b = a.copy()  # Shallow copy\n# Creates a new outer list, but reuses inner pointers!`,
        variables: [
          { name: 'a', targetId: 'outer_a' },
          { name: 'b', targetId: 'outer_b' },
        ],
        objects: [
          { id: 'outer_a', address: '0x1000', type: 'list (outer a)', refCount: 1, valueRepr: '[->0x1010, ->0x1020]', mutable: true },
          { id: 'outer_b', address: '0x2000', type: 'list (outer b)', refCount: 1, valueRepr: '[->0x1010, ->0x1020]', mutable: true, highlighted: true },
          { id: 'inner_1', address: '0x1010', type: 'list (inner 1)', refCount: 2, valueRepr: '[1, 2]', mutable: true },
          { id: 'inner_2', address: '0x1020', type: 'list (inner 2)', refCount: 2, valueRepr: '[3, 4]', mutable: true },
        ],
        explanation: "Shallow copy ('a.copy()') allocates a new outer container (0x2000), but its elements still point to the same inner lists (0x1010, 0x1020).",
      };
    }
    return {
      code: `c = copy.deepcopy(a)  # Deep copy\n# Clones the entire object graph recursively!`,
      variables: [
        { name: 'a', targetId: 'outer_a' },
        { name: 'b', targetId: 'outer_b' },
        { name: 'c', targetId: 'outer_c' },
      ],
      objects: [
        { id: 'outer_a', address: '0x1000', type: 'list (outer a)', refCount: 1, valueRepr: '[->0x1010, ->0x1020]', mutable: true },
        { id: 'outer_b', address: '0x2000', type: 'list (outer b)', refCount: 1, valueRepr: '[->0x1010, ->0x1020]', mutable: true },
        { id: 'outer_c', address: '0x3000', type: 'list (outer c)', refCount: 1, valueRepr: '[->0x3010, ->0x3020]', mutable: true, highlighted: true },
        { id: 'inner_1', address: '0x1010', type: 'list (inner 1)', refCount: 2, valueRepr: '[1, 2]', mutable: true },
        { id: 'inner_2', address: '0x1020', type: 'list (inner 2)', refCount: 2, valueRepr: '[3, 4]', mutable: true },
        { id: 'deep_1', address: '0x3010', type: 'list (clone 1)', refCount: 1, valueRepr: '[1, 2]', mutable: true, highlighted: true },
        { id: 'deep_2', address: '0x3020', type: 'list (clone 2)', refCount: 1, valueRepr: '[3, 4]', mutable: true, highlighted: true },
      ],
      explanation: "Deep copy duplicates both the outer container and all nested child objects recursively. Changes to 'a' will never touch 'c'!",
    };
  };

  // Scenario 3: Immutability & Re-binding
  const getMutabilityState = (): VisualizerState => {
    if (step === 1) {
      return {
        code: `x = 42\ny = x\n# Integers are immutable PyLongObject instances`,
        variables: [
          { name: 'x', targetId: 'int_42' },
          { name: 'y', targetId: 'int_42' },
        ],
        objects: [
          { id: 'int_42', address: '0x8042', type: 'int', refCount: 2, valueRepr: '42', mutable: false },
        ],
        explanation: "Both 'x' and 'y' point to the immutable integer object '42'.",
      };
    }
    return {
      code: `x = x + 1  # Cannot mutate 42 in-place!\n# Creates a new int(43) object and rebinds 'x'`,
      variables: [
        { name: 'x', targetId: 'int_43' },
        { name: 'y', targetId: 'int_42' },
      ],
      objects: [
        { id: 'int_42', address: '0x8042', type: 'int', refCount: 1, valueRepr: '42', mutable: false },
        { id: 'int_43', address: '0x8043', type: 'int', refCount: 1, valueRepr: '43', mutable: false, highlighted: true },
      ],
      explanation: "Because integers are immutable, 'x + 1' evaluates to a brand new PyObject at 0x8043. 'x' is rebound, leaving 'y' undisturbed at 42.",
    };
  };

  // Scenario 4: LEGB Scope Resolution
  const legbLayers = [
    { name: 'Local (L)', desc: 'Names assigned inside the active function frame (e.g. def foo(): x = 1)', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
    { name: 'Enclosing (E)', desc: 'Names in any enclosing nested function definitions (closures)', color: 'border-sky-500/40 bg-sky-500/10 text-sky-300' },
    { name: 'Global (G)', desc: 'Names assigned at top-level module scope (__main__ or file)', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
    { name: 'Built-in (B)', desc: 'Preloaded Python primitives: len, range, print, ValueError, ...', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
  ];

  const currentData =
    scenario === 'pointers'
      ? getPointersState()
      : scenario === 'copy'
      ? getCopyState()
      : getMutabilityState();

  return (
    <div className="bg-surface-base border border-surface-border rounded-xl p-4 sm:p-5 space-y-4 text-zinc-200">
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Python Memory & Object Model Visualizer</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PyObject Mechanics
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Interactive dissection of names, pointers, reference counting, and mutability.
            </p>
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="flex flex-wrap gap-1 bg-surface-panel p-1 rounded-lg border border-surface-border text-xs">
          <button
            onClick={() => { setScenario('pointers'); setStep(1); }}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              scenario === 'pointers' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Names & Pointers
          </button>
          <button
            onClick={() => { setScenario('copy'); setStep(1); }}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              scenario === 'copy' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Shallow vs Deep Copy
          </button>
          <button
            onClick={() => { setScenario('mutability'); setStep(1); }}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              scenario === 'mutability' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Mutability & Re-binding
          </button>
          <button
            onClick={() => setScenario('legb')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              scenario === 'legb' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            LEGB Scopes
          </button>
        </div>
      </div>

      {scenario !== 'legb' ? (
        <>
          {/* Code & Step Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-xs">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Executed Python Bytecode</span>
                <span className="text-blue-400">Step {step} of {scenario === 'copy' ? 3 : scenario === 'pointers' ? 3 : 2}</span>
              </div>
              <pre className="text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                {currentData.code}
              </pre>
            </div>

            <div className="bg-surface-panel p-3 rounded-lg border border-surface-border flex flex-col justify-between">
              <div className="text-xs text-zinc-300 leading-relaxed">
                <span className="font-semibold text-white block mb-1">Observation:</span>
                {currentData.explanation}
              </div>
              <div className="flex items-center gap-2 pt-3 mt-2 border-t border-surface-border">
                <button
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="flex-1 py-1 px-2 text-xs rounded bg-surface-elevated border border-surface-border disabled:opacity-30 hover:bg-zinc-800 transition"
                >
                  ◀ Prev Step
                </button>
                <button
                  onClick={() => {
                    const maxStep = scenario === 'copy' ? 3 : scenario === 'pointers' ? 3 : 2;
                    setStep((s) => (s >= maxStep ? 1 : s + 1));
                  }}
                  className="flex-1 py-1 px-2 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition flex items-center justify-center gap-1"
                >
                  <span>{step >= (scenario === 'copy' ? 3 : scenario === 'pointers' ? 3 : 2) ? 'Reset' : 'Next Step'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Memory Grid: Names Table -> Heap Objects */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Namespace (Stack Names) */}
            <div className="bg-surface-panel/80 rounded-xl p-3 border border-surface-border space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 pb-1 border-b border-surface-border">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Namespace (Names / Pointers)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Stack</span>
              </div>
              <div className="space-y-2">
                {currentData.variables.map((v) => (
                  <div
                    key={v.name}
                    onMouseEnter={() => setHoveredVar(v.name)}
                    onMouseLeave={() => setHoveredVar(null)}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                      hoveredVar === v.name
                        ? 'bg-blue-500/20 border-blue-500 text-white shadow-xs'
                        : 'bg-surface-elevated border-surface-border text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <span className="font-mono font-bold text-yellow-300">{v.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                      <span>points to</span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-300 bg-blue-500/10 px-1 rounded">{v.targetId}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Heap Objects (PyObject allocations) */}
            <div className="md:col-span-2 bg-surface-panel/80 rounded-xl p-3 border border-surface-border space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 pb-1 border-b border-surface-border">
                <span className="flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Heap Memory (Allocated PyObjects)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Heap RAM</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentData.objects.map((obj) => (
                  <div
                    key={obj.id}
                    className={`p-2.5 rounded-lg border text-xs font-mono space-y-1.5 transition-all ${
                      obj.highlighted
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20'
                        : 'bg-surface-elevated border-surface-border'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] pb-1 border-b border-surface-border/60">
                      <span className="text-zinc-400">{obj.address}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${
                        obj.mutable ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      }`}>
                        {obj.mutable ? 'Mutable' : 'Immutable'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">type:</span>
                      <span className="text-purple-300 font-semibold">{obj.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">ob_refcnt:</span>
                      <span className="text-white font-bold">{obj.refCount}</span>
                    </div>
                    <div className="pt-1 text-[11px]">
                      <span className="text-zinc-500 text-[10px] block">value payload:</span>
                      <span className="text-emerald-300 font-semibold truncate block">{obj.valueRepr}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Scenario 4: LEGB Scope Hierarchy */
        <div className="space-y-3 pt-1">
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300">
            <span className="font-semibold text-white block mb-1">The LEGB Rule:</span>
            When Python encounters a variable reference, it searches 4 nested scopes from inside out. The search halts at the very first scope containing the name.
          </div>
          <div className="space-y-2">
            {legbLayers.map((layer, idx) => (
              <div
                key={layer.name}
                className={`p-3 rounded-lg border flex items-start gap-3 transition-all ${layer.color}`}
              >
                <div className="w-6 h-6 rounded-full bg-surface-base border border-current flex items-center justify-center font-bold text-xs shrink-0">
                  {idx + 1}
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-xs block">{layer.name}</span>
                  <span className="text-xs text-zinc-400">{layer.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Pro-Tip */}
      <div className="p-2.5 rounded-lg bg-surface-panel border border-surface-border text-xs text-zinc-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-zinc-200">Python Pro-Tip:</strong> Check object identity in Python with <code className="text-blue-300 bg-surface-elevated px-1 py-0.5 rounded">id(obj)</code> or the identity comparison operator <code className="text-blue-300 bg-surface-elevated px-1 py-0.5 rounded">a is b</code> (which checks pointer equality), as opposed to <code className="text-blue-300 bg-surface-elevated px-1 py-0.5 rounded">a == b</code> (which checks value equality via <code className="text-blue-300">__eq__</code>).
        </span>
      </div>
    </div>
  );
};

export default InteractivePythonMemoryVisualizer;
