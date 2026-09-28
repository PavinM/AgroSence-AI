# Live data on Render

The dashboard opens `/api/sync/stream` using Server-Sent Events. The backend
checks MongoDB every two seconds and sends a snapshot when the newest sensor
reading, soil prediction, or plant analysis changes. The browser updates readings
and refreshes history tables and charts. It reconnects automatically and retains
the existing periodic refresh as a fallback. This synchronizes the latest state;
it is not a delivery log of every intermediate reading.

## Configure your existing Render service

In Render's Environment settings, set:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | The complete Atlas URI with the real password, as in your local backend `.env` |
| `MONGODB_DATABASE` | `agrosence_ai` |
| `VITE_API_BASE_URL` | Empty for the combined service defined in `render.yaml` |

Use the same Atlas cluster and database for local and deployed backends. Local
`.env` files are ignored by Git and are not automatically uploaded to Render.
Never place MongoDB credentials in a variable beginning with `VITE_`: those
variables are exposed in the browser bundle.

If your frontend and backend use separate Render services, set
`VITE_API_BASE_URL` on the frontend to the backend's HTTPS URL and set
`ALLOWED_ORIGINS` on the backend to the frontend's origin. Rebuild the frontend
after changing its API URL.

In MongoDB Atlas Network Access, allow the outbound IP ranges shown by Render
for the backend service. Allowing your laptop's IP alone does not allow Render.
Save the environment settings and deploy the changed code. Existing services
need their environment variables set manually; `sync: false` in a Blueprint
prompts for a secret when creating a service, not when updating an existing one.

## Verify the deployment

Open `https://YOUR-SERVICE.onrender.com/api/health` and confirm `mongodb` is true.
Open the dashboard. In another terminal, inspect the stream:

```sh
curl -N https://YOUR-SERVICE.onrender.com/api/sync/stream
```

New sensor telemetry sent to `/api/sensors/readings` should appear on the open
dashboard after roughly two seconds plus network/database latency. Real devices
should send to the Render backend URL, rather than a laptop's private LAN IP.
The sample ESP32 firmware sends every ten seconds, so that is the sampling rate.
For HTTPS, configure a secure Wi-Fi client with an appropriate trusted CA in the
firmware before flashing it.

An Atlas outage currently invokes the app's existing in-memory fallback. Those
buffered writes are local to an instance and are not synchronized or replayed
into MongoDB. Verify `mongodb: true` before relying on durable synchronization.

Free Render services can sleep after 15 minutes without incoming traffic and
take about a minute to wake. A continuously available deployment requires an
instance that stays running.

References: [Render environment variables](https://render.com/docs/configure-environment-variables),
[Render outbound IPs](https://render.com/docs/outbound-ip-addresses),
[Render free services](https://render.com/docs/free),
[Atlas IP access lists](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/).
