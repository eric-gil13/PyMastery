"""PyMastery Isolated Code Execution Runner with Watchdog, Matplotlib, Data Serialization, and Benchmark Evaluator."""

from __future__ import annotations
import asyncio
import base64
import io
import json
import math
import os
import pathlib
import sys
import tempfile
import time
import subprocess
import traceback
from typing import Any, Dict, List, Optional, Tuple


import psutil
from server.models import (
    BenchmarkResult,
    DataObjectSummary,
    PlotArtifact,
    RunRequest,
    RunResponse,
    TestCase,
    TestCaseResult,
)


HARNESS_CODE = r'''# PyMastery Subprocess Execution Harness
import sys
import os
import io
import json
import math
import time
import traceback
import tracemalloc
import base64
import ast

_MATPLOTLIB_AVAILABLE = False
_plots = []

try:
    if "matplotlib" in sys.modules or os.environ.get("MPLBACKEND"):
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        _MATPLOTLIB_AVAILABLE = True

        def _custom_show(*args, **kwargs):
            global _plots
            for fignum in plt.get_fignums():
                fig = plt.figure(fignum)
                buf_png = io.BytesIO()
                fig.savefig(buf_png, format="png", bbox_inches="tight", dpi=100)
                buf_png.seek(0)
                png_b64 = base64.b64encode(buf_png.read()).decode("utf-8")

                buf_svg = io.StringIO()
                fig.savefig(buf_svg, format="svg", bbox_inches="tight")
                buf_svg.seek(0)
                svg_str = buf_svg.read()

                _plots.append({
                    "index": len(_plots),
                    "format": "png",
                    "data": png_b64,
                    "mime_type": "image/png",
                    "dpi": 100,
                    "title": fig._suptitle.get_text() if hasattr(fig, "_suptitle") and fig._suptitle else None
                })
                plt.close(fig)

        plt.show = _custom_show
except Exception:
    pass


def _capture_remaining_plots():
    if "matplotlib.pyplot" in sys.modules:
        try:
            plt = sys.modules["matplotlib.pyplot"]
            for fignum in plt.get_fignums():
                fig = plt.figure(fignum)
                buf_png = io.BytesIO()
                fig.savefig(buf_png, format="png", bbox_inches="tight", dpi=100)
                buf_png.seek(0)
                png_b64 = base64.b64encode(buf_png.read()).decode("utf-8")

                _plots.append({
                    "index": len(_plots),
                    "format": "png",
                    "data": png_b64,
                    "mime_type": "image/png",
                    "dpi": 100,
                    "title": fig._suptitle.get_text() if hasattr(fig, "_suptitle") and fig._suptitle else None
                })
                plt.close(fig)
        except Exception:
            pass


def _serialize_data_objects(namespace, excluded_keys):
    serialized = []
    for k, v in list(namespace.items()):
        if k.startswith("_") or k in excluded_keys:
            continue
        obj_type = type(v).__name__
        module_name = getattr(type(v), "__module__", "")

        # Pandas DataFrame
        if "pandas" in module_name and obj_type == "DataFrame" and "pandas" in sys.modules:
            try:
                pd = sys.modules["pandas"]
                records = []
                preview_df = v.head(20)
                for record in preview_df.to_dict(orient="records"):
                    safe_rec = {}
                    for col_k, col_v in record.items():
                        if pd.isna(col_v):
                            safe_rec[str(col_k)] = None
                        elif isinstance(col_v, (int, float, str, bool)):
                            if isinstance(col_v, float) and (math.isnan(col_v) or math.isinf(col_v)):
                                safe_rec[str(col_k)] = str(col_v)
                            else:
                                safe_rec[str(col_k)] = col_v
                        else:
                            safe_rec[str(col_k)] = str(col_v)
                    records.append(safe_rec)

                summary = {}
                num_df = v.select_dtypes(include="number")
                if not num_df.empty:
                    for stat_name, stat_vals in num_df.describe().to_dict().items():
                        summary[stat_name] = {str(sk): float(sv) if not math.isnan(sv) else None for sk, sv in stat_vals.items()}

                serialized.append({
                    "name": k,
                    "object_type": "dataframe",
                    "shape": list(v.shape),
                    "columns": [str(c) for c in v.columns],
                    "dtypes": {str(col): str(dtype) for col, dtype in v.dtypes.items()},
                    "preview": records,
                    "summary_stats": summary
                })
            except Exception:
                pass

        # Pandas Series
        elif "pandas" in module_name and obj_type == "Series" and "pandas" in sys.modules:
            try:
                pd = sys.modules["pandas"]
                items = []
                for idx, val in v.head(20).items():
                    items.append({"index": str(idx), "value": None if pd.isna(val) else val if isinstance(val, (int, float, str, bool)) else str(val)})
                serialized.append({
                    "name": k,
                    "object_type": "series",
                    "shape": list(v.shape),
                    "dtype": str(v.dtype),
                    "preview": items
                })
            except Exception:
                pass

        # NumPy Array
        elif "numpy" in module_name and obj_type == "ndarray" and "numpy" in sys.modules:
            try:
                np = sys.modules["numpy"]
                flat_preview = v.flatten()[:50].tolist()
                stat_min = float(np.min(v)) if np.issubdtype(v.dtype, np.number) and v.size > 0 else None
                stat_max = float(np.max(v)) if np.issubdtype(v.dtype, np.number) and v.size > 0 else None
                stat_mean = float(np.mean(v)) if np.issubdtype(v.dtype, np.number) and v.size > 0 else None

                serialized.append({
                    "name": k,
                    "object_type": "numpy_array",
                    "shape": list(v.shape),
                    "dtype": str(v.dtype),
                    "preview": flat_preview,
                    "summary_stats": {"min": stat_min, "max": stat_max, "mean": stat_mean}
                })
            except Exception:
                pass

        # PyTorch Tensor
        elif "torch" in module_name and "Tensor" in obj_type and "torch" in sys.modules:
            try:
                preview = v.detach().cpu().flatten()[:50].tolist()
                serialized.append({
                    "name": k,
                    "object_type": "torch_tensor",
                    "shape": list(v.shape),
                    "dtype": str(v.dtype),
                    "preview": preview,
                    "summary_stats": {
                        "device": str(v.device),
                        "requires_grad": v.requires_grad,
                        "numel": v.numel()
                    }
                })
            except Exception:
                pass

    return serialized


def _values_equal(actual, expected, tolerance=1e-5):
    if actual == expected:
        return True
    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        if isinstance(actual, float) or isinstance(expected, float):
            return math.isclose(float(actual), float(expected), rel_tol=tolerance, abs_tol=tolerance)
        return actual == expected

    if "numpy" in sys.modules:
        np = sys.modules["numpy"]
        if isinstance(actual, np.ndarray) or isinstance(expected, np.ndarray):
            arr_a = np.asarray(actual)
            arr_b = np.asarray(expected)
            if np.issubdtype(arr_a.dtype, np.number) and np.issubdtype(arr_b.dtype, np.number):
                return bool(np.allclose(arr_a, arr_b, atol=tolerance))
            return bool(np.array_equal(arr_a, arr_b))

    if "torch" in sys.modules:
        torch = sys.modules["torch"]
        if isinstance(actual, torch.Tensor) or isinstance(expected, torch.Tensor):
            t_a = actual if isinstance(actual, torch.Tensor) else torch.tensor(actual)
            t_b = expected if isinstance(expected, torch.Tensor) else torch.tensor(expected)
            return bool(torch.allclose(t_a.float(), t_b.float(), atol=tolerance))

    if "pandas" in sys.modules:
        pd = sys.modules["pandas"]
        if isinstance(actual, pd.DataFrame) and isinstance(expected, pd.DataFrame):
            return bool(actual.equals(expected))
        if isinstance(actual, pd.Series) and isinstance(expected, pd.Series):
            return bool(actual.equals(expected))

    if isinstance(actual, list) and isinstance(expected, list):
        if len(actual) != len(expected):
            return False
        return all(_values_equal(a, e, tolerance) for a, e in zip(actual, expected))

    if isinstance(actual, dict) and isinstance(expected, dict):
        if set(actual.keys()) != set(expected.keys()):
            return False
        return all(_values_equal(actual[k], expected[k], tolerance) for k in actual)

    return False


def _safe_repr(obj, max_len=300):
    try:
        r = repr(obj)
        if len(r) > max_len:
            return r[:max_len] + "..."
        return r
    except Exception:
        return f"<{type(obj).__name__} object>"


def main():
    in_file = os.environ.get("PYMASTERY_IN_FILE")
    out_file = os.environ.get("PYMASTERY_OUT_FILE")

    if not in_file or not out_file:
        sys.stderr.write("Missing input or output files in harness environment.\n")
        sys.exit(1)

    with open(in_file, "r", encoding="utf-8") as f:
        payload = json.load(f)

    code = payload.get("code", "")
    mode = payload.get("mode", "run")
    test_cases = payload.get("test_cases", [])
    benchmark_iterations = payload.get("benchmark_iterations", 100)
    benchmark_setup = payload.get("benchmark_setup", "")
    benchmark_stmt = payload.get("benchmark_stmt", "")

    exec_globals = {
        "__name__": "__main__",
        "__doc__": None,
        "__package__": None,
    }
    excluded_keys = set(exec_globals.keys()) | {"_plots", "_MATPLOTLIB_AVAILABLE"}

    result = {
        "success": True,
        "status": "completed",
        "error": None,
        "traceback": None,
        "test_results": None,
        "tests_summary": None,
        "benchmark": None,
        "plots": [],
        "data_objects": []
    }

    try:
        parsed = ast.parse(code, filename="<user_code>")
        if parsed.body:
            last_stmt = parsed.body[-1]
            if isinstance(last_stmt, ast.Expr):
                if len(parsed.body) > 1:
                    preceding_module = ast.Module(body=parsed.body[:-1], type_ignores=[])
                    compiled_pre = compile(preceding_module, "<user_code>", "exec")
                    exec(compiled_pre, exec_globals)
                
                expr_ast = ast.Expression(body=last_stmt.value)
                compiled_expr = compile(expr_ast, "<user_code>", "eval")
                expr_val = eval(compiled_expr, exec_globals)
                
                if expr_val is not None:
                    try:
                        print(repr(expr_val))
                    except Exception:
                        print(str(expr_val))
            else:
                compiled = compile(parsed, "<user_code>", "exec")
                exec(compiled, exec_globals)
    except SyntaxError as syn_err:
        result["success"] = False
        result["status"] = "syntax_error"
        result["error"] = f"SyntaxError: {syn_err.msg} (line {syn_err.lineno})"
        result["traceback"] = traceback.format_exc()
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(result, f)
            f.flush()
        return
    except Exception as ex:
        result["success"] = False
        result["status"] = "runtime_error"
        result["error"] = f"{type(ex).__name__}: {str(ex)}"
        result["traceback"] = traceback.format_exc()
        _capture_remaining_plots()
        result["plots"] = _plots
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(result, f)
            f.flush()
        return

    _capture_remaining_plots()
    result["plots"] = _plots
    result["data_objects"] = _serialize_data_objects(exec_globals, excluded_keys)

    # Mode: TEST Assertion Evaluation
    if mode == "test" and test_cases:
        test_results = []
        passed_count = 0
        failed_count = 0
        error_count = 0

        for idx, tc in enumerate(test_cases):
            tc_name = tc.get("name", f"Test Case #{idx + 1}")
            tc_id = tc.get("id", str(idx + 1))
            call_expr = tc.get("call")
            expected_val = tc.get("expected")
            test_code = tc.get("test_code")
            hidden = tc.get("hidden", False)
            tolerance = tc.get("tolerance") or 1e-5

            old_stdout = sys.stdout
            test_stdout_buf = io.StringIO()
            sys.stdout = test_stdout_buf

            t_start = time.perf_counter()
            tracemalloc.start()
            mem_start, _ = tracemalloc.get_traced_memory()

            tc_status = "passed"
            actual_val = None
            err_msg = None
            diff_msg = None

            try:
                if call_expr:
                    actual_val = eval(call_expr, exec_globals)
                    if expected_val is not None:
                        is_eq = _values_equal(actual_val, expected_val, tolerance)
                        if not is_eq:
                            tc_status = "failed"
                            diff_msg = f"Expected: {_safe_repr(expected_val)}\nActual: {_safe_repr(actual_val)}"
                            err_msg = f"Assertion failed: {call_expr} returned unexpected value."
                elif test_code:
                    test_ns = dict(exec_globals)
                    exec(test_code, test_ns)
                    run_tests_fn = test_ns.get("run_tests")
                    if run_tests_fn and callable(run_tests_fn):
                        user_callables = [
                            v for k, v in exec_globals.items()
                            if not k.startswith("_")
                            and (callable(v) or isinstance(v, type))
                            and getattr(v, "__module__", "") in ("", None, "__main__", "<user_code>", "<string>")
                        ]
                        invoked = False
                        last_err = None
                        for cand in user_callables:
                            try:
                                res_rep = run_tests_fn(cand)
                                actual_val = "All test assertions passed!" if res_rep is None or (isinstance(res_rep, dict) and res_rep.get("passed")) else str(res_rep)
                                invoked = True
                                break
                            except (TypeError, ValueError, KeyError) as e:
                                last_err = e
                                continue

                        if not invoked and user_callables:
                            try:
                                cand_dict = {k: v for k, v in exec_globals.items() if not k.startswith("_") and (callable(v) or isinstance(v, type))}
                                res_rep = run_tests_fn(cand_dict)
                                actual_val = "All test assertions passed!" if res_rep is None or (isinstance(res_rep, dict) and res_rep.get("passed")) else str(res_rep)
                                invoked = True
                            except (TypeError, ValueError, KeyError):
                                pass

                        if not invoked:
                            try:
                                res_rep = run_tests_fn()
                                actual_val = "All test assertions passed!" if res_rep is None or (isinstance(res_rep, dict) and res_rep.get("passed")) else str(res_rep)
                                invoked = True
                            except TypeError:
                                if last_err:
                                    raise last_err
                                raise ValueError("Could not find matching function/class to evaluate against test suite.")
                    else:
                        actual_val = "Assertion Passed"
                else:
                    tc_status = "skipped"
            except AssertionError as ass_err:
                tc_status = "failed"
                err_msg = f"AssertionError: {str(ass_err)}" if str(ass_err) else "Assertion failed"
                diff_msg = traceback.format_exc()
            except Exception as ex:
                tc_status = "error"
                err_msg = f"{type(ex).__name__}: {str(ex)}"
                diff_msg = traceback.format_exc()

            t_end = time.perf_counter()
            mem_current, mem_peak = tracemalloc.get_traced_memory()
            tracemalloc.stop()

            sys.stdout = old_stdout
            test_out = test_stdout_buf.getvalue()

            duration_ms = round((t_end - t_start) * 1000.0, 3)
            memory_kb = round((mem_peak - mem_start) / 1024.0, 2)

            if tc_status == "passed":
                passed_count += 1
            elif tc_status == "failed":
                failed_count += 1
            elif tc_status == "error":
                error_count += 1

            test_results.append({
                "id": tc_id,
                "name": tc_name,
                "status": tc_status,
                "duration_ms": duration_ms,
                "memory_kb": memory_kb,
                "expected": expected_val if not hidden else "[HIDDEN]",
                "actual": _safe_repr(actual_val) if not hidden else "[HIDDEN]",
                "error_message": err_msg if not hidden or tc_status == "error" else "Test failed.",
                "diff": diff_msg if not hidden else None,
                "stdout": test_out,
                "hidden": hidden
            })

        total_tests = len(test_cases)
        score_pct = round((passed_count / total_tests * 100.0), 1) if total_tests > 0 else 0.0
        result["test_results"] = test_results
        result["tests_summary"] = {
            "total": total_tests,
            "passed": passed_count,
            "failed": failed_count,
            "errors": error_count,
            "score_percent": score_pct
        }
        if failed_count > 0 or error_count > 0:
            result["success"] = False

    # Mode: BENCHMARK Execution
    elif mode == "benchmark":
        try:
            bench_ns = dict(exec_globals)
            if benchmark_setup:
                exec(benchmark_setup, bench_ns)

            stmt = benchmark_stmt or "pass"
            compiled_stmt = compile(stmt, "<benchmark_stmt>", "exec")

            warmup = min(10, max(2, benchmark_iterations // 10))
            for _ in range(warmup):
                exec(compiled_stmt, bench_ns)

            timings = []
            tracemalloc.start()
            mem_start, _ = tracemalloc.get_traced_memory()

            t_bench_start = time.perf_counter()
            for _ in range(benchmark_iterations):
                t0 = time.perf_counter_ns()
                exec(compiled_stmt, bench_ns)
                t1 = time.perf_counter_ns()
                timings.append((t1 - t0) / 1_000_000.0)
            t_bench_end = time.perf_counter()

            mem_curr, mem_peak = tracemalloc.get_traced_memory()
            tracemalloc.stop()

            total_time_ms = (t_bench_end - t_bench_start) * 1000.0
            mean_ms = sum(timings) / len(timings) if timings else 0.0
            sorted_timings = sorted(timings) if timings else [0.0]
            median_ms = sorted_timings[len(sorted_timings) // 2]
            min_ms = sorted_timings[0]
            max_ms = sorted_timings[-1]
            variance = sum((x - mean_ms) ** 2 for x in timings) / len(timings) if timings else 0.0
            std_dev_ms = math.sqrt(variance)
            ops_per_sec = (benchmark_iterations / (total_time_ms / 1000.0)) if total_time_ms > 0 else 0.0

            result["benchmark"] = {
                "iterations": benchmark_iterations,
                "warmup_iterations": warmup,
                "total_time_ms": round(total_time_ms, 3),
                "mean_ms": round(mean_ms, 4),
                "median_ms": round(median_ms, 4),
                "min_ms": round(min_ms, 4),
                "max_ms": round(max_ms, 4),
                "std_dev_ms": round(std_dev_ms, 4),
                "ops_per_sec": round(ops_per_sec, 2),
                "peak_memory_kb": round(mem_peak / 1024.0, 2),
                "memory_diff_kb": round((mem_curr - mem_start) / 1024.0, 2)
            }
        except Exception as bench_ex:
            result["success"] = False
            result["status"] = "runtime_error"
            result["error"] = f"Benchmark Error: {str(bench_ex)}"
            result["traceback"] = traceback.format_exc()

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(result, f)
        f.flush()


if __name__ == "__main__":
    main()
'''


class CodeRunner:
    """Executes Python code in an isolated subprocess with watchdog and resource constraints."""

    def __init__(self, python_path: Optional[str] = None):
        if python_path:
            self.python_path = python_path
        else:
            root_dir = pathlib.Path(__file__).resolve().parent.parent
            win_venv = root_dir / ".venv" / "Scripts" / "python.exe"
            unix_venv = root_dir / ".venv" / "bin" / "python"
            if win_venv.exists():
                self.python_path = str(win_venv)
            elif unix_venv.exists():
                self.python_path = str(unix_venv)
            else:
                self.python_path = sys.executable

        self.harness_path = pathlib.Path(__file__).resolve().parent / "_harness.py"
        self._ensure_harness()

    def _ensure_harness(self):
        if not self.harness_path.exists():
            with open(self.harness_path, "w", encoding="utf-8") as f:
                f.write(HARNESS_CODE)

    async def execute(self, req: RunRequest) -> RunResponse:
        """Executes the request asynchronously with watchdog timer and memory threshold."""
        self._ensure_harness()

        timeout_sec = min(max(req.timeout, 0.5), 10.0)
        memory_limit_mb = min(max(req.memory_limit_mb, 64.0), 1024.0)

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as in_f:
            json.dump({
                "code": req.code,
                "mode": req.mode,
                "test_cases": [tc.model_dump() for tc in (req.test_cases or [])],
                "benchmark_iterations": req.benchmark_iterations,
                "benchmark_setup": req.benchmark_setup,
                "benchmark_stmt": req.benchmark_stmt,
            }, in_f)
            in_file_path = in_f.name

        out_fd, out_file_path = tempfile.mkstemp(suffix=".json")
        os.close(out_fd)

        env = os.environ.copy()
        env["PYMASTERY_IN_FILE"] = in_file_path
        env["PYMASTERY_OUT_FILE"] = out_file_path
        env["PYTHONUNBUFFERED"] = "1"
        env["MPLBACKEND"] = "Agg"

        start_time = time.perf_counter()
        peak_memory_mb = 0.0
        timed_out = False
        memory_exceeded = False

        try:
            def _run_subprocess_sync() -> Tuple[int, bytes, bytes]:
                nonlocal peak_memory_mb, timed_out, memory_exceeded
                proc = subprocess.Popen(
                    [self.python_path, str(self.harness_path)],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=env,
                )

                ps_proc = None
                try:
                    ps_proc = psutil.Process(proc.pid)
                except Exception:
                    pass

                stdin_bytes = (req.stdin or "").encode("utf-8")
                start = time.perf_counter()

                if stdin_bytes:
                    try:
                        proc.stdin.write(stdin_bytes)
                        proc.stdin.flush()
                    except Exception:
                        pass
                try:
                    proc.stdin.close()
                except Exception:
                    pass
                proc.stdin = None

                while proc.poll() is None:
                    if ps_proc:
                        try:
                            rss_mb = ps_proc.memory_info().rss / (1024.0 * 1024.0)
                            if rss_mb > peak_memory_mb:
                                peak_memory_mb = rss_mb
                            if rss_mb > memory_limit_mb:
                                memory_exceeded = True
                                self._kill_process_tree(proc.pid)
                                break
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            pass

                    elapsed = time.perf_counter() - start
                    if elapsed > timeout_sec:
                        timed_out = True
                        self._kill_process_tree(proc.pid)
                        break

                    time.sleep(0.02)

                stdout_bytes, stderr_bytes = proc.communicate()
                return proc.returncode or 0, stdout_bytes or b"", stderr_bytes or b""

            exit_code, stdout_bytes, stderr_bytes = await asyncio.to_thread(_run_subprocess_sync)

            stdout_str = stdout_bytes.decode("utf-8", errors="replace") if stdout_bytes else ""
            stderr_str = stderr_bytes.decode("utf-8", errors="replace") if stderr_bytes else ""
            duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)


            if timed_out:
                return RunResponse(
                    success=False,
                    status="timeout",
                    stdout=stdout_str,
                    stderr=stderr_str,
                    exit_code=-1,
                    duration_ms=duration_ms,
                    peak_memory_mb=round(peak_memory_mb, 2),
                    error=f"Execution timed out after {timeout_sec:.1f} seconds. Check for infinite loops or heavy computations.",
                )

            if memory_exceeded:
                return RunResponse(
                    success=False,
                    status="memory_exceeded",
                    stdout=stdout_str,
                    stderr=stderr_str,
                    exit_code=-1,
                    duration_ms=duration_ms,
                    peak_memory_mb=round(peak_memory_mb, 2),
                    error=f"Memory limit of {memory_limit_mb:.0f} MB exceeded (peak: {peak_memory_mb:.1f} MB).",
                )

            # Load harness output JSON
            harness_data = {}
            if os.path.exists(out_file_path) and os.path.getsize(out_file_path) > 0:
                try:
                    with open(out_file_path, "r", encoding="utf-8") as f:
                        harness_data = json.load(f)
                except Exception as json_err:
                    harness_data = {
                        "success": False,
                        "status": "runtime_error",
                        "error": f"Failed to parse runner output: {str(json_err)}"
                    }
            else:
                harness_data = {
                    "success": False,
                    "status": "runtime_error" if exit_code != 0 else "completed",
                    "error": stderr_str if stderr_str else f"Process exited with code {exit_code}"
                }

            plots = [
                PlotArtifact(
                    index=p["index"],
                    format=p["format"],
                    data=p["data"],
                    mime_type=p.get("mime_type", "image/png"),
                    dpi=p.get("dpi", 100),
                    title=p.get("title")
                )
                for p in harness_data.get("plots", [])
            ]

            data_objects = [
                DataObjectSummary(
                    name=d["name"],
                    object_type=d["object_type"],
                    shape=d.get("shape"),
                    dtype=d.get("dtype"),
                    columns=d.get("columns"),
                    dtypes=d.get("dtypes"),
                    preview=d.get("preview"),
                    summary_stats=d.get("summary_stats")
                )
                for d in harness_data.get("data_objects", [])
            ]

            test_results = None
            if harness_data.get("test_results") is not None:
                test_results = [
                    TestCaseResult(
                        id=tr.get("id"),
                        name=tr["name"],
                        status=tr["status"],
                        duration_ms=tr.get("duration_ms", 0.0),
                        memory_kb=tr.get("memory_kb", 0.0),
                        expected=tr.get("expected"),
                        actual=tr.get("actual"),
                        error_message=tr.get("error_message"),
                        diff=tr.get("diff"),
                        stdout=tr.get("stdout"),
                        hidden=tr.get("hidden", False)
                    )
                    for tr in harness_data["test_results"]
                ]

            benchmark = None
            if harness_data.get("benchmark") is not None:
                benchmark = BenchmarkResult(**harness_data["benchmark"])

            return RunResponse(
                success=harness_data.get("success", exit_code == 0),
                status=harness_data.get("status", "completed" if exit_code == 0 else "runtime_error"),
                stdout=stdout_str,
                stderr=stderr_str,
                exit_code=exit_code,
                duration_ms=duration_ms,
                peak_memory_mb=round(peak_memory_mb, 2),
                error=harness_data.get("error"),
                traceback=harness_data.get("traceback"),
                test_results=test_results,
                tests_summary=harness_data.get("tests_summary"),
                benchmark=benchmark,
                plots=plots,
                data_objects=data_objects,
            )

        except Exception as runner_err:
            return RunResponse(
                success=False,
                status="runtime_error",
                exit_code=-1,
                error=f"Runner exception: {str(runner_err)}",
                traceback=traceback.format_exc(),
            )
        finally:
            for p in (in_file_path, out_file_path):
                try:
                    if os.path.exists(p):
                        os.remove(p)
                except Exception:
                    pass

    @staticmethod
    def _kill_process_tree(pid: int):
        """Kills a process and all its children gracefully then forcefully."""
        try:
            parent = psutil.Process(pid)
            children = parent.children(recursive=True)
            for child in children:
                try:
                    child.kill()
                except Exception:
                    pass
            parent.kill()
        except Exception:
            pass
    run_code = execute


runner = CodeRunner()
