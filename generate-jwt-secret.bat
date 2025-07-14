@echo off
echo ========================================
echo JWT Secret Key Generator
echo ========================================
echo.

echo Generating a secure JWT secret key...
echo.

REM Try different methods to generate the key
echo Method 1: Using PowerShell...
powershell -Command "[System.Web.Security.Membership]::GeneratePassword(64, 10)" 2>nul
if %errorlevel% equ 0 (
    echo.
    echo Method 1 successful!
    goto :end
)

echo Method 1 failed, trying Method 2...
echo Method 2: Using Node.js...
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))" 2>nul
if %errorlevel% equ 0 (
    echo.
    echo Method 2 successful!
    goto :end
)

echo Method 2 failed, trying Method 3...
echo Method 3: Using Python...
python -c "import secrets; print(secrets.token_urlsafe(64))" 2>nul
if %errorlevel% equ 0 (
    echo.
    echo Method 3 successful!
    goto :end
)

echo.
echo All automatic methods failed.
echo.
echo Please generate a JWT secret key manually using one of these methods:
echo.
echo 1. OpenSSL (recommended):
echo    openssl rand -base64 64
echo.
echo 2. Online generator:
echo    https://generate-secret.vercel.app/64
echo.
echo 3. PowerShell:
echo    [System.Web.Security.Membership]::GeneratePassword(64, 10)
echo.
echo 4. Node.js:
echo    node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
echo.
echo 5. Python:
echo    python -c "import secrets; print(secrets.token_urlsafe(64))"
echo.

:end
echo.
echo ========================================
echo Instructions:
echo ========================================
echo 1. Copy the generated secret key above
echo 2. Replace the SecretKey in backend/appsettings.json
echo 3. Set the same key in Azure App Service settings
echo 4. Keep this key secure and never commit it to git
echo.
echo ========================================
pause 