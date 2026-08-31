"""Unit & Integration Tests for PyMastery Runner, Sync, AI Tutor, and API Endpoints."""

import asyncio
import os
import sys
import tempfile
import unittest
from fastapi.testclient import TestClient

from server.ai_tutor import ai_tutor
from server.curriculum import curriculum
from server.main import app
from server.models import (
    AIReviewRequest,
    AITutorChatRequest,
    BenchmarkHighscore,
    ChallengeProgress,
    CodeDraft,
    RunRequest,
    SyncExportPayload,
    TestCase,
    UserProfile,
)
from server.runner import runner
from server.sync import DatabaseManager


class TestCodeRunner(unittest.IsolatedAsyncioTestCase):
    """Test suite for isolated code execution runner, watchdog, hooks, and evaluators."""

    async def test_01_basic_execution(self):
        """Verify standard code execution with stdout."""
        req = RunRequest(code="print('Hello PyMastery!')\nx = 10 + 20\nprint(f'Result: {x}')")
        resp = await runner.execute(req)
        self.assertTrue(resp.success)
        self.assertEqual(resp.status, "completed")
        self.assertIn("Hello PyMastery!", resp.stdout)
        self.assertIn("Result: 30", resp.stdout)
        self.assertGreater(resp.duration_ms, 0)

    async def test_02_syntax_error_handling(self):
        """Verify clean error capture for syntax errors without server crashes."""
        req = RunRequest(code="def broken_func(:\n    pass")
        resp = await runner.execute(req)
        self.assertFalse(resp.success)
        self.assertEqual(resp.status, "syntax_error")
        self.assertIn("SyntaxError", resp.error)

    async def test_03_runtime_error_handling(self):
        """Verify traceback and error capture for runtime exceptions."""
        req = RunRequest(code="def divide(a, b):\n    return a / b\nprint(divide(10, 0))")
        resp = await runner.execute(req)
        self.assertFalse(resp.success)
        self.assertEqual(resp.status, "runtime_error")
        self.assertIn("ZeroDivisionError", resp.error)

    async def test_04_watchdog_timeout(self):
        """Verify watchdog terminates infinite loops within timeout limit."""
        req = RunRequest(code="while True:\n    pass", timeout=1.0)
        resp = await runner.execute(req)
        self.assertFalse(resp.success)
        self.assertEqual(resp.status, "timeout")
        self.assertIn("timed out", resp.error.lower())
        self.assertLessEqual(resp.duration_ms, 2500)

    async def test_05_matplotlib_plot_capture(self):
        """Verify Matplotlib figure capture as Base64 PNG."""
        code = """import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)
plt.plot(x, y, label='Sine')
plt.title('Sine Wave Test')
plt.show()
"""
        req = RunRequest(code=code)
        resp = await runner.execute(req)
        self.assertTrue(resp.success)
        self.assertGreaterEqual(len(resp.plots), 1)
        self.assertEqual(resp.plots[0].format, "png")
        self.assertTrue(len(resp.plots[0].data) > 100)

    async def test_06_dataframe_and_numpy_serialization(self):
        """Verify Pandas DataFrame and NumPy array data serialization."""
        code = """import pandas as pd
import numpy as np

arr = np.array([1, 2, 3, 4, 5], dtype=np.float32)
df = pd.DataFrame({
    'age': [25, 30, 35, 40],
    'score': [88.5, 92.0, 79.5, 95.0],
    'name': ['Alice', 'Bob', 'Charlie', 'Dana']
})
"""
        req = RunRequest(code=code)
        resp = await runner.execute(req)
        self.assertTrue(resp.success)
        self.assertGreaterEqual(len(resp.data_objects), 2)

        names = {d.name: d for d in resp.data_objects}
        self.assertIn("df", names)
        self.assertEqual(names["df"].object_type, "dataframe")
        self.assertEqual(names["df"].shape, [4, 3])
        self.assertEqual(names["df"].columns, ["age", "score", "name"])

        self.assertIn("arr", names)
        self.assertEqual(names["arr"].object_type, "numpy_array")
        self.assertEqual(names["arr"].shape, [5])

    async def test_07_test_assertion_evaluator(self):
        """Verify structured test assertions execution, pass/fail status, and timing."""
        code = """def add_numbers(a, b):
    return a + b
"""
        test_cases = [
            TestCase(name="Positive Numbers", call="add_numbers(3, 7)", expected=10),
            TestCase(name="Negative Numbers", call="add_numbers(-2, -5)", expected=-7),
            TestCase(name="Intentional Failure", call="add_numbers(2, 2)", expected=5),
        ]
        req = RunRequest(code=code, mode="test", test_cases=test_cases)
        resp = await runner.execute(req)

        self.assertFalse(resp.success)
        self.assertIsNotNone(resp.test_results)
        self.assertEqual(len(resp.test_results), 3)
        self.assertEqual(resp.test_results[0].status, "passed")
        self.assertEqual(resp.test_results[1].status, "passed")
        self.assertEqual(resp.test_results[2].status, "failed")
        self.assertEqual(resp.tests_summary["passed"], 2)
        self.assertEqual(resp.tests_summary["failed"], 1)

    async def test_08_benchmark_evaluator(self):
        """Verify benchmark execution measuring mean runtime and ops/sec."""
        req = RunRequest(
            code="def compute(): return sum(i * 2 for i in range(100))",
            mode="benchmark",
            benchmark_stmt="compute()",
            benchmark_iterations=50
        )
        resp = await runner.execute(req)
        self.assertTrue(resp.success)
        self.assertIsNotNone(resp.benchmark)
        self.assertEqual(resp.benchmark.iterations, 50)
        self.assertGreater(resp.benchmark.ops_per_sec, 0)
        self.assertGreater(resp.benchmark.mean_ms, 0)


class TestSyncAndPersistence(unittest.TestCase):
    """Test suite for SQLite persistence, profiles, progress, drafts, and multi-device JSON sync."""

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_db_path = os.path.join(self.temp_dir.name, "test_data.db")
        self.db = DatabaseManager(db_path=self.temp_db_path)

    def tearDown(self):
        try:
            self.temp_dir.cleanup()
        except Exception:
            pass

    def test_01_profile_and_xp(self):
        prof = self.db.get_profile("test_user")
        self.assertEqual(prof.xp, 0)
        self.assertEqual(prof.level, 1)

        prof.xp = 450
        prof.username = "Guido"
        updated = self.db.update_profile(prof)
        self.assertEqual(updated.username, "Guido")
        self.assertEqual(updated.level, 3)

    def test_02_challenge_progress_and_drafts(self):
        draft = CodeDraft(challenge_id="lru-cache", code="class LRU: pass")
        self.db.save_draft(draft)
        loaded_draft = self.db.get_draft("lru-cache")
        self.assertIsNotNone(loaded_draft)
        self.assertEqual(loaded_draft.code, "class LRU: pass")

        prog = ChallengeProgress(
            challenge_id="lru-cache",
            track_id="track-core",
            status="completed",
            passed_tests_count=4,
            total_tests_count=4,
            best_runtime_ms=1.25,
            best_memory_kb=512.0
        )
        self.db.save_progress(prog)
        loaded_prog = self.db.get_progress("lru-cache")
        self.assertIsNotNone(loaded_prog)
        self.assertEqual(loaded_prog.status, "completed")
        self.assertEqual(loaded_prog.passed_tests_count, 4)

    def test_03_export_and_import_sync(self):
        self.db.save_draft(CodeDraft(challenge_id="ch-1", code="x = 1"))
        self.db.save_progress(ChallengeProgress(challenge_id="ch-1", track_id="t1", status="completed", passed_tests_count=2, total_tests_count=2))
        self.db.record_benchmark(BenchmarkHighscore(challenge_id="ch-1", runtime_ms=0.5, memory_kb=100.0, ops_per_sec=2000.0))

        export_payload = self.db.export_all("default_user")
        self.assertEqual(len(export_payload.progress), 1)
        self.assertEqual(len(export_payload.drafts), 1)
        self.assertEqual(len(export_payload.benchmarks), 1)

        new_db_path = os.path.join(self.temp_dir.name, "test_import.db")
        new_db = DatabaseManager(db_path=new_db_path)
        import_res = new_db.import_all(export_payload, merge=True)
        self.assertTrue(import_res.success)
        self.assertEqual(import_res.imported_progress, 1)
        self.assertEqual(import_res.imported_drafts, 1)


class TestAITutor(unittest.IsolatedAsyncioTestCase):
    """Test suite for AST code reviewer and Socratic tutor."""

    async def test_01_ast_anti_pattern_detection(self):
        bad_code = """def compute_sum(items):
    total = 0
    for i in range(len(items)):
        try:
            total += items[i]
        except:
            pass
    return total
"""
        feedback = await ai_tutor.review_code(AIReviewRequest(code=bad_code, challenge_title="Sum List"))
        self.assertIsNotNone(feedback)
        self.assertLessEqual(feedback.score, 8)
        self.assertTrue(any("range(len" in item or "enumerate" in item for item in feedback.improvements + feedback.idiomatic_python))
        self.assertIsNotNone(feedback.security_or_pitfalls)

    async def test_02_ast_clean_code_analysis(self):
        clean_code = """from typing import List

def square_numbers(nums: List[int]) -> List[int]:
    '''Computes squares of numbers using list comprehension.'''
    return [x ** 2 for x in nums]
"""
        feedback = await ai_tutor.review_code(AIReviewRequest(code=clean_code, challenge_title="Square Numbers"))
        self.assertGreaterEqual(feedback.score, 8)
        self.assertEqual(feedback.complexity["time"], "O(N)")

    async def test_03_tutor_socratic_response(self):
        req = AITutorChatRequest(
            messages=[{"role": "user", "content": "Why is my time complexity too high?"}],
            challenge_title="Pairwise Distance",
            code="for i in range(N):\n    for j in range(N): pass"
        )
        resp = await ai_tutor.tutor_chat(req)
        self.assertIsNotNone(resp.reply)
        self.assertGreater(len(resp.hints), 0)


class TestFastAPIRoutes(unittest.TestCase):
    """Test suite for FastAPI endpoints."""

    def setUp(self):
        self.client = TestClient(app)

    def test_01_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")

    def test_02_curriculum_endpoints(self):
        res = self.client.get("/api/curriculum")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total_challenges"], 5)
        self.assertGreater(data["total_xp"], 500)

        ch_res = self.client.get("/api/challenge/day01_ch01_pairwise_distance")
        self.assertEqual(ch_res.status_code, 200)
        ch = ch_res.json()
        self.assertEqual(ch["id"], "day01_ch01_pairwise_distance")

    def test_03_run_endpoint(self):
        res = self.client.post("/api/run", json={"code": "print('API Test Success!')"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("API Test Success!", data["stdout"])

    def test_04_sync_endpoints(self):
        prof_res = self.client.get("/api/sync/profile")
        self.assertEqual(prof_res.status_code, 200)

        export_res = self.client.get("/api/sync/export")
        self.assertEqual(export_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
