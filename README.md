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
