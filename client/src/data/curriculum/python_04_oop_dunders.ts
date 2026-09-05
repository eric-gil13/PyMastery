import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY04_TRACK: DayTrack = {
  partNumber: 4,
  partId: 4,
  dayNumber: 4,
  id: 4,
  title: 'Part 4: Object-Oriented Programming & The Dunder Protocol',
  subtitle: 'Classes, dunder protocols, properties, inheritance, slots, and polymorphism',
  description: 'Master Python’s object-oriented architecture. Understand how Python implements data encapsulation via the dunder (double underscore) protocol, turn plain classes into idiomatic math containers with `__add__` and `__repr__`, optimize memory using `__slots__`, and build polymorphic class hierarchies.',
  iconName: 'ShieldCheck',
  badge: 'Part 4 • OOP & Dunders',
  libraryMechanics: {
    libraryName: 'Python Dunder Protocol & Class Internals',
    tagline: 'Special methods, instance __dict__ vs __slots__, and C3 MRO linearization.',
    overview: `### ⚡ Python’s Philosophy: The Data Model
Python does not use special keywords like \`implements\`, \`interface\`, or operator overloading pragmas. Instead, Python relies on the **Data Model** (colloquially called the **Dunder Protocol**).

By implementing magic methods with leading and trailing double underscores (like \`__len__\`, \`__getitem__\`, \`__eq__\`), your custom classes seamlessly integrate into Python’s built-in syntax:
- \`len(obj)\` calls \`type(obj).__len__(obj)\`
- \`a + b\` calls \`type(a).__add__(a, b)\`
- \`obj[key]\` calls \`type(obj).__getitem__(obj, key)\`
- \`str(obj)\` calls \`type(obj).__str__(obj)\`

### 📦 Memory: __dict__ vs __slots__
By default, every Python class instance maintains a dynamic dictionary (\`inst.__dict__\`) to store its attributes. While flexible, this adds ~150 bytes of hash table overhead per instance.
By declaring \`__slots__ = ('x', 'y')\`, CPython replaces the dictionary with a fixed-size C array of pointers, slashing instance memory by up to 80% and speeding up attribute access.`,
    whyItExists: `Idiomatic Python classes feel like native built-in types:
- **\`__repr__\` vs \`__str__\`:** \`__repr__\` provides an unambiguous string representing how to recreate the object (for developers/debuggers). \`__str__\` provides a human-readable display.
- **Polymorphism:** Code that expects a sequence needs only \`__len__\` and \`__getitem__\`, working uniformly on lists, tuples, or your custom objects (Duck Typing: *"If it walks like a duck and quacks like a duck, it is a duck"*).
- **Encapsulation with \`@property\`:** Expose clean attribute syntax (\`account.balance\`) while running validation logic behind the scenes.`,
    coreAnatomy: {
      objectName: 'CPython PyTypeObject & Instance Memory',
      description: 'The layout of a class instance with __dict__ vs __slots__.',
      fields: [
        {
          name: '__dict__',
          type: 'PyDictObject*',
          role: 'Dynamic hash table storing instance attributes (omitted when __slots__ is defined).'
        },
        {
          name: '__class__',
          type: 'PyTypeObject*',
          role: 'Pointer to the class definition holding methods and MRO hierarchy.'
        },
        {
          name: '__mro__',
          type: 'tuple[type]',
          role: 'Method Resolution Order computed via the C3 linearization algorithm.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|                 Standard vs __slots__ Instance              |
|                                                             |
|  Standard Instance (~180 bytes)    __slots__ Instance (~48 B)|
|  +---------------------------+     +-----------------------+|
|  | ob_refcnt : 1             |     | ob_refcnt : 1         ||
|  | ob_type   : <class Point> |     | ob_type   : <class P> ||
|  | __dict__  : -> PyDict     |     | slot 0 (_x): float    ||
|  +---------------------------+     | slot 1 (_y): float    ||
|               |                    +-----------------------+|
|               v                                             |
|         [Large Hash Table]                                  |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-dunder-math',
        title: 'Arithmetic Dunders & In-Place Operations',
        icon: 'Zap',
        summary: 'Turn custom classes into mathematical objects.',
        markdownContent: `### Emulating Numeric Types

To support operator arithmetic, implement binary special methods:

\`\`\`python
class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
        
    def __add__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return Point(self.x + other.x, self.y + other.y)
        
    def __repr__(self):
        return f"Point({self.x}, {self.y})"

p1 = Point(1, 2)
p2 = Point(3, 4)
print(p1 + p2)  # Point(4, 6)
\`\`\`

> **Pro-Tip**: Return \`NotImplemented\` instead of raising \`TypeError\` if the types do not match. This allows Python to try the reflected method (\`__radd__\`) on the right-hand operand.`,
        codeSnippets: [
          {
            id: 'snip-dunders',
            title: 'Reflected Arithmetic (__radd__)',
            code: `class ScalarMultiplier:
    def __init__(self, factor):
        self.factor = factor
        
    def __rmul__(self, other):
        return [item * self.factor for item in other]

sm = ScalarMultiplier(3)
print([1, 2, 3] * sm)  # Uses __rmul__ on sm!`,
            explanation: 'When the left-hand operand does not know how to multiply with your custom class, Python reflects the call to the right operand __rmul__.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Bypassing super() in Multiple Inheritance',
        badSnippet: `class Child(BaseA, BaseB):\n    def __init__(self):\n        BaseA.__init__(self)  # Bypasses BaseB and breaks MRO!`,
        badExplanation: 'Hardcoding direct parent class calls skips diamond inheritance nodes and breaks cooperative multiple inheritance.',
        goodSnippet: `class Child(BaseA, BaseB):\n    def __init__(self, *args, **kwargs):\n        super().__init__(*args, **kwargs)  # Follows C3 MRO graph`,
        goodExplanation: 'Always use super() to let Python navigate the computed Method Resolution Order linearized graph.',
        perfImpact: 'Prevents silent state initialization omissions in complex class hierarchies.'
      }
    ],
    apiCheatSheet: [
      {
        name: '__repr__',
        category: 'Protocols',
        signature: '__repr__(self) -> str',
        summary: 'Returns official string representation of object, ideally valid Python code to recreate it.',
        parameters: [],
        returns: 'str representation.',
        exampleSnippet: 'def __repr__(self): return f"Point({self.x})"'
      },
      {
        name: '__eq__',
        category: 'Protocols',
        signature: '__eq__(self, other) -> bool',
        summary: 'Called for equality comparison (==). Should return NotImplemented if other is an incompatible type.',
        parameters: [
          { name: 'other', type: 'object', desc: 'Comparison target.' }
        ],
        returns: 'bool or NotImplemented.',
        exampleSnippet: 'def __eq__(self, other): return self.x == other.x'
      },
      {
        name: '__len__',
        category: 'Protocols',
        signature: '__len__(self) -> int',
        summary: 'Returns non-negative integer length of container. Called by len() and truthiness checks.',
        parameters: [],
        returns: 'int non-negative length.',
        exampleSnippet: 'def __len__(self): return len(self._items)'
      },
      {
        name: 'property',
        category: 'Descriptors',
        signature: '@property / @name.setter',
        summary: 'Defines managed getter and setter attributes without breaking public API conventions.',
        parameters: [],
        returns: 'Property descriptor attribute.',
        exampleSnippet: '@property\ndef x(self): return self._x'
      }
    ],
    interactiveWidgetType: 'python-memory'
  },
  challenges: [
    {
      id: 'python-p4-c1',
      dayId: 4,
      partId: 4,
      title: '2D Vector Math Container Protocol',
      slug: '2d-vector-math-container-protocol',
      difficulty: 'Intermediate',
      category: 'Dunder Protocol & Math Types',
      summary: 'Implement an immutable, memory-efficient 2D Vector class supporting vector addition, scalar multiplication, container indexing, and magnitude.',
      estimatedTime: '20 min',
      hints: [
        'Set `__slots__ = ("_x", "_y")` inside the class body before `__init__`.',
        'Coerce `x` and `y` to float in `__init__`, raising `TypeError` on ValueError/TypeError.',
        'Implement read-only `@property def x(self): return self._x` and `y`.',
        'In `__add__`, check `if not isinstance(other, Vector2D): return NotImplemented`.',
        'In `__mul__` and `__rmul__`, support scalar multiplication and return `NotImplemented` if not numeric.'
      ],
      instructions: `Create a class \`Vector2D\` that satisfies:
1. **Memory Optimization**:
   - Define \`__slots__ = ('_x', '_y')\` to prevent \`__dict__\` allocation.
2. **Initialization & Properties**:
   - \`__init__(self, x: float, y: float)\`: Coerce \`x\` and \`y\` to \`float\`. If coercion fails, raise \`TypeError("Vector coordinates must be numeric")\`.
   - Read-only properties \`x\` and \`y\` returning \`self._x\` and \`self._y\`. Attempting to set \`v.x = 10\` should raise \`AttributeError\`.
3. **Representation & Equality**:
   - \`__repr__(self) -> str\`: Returns \`f"Vector2D({self._x}, {self._y})"\`.
   - \`__eq__(self, other) -> bool\`: Returns \`True\` if \`other\` is a \`Vector2D\` and \`abs(self._x - other._x) < 1e-6\` and \`abs(self._y - other._y) < 1e-6\`. Returns \`False\` for non-Vector2D objects.
4. **Vector Arithmetic**:
   - \`__add__(self, other)\`: Adds two \`Vector2D\` instances and returns a new \`Vector2D\`. If \`other\` is not a \`Vector2D\`, return \`NotImplemented\`.
   - \`__mul__(self, scalar: float)\` and \`__rmul__(self, scalar: float)\`: Scalar multiplication returning a new \`Vector2D(self._x * scalar, self._y * scalar)\`. If scalar is not numeric, return \`NotImplemented\`.
5. **Magnitude & Container Protocol**:
   - \`magnitude(self) -> float\` (or \`__abs__\`): returns \`math.sqrt(self._x**2 + self._y**2)\`.
   - \`__len__(self) -> int\`: always returns \`2\`.
   - \`__getitem__(self, index: int) -> float\`: \`v[0]\` returns \`self._x\`, \`v[1]\` returns \`self._y\`. Any other index raises \`IndexError("Vector2D index out of range")\`.`,
      starterCode: `import math

class Vector2D:
    """
    An immutable, memory-optimized 2D mathematical vector.
    """
    __slots__ = ('_x', '_y')

    def __init__(self, x: float, y: float):
        # TODO: Validate and initialize coordinates
        pass

    # TODO: Implement properties x, y, dunder methods __repr__, __eq__, __add__, __mul__, __rmul__, __len__, __getitem__, and magnitude
`,
      solutionCode: `import math

class Vector2D:
    __slots__ = ('_x', '_y')

    def __init__(self, x: float, y: float):
        try:
            self._x = float(x)
            self._y = float(y)
        except (TypeError, ValueError):
            raise TypeError("Vector coordinates must be numeric")

    @property
    def x(self) -> float:
        return self._x

    @property
    def y(self) -> float:
        return self._y

    def __repr__(self) -> str:
        return f"Vector2D({self._x}, {self._y})"

    def __eq__(self, other) -> bool:
        if not isinstance(other, Vector2D):
            return False
        return abs(self._x - other._x) < 1e-6 and abs(self._y - other._y) < 1e-6

    def __add__(self, other):
        if not isinstance(other, Vector2D):
            return NotImplemented
        return Vector2D(self._x + other._x, self._y + other._y)

    def __mul__(self, scalar):
        try:
            fscalar = float(scalar)
        except (TypeError, ValueError):
            return NotImplemented
        return Vector2D(self._x * fscalar, self._y * fscalar)

    def __rmul__(self, scalar):
        return self.__mul__(scalar)

    @property
    def magnitude(self) -> float:
        return math.sqrt(self._x ** 2 + self._y ** 2)

    def __abs__(self) -> float:
        return self.magnitude

    def __len__(self) -> int:
        return 2

    def __getitem__(self, index: int) -> float:
        if index == 0:
            return self._x
        elif index == 1:
            return self._y
        raise IndexError("Vector2D index out of range")
`,
      testCases: [
        {
          id: 't1',
          name: 'Vector Addition & Scaling',
          inputDescription: 'v1 = Vector2D(3, 4), v2 = Vector2D(1, 2)',
          expectedOutput: 'v1 + v2 == Vector2D(4, 6), 2 * v1 == Vector2D(6, 8)'
        },
        {
          id: 't2',
          name: 'Magnitude and Indexing',
          inputDescription: 'v = Vector2D(3, 4)',
          expectedOutput: 'magnitude=5.0, v[0]=3.0, v[1]=4.0, len(v)=2'
        },
        {
          id: 't3',
          name: 'Slots Memory Enforcement',
          inputDescription: 'hasattr(v, "__dict__")',
          expectedOutput: 'False (__slots__ active)'
        }
      ],
      benchmarkTargetMs: 0.05,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'Building Native Python Math Types',
        subtitle: 'The full dunder operator protocol',
        overview: 'NumPy arrays and PyTorch tensors behave like numbers because they implement dunders. You can give your domain objects identical mathematical elegance.',
        mentalModel5s: 'Map operators (+, *, len, []) to their respective dunder hooks (`__add__`, `__mul__`, `__len__`, `__getitem__`).',
        visualAnalogy: 'Fitting a custom key into a standard deadbolt: by matching the dunder profile, Python unlocks native syntax for your class.',
        pitfalls: [
          'Raising TypeError in `__add__` instead of returning `NotImplemented`.',
          'Attempting to assign attributes not declared in `__slots__`.'
        ],
        progressiveHints: [
          'Step 1: Declare `__slots__ = ("_x", "_y")`.',
          'Step 2: Use `@property` for `x` and `y` without setters.',
          'Step 3: In `__add__`, return `NotImplemented` if `not isinstance(other, Vector2D)`.',
          'Step 4: Implement `__getitem__` with bounds checking for 0 and 1.'
        ],
        mathFormulas: [
          {
            title: 'Euclidean Vector Magnitude',
            latex: '\\|\\mathbf{v}\\| = \\sqrt{x^2 + y^2}',
            explanation: 'Computes the geometric length of the 2D spatial vector from the origin.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual method calls
v3 = v1.add(v2)
mag = v1.get_length()`,
          naiveExplanation: 'Awkward Java-style syntax that prevents idiomatic expression composition.',
          idiomaticCode: `v3 = v1 + v2
mag = v1.magnitude`,
          idiomaticExplanation: 'Leverages Python operator overloading and property descriptors.',
          speedupText: 'Natural mathematical readability'
        },
        memoryLayout: {
          title: '__slots__ Structure',
          content: '__slots__ eliminates the per-instance __dict__ pointer, reducing instance size to contiguous C pointers.',
          diagramAscii: `Vector2D instance: [PyObject header (16B) | _x (8B float) | _y (8B float)] = 32B`,
          keyRule: 'Instances with __slots__ cannot have arbitrary new attributes assigned at runtime.'
        },
        keyTakeaways: [
          'Return NotImplemented in binary dunders to allow reflected operations.',
          'Use __slots__ for classes instantiated thousands of times in performance-critical loops.',
          'Use properties to ensure read-only immutability.'
        ]
      }
    },
    {
      id: 'python-p4-c2',
      dayId: 4,
      partId: 4,
      title: 'Polymorphic Account Hierarchy with Invariant Validation',
      slug: 'polymorphic-account-hierarchy-with-invariant-validation',
      difficulty: 'Intermediate',
      category: 'Inheritance & Encapsulation',
      summary: 'Design an object-oriented financial account system with inheritance, transaction auditing, overdraft guards, and interest accrual.',
      estimatedTime: '20 min',
      hints: [
        'Call `super().__init__(account_id, owner, initial_balance)` in subclasses.',
        'Use `_balance` as an internal float and expose a `@property def balance(self): return self._balance`.',
        'In `withdraw`, raise `ValueError("Insufficient funds")` or `ValueError("Overdraft limit exceeded")`.',
        'Append audit dicts `{"type": ..., "amount": ..., "balance": ...}` to `self._transactions`.'
      ],
      instructions: `Create a polymorphic bank account hierarchy:
1. **Base Class \`BankAccount\`**:
   - \`__init__(self, account_id: str, owner: str, initial_balance: float = 0.0)\`:
     - If \`initial_balance < 0\`, raise \`ValueError("Initial balance cannot be negative")\`.
     - Initializes \`account_id\`, \`owner\`, \`_balance\` (float), and \`_transactions\` (list of transaction dicts).
   - Properties:
     - \`balance -> float\`: read-only balance.
     - \`transaction_history -> list[dict]\`: copy of transaction logs.
   - Methods:
     - \`deposit(self, amount: float) -> float\`: If \`amount <= 0\`, raise \`ValueError("Deposit amount must be positive")\`. Adds amount to balance, logs \`{"type": "deposit", "amount": amount, "balance": self._balance}\`, and returns new balance.
     - \`withdraw(self, amount: float) -> float\`: Base implementation checks \`amount > 0\` and \`self._balance >= amount\`. If insufficient funds, raises \`ValueError("Insufficient funds")\`. Logs transaction and returns new balance.
2. **Derived Class \`CheckingAccount(BankAccount)\`**:
   - \`__init__(self, account_id: str, owner: str, initial_balance: float = 0.0, overdraft_limit: float = 500.0)\`:
     - Uses \`super().__init__(account_id, owner, initial_balance)\`.
     - Read-only property \`overdraft_limit\`.
     - Overrides \`withdraw(amount)\`: allows withdrawing up to \`self._balance + self.overdraft_limit\`. If exceeding overdraft limit, raises \`ValueError("Overdraft limit exceeded")\`.
3. **Derived Class \`SavingsAccount(BankAccount)\`**:
   - \`__init__(self, account_id: str, owner: str, initial_balance: float = 0.0, interest_rate: float = 0.05)\`:
     - Uses \`super().__init__(account_id, owner, initial_balance)\`.
     - Read-only property \`interest_rate\`.
     - Method \`accrue_interest(self) -> float\`: Computes interest as \`self._balance * self.interest_rate\` (rounded to 2 decimals), deposits it, and returns the interest amount accrued.`,
      starterCode: `class BankAccount:
    """Base class for financial accounts."""
    def __init__(self, account_id: str, owner: str, initial_balance: float = 0.0):
        # TODO: Initialize and validate account fields
        pass

    # TODO: Implement properties balance, transaction_history, and methods deposit, withdraw


class CheckingAccount(BankAccount):
    """Checking account with overdraft protection."""
    # TODO: Implement overdraft limit and overridden withdraw


class SavingsAccount(BankAccount):
    """Savings account with interest accrual."""
    # TODO: Implement interest rate and accrue_interest
`,
      solutionCode: `class BankAccount:
    def __init__(self, account_id: str, owner: str, initial_balance: float = 0.0):
        if initial_balance < 0:
            raise ValueError("Initial balance cannot be negative")
        self.account_id = str(account_id)
        self.owner = str(owner)
        self._balance = float(initial_balance)
        self._transactions = []
        if self._balance > 0:
            self._transactions.append({"type": "deposit", "amount": self._balance, "balance": self._balance})

    @property
    def balance(self) -> float:
        return self._balance

    @property
    def transaction_history(self) -> list:
        return [dict(t) for t in self._transactions]

    def deposit(self, amount: float) -> float:
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self._balance += float(amount)
        self._transactions.append({"type": "deposit", "amount": float(amount), "balance": self._balance})
        return self._balance

    def withdraw(self, amount: float) -> float:
        famount = float(amount)
        if famount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if famount > self._balance:
            raise ValueError("Insufficient funds")
        self._balance -= famount
        self._transactions.append({"type": "withdrawal", "amount": famount, "balance": self._balance})
        return self._balance


class CheckingAccount(BankAccount):
    def __init__(self, account_id: str, owner: str, initial_balance: float = 0.0, overdraft_limit: float = 500.0):
        super().__init__(account_id, owner, initial_balance)
        if overdraft_limit < 0:
            raise ValueError("Overdraft limit cannot be negative")
        self._overdraft_limit = float(overdraft_limit)

    @property
    def overdraft_limit(self) -> float:
        return self._overdraft_limit

    def withdraw(self, amount: float) -> float:
        famount = float(amount)
        if famount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if famount > (self._balance + self._overdraft_limit):
            raise ValueError("Overdraft limit exceeded")
        self._balance -= famount
        self._transactions.append({"type": "withdrawal", "amount": famount, "balance": self._balance})
        return self._balance


class SavingsAccount(BankAccount):
    def __init__(self, account_id: str, owner: str, initial_balance: float = 0.0, interest_rate: float = 0.05):
        super().__init__(account_id, owner, initial_balance)
        if interest_rate < 0:
            raise ValueError("Interest rate cannot be negative")
        self._interest_rate = float(interest_rate)

    @property
    def interest_rate(self) -> float:
        return self._interest_rate

    def accrue_interest(self) -> float:
        interest = round(self._balance * self._interest_rate, 2)
        if interest > 0:
            self.deposit(interest)
        return interest
`,
      testCases: [
        {
          id: 't1',
          name: 'Checking Account Overdraft Behavior',
          inputDescription: 'chk = CheckingAccount("C1", "Alice", initial_balance=100, overdraft_limit=200); chk.withdraw(250)',
          expectedOutput: 'balance=-150.0; subsequent withdraw(100) raises ValueError'
        },
        {
          id: 't2',
          name: 'Savings Account Interest Accrual',
          inputDescription: 'sav = SavingsAccount("S1", "Bob", initial_balance=1000, interest_rate=0.05); sav.accrue_interest()',
          expectedOutput: 'accrued=50.0, new_balance=1050.0'
        },
        {
          id: 't3',
          name: 'Negative Deposit Validation',
          inputDescription: 'account.deposit(-50)',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 0.05,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'Polymorphic Class Hierarchies & Super()',
        subtitle: 'Specializing behavior without duplicating state management',
        overview: 'Subclasses inherit parent state and methods while overriding specific domain invariants (like overdraft boundaries).',
        mentalModel5s: 'Initialize base state via `super().__init__()` -> Specialize methods with polymorphic overrides.',
        visualAnalogy: 'A family lineage: children inherit basic physical traits but cultivate specialized talents.',
        pitfalls: [
          'Mutating `_balance` directly without recording audit log entries.',
          'Forgetting to return a defensive copy of `transaction_history`.'
        ],
        progressiveHints: [
          'Step 1: In `BankAccount.__init__`, validate `initial_balance >= 0`.',
          'Step 2: In `CheckingAccount.withdraw`, compare against `self._balance + self._overdraft_limit`.',
          'Step 3: In `SavingsAccount.accrue_interest`, calculate interest and call `self.deposit(interest)`.'
        ],
        mathFormulas: [
          {
            title: 'Compound Interest Formula',
            latex: 'A = P(1 + r)',
            explanation: 'Single-period interest accrual added directly to the account balance.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Checking instance type with if/elif
if isinstance(acc, CheckingAccount):
    ...
elif isinstance(acc, SavingsAccount):
    ...`,
          naiveExplanation: 'Violates Open-Closed Principle (OCP); adding a new account requires modifying existing code.',
          idiomaticCode: `acc.withdraw(amount)  # Dynamic dispatch`,
          idiomaticExplanation: 'Python resolves the correct method implementation via the object class at runtime.',
          speedupText: 'Decoupled, extensible architecture'
        },
        memoryLayout: {
          title: 'Method Resolution Order (MRO)',
          content: 'CheckingAccount.__mro__ -> (CheckingAccount, BankAccount, object).',
          diagramAscii: `CheckingAccount.withdraw -> overrides BankAccount.withdraw`,
          keyRule: 'super() delegates upwards to the next class in the linearization chain.'
        },
        keyTakeaways: [
          'Always use super() to initialize parent class states.',
          'Encapsulate mutable state behind read-only properties.',
          'Rely on polymorphism to dispatch behavior without explicit type checks.'
        ]
      }
    }
  ]
};

export const PYTHON_PART04_TRACK = DAY04_TRACK;
export const testCases = DAY04_TRACK.challenges.flatMap((c) => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY04_TRACK;
