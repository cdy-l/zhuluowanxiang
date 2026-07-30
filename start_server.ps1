$env:PYTHONPATH = "C:\Users\chang'dong'yu\Desktop\大三下小学期\code\backend"
Set-Location -LiteralPath "C:\Users\chang'dong'yu\Desktop\大三下小学期\code"
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
Read-Host "Press Enter to exit"
