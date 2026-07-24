# Project Eagle Prototype

Transporter IQ prototype for NGIC-style gas transportation performance monitoring, including shipper-centred accountability, supplier/GASCO delivery performance, sector utilisation, DGDR/DGDO reporting, line-pack monitoring, alerts, escalations, and AI-style recommendations.

## Run Locally

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python server.py
```

Then open:

```text
http://127.0.0.1:8765/
```

Keep the terminal window open while using the app. Closing the terminal stops the local server.

## Tests

```bash
.venv/bin/python -m unittest tests/test_transporter_intelligence.py
```

## Deploy (Render)

This app keeps all data in memory and writes uploads to local disk, so it needs to run
as a single long-lived process rather than stateless serverless functions. Render's
free web service tier fits that model with no code changes:

1. Push this repo to GitHub (already done).
2. In the Render dashboard: **New > Blueprint**, point it at this repo. Render will
   read `render.yaml` and provision the service automatically (build command
   `pip install -r requirements.txt`, start command `python server.py`).
3. Render sets a `PORT` env var; `server.py` already reads `HOST`/`PORT` from the
   environment and binds to `0.0.0.0` in production, `127.0.0.1:8765` locally.

Note: on the free tier the service spins down after periods of inactivity, and a
restart resets in-memory data and uploaded files — same as stopping/restarting
`server.py` locally. For real persistence, add a database/object storage backend.
