# Python Server Guide for Windows

## The Problem
You always fail to run Python server because on Windows, Python uses the `py` launcher, not the `python` command.

## The Solution

### ❌ Don't use this (doesn't work on Windows):
```bash
python -m http.server 8000
```

### ✅ Use this instead (works on Windows):
```bash
py -m http.server 8000
```

## Quick Commands

### Start the server:
```bash
py -m http.server 8000
```

### Start on a different port:
```bash
py -m http.server 3000
```

### Start and specify host (for network access):
```bash
py -m http.server 8000 --bind 0.0.0.0
```

## Why This Happens
- On Windows, Python is installed with the `py` launcher
- The `python` command is not available by default
- The `py` launcher automatically finds and uses the correct Python version

## Alternative Solutions
If you want to use `python` command, you can:
1. Add Python to your PATH environment variable
2. Use the full path to python.exe
3. Create an alias in your PowerShell profile

## Test Your Server
After starting the server, open your browser and go to:
- `http://localhost:8000` (or whatever port you specified)

## Stop the Server
Press `Ctrl+C` in the terminal to stop the server. 