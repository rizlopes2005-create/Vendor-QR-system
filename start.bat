@echo off
echo Starting Vendor QR System...

:: Start Backend in a new window
echo Starting Backend on port 8000...
start cmd /k "cd backend && .\venv\Scripts\python -m uvicorn main:app --reload --port 8000"

:: Start Frontend in a new window
echo Starting Frontend on port 8080...
start cmd /k "cd frontend && npx http-server -p 8080"

echo.
echo ==========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:8080
echo ==========================================
echo.
pause
