import json
import unittest

from backend.realtime import stream_updates


class RequestStub:
    disconnected = False

    async def is_disconnected(self):
        return self.disconnected


class StreamTests(unittest.IsolatedAsyncioTestCase):
    async def test_shared_writes_heartbeat_and_disconnect(self):
        state = {"reading": None, "soil": [], "plants": []}
        request = RequestStub()
        stream = stream_updates(request, lambda: dict(state), interval=0)
        self.assertIn("retry:", await anext(stream))
        initial = await anext(stream)
        self.assertEqual(json.loads(initial.split("data: ")[1]), state)
        self.assertIn("heartbeat", await anext(stream))
        # Simulate a write by another backend instance directly in shared state.
        state["reading"] = {"id": "new", "soil_moisture": 65}
        self.assertIn('"soil_moisture": 65', await anext(stream))
        state["plants"] = [{"id": "scan"}]
        self.assertIn('"scan"', await anext(stream))
        request.disconnected = True
        with self.assertRaises(StopAsyncIteration):
            await anext(stream)

    async def test_reconnect_sends_current_snapshot(self):
        state = {"reading": {"id": "latest"}}
        for _ in range(2):
            stream = stream_updates(RequestStub(), lambda: state, interval=0)
            await anext(stream)
            self.assertIn('"latest"', await anext(stream))
            await stream.aclose()

    async def test_recovers_after_database_error(self):
        calls = 0

        def read():
            nonlocal calls
            calls += 1
            if calls == 1:
                raise RuntimeError("temporary outage")
            return {"reading": {"id": "recovered"}}

        stream = stream_updates(RequestStub(), read, interval=0)
        await anext(stream)
        with self.assertLogs("backend.realtime", level="ERROR"):
            self.assertIn("temporarily unavailable", await anext(stream))
        self.assertIn('"recovered"', await anext(stream))
        await stream.aclose()
