"""AI Tutor & Senior Code Reviewer for PyMastery with multi-provider LLM support, BYOK routing, and AST analysis."""

from __future__ import annotations
import ast
import json
import logging
import os
import pathlib
import re
from typing import Any, Dict, List, Optional, Tuple

import httpx
from server.models import (
    AIReviewRequest,
    AITestConnectionRequest,
    AITestConnectionResponse,
    AITutorChatRequest,
    AITutorResponse,
    CodeReviewFeedback,
)

logger = logging.getLogger("pymastery.ai_tutor")
logging.basicConfig(level=logging.INFO)


class ASTCodeAnalyzer:

    """Performs deep AST and heuristic static code analysis to generate senior code reviews."""

    def analyze(self, code: str, title: Optional[str] = None) -> CodeReviewFeedback:
        strengths = []
        improvements = []
        idiomatic_python = []
        pitfalls = []
        score = 8
        time_complexity = "O(N)"
        space_complexity = "O(1)"

        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return CodeReviewFeedback(
                score=2,
                summary=f"Code has syntax errors and cannot be parsed: {e.msg} on line {e.lineno}.",
                strengths=[],
                improvements=[f"Fix syntax error on line {e.lineno}: {e.msg}"],
                complexity={"time": "N/A", "space": "N/A"},
                idiomatic_python=["Ensure code is valid Python 3 syntax."],
                security_or_pitfalls=["Syntax error prevents execution."]
            )

        functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]

        if classes:
            strengths.append(f"Clean Object-Oriented design with `{classes[0].name}`.")
            dunders = [f.name for c in classes for f in c.body if isinstance(f, ast.FunctionDef) and f.name.startswith("__")]
            if dunders:
                strengths.append(f"Effective use of special dunder methods: {', '.join(dunders)}.")

        if functions:
            has_type_hints = any(f.returns or any(arg.annotation for arg in f.args.args) for f in functions)
            if has_type_hints:
                strengths.append("Clean type annotations improve maintainability and contracts.")
                score += 1
            else:
                improvements.append("Consider adding type annotations for clearer function contracts.")

            has_docstrings = any(ast.get_docstring(f) for f in functions)
            if has_docstrings:
                strengths.append("Descriptive docstrings documenting parameters.")
            else:
                idiomatic_python.append("Add docstrings explaining the function's algorithmic purpose.")

        for node in ast.walk(tree):
            if isinstance(node, ast.For):
                if isinstance(node.iter, ast.Call) and getattr(node.iter.func, "id", None) == "range":
                    if node.iter.args and isinstance(node.iter.args[0], ast.Call) and getattr(node.iter.args[0].func, "id", None) == "len":
                        improvements.append(f"Line {node.lineno}: Avoid `range(len(...))`. Use `enumerate(...)` if indices are needed, or iterate directly.")
                        idiomatic_python.append("Prefer `for idx, item in enumerate(seq):` over `for i in range(len(seq)):`.")
                        score -= 1

        for node in ast.walk(tree):
            if isinstance(node, ast.ExceptHandler):
                if node.type is None:
                    pitfalls.append(f"Line {node.lineno}: Bare `except:` catches system-exiting exceptions. Use `except Exception:` or specific error types.")
                    score -= 1

        max_loop_depth = 0
        def get_loop_depth(node, depth=0):
            nonlocal max_loop_depth
            if isinstance(node, (ast.For, ast.While, ast.ListComp, ast.DictComp, ast.SetComp, ast.GeneratorExp)):
                depth += 1
                max_loop_depth = max(max_loop_depth, depth)
            for child in ast.iter_child_nodes(node):
                get_loop_depth(child, depth)

        get_loop_depth(tree)
        if max_loop_depth == 0:
            time_complexity = "O(1)"
        elif max_loop_depth == 1:
            time_complexity = "O(N)"
            strengths.append("Linear time complexity with single-pass iteration.")
        elif max_loop_depth == 2:
            time_complexity = "O(N^2)"
            improvements.append("Nested loops detected. Look for vectorized array broadcasting to eliminate loops.")
            score -= 1
        else:
            time_complexity = f"O(N^{max_loop_depth})"
            improvements.append(f"High loop depth ({max_loop_depth}). Consider refactoring into vectorized matrix operations.")
            score -= 2

        score = max(1, min(10, score))
        summary = f"Code structure is solid. Estimated time complexity is {time_complexity}. "
        if improvements:
            summary += f"Key recommendation: {improvements[0]}"
        else:
            summary += "Follows Pythonic idioms well with clean structure."

        return CodeReviewFeedback(
            score=score,
            summary=summary,
            strengths=strengths or ["Clean and functional Python implementation."],
            improvements=improvements or ["No major flaws detected."],
            complexity={"time": time_complexity, "space": space_complexity},
            idiomatic_python=idiomatic_python or ["Follows idiomatic conventions."],
            security_or_pitfalls=pitfalls or None
        )


class AITutorService:
    """Provides senior code reviews, hints, and peer mentoring across Gemini, OpenAI, Groq, DeepSeek, and AST."""

    def __init__(self):
        self.analyzer = ASTCodeAnalyzer()
        self._load_env()

    def _load_env(self):
        """Loads environment variables from root .env if present."""
        env_file = pathlib.Path(__file__).resolve().parent.parent / ".env"
        if env_file.exists():
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if "=" in line and not line.startswith("#"):
                            k, v = line.split("=", 1)
                            os.environ[k.strip()] = v.strip().strip("'\"")
            except Exception as e:
                logger.warning("Failed reading .env file: %s", e)

    def _resolve_key_and_provider(
        self,
        req_key: Optional[str] = None,
        req_provider: Optional[str] = None,
        req_model: Optional[str] = None,
        req_base_url: Optional[str] = None,
    ) -> Tuple[Optional[str], str, str, Optional[str]]:
        """Resolves API key, provider, model, and custom endpoint URL based on user BYOK or server defaults."""
        self._load_env()

        custom_url = (
            req_base_url
            or os.environ.get("CUSTOM_LLM_URL")
            or os.environ.get("LOCAL_LLM_URL")
            or os.environ.get("OPENAI_BASE_URL")
        )
        if custom_url:
            custom_url = custom_url.strip()

        # 1. Custom / Local network provider requested or custom URL provided
        if req_provider in ("custom", "qwen", "ollama", "vllm", "local") or (custom_url and req_provider not in ("gemini", "groq", "deepseek", "openai")):
            api_key = req_key.strip() if req_key and req_key.strip() else os.environ.get("CUSTOM_LLM_KEY", "local-key")
            provider = "custom"
            model = (
                req_model.strip() if req_model and req_model.strip()
                else os.environ.get("CUSTOM_LLM_MODEL", "qwen2.5-coder-32b")
            )
            return api_key, provider, model, custom_url

        # 2. User provided a BYOK key in request or header
        if req_key and req_key.strip():
            api_key = req_key.strip()
            if req_provider and req_provider not in ("auto", "mock"):
                provider = req_provider.lower()
            elif api_key.startswith("AIza"):
                provider = "gemini"
            elif api_key.startswith("sk-ant"):
                provider = "anthropic"
            elif api_key.startswith("gsk_"):
                provider = "groq"
            else:
                provider = "openai"
        else:
            # 3. Use server-configured environment keys
            gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
            openai_key = os.environ.get("OPENAI_API_KEY")
            groq_key = os.environ.get("GROQ_API_KEY")
            deepseek_key = os.environ.get("DEEPSEEK_API_KEY")

            if req_provider == "gemini" and gemini_key:
                api_key, provider = gemini_key, "gemini"
            elif req_provider == "openai" and openai_key:
                api_key, provider = openai_key, "openai"
            elif req_provider == "groq" and groq_key:
                api_key, provider = groq_key, "groq"
            elif req_provider == "deepseek" and deepseek_key:
                api_key, provider = deepseek_key, "deepseek"
            elif gemini_key:
                api_key, provider = gemini_key, "gemini"
            elif openai_key:
                api_key, provider = openai_key, "openai"
            elif groq_key:
                api_key, provider = groq_key, "groq"
            elif deepseek_key:
                api_key, provider = deepseek_key, "deepseek"
            elif custom_url:
                api_key, provider = os.environ.get("CUSTOM_LLM_KEY", "local-key"), "custom"
            else:
                api_key, provider = None, "mock"

        # Default model selection
        if req_model and req_model.strip():
            model = req_model.strip()
        elif provider == "gemini":
            model = "gemini-3.6-flash"
        elif provider == "groq":
            model = "llama-3.3-70b-versatile"
        elif provider == "deepseek":
            model = "deepseek-chat"
        elif provider == "openai":
            model = "gpt-4o-mini"
        elif provider == "custom":
            model = os.environ.get("CUSTOM_LLM_MODEL", "qwen2.5-coder-32b")
        else:
            model = "offline-ast"

        return api_key, provider, model, custom_url

    def _normalize_chat_endpoint(self, base_url: str) -> str:
        """Constructs a standard OpenAI-compatible chat completions endpoint from a base URL."""
        url = base_url.strip().rstrip("/")
        if url.endswith("/chat/completions"):
            return url
        if url.endswith("/v1"):
            return f"{url}/chat/completions"
        return f"{url}/v1/chat/completions"

    async def review_code(self, req: AIReviewRequest) -> CodeReviewFeedback:
        api_key, provider, model, custom_url = self._resolve_key_and_provider(
            req.user_api_key, req.provider, req.model, req.base_url
        )

        if not api_key or provider == "mock":
            return self.analyzer.analyze(req.code, req.challenge_title)

        prompt = f"""You are a Principal Python Architect conducting a code review for a fellow senior engineer.
Challenge: {req.challenge_title or req.challenge_id or 'Python Challenge'}
Challenge Description: {req.challenge_description or 'N/A'}

User's Code:
```python
{req.code}
```

Review this code with a pragmatic, senior peer tone. Focus on expressiveness, idiomatic Python patterns, and vectorization.
Respond ONLY with a valid JSON matching this schema:
{{
  "score": <integer from 1 to 10>,
  "summary": "<2-3 sentence executive assessment in natural mentor voice>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>"],
  "complexity": {{"time": "<e.g. O(N)>", "space": "<e.g. O(1)>"}},
  "idiomatic_python": ["<idiom recommendation 1>", "<idiom recommendation 2>"],
  "security_or_pitfalls": ["<potential pitfall if any>"]
}}
"""
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                if provider == "gemini":
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                    resp = await client.post(
                        url,
                        json={"contents": [{"parts": [{"text": prompt}]}]},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        text_resp = data["candidates"][0]["content"]["parts"][0]["text"]
                        json_match = re.search(r"\{.*\}", text_resp, re.DOTALL)
                        if json_match:
                            parsed = json.loads(json_match.group(0))
                            parsed["provider_used"] = f"gemini ({model})"
                            return CodeReviewFeedback(**parsed)
                    else:
                        logger.warning("Gemini review API returned status %s: %s", resp.status_code, resp.text)

                elif provider in ("openai", "groq", "deepseek", "custom"):
                    if provider == "custom" and custom_url:
                        endpoint = self._normalize_chat_endpoint(custom_url)
                    elif provider == "groq":
                        endpoint = "https://api.groq.com/openai/v1/chat/completions"
                    elif provider == "deepseek":
                        endpoint = "https://api.deepseek.com/chat/completions"
                    else:
                        endpoint = "https://api.openai.com/v1/chat/completions"

                    headers = {"Content-Type": "application/json"}
                    if api_key and api_key != "local-key":
                        headers["Authorization"] = f"Bearer {api_key}"

                    payload: Dict[str, Any] = {
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                    }
                    if provider in ("openai", "groq", "deepseek"):
                        payload["response_format"] = {"type": "json_object"}

                    resp = await client.post(
                        endpoint,
                        headers=headers,
                        json=payload,
                    )
                    if resp.status_code == 200:
                        content_str = resp.json()["choices"][0]["message"]["content"]
                        json_match = re.search(r"\{.*\}", content_str, re.DOTALL)
                        if json_match:
                            parsed = json.loads(json_match.group(0))
                            parsed["provider_used"] = f"{provider} ({model})"
                            return CodeReviewFeedback(**parsed)
                    else:
                        logger.warning("%s review API returned status %s: %s", provider, resp.status_code, resp.text)
        except Exception as e:
            logger.error("AI code review error: %s", e)

        return self.analyzer.analyze(req.code, req.challenge_title)

    async def tutor_chat(self, req: AITutorChatRequest) -> AITutorResponse:
        api_key, provider, model, custom_url = self._resolve_key_and_provider(
            req.user_api_key, req.provider, req.model, req.base_url
        )

        if req.question:
            latest_message = req.question
        elif req.messages:
            latest_message = req.messages[-1].get("content", "")
        elif req.chat_history:
            latest_message = req.chat_history[-1].get("content", "")
        else:
            latest_message = "How can I improve my code?"

        user_code = req.code or req.user_code or ""

        if not api_key or provider == "mock":
            return self._generate_dynamic_fallback_response(req, latest_message)

        system_prompt = (
            "You are a friendly, pragmatic Principal Python Engineer pairing with a fellow senior developer. "
            "Speak naturally like a peer over coffee—direct, helpful, and insightful. "
            "Format mathematical expressions cleanly using inline KaTeX notation like `$A$` or `$\\|a - b\\|^2$` "
            "and display math `$$...$$` for multi-line derivations. "
            "Use clear, syntax-highlighted code snippets (```python) and structured bullet points. "
            "Focus on memory layout, vectorization, PyTorch/NumPy idioms, and C-level performance tradeoffs."
        )

        context = f"Current Challenge: {req.challenge_title or req.challenge_id or 'Python Data Science'}\n"
        if req.challenge_description:
            context += f"Description: {req.challenge_description}\n"
        if user_code:
            context += f"Student's Code:\n```python\n{user_code}\n```\n"
        if req.current_error:
            context += f"Encountered Error / Test Failure:\n{req.current_error}\n"

        history = req.messages or req.chat_history or []
        conversation_turns: List[Dict[str, str]] = []
        for msg in history[-6:]:
            role = "assistant" if msg.get("role") in ("assistant", "model", "bot") else "user"
            content = msg.get("content", "").strip()
            if content:
                conversation_turns.append({"role": role, "content": content})

        if not conversation_turns or conversation_turns[-1]["content"] != latest_message:
            conversation_turns.append({"role": "user", "content": latest_message})

        error_detail: Optional[str] = None
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                if provider == "gemini":
                    # Gemini requires contents to begin with 'user' and alternate roles
                    gemini_contents = []
                    for turn in conversation_turns:
                        g_role = "model" if turn["role"] == "assistant" else "user"
                        if not gemini_contents and g_role == "model":
                            continue  # Drop initial model turns
                        if gemini_contents and gemini_contents[-1]["role"] == g_role:
                            gemini_contents[-1]["parts"][0]["text"] += f"\n\n{turn['content']}"
                        else:
                            gemini_contents.append({"role": g_role, "parts": [{"text": turn["content"]}]})

                    if not gemini_contents:
                        gemini_contents = [{"role": "user", "parts": [{"text": latest_message}]}]

                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                    payload: Dict[str, Any] = {
                        "contents": gemini_contents,
                        "systemInstruction": {
                            "parts": [{"text": f"{system_prompt}\n\n{context}"}]
                        },
                    }
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        candidates = resp.json().get("candidates", [])
                        if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                            text = candidates[0]["content"]["parts"][0]["text"]
                            return AITutorResponse(
                                reply=text,
                                hints=["Analyze array dimensions & strides", "Avoid python-level iterations in hot paths"],
                                suggested_actions=["Run Test Suite (Ctrl+Enter)", "Inspect Visualizer & Benchmarks"],
                                provider_used=f"gemini ({model})"
                            )
                        else:
                            error_detail = "Gemini returned an empty candidate response."
                    else:
                        try:
                            err_msg = resp.json().get("error", {}).get("message", resp.text)
                        except Exception:
                            err_msg = resp.text
                        error_detail = f"Gemini API error ({resp.status_code}): {err_msg}"
                        logger.warning("Gemini chat API returned status %s: %s", resp.status_code, resp.text)

                elif provider in ("openai", "groq", "deepseek", "custom"):
                    if provider == "custom" and custom_url:
                        endpoint = self._normalize_chat_endpoint(custom_url)
                    elif provider == "groq":
                        endpoint = "https://api.groq.com/openai/v1/chat/completions"
                    elif provider == "deepseek":
                        endpoint = "https://api.deepseek.com/chat/completions"
                    else:
                        endpoint = "https://api.openai.com/v1/chat/completions"

                    headers = {"Content-Type": "application/json"}
                    if api_key and api_key != "local-key":
                        headers["Authorization"] = f"Bearer {api_key}"

                    openai_messages = [{"role": "system", "content": f"{system_prompt}\n\n{context}"}]
                    for turn in conversation_turns:
                        openai_messages.append({"role": turn["role"], "content": turn["content"]})

                    resp = await client.post(
                        endpoint,
                        headers=headers,
                        json={
                            "model": model,
                            "messages": openai_messages,
                            "temperature": 0.7,
                        },
                    )
                    if resp.status_code == 200:
                        text = resp.json()["choices"][0]["message"]["content"]
                        return AITutorResponse(
                            reply=text,
                            hints=["Analyze array dimensions & strides", "Avoid python-level iterations in hot paths"],
                            suggested_actions=["Run Test Suite (Ctrl+Enter)", "Inspect Visualizer & Benchmarks"],
                            provider_used=f"{'qwen/custom' if provider == 'custom' else provider} ({model})"
                        )
                    else:
                        try:
                            err_msg = resp.json().get("error", {}).get("message", resp.text)
                        except Exception:
                            err_msg = resp.text
                        error_detail = f"{provider.capitalize()} API error ({resp.status_code}): {err_msg}"
                        logger.warning("%s chat API returned status %s: %s", provider, resp.status_code, resp.text)
        except Exception as e:
            error_detail = f"AI Tutor runtime error: {e}"
            logger.error("AI Tutor chat error: %s", e)

        fallback = self._generate_dynamic_fallback_response(req, latest_message)
        if error_detail:
            fallback.error_message = error_detail
        return fallback

    async def test_connection(self, req: AITestConnectionRequest) -> AITestConnectionResponse:
        """Lightweight connectivity ping to validate API keys and model availability."""
        api_key, provider, model, custom_url = self._resolve_key_and_provider(
            req.user_api_key, req.provider, req.model, req.base_url
        )
        if not api_key or provider == "mock":
            return AITestConnectionResponse(
                success=False,
                provider=provider,
                model=model,
                message="No API key provided or detected. Please enter a valid API key."
            )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                if provider == "gemini":
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                    resp = await client.post(
                        url,
                        json={"contents": [{"role": "user", "parts": [{"text": "Hello, ping test."}]}]}
                    )
                    if resp.status_code == 200:
                        return AITestConnectionResponse(
                            success=True,
                            provider=provider,
                            model=model,
                            message=f"Successfully connected to Gemini API with model '{model}'!"
                        )
                    else:
                        try:
                            err_msg = resp.json().get("error", {}).get("message", resp.text)
                        except Exception:
                            err_msg = resp.text
                        return AITestConnectionResponse(
                            success=False,
                            provider=provider,
                            model=model,
                            message=f"Gemini error ({resp.status_code}): {err_msg}"
                        )
                elif provider in ("openai", "groq", "deepseek", "custom"):
                    if provider == "custom" and custom_url:
                        endpoint = self._normalize_chat_endpoint(custom_url)
                    elif provider == "groq":
                        endpoint = "https://api.groq.com/openai/v1/chat/completions"
                    elif provider == "deepseek":
                        endpoint = "https://api.deepseek.com/chat/completions"
                    else:
                        endpoint = "https://api.openai.com/v1/chat/completions"

                    headers = {"Content-Type": "application/json"}
                    if api_key and api_key != "local-key":
                        headers["Authorization"] = f"Bearer {api_key}"

                    resp = await client.post(
                        endpoint,
                        headers=headers,
                        json={
                            "model": model,
                            "messages": [{"role": "user", "content": "Hello, ping test."}],
                            "max_tokens": 10,
                        }
                    )
                    if resp.status_code == 200:
                        return AITestConnectionResponse(
                            success=True,
                            provider=provider,
                            model=model,
                            message=f"Successfully connected to {provider.capitalize()} with model '{model}'!"
                        )
                    else:
                        try:
                            err_msg = resp.json().get("error", {}).get("message", resp.text)
                        except Exception:
                            err_msg = resp.text
                        return AITestConnectionResponse(
                            success=False,
                            provider=provider,
                            model=model,
                            message=f"{provider.capitalize()} error ({resp.status_code}): {err_msg}"
                        )
                else:
                    return AITestConnectionResponse(
                        success=False,
                        provider=provider,
                        model=model,
                        message=f"Unsupported provider: '{provider}'."
                    )
        except Exception as e:
            return AITestConnectionResponse(
                success=False,
                provider=provider,
                model=model,
                message=f"Network connection failed: {str(e)}"
            )

    def _generate_dynamic_fallback_response(self, req: AITutorChatRequest, query: str) -> AITutorResponse:
        """Dynamic, topic-aware offline mentor fallback when no LLM API is reachable."""
        title = req.challenge_title or "this challenge"
        q = query.lower()
        code = req.code or req.user_code or ""
        error = req.current_error or ""

        # Check topic domain
        is_pandas = "pandas" in title.lower() or "dataframe" in title.lower() or "series" in title.lower() or "d2" in str(req.challenge_id)
        is_torch = "torch" in title.lower() or "autograd" in title.lower() or "tensor" in title.lower() or "nn" in title.lower() or "d3" in str(req.challenge_id) or "d5" in str(req.challenge_id)
        is_plot = "plot" in title.lower() or "matplotlib" in title.lower() or "chart" in title.lower()

        if error or "fail" in q or "error" in q:
            if is_pandas:
                reply = (
                    f"Let's troubleshoot **{title}**.\n\n"
                    f"In Pandas, errors usually stem from:\n"
                    f"1. **Index Alignment**: Arithmetic between two Series with different indices results in `NaN`s.\n"
                    f"2. **Chained Indexing (`SettingWithCopyWarning`)**: Use `.loc[row_indexer, col_indexer]` instead of `df[a][b]`.\n"
                    f"3. **Aggregation Reductions**: Ensure `.groupby(...)` applies `.agg()` or `.transform()` depending on whether you want a collapsed or broadcasted shape."
                )
            elif is_torch:
                reply = (
                    f"Let's look at the failure in **{title}**.\n\n"
                    f"With PyTorch Autograd:\n"
                    f"1. **Graph Break**: Calling `.numpy()`, `.item()`, or in-place mutations (`x += y`, `x[0] = ...`) detaches tensors from the computation graph.\n"
                    f"2. **Tensor Broadcasting**: Ensure batch dimensions match before performing operations like `torch.matmul` or matrix multiplies.\n"
                    f"3. **Saved Context**: In custom `autograd.Function`, remember that `ctx.save_for_backward` only takes tensors."
                )
            else:
                reply = (
                    f"Let's look at why that failed in **{title}**.\n\n"
                    f"When debugging vectorized Python code:\n"
                    f"1. **Shape Verification**: Check intermediate shapes using `print('Shape:', arr.shape)`.\n"
                    f"2. **Reduction Axes**: Verify whether your aggregation (`sum`, `mean`) needs `axis=-1` (across features) or `axis=0` (across samples).\n"
                    f"3. **Numerical Stability**: When taking `sqrt` or `log`, guard against negative or zero values with `np.maximum(x, 0.0)`."
                )
        elif "hint" in q or "nudge" in q:
            if is_pandas:
                reply = (
                    f"Here's a strategic hint for **{title}**:\n\n"
                    f"Instead of row-by-row iteration (`.iterrows()` or `.apply()`), think in **columnar vectors**.\n"
                    f"Can you express this transformation using boolean masks (`df['col'] > 0`) or `.where()` / `.map()`?"
                )
            elif is_torch:
                reply = (
                    f"Here's a strategic hint for **{title}**:\n\n"
                    f"Write down the forward mathematical formulation first, then compute the Vector-Jacobian Product (VJP) for the backward pass using the chain rule.\n"
                    f"Avoid creating intermediate detached tensors to keep backprop lightning fast!"
                )
            else:
                reply = (
                    f"Here's a strategic hint for **{title}**:\n\n"
                    f"Think about **tensor shapes** rather than indices:\n"
                    f"- Input shape: `(N, D)`\n"
                    f"- Target output shape: What dimensions are being combined or expanded?\n"
                    f"- Inserting a singleton axis (`[:, None]`) allows NumPy to broadcast arrays without copying data."
                )
        elif "fast" in q or "speed" in q or "optimi" in q:
            reply = (
                f"To hit Gold medal performance in **{title}**:\n\n"
                f"1. **Eliminate Python Iteration**: Replace all `for` loops with compiled C/SIMD array primitives.\n"
                f"2. **Memory Locality**: Ensure arrays are C-contiguous (`np.ascontiguousarray`) for optimal CPU cache line pre-fetching.\n"
                f"3. **BLAS Acceleration**: Utilize matrix multiplications (`@` or `torch.matmul`) to trigger multi-threaded AVX-512 SIMD execution."
            )
        else:
            reply = (
                f"You're working on **{title}**.\n\n"
                f"The core goal here is writing idiomatic, high-throughput Python without resorting to slow interpreter loops.\n\n"
                f"Try implementing your solution and hitting **Run / Test** (or Ctrl+Enter). I can analyze your code structure, memory layout, and execution benchmarks as you iterate!"
            )

        return AITutorResponse(
            reply=reply,
            hints=["Check reduction axes and tensor shapes.", "Eliminate explicit loops in favor of vectorized operations."],
            provider_used="offline_ast_fallback",
        )


ai_tutor = AITutorService()
