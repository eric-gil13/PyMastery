"""
PyMastery Persistent Warm Worker Engine.
Pre-loads PyTorch, NumPy, Pandas, and Matplotlib into a long-lived process.
Executes code payloads over an IPC Pipe with sub-millisecond dispatch time.
"""

from __future__ import annotations
import os
# Restrict OpenMP / BLAS thread pools to 1 thread to avoid CPU thrashing on throttled containers
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import ast
import io
import math
import multiprocessing as mp
import sys
import time
import traceback
import tracemalloc

# Import helpers from harness
from server._harness import (
    _capture_remaining_plots,
    _safe_repr,
    _serialize_data_objects,
    _values_equal,
)


def run_harness_payload(payload: dict) -> dict:
    """Executes a code execution payload within the warm process and returns results dict."""
    import server._harness as harness_mod

    harness_mod._plots = []

    if "matplotlib.pyplot" in sys.modules:
        try:
            sys.modules["matplotlib.pyplot"].close("all")
        except Exception:
            pass

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    old_stdin = sys.stdin

    captured_stdout = io.StringIO()
    captured_stderr = io.StringIO()
    sys.stdout = captured_stdout
    sys.stderr = captured_stderr
    sys.stdin = io.StringIO(payload.get("stdin") or "")

    code = payload.get("code", "")
    mode = payload.get("mode", "run")
    test_cases = [] if mode == "run" else payload.get("test_cases", [])
    benchmark_iterations = payload.get("benchmark_iterations", 100)
    benchmark_setup = payload.get("benchmark_setup", "")
    benchmark_stmt = payload.get("benchmark_stmt", "")

    result: dict = {
        "success": True,
        "status": "completed",
        "stdout": "",
        "stderr": "",
        "error": None,
        "traceback": None,
        "test_results": [] if mode == "run" else None,
        "tests_summary": None,
        "benchmark": None,
        "plots": [],
        "data_objects": [],
    }

    try:
        exec_globals = {
            "__name__": "__main__",
            "__doc__": None,
            "__package__": None,
        }
        excluded_keys = set(exec_globals.keys()) | {"_plots", "_MATPLOTLIB_AVAILABLE"}

        # 1. Execute User Code
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
            return result
        except Exception as ex:
            result["success"] = False
            result["status"] = "runtime_error"
            result["error"] = f"{type(ex).__name__}: {str(ex)}"
            result["traceback"] = traceback.format_exc()
            return result

        # Capture plots and data objects
        _capture_remaining_plots()
        result["plots"] = list(harness_mod._plots)
        result["data_objects"] = _serialize_data_objects(exec_globals, excluded_keys)

        # 2. Mode: TEST Assertion Evaluation
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

                old_tc_stdout = sys.stdout
                test_stdout_buf = io.StringIO()
                sys.stdout = test_stdout_buf

                t_start = time.perf_counter()
                if not tracemalloc.is_tracing():
                    try:
                        tracemalloc.start()
                    except Exception:
                        pass
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
                        func_wrapper.__module__ = getattr(cand_obj, "__module__", "__main__")
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
                            if not _values_equal(actual_val, expected_val, tolerance):
                                tc_status = "failed"
                                diff_msg = f"Expected: {_safe_repr(expected_val)}\nActual: {_safe_repr(actual_val)}"
                                err_msg = f"Assertion failed: {call_expr} returned unexpected value."
                    elif test_code:
                        test_ns = dict(exec_globals)
                        exec(test_code, test_ns)
                        run_tests_fn = test_ns.get("run_tests")
                        if run_tests_fn and callable(run_tests_fn):
                            KNOWN_TARGETS = {
                                # PyTorch Progressive Track
                                "torch-p1-c1": lambda ns: ns.get("init_tensor_matrices"),
                                "torch-p1-c2": lambda ns: ns.get("bridge_numpy_to_tensor"),
                                "torch-p2-c1": lambda ns: ns.get("compute_polynomial_gradients"),
                                "torch-p2-c2": lambda ns: ns.get("evaluate_inference_no_grad"),
                                "torch-p3-c1": lambda ns: ns.get("build_and_run_mlp") or ns.get("SimpleMLP"),
                                "torch-p3-c2": lambda ns: ns.get("build_residual_block") or ns.get("ResidualBlock"),
                                "torch-p4-c1": lambda ns: ns.get("evaluate_losses"),
                                "torch-p4-c2": lambda ns: ns.get("single_step_adam_update"),
                                "torch-p5-c1": lambda ns: ns.get("train_model"),
                                "torch-p5-c2": lambda ns: ns.get("train_with_early_stopping"),
                                "torch-p6-c1": lambda ns: ns.get("TabularDataset"),
                                "torch-p6-c2": lambda ns: ns.get("create_and_inspect_dataloader") or ns.get("create_data_loader"),
                                "torch-p7-c1": lambda ns: ns.get("ConvFeatureExtractor"),
                                "torch-p7-c2": lambda ns: ns.get("SelfAttentionBlock") or ns.get("MultiheadSelfAttention"),

                                # Pure Python Progressive Track
                                "python-p1-c1": lambda ns: ns.get("clean_and_format_record"),
                                "python-p1-c2": lambda ns: ns.get("categorize_metric"),
                                "python-p2-c1": lambda ns: ns.get("build_inverted_index"),
                                "python-p2-c2": lambda ns: ns.get("flatten_and_deduplicate"),
                                "python-p3-c1": lambda ns: ns.get("compose_pipeline"),
                                "python-p3-c2": lambda ns: ns.get("make_bounded_memoizer"),
                                "python-p4-c1": lambda ns: ns.get("Vector2D"),
                                "python-p4-c2": lambda ns: {
                                    "BankAccount": ns.get("BankAccount"),
                                    "CheckingAccount": ns.get("CheckingAccount"),
                                    "SavingsAccount": ns.get("SavingsAccount"),
                                },
                                "python-p5-c1": lambda ns: ns.get("stream_sliding_window"),
                                "python-p5-c2": lambda ns: ns.get("pipeline_log_stream"),
                                "python-p6-c1": lambda ns: ns.get("retry_with_backoff"),
                                "python-p6-c2": lambda ns: ns.get("AtomicTransaction"),
                                "python-p7-c1": lambda ns: ns.get("EventDispatcher"),
                                "python-p7-c2": lambda ns: {
                                    "async_task_batcher": ns.get("async_task_batcher"),
                                    "run_batcher_sync": ns.get("run_batcher_sync"),
                                },

                                # NumPy Track
                                "d1-c1": lambda ns: ns.get("init_sensor_data"),
                                "d1-c2": lambda ns: ns.get("generate_range_and_samples"),
                                "d2-c1": lambda ns: ns.get("reshape_stream_to_grid"),
                                "d2-c2": lambda ns: ns.get("format_multichannel_tensor"),
                                "d3-c1": lambda ns: ns.get("crop_bounding_box"),
                                "d3-c2": lambda ns: ns.get("decimate_and_isolate"),
                                "d4-c1": lambda ns: ns.get("compute_financial_metrics"),
                                "d4-c2": lambda ns: ns.get("clamped_exp_activation"),
                                "d5-c1": lambda ns: ns.get("aggregate_scorecard"),
                                "d5-c2": lambda ns: ns.get("analyze_cashflow"),
                                "d6-c1": lambda ns: ns.get("clean_sensor_readings"),
                                "d6-c2": lambda ns: ns.get("sieve_server_telemetry"),
                                "d7-c1": lambda ns: ns.get("normalize_features"),
                                "d7-c2": lambda ns: ns.get("compute_portfolio_returns"),
                                "d7-c3": lambda ns: ns.get("pairwise_euclidean_distance"),

                                # Pandas Track
                                "pandas-p1-c1": lambda ns: ns.get("build_employee_directory"),
                                "pandas-p1-c2": lambda ns: ns.get("inspect_dataframe"),
                                "pandas-p2-c1": lambda ns: ns.get("filter_high_earners"),
                                "pandas-p2-c2": lambda ns: ns.get("slice_subtable"),
                                "pandas-p3-c1": lambda ns: ns.get("clean_and_impute_dataset"),
                                "pandas-p3-c2": lambda ns: ns.get("normalize_customer_records"),
                                "pandas-p4-c1": lambda ns: ns.get("aggregate_department_metrics"),
                                "pandas-p4-c2": lambda ns: ns.get("rank_regional_performance"),
                                "pandas-p5-c1": lambda ns: ns.get("join_customer_orders"),
                                "pandas-p5-c2": lambda ns: ns.get("combine_retail_data"),
                                "pandas-p6-c1": lambda ns: ns.get("calculate_stock_metrics"),
                                "pandas-p6-c2": lambda ns: ns.get("resample_sales_and_detect_peaks"),
                                "pandas-p7-c1": lambda ns: ns.get("build_rfm_pipeline"),
                                "pandas-p7-c2": lambda ns: ns.get("build_production_kpi_pipeline"),

                                # Matplotlib Track
                                "mpl-p1-c1": lambda ns: ns.get("plot_metric_curves"),
                                "mpl-p1-c2": lambda ns: ns.get("plot_trajectories"),
                                "mpl-p2-c1": lambda ns: ns.get("plot_scatter_and_bar"),
                                "mpl-p2-c2": lambda ns: ns.get("plot_distribution_with_density"),
                                "mpl-p3-c1": lambda ns: ns.get("create_diagnostic_grid"),
                                "mpl-p3-c2": lambda ns: ns.get("plot_volume_price_twin"),
                                "mpl-p4-c1": lambda ns: ns.get("annotate_peak_anomaly"),
                                "mpl-p4-c2": lambda ns: ns.get("build_publication_figure"),

                                # Scikit-Learn Track
                                "sk-p1-c1": lambda ns: ns.get("stratified_train_test_split"),
                                "sk-p1-c2": lambda ns: ns.get("temporal_train_test_split"),
                                "sk-p2-c1": lambda ns: ns.get("scale_features_leak_free"),
                                "sk-p2-c2": lambda ns: ns.get("preprocess_mixed_features"),
                                "sk-p3-c1": lambda ns: ns.get("train_churn_classifier"),
                                "sk-p3-c2": lambda ns: ns.get("inspect_tree_feature_importances"),
                                "sk-p4-c1": lambda ns: ns.get("train_housing_regressor"),
                                "sk-p4-c2": lambda ns: ns.get("compare_ols_and_ridge"),
                                "sk-p5-c1": lambda ns: ns.get("evaluate_model_cv"),
                                "sk-p5-c2": lambda ns: ns.get("tune_decision_tree_grid"),
                                "sk-p6-c1": lambda ns: ns.get("build_preprocessing_classifier_pipeline"),
                                "sk-p6-c2": lambda ns: ns.get("build_and_evaluate_capstone_pipeline"),

                                # Legacy Curriculum Track
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
                                "day07_ch01_full_pipeline_capstone": lambda ns: ns.get("EndToEndMLPipeline") or ns.get("DeepMLP"),
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

                            cid = (payload.get("challenge_id") or tc.get("challenge_id") or "").strip().lower()
                            # Match normalized cid
                            matched_entry = next((fn for k, fn in KNOWN_TARGETS.items() if k.lower() == cid), None)
                            if matched_entry:
                                target = matched_entry(test_ns)
                                if target is not None:
                                    try:
                                        wrapped_target = _wrap_candidate(target) if (callable(target) or isinstance(target, type)) else target
                                        res_rep = run_tests_fn(wrapped_target)
                                        invoked = True
                                    except TypeError:
                                        try:
                                            res_rep = run_tests_fn()
                                            invoked = True
                                        except Exception as e_noarg:
                                            last_err = e_noarg
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
                            actual_val = "Test executed successfully."
                    else:
                        actual_val = "No assertions provided."
                except AssertionError as ass_err:
                    tc_status = "failed"
                    tb_str = traceback.format_exc()
                    err_msg = tb_str
                    diff_msg = tb_str
                except Exception as ex:
                    tc_status = "error"
                    tb_str = traceback.format_exc()
                    err_msg = str(ex)
                    diff_msg = tb_str
                finally:
                    duration_ms = round((time.perf_counter() - t_start) * 1000.0, 3)
                    mem_curr, _ = tracemalloc.get_traced_memory()
                    memory_kb = round(max(0.0, (mem_curr - mem_start) / 1024.0), 2)
                    test_out = test_stdout_buf.getvalue()
                    sys.stdout = old_tc_stdout

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
                "score_percent": score_pct,
            }
            if failed_count > 0 or error_count > 0:
                result["success"] = False
                first_fail = next((tr for tr in test_results if tr["status"] in ("failed", "error") and tr.get("diff")), None)
                if first_fail and not result.get("traceback"):
                    result["traceback"] = first_fail.get("diff")
                    result["error"] = first_fail.get("error_message")

        # 3. Mode: BENCHMARK Execution
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
                if not tracemalloc.is_tracing():
                    try:
                        tracemalloc.start()
                    except Exception:
                        pass
                mem_start, _ = tracemalloc.get_traced_memory()

                t_bench_start = time.perf_counter()
                for _ in range(benchmark_iterations):
                    t0 = time.perf_counter_ns()
                    exec(compiled_stmt, bench_ns)
                    t1 = time.perf_counter_ns()
                    timings.append((t1 - t0) / 1_000_000.0)
                t_bench_end = time.perf_counter()

                mem_curr, mem_peak = tracemalloc.get_traced_memory()

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
                    "memory_diff_kb": round((mem_curr - mem_start) / 1024.0, 2),
                }
            except Exception as bench_ex:
                result["success"] = False
                result["status"] = "runtime_error"
                result["error"] = f"Benchmark Error: {str(bench_ex)}"
                result["traceback"] = traceback.format_exc()

        return result
    finally:
        result["stdout"] = captured_stdout.getvalue()
        result["stderr"] = captured_stderr.getvalue()
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        sys.stdin = old_stdin


def warm_worker_loop(pipe: mp.connection.Connection):
    """Main loop for the warm worker process. Pre-loads packages and processes requests."""
    # 1. Pre-warm NumPy, Pandas, Matplotlib
    try:
        import numpy as np
    except Exception:
        pass
    try:
        import pandas as pd
    except Exception:
        pass
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception:
        pass

    # 2. Pre-warm Scikit-Learn
    try:
        import sklearn
        import sklearn.model_selection
        import sklearn.preprocessing
        import sklearn.pipeline
        import sklearn.ensemble
    except Exception:
        pass

    # 3. Pre-warm PyTorch Core, NN, Optim, Autograd Dispatcher, and DataLoader
    try:
        import torch
        torch.set_num_threads(1)
        torch.set_num_interop_threads(1)
        import torch.nn as nn
        import torch.optim as optim
        from torch.utils.data import DataLoader, TensorDataset

        # Instantiate core layers and loss functions
        dummy_m = nn.Linear(2, 1)
        dummy_conv = nn.Conv2d(1, 1, 3)
        dummy_mse = nn.MSELoss()
        dummy_ce = nn.CrossEntropyLoss()

        # Instantiate optimizers (triggers first-time C++ dispatcher bindings)
        dummy_opt = optim.Adam(dummy_m.parameters(), lr=0.01)
        dummy_sgd = optim.SGD(dummy_m.parameters(), lr=0.01)

        # Trigger first forward, loss, backward, and optimizer steps to link dispatcher kernels into memory
        dummy_opt.zero_grad()
        dummy_out = dummy_m(torch.ones(1, 2))
        dummy_loss = dummy_mse(dummy_out, torch.zeros(1, 1))
        dummy_loss.backward()
        dummy_opt.step()
        dummy_sgd.step()

        # Pre-warm DataLoader iterator
        dummy_dl = DataLoader(TensorDataset(torch.ones(2, 2), torch.zeros(2, 1)), batch_size=1)
        for _ in dummy_dl:
            pass

        # Pre-warm activation and reduction functions
        _ = torch.softmax(torch.tensor([[1.0, 2.0]]), dim=-1)
        _ = torch.argmax(torch.tensor([[1.0, 2.0]]), dim=-1)
    except Exception:
        pass

    # Notify manager worker is ready
    pipe.send({"type": "ready"})

    while True:
        try:
            if not pipe.poll(0.05):
                continue
            msg = pipe.recv()
            if msg == "stop" or not isinstance(msg, dict):
                break

            res = run_harness_payload(msg)
            pipe.send({"type": "result", "data": res})
        except EOFError:
            break
        except Exception as e:
            try:
                pipe.send({
                    "type": "error",
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                })
            except Exception:
                pass
            break
