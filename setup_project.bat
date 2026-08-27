@echo off
echo ==========================================
echo   建立《北斗紅磚市場：時光修復師》專案結構
echo ==========================================

:: 建立目錄結構
echo 建立資料夾中...
mkdir assets
mkdir assets\images
mkdir assets\audio
mkdir js

:: 建立基礎檔案
echo 建立基礎檔案中...

:: 1. 主 HTML 檔
(
echo ^<!DOCTYPE html^>
echo ^<html lang="zh-Hant"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>北斗紅磚市場：時光修復師^</title^>
echo     ^<link rel="stylesheet" href="style.css"^>
echo ^</head^>
echo ^<body^>
echo     ^