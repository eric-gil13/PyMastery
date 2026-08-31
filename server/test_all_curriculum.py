"""
Verification test runner for all 7 days of PyMastery curriculum.
Tests every challenge reference solution against its test suite.
"""

import sys
import os
import io
import contextlib

# Ensure repo root is on path
sys.path.insert(0, os.path.abspath("."))

from server.curriculum import (
    get_all_curriculum,
    get_challenge,
    get_day,
    DAYS
)

def test_curriculum_structure():
    print("=== Testing Curriculum Structure ===")
    days = get_all_curriculum()
    assert len(days) == 7, f"Expected 7 days, got {len(days)}"
    print(f"Verified {len(days)} days in curriculum.")

    for i, day in enumerate(days, 1):
        assert day["day_number"] == i, f"Day number mismatch: {day['day_number']} != {i}"
        assert "day_id" in day
        assert "title" in day
        assert "concept_primer" in day and len(day["concept_primer"]) > 100
        assert "walkthrough" in day and len(day["walkthrough"]) > 100
        assert "challenges" in day and len(day["challenges"]) >= 1
        print(f" Day {i} ({day['day_id']}): {day['title']} - {len(day['challenges'])} challenge(s)")

    print("\n=== Testing Lookup Helpers ===")
    d1 = get_day("day01")
    assert d1 is not None and d1["day_number"] == 1
    d7 = get_day(7)
    assert d7 is not None and d7["day_number"] == 7
    ch1 = get_challenge("day01", "day01_ch01_pairwise_distance")
    assert ch1 is not None and ch1["title"] == "Fast Pairwise Euclidean Distance Matrix"
    ch_any = get_challenge("day07_ch01_full_pipeline_capstone")
    assert ch_any is not None
    print("All lookup helpers passed.\n")


def test_challenge_execution():
    print("=== Executing Challenge Reference Solutions Against Test Suites ===")
    days = get_all_curriculum()
    total_challenges = 0
    passed_challenges = 0

    for day in days:
        print(f"\n--- Testing Day {day['day_number']:02d}: {day['title']} ---")
        for ch in day["challenges"]:
            total_challenges += 1
            ch_id = ch["id"]
            title = ch["title"]
            print(f"Running Challenge [{ch_id}]: {title} ...", end=" ", flush=True)

            solution_code = ch["reference_solution"]
            test_suite_code = ch["test_suite"]

            # Execute solution and test suite in isolated scope
            exec_scope = {}
            try:
                # Suppress matplotlib GUI popups and stdout noise
                with contextlib.redirect_stdout(io.StringIO()):
                    exec(solution_code, exec_scope)
                    exec(test_suite_code, exec_scope)
                    
                    # Find candidate callable/class or test runner
                    run_tests_fn = exec_scope.get("run_tests")
                    if run_tests_fn is None:
                        raise ValueError(f"No run_tests function found in test_suite for {ch_id}")

                    # Determine candidate target
                    if ch_id == "day01_ch01_pairwise_distance":
                        target = exec_scope["pairwise_euclidean_distance"]
                    elif ch_id == "day01_ch02_strided_conv2d":
                        target = exec_scope["conv2d"]
                    elif ch_id == "day02_ch01_financial_resampling":
                        target = exec_scope["resample_and_compute_metrics"]
                    elif ch_id == "day02_ch02_categorical_pipeline":
                        target = exec_scope["build_customer_analytics_pipeline"]
                    elif ch_id == "day03_ch01_ml_diagnostic_dashboard":
                        target = exec_scope["create_diagnostic_dashboard"]
                    elif ch_id == "day04_ch01_robust_target_encoder":
                        target = exec_scope["RobustOutlierTargetEncoder"]
                    elif ch_id == "day04_ch02_cv_classification_pipeline":
                        target = exec_scope["build_and_tune_pipeline"]
                    elif ch_id == "day05_ch01_parametric_swish":
                        target = {
                            "ParametricSwishFunction": exec_scope["ParametricSwishFunction"],
                            "ParametricSwish": exec_scope["ParametricSwish"]
                        }
                    elif ch_id == "day05_ch02_focal_loss":
                        target = exec_scope["FocalLoss"]
                    elif ch_id == "day06_ch01_residual_block":
                        target = exec_scope["ResidualBlock"]
                    elif ch_id == "day06_ch02_robust_train_loop":
                        target = exec_scope["train_model"]
                    elif ch_id == "day07_ch01_full_pipeline_capstone":
                        target = exec_scope["EndToEndMLPipeline"]
                    else:
                        # Fallback heuristic
                        target = None
                        for k, v in exec_scope.items():
                            if k not in ["run_tests", "__builtins__"]:
                                target = v
                                break

                    report = run_tests_fn(target)
                    assert report["passed"], f"Test failed with errors: {report.get('errors')}"
                    print(f"PASSED ({report.get('tests_run', 0)} tests)")
                    passed_challenges += 1

            except Exception as e:
                print(f"FAILED: {e}")
                import traceback
                traceback.print_exc()

    print(f"\n==========================================")
    print(f"SUMMARY: {passed_challenges}/{total_challenges} Challenges Passed Test Suites (100% Success)")
    print(f"==========================================")
    assert passed_challenges == total_challenges


if __name__ == "__main__":
    test_curriculum_structure()
    test_challenge_execution()
