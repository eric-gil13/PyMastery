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
import logging
import multiprocessing as mp
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
    if "matplotlib" in sys.modules or os.environ.get("PYMASTERY_ENABLE_MPL") == "1":
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


def _safe_repr(obj, max_len=2000):
    if obj is None:
        return "None"
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
    test_cases = [] if mode == "run" else payload.get("test_cases", [])
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
        "test_results": [] if mode == "run" else None,
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
        if mode == "run":
            result["test_results"] = []
            result["tests_summary"] = None
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
        if mode == "run":
            result["test_results"] = []
            result["tests_summary"] = None
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
            input_desc = tc.get("input_repr") or tc.get("inputDescription") or tc.get("input")

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
            tb_str = None
            captured_input = None

            def _wrap_candidate(cand_obj):
                if isinstance(cand_obj, type):
                    return cand_obj
                elif callable(cand_obj):
                    def func_wrapper(*args, **kwargs):
                        nonlocal actual_val, captured_input
                        try:
                            arg_strs = [_safe_repr(a, 100) for a in args] + [f"{k}={_safe_repr(v, 100)}" for k, v in kwargs.items()]
                            fn_name = getattr(cand_obj, "__name__", "candidate_func")
                            captured_input = f"{fn_name}({', '.join(arg_strs)})"
                        except Exception:
                            pass
                        res = cand_obj(*args, **kwargs)
                        actual_val = res
                        return res
                    if hasattr(cand_obj, "__name__"):
                        func_wrapper.__name__ = cand_obj.__name__
                    return func_wrapper
                return cand_obj

            try:
                if call_expr:
                    captured_input = call_expr
                    call_ns = dict(exec_globals)
                    for k, v in list(exec_globals.items()):
                        if not k.startswith("_") and (callable(v) or isinstance(v, type)) and getattr(v, "__module__", "") in ("", None, "__main__", "<user_code>", "<string>"):
                            call_ns[k] = _wrap_candidate(v)

                    eval_res = eval(call_expr, call_ns)
                    if actual_val is None:
                        actual_val = eval_res

                    if expected_val is not None:
                        is_eq = _values_equal(actual_val, expected_val, tolerance)
                        if not is_eq:
                            tc_status = "failed"
                            diff_msg = f"Expected: {_safe_repr(expected_val)}\nActual: {_safe_repr(actual_val)}"
                            err_msg = f"Assertion failed: {call_expr} returned unexpected value.\nExpected: {_safe_repr(expected_val)}\nActual: {_safe_repr(actual_val)}"
                elif test_code:
                    test_ns = dict(exec_globals)
                    exec(test_code, test_ns)
                    run_tests_fn = test_ns.get("run_tests")
                    if run_tests_fn and callable(run_tests_fn):
                        KNOWN_TARGETS = {
                            "day01_ch01_pairwise_distance": lambda ns: ns.get("pairwise_euclidean_distance"),
                            "day01_ch02_strided_conv2d": lambda ns: ns.get("conv2d"),
                            "day02_ch01_financial_resampling": lambda ns: ns.get("resample_and_compute_metrics"),
                            "day02_ch02_categorical_pipeline": lambda ns: ns.get("build_customer_analytics_pipeline"),
                            "day03_ch01_ml_diagnostic_dashboard": lambda ns: ns.get("create_diagnostic_dashboard"),
                            "day04_ch01_robust_target_encoder": lambda ns: ns.get("RobustOutlierTargetEncoder"),
                            "day04_ch02_cv_classification_pipeline": lambda ns: ns.get("build_and_tune_pipeline"),
                            "day05_ch01_parametric_swish": lambda ns: {
                                "ParametricSwishFunction": ns.get("ParametricSwishFunction"),
                                "ParametricSwish": ns.get("ParametricSwish")
                            },
                            "day05_ch02_focal_loss": lambda ns: ns.get("FocalLoss"),
                            "day06_ch01_residual_block": lambda ns: ns.get("ResidualBlock"),
                            "day06_ch02_robust_train_loop": lambda ns: ns.get("train_model"),
                            "day07_ch01_full_pipeline_capstone": lambda ns: ns.get("EndToEndMLPipeline"),
                            "torch-p3-c1": lambda ns: ns.get("build_and_run_mlp"),
                            "torch-p3-c2": lambda ns: ns.get("build_residual_block"),
                            "python-p4-c1": lambda ns: ns.get("Vector2D"),
                            "python-p4-c2": lambda ns: {
                                "BankAccount": ns.get("BankAccount"),
                                "CheckingAccount": ns.get("CheckingAccount"),
                                "SavingsAccount": ns.get("SavingsAccount")
                            },
                            "python-p7-c1": lambda ns: ns.get("EventDispatcher"),
                            "python-p7-c2": lambda ns: {
                                "async_task_batcher": ns.get("async_task_batcher"),
                                "run_batcher_sync": ns.get("run_batcher_sync")
                            },
                        }

                        user_callables = [
                            (k, v) for k, v in test_ns.items()
                            if not k.startswith("_")
                            and k != "run_tests"
                            and (callable(v) or isinstance(v, type))
                            and getattr(v, "__module__", "") in ("", None, "__main__", "<user_code>", "<string>")
                            and not getattr(getattr(v, "__class__", None), "__module__", "").startswith("typing")
                            and getattr(v, "__module__", "") != "typing"
                        ]

                        invoked = False
                        last_err = None
                        res_rep = None

                        cid = payload.get("challenge_id") or tc.get("challenge_id") or ""
                        if cid in KNOWN_TARGETS:
                            target = KNOWN_TARGETS[cid](test_ns)
                            if target is not None:
                                try:
                                    wrapped_target = _wrap_candidate(target) if (callable(target) or isinstance(target, type)) else target
                                    res_rep = run_tests_fn(wrapped_target)
                                    invoked = True
                                except Exception as e:
                                    last_err = e

                        if not invoked:
                            for k, cand in reversed(user_callables):
                                try:
                                    wrapped_cand = _wrap_candidate(cand)
                                    res_rep = run_tests_fn(wrapped_cand)
                                    invoked = True
                                    break
                                except AssertionError:
                                    raise
                                except (TypeError, ValueError, KeyError) as e:
                                    last_err = e
                                    continue

                        if not invoked and user_callables:
                            try:
                                cand_dict = {k: v for k, v in user_callables}
                                res_rep = run_tests_fn(cand_dict)
                                invoked = True
                            except (TypeError, ValueError, KeyError) as e:
                                last_err = e

                        if not invoked:
                            try:
                                res_rep = run_tests_fn()
                                invoked = True
                            except (TypeError, ValueError, KeyError) as e:
                                last_err = e

                        if not invoked:
                            if last_err:
                                raise last_err
                            raise ValueError("Could not find matching function/class to evaluate against test suite.")

                        if actual_val is None:
                            actual_val = "All test assertions passed!" if res_rep is None or (isinstance(res_rep, dict) and res_rep.get("passed", res_rep.get("success", True))) else str(res_rep)
                        if isinstance(res_rep, dict) and not res_rep.get("success", res_rep.get("passed", True)):
                            tc_status = "failed"
                            err_msg = res_rep.get("error", "Test suite reported failure.")
                            diff_msg = res_rep.get("diff")
                    else:
                        if actual_val is None:
                            actual_val = "Assertion Passed"
                else:
                    tc_status = "skipped"
            except AssertionError as ass_err:
                tc_status = "failed"
                tb_str = traceback.format_exc()
                err_msg = tb_str
                diff_msg = tb_str
            except Exception as ex:
                tc_status = "error"
                tb_str = traceback.format_exc()
                err_msg = tb_str
                diff_msg = tb_str

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

            input_repr_str = (
                input_desc
                or (call_expr if call_expr else None)
                or captured_input
                or tc.get("description")
            )

            test_results.append({
                "id": tc_id,
                "name": tc_name,
                "status": tc_status,
                "duration_ms": duration_ms,
                "memory_kb": memory_kb,
                "input_repr": input_repr_str,
                "expected": expected_val if not hidden else "[HIDDEN]",
                "actual": _safe_repr(actual_val) if not hidden else "[HIDDEN]",
                "error_message": err_msg if not hidden or tc_status == "error" else "Test failed.",
                "diff": diff_msg if not hidden else None,
                "traceback": tb_str if not hidden or tc_status == "error" else None,
                "stdout": test_out,
                "hidden": hidden,
                "call": tc.get("call"),
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
            first_fail = next((tr for tr in test_results if tr["status"] in ("failed", "error") and tr.get("diff")), None)
            if first_fail and not result.get("traceback"):
                result["traceback"] = first_fail.get("diff")
                result["error"] = first_fail.get("error_message")

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


logger = logging.getLogger("pymastery.runner")


class WarmWorkerManager:
    """Manages a persistent warm Python worker process with pre-loaded scientific packages."""

    def __init__(self, python_path: Optional[str] = None):
        self.python_path = python_path
        self._lock = asyncio.Lock()
        self.proc: Optional[mp.Process] = None
        self.pipe: Optional[mp.connection.Connection] = None

    def _ensure_worker(self):
        if self.proc is not None and self.proc.is_alive() and self.pipe is not None:
            return

        self._cleanup()

        try:
            ctx = mp.get_context()
            parent_conn, child_conn = ctx.Pipe()
            from server._worker import warm_worker_loop
            self.proc = ctx.Process(target=warm_worker_loop, args=(child_conn,), daemon=True)
            self.proc.start()
            self.pipe = parent_conn

            # Wait for ready signal (up to 20s for initial import/linking of torch/openblas)
            if self.pipe.poll(20.0):
                msg = self.pipe.recv()
                if not (isinstance(msg, dict) and msg.get("type") == "ready"):
                    raise RuntimeError(f"Unexpected worker handshake: {msg}")
            else:
                self._cleanup()
                raise TimeoutError("Warm worker initialization timed out")
        except Exception:
            self._cleanup()
            raise

    def _cleanup(self):
        if self.proc:
            try:
                CodeRunner._kill_process_tree(self.proc.pid)
            except Exception:
                pass
            try:
                self.proc.join(timeout=0.5)
            except Exception:
                pass
            self.proc = None
        if self.pipe:
            try:
                self.pipe.close()
            except Exception:
                pass
            self.pipe = None

    async def execute(
        self,
        payload: dict,
        timeout_sec: float,
        memory_limit_mb: float,
        mode: str
    ) -> RunResponse:
        async with self._lock:
            await asyncio.to_thread(self._ensure_worker)

            start_time = time.perf_counter()
            timed_out = False
            memory_exceeded = False
            peak_memory_mb = 0.0

            ps_proc = None
            start_rss_mb = 0.0
            try:
                ps_proc = psutil.Process(self.proc.pid)
                start_rss_mb = ps_proc.memory_info().rss / (1024.0 * 1024.0)
                peak_memory_mb = start_rss_mb
            except Exception:
                pass

            try:
                self.pipe.send(payload)
            except Exception as send_err:
                self._cleanup()
                raise send_err

            def _poll_worker() -> Tuple[Optional[dict], bool, bool, float]:
                nonlocal peak_memory_mb
                nonlocal timed_out
                nonlocal memory_exceeded

                start_poll = time.perf_counter()
                recv_msg = None

                while True:
                    if ps_proc:
                        try:
                            rss_mb = ps_proc.memory_info().rss / (1024.0 * 1024.0)
                            if rss_mb > peak_memory_mb:
                                peak_memory_mb = rss_mb
                            delta_mb = max(0.0, rss_mb - start_rss_mb)
                            if delta_mb > memory_limit_mb or rss_mb > max(1536.0, start_rss_mb + memory_limit_mb):
                                memory_exceeded = True
                                break
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            pass

                    if self.pipe.poll(0.02):
                        try:
                            recv_msg = self.pipe.recv()
                        except (EOFError, BrokenPipeError):
                            recv_msg = None
                        break

                    if not self.proc.is_alive():
                        break

                    elapsed = time.perf_counter() - start_poll
                    if elapsed > timeout_sec:
                        timed_out = True
                        break

                return recv_msg, timed_out, memory_exceeded, peak_memory_mb

            recv_msg, timed_out, memory_exceeded, peak_memory_mb = await asyncio.to_thread(_poll_worker)
            duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

            if timed_out:
                self._cleanup()
                return RunResponse(
                    success=False,
                    status="timeout",
                    stdout="",
                    stderr="",
                    exit_code=-1,
                    duration_ms=duration_ms,
                    peak_memory_mb=round(peak_memory_mb, 2),
                    error=f"Execution timed out after {timeout_sec:.1f} seconds. Check for infinite loops or heavy computations.",
                    test_results=[] if mode == "run" else None,
                    tests_summary=None,
                )

            if memory_exceeded:
                self._cleanup()
                return RunResponse(
                    success=False,
                    status="memory_exceeded",
                    stdout="",
                    stderr="",
                    exit_code=-1,
                    duration_ms=duration_ms,
                    peak_memory_mb=round(peak_memory_mb, 2),
                    error=f"Memory limit of {memory_limit_mb:.0f} MB exceeded (peak: {peak_memory_mb:.1f} MB).",
                    test_results=[] if mode == "run" else None,
                    tests_summary=None,
                )

            if recv_msg is None or recv_msg.get("type") != "result":
                self._cleanup()
                err_text = "Worker process terminated unexpectedly."
                if recv_msg and recv_msg.get("type") == "error":
                    err_text = recv_msg.get("error", err_text)
                return RunResponse(
                    success=False,
                    status="runtime_error",
                    stdout="",
                    stderr="",
                    exit_code=-1,
                    duration_ms=duration_ms,
                    peak_memory_mb=round(peak_memory_mb, 2),
                    error=err_text,
                    test_results=[] if mode == "run" else None,
                    tests_summary=None,
                )

            harness_data = recv_msg.get("data", {})
            return CodeRunner._build_response(harness_data, duration_ms, peak_memory_mb, mode)


class CodeRunner:
    """Executes Python code in a pre-warmed background worker with isolated subprocess fallback."""

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
        self.warm_worker = WarmWorkerManager(python_path=self.python_path)

    def _ensure_harness(self):
        try:
            if not self.harness_path.exists():
                with open(self.harness_path, "w", encoding="utf-8") as f:
                    f.write(HARNESS_CODE)
        except Exception:
            pass

    @staticmethod
    def _build_response(
        harness_data: dict,
        duration_ms: float,
        peak_memory_mb: float,
        mode: str,
        exit_code: int = 0
    ) -> RunResponse:
        plots = [
            PlotArtifact(
                index=p["index"],
                format=p["format"],
                data=p["data"],
                mime_type=p.get("mime_type", "image/png"),
                dpi=p.get("dpi", 100),
                title=p.get("title"),
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
                summary_stats=d.get("summary_stats"),
            )
            for d in harness_data.get("data_objects", [])
        ]

        test_results = [] if mode == "run" else None
        if mode != "run" and harness_data.get("test_results") is not None:
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
                    traceback=tr.get("traceback"),
                    stdout=tr.get("stdout"),
                    hidden=tr.get("hidden", False),
                    input_repr=tr.get("input_repr"),
                    call=tr.get("call"),
                )
                for tr in harness_data["test_results"]
            ]

        benchmark = None
        if harness_data.get("benchmark") is not None:
            benchmark = BenchmarkResult(**harness_data["benchmark"])

        return RunResponse(
            success=harness_data.get("success", exit_code == 0),
            status=harness_data.get("status", "completed" if exit_code == 0 else "runtime_error"),
            stdout=harness_data.get("stdout", ""),
            stderr=harness_data.get("stderr", ""),
            exit_code=exit_code if not harness_data.get("success", True) and exit_code != 0 else 0,
            duration_ms=duration_ms,
            peak_memory_mb=round(peak_memory_mb, 2),
            error=harness_data.get("error"),
            traceback=harness_data.get("traceback"),
            test_results=test_results,
            tests_summary=None if mode == "run" else harness_data.get("tests_summary"),
            benchmark=benchmark,
            plots=plots,
            data_objects=data_objects,
        )

    async def execute(self, req: RunRequest) -> RunResponse:
        """Executes the request via warm worker with fallback to isolated subprocess."""
        timeout_sec = min(max(req.timeout, 0.5), 35.0)
        memory_limit_mb = min(max(req.memory_limit_mb, 64.0), 1024.0)

        payload = {
            "code": req.code,
            "mode": req.mode,
            "challenge_id": req.challenge_id,
            "test_cases": [] if req.mode == "run" else [tc.model_dump() for tc in (req.test_cases or [])],
            "benchmark_iterations": req.benchmark_iterations,
            "benchmark_setup": req.benchmark_setup,
            "benchmark_stmt": req.benchmark_stmt,
            "stdin": req.stdin or "",
        }

        try:
            return await self.warm_worker.execute(payload, timeout_sec, memory_limit_mb, req.mode)
        except Exception as warm_err:
            logger.warning("Warm worker execution failed, falling back to subprocess: %s", warm_err)
            return await self._execute_subprocess(req, timeout_sec, memory_limit_mb)

    async def _execute_subprocess(self, req: RunRequest, timeout_sec: float, memory_limit_mb: float) -> RunResponse:
        """Fallback execution in a cold subprocess."""
        self._ensure_harness()

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as in_f:
            json.dump({
                "code": req.code,
                "mode": req.mode,
                "challenge_id": req.challenge_id,
                "test_cases": [] if req.mode == "run" else [tc.model_dump() for tc in (req.test_cases or [])],
                "benchmark_iterations": req.benchmark_iterations,
                "benchmark_setup": req.benchmark_setup,
                "benchmark_stmt": req.benchmark_stmt,
                "stdin": req.stdin or "",
            }, in_f)
            in_file_path = in_f.name

        out_fd, out_file_path = tempfile.mkstemp(suffix=".json")
        os.close(out_fd)

        env = os.environ.copy()
        env["PYMASTERY_IN_FILE"] = in_file_path
        env["PYMASTERY_OUT_FILE"] = out_file_path
        env["PYTHONUNBUFFERED"] = "1"
        if "matplotlib" in req.code or "plt" in req.code:
            env["MPLBACKEND"] = "Agg"
            env["PYMASTERY_ENABLE_MPL"] = "1"

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

                    time.sleep(0.05)

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
                    test_results=[] if req.mode == "run" else None,
                    tests_summary=None,
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
                    test_results=[] if req.mode == "run" else None,
                    tests_summary=None,
                )

            harness_data = {}
            if os.path.exists(out_file_path) and os.path.getsize(out_file_path) > 0:
                try:
                    with open(out_file_path, "r", encoding="utf-8") as f:
                        harness_data = json.load(f)
                except Exception as json_err:
                    harness_data = {
                        "success": False,
                        "status": "runtime_error",
                        "error": f"Failed to parse runner output: {str(json_err)}",
                    }
            else:
                harness_data = {
                    "success": False,
                    "status": "runtime_error" if exit_code != 0 else "completed",
                    "error": stderr_str if stderr_str else f"Process exited with code {exit_code}",
                }

            if not harness_data.get("stdout") and stdout_str:
                harness_data["stdout"] = stdout_str
            if not harness_data.get("stderr") and stderr_str:
                harness_data["stderr"] = stderr_str

            return self._build_response(harness_data, duration_ms, peak_memory_mb, req.mode, exit_code)

        except Exception as runner_err:
            return RunResponse(
                success=False,
                status="runtime_error",
                exit_code=-1,
                error=f"Runner exception: {str(runner_err)}",
                traceback=traceback.format_exc(),
                test_results=[] if req.mode == "run" else None,
                tests_summary=None,
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
