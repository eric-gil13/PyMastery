import asyncio
import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from server.ai_tutor import ai_tutor
from server.models import AITutorChatRequest, AITestConnectionRequest


class TestGeminiAITutor(unittest.TestCase):
    def test_key_and_model_resolution(self):
        # 1. AI Studio key auto-detection
        key = "AIzaSy_fake_test_key_12345"
        resolved_key, provider, model, _ = ai_tutor._resolve_key_and_provider(
            req_key=key, req_provider="auto", req_model=None
        )
        self.assertEqual(provider, "gemini")
        self.assertEqual(model, "gemini-3.6-flash")
        self.assertEqual(resolved_key, key)

        # 2. General AIza key prefix
        key2 = "AIzaNotSy_something_else"
        _, provider2, model2, _ = ai_tutor._resolve_key_and_provider(
            req_key=key2, req_provider="auto", req_model=None
        )
        self.assertEqual(provider2, "gemini")
        self.assertEqual(model2, "gemini-3.6-flash")

        # 3. Explicit custom model
        _, provider3, model3, _ = ai_tutor._resolve_key_and_provider(
            req_key=key, req_provider="gemini", req_model="custom-exp-model"
        )
        self.assertEqual(model3, "custom-exp-model")

    def test_gemini_turn_sanitization_and_success(self):
        async def run():
            req = AITutorChatRequest(
                user_api_key="AIzaFakeKey",
                provider="gemini",
                messages=[
                    {"role": "assistant", "content": "Hey! I am your mentor."},
                    {"role": "user", "content": "How do I optimize this?"},
                ],
                question="How do I optimize this?",
                challenge_title="Euclidean Distance Matrix"
            )

            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "You can vectorize it with A @ B.T."}]
                        }
                    }
                ]
            }

            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_resp
                resp = await ai_tutor.tutor_chat(req)

                self.assertEqual(resp.provider_used, "gemini (gemini-3.6-flash)")
                self.assertEqual(resp.reply, "You can vectorize it with A @ B.T.")
                self.assertIsNone(resp.error_message)

                # Verify payload sent to Gemini: first turn must be 'user', not 'model'
                called_payload = mock_post.call_args.kwargs["json"]
                contents = called_payload["contents"]
                self.assertEqual(contents[0]["role"], "user")
                self.assertEqual(contents[0]["parts"][0]["text"], "How do I optimize this?")

        asyncio.run(run())

    def test_gemini_error_propagation(self):
        async def run():
            req = AITutorChatRequest(
                user_api_key="AIzaBadKey",
                provider="gemini",
                messages=[{"role": "user", "content": "Test"}],
                question="Test",
                challenge_title="Euclidean Distance Matrix"
            )

            mock_resp = MagicMock()
            mock_resp.status_code = 400
            mock_resp.text = '{"error": {"message": "API key not valid."}}'
            mock_resp.json.return_value = {"error": {"message": "API key not valid."}}

            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_resp
                resp = await ai_tutor.tutor_chat(req)

                self.assertEqual(resp.provider_used, "offline_ast_fallback")
                self.assertIsNotNone(resp.error_message)
                self.assertIn("Gemini API error (400)", resp.error_message)
                self.assertIn("API key not valid", resp.error_message)

        asyncio.run(run())

    def test_test_connection_endpoint(self):
        async def run():
            # Test success
            mock_ok_resp = MagicMock()
            mock_ok_resp.status_code = 200

            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_ok_resp
                res = await ai_tutor.test_connection(
                    AITestConnectionRequest(user_api_key="AIzaValid", provider="gemini")
                )
                self.assertTrue(res.success)
                self.assertIn("Successfully connected", res.message)

            # Test failure
            mock_err_resp = MagicMock()
            mock_err_resp.status_code = 403
            mock_err_resp.json.return_value = {"error": {"message": "Permission denied"}}
            mock_err_resp.text = "Permission denied"

            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_err_resp
                res2 = await ai_tutor.test_connection(
                    AITestConnectionRequest(user_api_key="AIzaBad", provider="gemini")
                )
                self.assertFalse(res2.success)
                self.assertIn("403", res2.message)
                self.assertIn("Permission denied", res2.message)

        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
