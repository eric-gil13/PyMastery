"""
Part 1: Python Core Foundations & Memory Model
PyMastery Progressive Zero-to-Hero Pure Python Curriculum
"""

from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "python_01",
    "day_number": 1,
    "title": "Part 1: Python Core Foundations & Memory Model",
    "tagline": "Primitives, reference variables, truthiness rules, string formatting, and control flow.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Variables as pointers and the CPython PyObject memory model",
        "Reference assignment, mutability vs immutability, and the `is` vs `==` operator",
        "The Python truthiness protocol and short-circuit evaluation",
        "Modern f-strings and formatted string literal specifications",
        "Defensive type validation and exception handling"
    ]
}

CONCEPT_PRIMER = r"""# Part 1: Python Core Foundations & Memory Model

Welcome to Pure Python Zero-to-Hero! Python is renowned for its clean syntax, but under the hood lies a sophisticated and completely consistent dynamic memory model.

---

## 1. Everything is a Pointer: The PyObject

In languages like C or Go, declaring `int x = 42;` reserves a 4-byte cell on the CPU stack. In Python, variables are **never** physical boxes holding data. Instead, variables are lightweight **name tags** (pointers) that reference heap-allocated objects.

Every Python runtime instance is represented in C by a `PyObject` structure:

```
+------------------------------------+
|             PyObject               |
+------------------------------------+
| ob_refcnt : int64 (reference count)|
| ob_type   : struct _typeobject*    |
| payload   : value data bytes...    |
+------------------------------------+
```

When you execute:
```python
a = [1, 2, 3]
b = a
```
No list is copied! Both `a` and `b` hold pointers to the exact same heap address (`id(a) == id(b)`). Mutating the list through `b.append(4)` immediately reflects through `a`!

---

## 2. Object Identity (`is`) vs. Value Equality (`==`)

- **`==`**: Checks **value equality**. It calls the object's `__eq__` method.
- **`is`**: Checks **object identity**. It compares physical pointers (`id(a) == id(b)`).

```python
x = [1, 2]
y = [1, 2]

print(x == y)  # True: values match
print(x is y)  # False: distinct heap allocations!
```

> **Rule of Thumb**: Only use `is` when comparing against singletons like `None` (`if val is None:`), `True`, or `False`. Always use `==` for numbers and strings.

---

## 3. Truthiness & Short-Circuit Evaluation

In Python, every object has a boolean value governed by its `__bool__()` or `__len__()` dunder methods.

The following values evaluate to `False`:
- `None` and `False`
- Numeric zeros: `0`, `0.0`, `0j`
- Empty collections: `""`, `()`, `[]`, `{}`, `set()`

Everything else evaluates to `True`.

Python's `and` and `or` operators short-circuit and return the **actual operand**, not a strict boolean:
```python
# 'or' yields the first truthy value, or the last value if none are truthy
selected_name = user_input or "Default User"
```
"""

WALKTHROUGH = r"""# Walkthrough: String Sanitization & Safe Coercion

Let's build a robust data transformer using idiomatic Python:

```python
def sanitize_email(raw_email: str) -> str:
    # 1. Defensive type check
    if not isinstance(raw_email, str):
        raise TypeError("raw_email must be a string")
        
    # 2. Strip whitespace and lowercase
    cleaned = raw_email.strip().lower()
    
    # 3. Simple format check
    if "@" not in cleaned or "." not in cleaned:
        raise ValueError(f"Invalid email address: {raw_email}")
        
    return cleaned

# Test it
print(sanitize_email("  Guido@Python.ORG  "))
# Output: 'guido@python.org'
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Data Sanitizer & String Formatter
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "python-p1-c1",
    "title": "Data Sanitizer & String Formatter",
    "difficulty": "Beginner",
    "category": "String & Type Processing",
    "description": (
        "Clean raw user profile records, sanitize email addresses, round numerical scores, "
        "and format a standardized biographical summary string."
    ),
    "instructions": (
        "Write a function `clean_and_format_record(raw_record: dict) -> dict` that processes and validates user profile data:\n\n"
        "1. Input Validation:\n"
        "   - Ensure `raw_record` is a non-empty dictionary; raise a `ValueError` if it is not a dictionary or contains no items.\n"
        "   - Confirm that all required keys ('name', 'email', 'role', and 'score') are present. If any required key is missing, raise a `KeyError` identifying the missing key.\n"
        "2. Sanitization Rules:\n"
        "   - name: Remove leading and trailing whitespace, and normalize to Title Case (e.g., '  jane DOE  ' becomes 'Jane Doe').\n"
        "   - email: Trim leading and trailing whitespace, and convert all characters to lowercase.\n"
        "   - role: Trim leading and trailing whitespace, and convert all characters to UPPERCASE.\n"
        "   - score: Parse as a floating-point number rounded to 2 decimal places. If the value cannot be parsed as a float or is strictly negative, raise a `ValueError`.\n"
        "3. Generated Summary:\n"
        "   - Add a key 'bio' formatted as a summary string containing the person's name, role in parentheses, and the score formatted to exactly two decimal places (e.g., 'Alice (ADMIN) - Score: 95.50' or 'Alan Turing (SCIENTIST) - Score: 98.57').\n"
        "4. Return Value:\n"
        "   - Return a new dictionary containing the cleaned 'name', 'email', 'role', 'score', and the newly generated 'bio'."
    ),
    "starter_code": r'''def clean_and_format_record(raw_record: dict) -> dict:
    """
    Sanitize and format a raw user record.
    
    Args:
        raw_record: Dictionary containing 'name', 'email', 'role', 'score'.
        
    Returns:
        Cleaned dictionary with formatted 'bio' string.
    """
    # TODO: Validate input, clean values, build bio string, and return new dict
    pass
''',
    "reference_solution": r'''def clean_and_format_record(raw_record: dict) -> dict:
    if not isinstance(raw_record, dict) or not raw_record:
        raise ValueError("raw_record must be a non-empty dict")
        
    required_keys = ("name", "email", "role", "score")
    for k in required_keys:
        if k not in raw_record:
            raise KeyError(f"Missing required key: {k}")
            
    name = str(raw_record["name"]).strip().title()
    email = str(raw_record["email"]).strip().lower()
    role = str(raw_record["role"]).strip().upper()
    
    try:
        score = float(raw_record["score"])
        if score < 0:
            raise ValueError("Invalid score")
        score = round(score, 2)
    except (TypeError, ValueError):
        raise ValueError("Invalid score")
        
    bio = f"{name} ({role}) - Score: {score:.2f}"
    
    return {
        "name": name,
        "email": email,
        "role": role,
        "score": score,
        "bio": bio,
    }
''',
    "test_suite": r'''def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)
 
    # Test 1: Standard dirty input
    dirty = {
        "name": "  alAN turing  ",
        "email": " ALAN@EXAMPLE.COM ",
        "role": "scientist ",
        "score": "98.567"
    }
    res = candidate_func(dirty)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(res["name"] == "Alan Turing", f"Name mismatch: {res['name']}")
    assert_test(res["email"] == "alan@example.com", f"Email mismatch: {res['email']}")
    assert_test(res["role"] == "SCIENTIST", f"Role mismatch: {res['role']}")
    assert_test(res["score"] == 98.57, f"Score mismatch: {res['score']}")
    assert_test(res["bio"] == "Alan Turing (SCIENTIST) - Score: 98.57", f"Bio mismatch: {res['bio']}")

    # Test 2: Integer score formatting in bio
    res2 = candidate_func({"name": "ada lovelace", "email": "ada@math.org", "role": "engineer", "score": 100})
    assert_test(res2["bio"] == "Ada Lovelace (ENGINEER) - Score: 100.00", f"Integer score bio formatting mismatch: {res2['bio']}")

    # Test 3: Missing keys
    try:
        candidate_func({"name": "Grace Hopper"})
        assert_test(False, "Should raise KeyError for missing keys")
    except KeyError:
        report["tests_run"] += 1

    # Test 4: Invalid score
    try:
        candidate_func({"name": "Test", "email": "t@t.com", "role": "admin", "score": "bad_score"})
        assert_test(False, "Should raise ValueError for invalid score")
    except ValueError:
        report["tests_run"] += 1

    # Test 5: Empty input
    try:
        candidate_func({})
        assert_test(False, "Should raise ValueError for empty dict")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Validate container types and truthiness upfront to ensure the record is a non-empty dictionary before accessing keys.",
        "Iterate through the required field names to check dictionary membership, raising an appropriate key error if any are missing.",
        "Apply string trimming and case normalization methods to clean whitespace and standardize casing across text fields.",
        "Safely convert numerical values inside an error-handling block to catch invalid types or non-numeric strings, and verify non-negativity.",
        "Assemble the summary bio using formatted string interpolation with a precision specifier to guarantee two decimal places on the score."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Safe Numeric Converter & Metric Analyzer
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "python-p1-c2",
    "title": "Safe Numeric Converter & Metric Analyzer",
    "difficulty": "Beginner",
    "category": "Control Flow & Truthiness",
    "description": (
        "Convert arbitrary raw metric inputs, categorize their magnitude within bounding ranges, "
        "and inspect mathematical parity."
    ),
    "instructions": (
        "Write a function `categorize_metric(val: any, low: float = 0.0, high: float = 100.0) -> dict` that:\n\n"
        "1. Validation & Coercion:\n"
        "   - If `val` is None or a boolean (note: in Python, `bool` is a subclass of `int`), raise a `ValueError`.\n"
        "   - Attempt to coerce `val` to a float. If coercion fails, raise a `ValueError`.\n"
        "   - Coerce `low` and `high` to float. If `low >= high`, raise a `ValueError`.\n"
        "2. Range Categorization:\n"
        "   - If `val < low`: category is 'below'.\n"
        "   - If `low <= val <= high`: category is 'in_range'.\n"
        "   - If `val > high`: category is 'above'.\n"
        "3. Parity Check:\n"
        "   - If `val` represents an exact integer (e.g. 42.0 or 42):\n"
        "     - Check if the integer is even ('even') or odd ('odd').\n"
        "   - If `val` has a non-zero fractional part (e.g. 42.5), parity is 'non-integer'.\n"
        "4. Normalized Ratio:\n"
        "   - Compute ratio = (val - low) / (high - low) rounded to 4 decimal places.\n"
        "5. Return Value:\n"
        "   - Return a dictionary with keys: 'value' (float), 'category' (str), 'parity' (str), 'ratio' (float)."
    ),
    "starter_code": r'''def categorize_metric(val: any, low: float = 0.0, high: float = 100.0) -> dict:
    """
    Safely convert and categorize a numeric metric against bounding thresholds.
    
    Args:
        val: Value to analyze (int, float, or numeric string).
        low: Lower bound (default 0.0).
        high: Upper bound (default 100.0).
        
    Returns:
        Dictionary with keys: 'value', 'category', 'parity', 'ratio'.
    """
    # TODO: Validate val and bounds, determine category and parity, compute ratio
    pass
''',
    "reference_solution": r'''def categorize_metric(val: any, low: float = 0.0, high: float = 100.0) -> dict:
    if val is None or isinstance(val, bool):
        raise ValueError("val must be a valid numeric value")
        
    try:
        fval = float(val)
    except (TypeError, ValueError):
        raise ValueError("val must be a valid numeric value")
        
    flow = float(low)
    fhigh = float(high)
    if flow >= fhigh:
        raise ValueError("low must be strictly less than high")
        
    if fval < flow:
        category = "below"
    elif fval > fhigh:
        category = "above"
    else:
        category = "in_range"
        
    if fval.is_integer():
        int_val = int(fval)
        parity = "even" if int_val % 2 == 0 else "odd"
    else:
        parity = "non-integer"
        
    ratio = round((fval - flow) / (fhigh - flow), 4)
    
    return {
        "value": fval,
        "category": category,
        "parity": parity,
        "ratio": ratio,
    }
''',
    "test_suite": r'''def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: In range even integer float
    r1 = candidate_func(50.0, 0, 100)
    assert_test(r1["value"] == 50.0, "Value mismatch")
    assert_test(r1["category"] == "in_range", f"Category mismatch: {r1['category']}")
    assert_test(r1["parity"] == "even", f"Parity mismatch: {r1['parity']}")
    assert_test(r1["ratio"] == 0.5, f"Ratio mismatch: {r1['ratio']}")

    # Test 2: Above range non-integer string
    r2 = candidate_func("105.75", 0, 100)
    assert_test(r2["category"] == "above", f"Category mismatch: {r2['category']}")
    assert_test(r2["parity"] == "non-integer", f"Parity mismatch: {r2['parity']}")
    assert_test(r2["ratio"] == 1.0575, f"Ratio mismatch: {r2['ratio']}")

    # Test 3: Below range odd integer
    r3 = candidate_func(-5, 0, 100)
    assert_test(r3["category"] == "below", f"Category mismatch: {r3['category']}")
    assert_test(r3["parity"] == "odd", f"Parity mismatch: {r3['parity']}")

    # Test 4: Rejection of booleans (since bool subclasses int in Python)
    try:
        candidate_func(True, 0, 100)
        assert_test(False, "Should reject boolean True")
    except ValueError:
        report["tests_run"] += 1

    # Test 5: Rejection of low >= high
    try:
        candidate_func(50, 100, 50)
        assert_test(False, "Should reject low >= high")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Remember that booleans inherit from integers in Python (`isinstance(True, int)` is True). Test for boolean types explicitly before numeric coercion.",
        "Float instances provide a built-in method to test whether they represent a whole number without any fractional part.",
        "Normalize the value relative to the range bounds and apply rounding to 4 decimal places."
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
