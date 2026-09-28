"""Stream shared database snapshots without blocking the ASGI event loop."""

import asyncio
import json
import logging


async def stream_updates(request, read_snapshot, interval=2):
    previous = None
    yield "retry: 3000\n\n"
    while not await request.is_disconnected():
        try:
            snapshot = await asyncio.to_thread(read_snapshot)
            serialized = json.dumps(snapshot, sort_keys=True)
            if serialized != previous:
                yield f"event: sync\ndata: {serialized}\n\n"
                previous = serialized
            else:
                yield ": heartbeat\n\n"
        except Exception:
            logging.getLogger(__name__).exception("Unable to read live database snapshot")
            yield ": database temporarily unavailable\n\n"
        await asyncio.sleep(interval)
