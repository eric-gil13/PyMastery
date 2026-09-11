"""
Part 4: Object-Oriented Programming & The Dunder Protocol
PyMastery Progressive Zero-to-Hero Pure Python Curriculum
"""

import math
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "python_04",
    "day_number": 4,
    "title": "Part 4: Object-Oriented Programming & The Dunder Protocol",
    "tagline": "Classes, dunder protocols, properties, inheritance, slots, and polymorphism.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Python Data Model special methods (dunders: `__repr__`, `__eq__`, `__add__`, `__len__`, `__getitem__`)",
        "Encapsulation and managed attributes with `@property` and `@setter`",
        "Memory optimization using `__slots__` to banish instance `__dict__` overhead",
        "Inheritance, cooperative `super()` dispatch, and C3 Method Resolution Order (MRO)",
        "Duck typing and polymorphic interface design"
    ]
}

CONCEPT_PRIMER = r"""# Part 4: Object-Oriented Programming & The Dunder Protocol

Python does not require interface declarations or operator overloading keywords. Everything is governed by the **Python Data Model**—a unified protocol of special methods called **dunders**.

---

## 1. Emulating Built-in Types

When you implement dunder methods, your objects gain native syntax:

- **Representation**: `__repr__` (unambiguous, machine-readable) and `__str__` (human-readable).
- **Comparison**: `__eq__`, `__lt__`, `__le__`, `__gt__`, `__ge__`.
- **Arithmetic**: `__add__`, `__sub__`, `__mul__`, `__truediv__`.
- **Containers**: `__len__`, `__getitem__`, `__setitem__`, `__contains__`.

```python
class Money:
    def __init__(self, amount: float):
        self.amount = float(amount)
        
    def __add__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return Money(self.amount + other.amount)
        
    def __repr__(self):
        return f"Money({self.amount:.2f})"
```

---

## 2. Memory Optimization with `__slots__`

By default, every Python instance stores attributes in a dynamic `__dict__` (~150+ bytes of memory).

If your system creates millions of instances (e.g. vertices, tokens, data points), declare `__slots__`:
```python
class FastNode:
    __slots__ = ("value", "next")
    def __init__(self, value):
        self.value = value
        self.next = None
```
This replaces `__dict__` with a compact C pointer array, slashing memory consumption by 70–80%!
"""

WALKTHROUGH = r"""# Walkthrough: Property Getters and Invariant Validation

```python
class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius  # Invokes the setter!
        
    @property
    def celsius(self) -> float:
        return self._celsius
        
    @celsius.setter
    def celsius(self, value: float):
        if value < -273.15:
            raise ValueError("Temperature cannot be below absolute zero!")
        self._celsius = float(value)

t = Temperature(25.0)
print(t.celsius)  # 25.0
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: 2D Vector Math Container Protocol
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "python-p4-c1",
    "title": "2D Vector Math Container Protocol",
    "difficulty": "Intermediate",
    "category": "Dunder Protocol & Math Types",
    "description": (
        "Implement an immutable, memory-efficient 2D Vector class supporting vector addition, "
        "scalar multiplication, container indexing, and magnitude."
    ),
    "instructions": (
        "Create a class `Vector2D` that:\n"
        "1. Declares slot-based attribute storage for internal coordinates to eliminate instance __dict__ allocation.\n"
        "2. In `__init__(x, y)`, coerces coordinates to float, raising `TypeError(\"Vector coordinates must be numeric\")` if invalid.\n"
        "3. Exposes read-only properties `x` and `y` backed by internal coordinates.\n"
        "4. Implements `__repr__` returning an unambiguous string formatted as `Vector2D(<x>, <y>)`.\n"
        "5. Implements `__eq__` comparing x and y coordinates against another Vector2D within a 1e-6 tolerance (returning False for non-Vector2D objects).\n"
        "6. Implements `__add__(other)` returning a new Vector2D representing vector addition, or returning `NotImplemented` for incompatible types.\n"
        "7. Implements `__mul__(scalar)` and `__rmul__(scalar)` for scalar scaling, returning `NotImplemented` for non-numeric scalars.\n"
        "8. Implements a `magnitude` property (and `__abs__`) returning the Euclidean distance from the origin.\n"
        "9. Implements container protocols `__len__` returning 2 and `__getitem__` supporting indices 0 and 1, raising `IndexError` otherwise."
    ),
    "starter_code": r'''import math

class Vector2D:
    """
    An immutable, memory-optimized 2D mathematical vector.
    """
    __slots__ = ('_x', '_y')

    def __init__(self, x: float, y: float):
        # TODO: Validate and initialize coordinates
        pass

    # TODO: Implement properties x, y, dunder methods __repr__, __eq__, __add__, __mul__, __rmul__, __len__, __getitem__, and magnitude
''',
    "reference_solution": r'''import math

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
''',
    "test_suite": r'''def run_tests(candidate_target):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Determine class
    Vector2D = candidate_target["Vector2D"] if isinstance(candidate_target, dict) else candidate_target

    # Test 1: Instantiation, properties, and slots
    v1 = Vector2D(3, 4)
    assert_test(v1.x == 3.0 and v1.y == 4.0, "Coordinates mismatch")
    assert_test(not hasattr(v1, "__dict__"), "__slots__ must be used to eliminate __dict__")
    assert_test(repr(v1) == "Vector2D(3.0, 4.0)", f"Repr mismatch: {repr(v1)}")

    # Test 2: Addition & Scaling
    v2 = Vector2D(1, 2)
    v3 = v1 + v2
    assert_test(v3.x == 4.0 and v3.y == 6.0, "Vector addition mismatch")
    v_scaled = v1 * 2
    assert_test(v_scaled.x == 6.0 and v_scaled.y == 8.0, "Scalar multiplication mismatch")
    v_rscaled = 3 * v2
    assert_test(v_rscaled.x == 3.0 and v_rscaled.y == 6.0, "Reflected scalar multiplication mismatch")

    # Test 3: Magnitude, length, and indexing
    assert_test(abs(v1.magnitude - 5.0) < 1e-6, "Magnitude mismatch")
    assert_test(len(v1) == 2, "Length must be 2")
    assert_test(v1[0] == 3.0 and v1[1] == 4.0, "Indexing mismatch")
    try:
        _ = v1[2]
        assert_test(False, "Should raise IndexError on index >= 2")
    except IndexError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Declare the slot sequence at class scope using internal coordinate attribute names to suppress __dict__ creation.",
        "Implement reflected scalar multiplication by delegating the reflected operator call to your primary multiplication method.",
        "Return the NotImplemented singleton from binary dunder methods when operand types are unsupported to trigger Python's reflection fallback."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Polymorphic Account Hierarchy with Invariant Validation
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "python-p4-c2",
    "title": "Polymorphic Account Hierarchy with Invariant Validation",
    "difficulty": "Intermediate",
    "category": "Inheritance & Encapsulation",
    "description": (
        "Design an object-oriented financial account system with inheritance, transaction auditing, "
        "overdraft guards, and interest accrual."
    ),
    "instructions": (
        "Create an account hierarchy:\n"
        "1. Base class `BankAccount(account_id, owner, initial_balance=0.0)`:\n"
        "   - Validates that initial_balance is non-negative (raising ValueError if negative).\n"
        "   - Read-only properties `balance` (float) and `transaction_history` (defensive copy of audit records).\n"
        "   - `deposit(amount)`: validates amount > 0, updates balance, logs an audit entry recording transaction type, amount, and resulting balance, and returns new balance.\n"
        "   - `withdraw(amount)`: validates amount > 0 and funds are sufficient (raising ValueError if insufficient), updates balance, logs audit record, and returns new balance.\n"
        "2. Derived class `CheckingAccount(BankAccount)`:\n"
        "   - `__init__(account_id, owner, initial_balance=0.0, overdraft_limit=500.0)`: delegates initialization to parent and validates overdraft limit.\n"
        "   - Read-only property `overdraft_limit`.\n"
        "   - Overrides `withdraw(amount)`: permits withdrawal up to the combined sum of current balance and overdraft limit, raising ValueError if exceeded.\n"
        "3. Derived class `SavingsAccount(BankAccount)`:\n"
        "   - `__init__(account_id, owner, initial_balance=0.0, interest_rate=0.05)`: delegates initialization to parent and validates interest rate.\n"
        "   - Read-only property `interest_rate`.\n"
        "   - Method `accrue_interest() -> float`: calculates simple interest on current balance rounded to 2 decimal places, credits positive interest via deposit, and returns accrued interest."
    ),
    "starter_code": r'''class BankAccount:
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
''',
    "reference_solution": r'''class BankAccount:
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
''',
    "test_suite": r'''def run_tests(candidate_target):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    scope = candidate_target if isinstance(candidate_target, dict) else {
        "BankAccount": getattr(candidate_target, "BankAccount", candidate_target),
        "CheckingAccount": getattr(candidate_target, "CheckingAccount", None),
        "SavingsAccount": getattr(candidate_target, "SavingsAccount", None)
    }

    CheckingAccount = scope["CheckingAccount"]
    SavingsAccount = scope["SavingsAccount"]

    # Test 1: Checking account overdraft
    chk = CheckingAccount("C100", "Alice", initial_balance=100.0, overdraft_limit=200.0)
    assert_test(chk.balance == 100.0, "Initial balance mismatch")
    chk.withdraw(250.0)
    assert_test(chk.balance == -150.0, f"Overdraft balance mismatch: {chk.balance}")
    try:
        chk.withdraw(100.0)
        assert_test(False, "Should raise ValueError for exceeding overdraft limit")
    except ValueError:
        report["tests_run"] += 1

    # Test 2: Savings account interest accrual
    sav = SavingsAccount("S200", "Bob", initial_balance=1000.0, interest_rate=0.05)
    accrued = sav.accrue_interest()
    assert_test(accrued == 50.0, f"Interest accrual calculation mismatch: {accrued}")
    assert_test(sav.balance == 1050.0, f"Balance after accrual mismatch: {sav.balance}")

    # Test 3: Transaction history audit
    hist = sav.transaction_history
    assert_test(len(hist) >= 2, "Transaction history missing audit logs")

    return report
''',
    "hints": [
        "Delegate base attribute initialization from derived classes using cooperative super() calls.",
        "In CheckingAccount.withdraw, check that the withdrawal amount does not exceed available funds augmented by the overdraft allowance.",
        "In SavingsAccount.accrue_interest, reuse the inherited deposit method to ensure balance updates and transaction logging remain synchronized."
    ]
}

CHALLENGES = [CHALLENGE_1, CHALLENGE_2]

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": CHALLENGES
}

def get_curriculum() -> Dict[str, Any]:
    return CURRICULUM_DATA
