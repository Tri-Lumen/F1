; ============================================================================
;  F1 Dashboard — NSIS Bootstrapper Installer
;
;  Builds a tiny .exe that downloads and runs the latest release from GitHub.
;  This installer only needs to be built once — it always fetches the latest.
; ============================================================================

!include "MUI2.nsh"
!include "nsDialogs.nsh"

; ---- General settings -------------------------------------------------------
Name "F1 Dashboard Installer"
OutFile "F1-Dashboard-WebInstaller.exe"
InstallDir "$TEMP\F1-Dashboard-Install"
RequestExecutionLevel user
ShowInstDetails show

; ---- Branding ----------------------------------------------------------------
!define MUI_ICON "..\build\icon.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "F1 Dashboard — Online Installer"
!define MUI_WELCOMEPAGE_TEXT "This installer will download and install the latest version of F1 Dashboard from GitHub.$\r$\n$\r$\nNo internet connection is required after the initial install — the app will auto-update itself.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_TITLE "Download Complete"
!define MUI_FINISHPAGE_TEXT "The F1 Dashboard installer has been downloaded and launched.$\r$\n$\r$\nFollow the prompts in the main installer to complete setup."

; ---- Pages -------------------------------------------------------------------
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; ---- Variables ---------------------------------------------------------------
Var PowerShellPath

; ---- Installer section -------------------------------------------------------
Section "Install"
    SetOutPath $INSTDIR

    ; Find PowerShell
    StrCpy $PowerShellPath "$WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
    IfFileExists $PowerShellPath found_ps 0

    ; Try pwsh (PowerShell Core)
    StrCpy $PowerShellPath "pwsh.exe"
    found_ps:

    ; Write the bootstrapper script to temp
    DetailPrint "Preparing bootstrapper..."
    SetOutPath $INSTDIR
    File "install-windows.ps1"

    ; Execute the PowerShell bootstrapper
    DetailPrint "Downloading latest F1 Dashboard release..."
    nsExec::ExecToLog '$PowerShellPath -ExecutionPolicy Bypass -NoProfile -File "$INSTDIR\install-windows.ps1"'
    Pop $0

    ; Clean up
    DetailPrint "Cleaning up..."
    RMDir /r $INSTDIR
SectionEnd
