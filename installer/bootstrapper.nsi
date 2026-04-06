; ============================================================================
;  Delta Dashboard — NSIS Bootstrapper Installer
;
;  Builds a tiny .exe that downloads and runs the latest release from GitHub.
;  This installer only needs to be built once — it always fetches the latest.
; ============================================================================

!include "MUI2.nsh"
!include "nsDialogs.nsh"

; ---- General settings -------------------------------------------------------
Name "Delta Dashboard Installer"
OutFile "Delta-Dashboard-WebInstaller.exe"
InstallDir "$TEMP\Delta-Dashboard-Bootstrap"
RequestExecutionLevel user
ShowInstDetails show

; ---- Branding ----------------------------------------------------------------
!define MUI_ICON "..\build\icon.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Delta Dashboard — Online Installer"
!define MUI_WELCOMEPAGE_TEXT "This installer will download and install the latest version of Delta Dashboard from GitHub.$\r$\n$\r$\nNo internet connection is required after the initial install — the app will auto-update itself.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TEXT "Delta Dashboard has been installed successfully.$\r$\n$\r$\nYou can now launch it from the Start Menu."

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
    DetailPrint "Downloading latest Delta Dashboard release..."
    nsExec::ExecToLog '$PowerShellPath -ExecutionPolicy Bypass -NoProfile -File "$INSTDIR\install-windows.ps1"'
    Pop $0

    ; Clean up
    DetailPrint "Cleaning up..."
    RMDir /r $INSTDIR

    ; Surface any failure — exit code 0 means success, anything else (including
    ; the literal string "error" that nsExec pushes when it cannot launch the
    ; process at all) means the download failed, the asset wasn't found, or
    ; the user cancelled setup.  IntCmp silently coerces non-numeric strings to
    ; 0, so we must guard against the "error" sentinel explicitly first.
    StrCmp $0 "error" install_failed
    IntCmp $0 0 done install_failed
    install_failed:
    MessageBox MB_ICONSTOP "Installation did not complete.$\r$\n$\r$\nThis usually means the installer asset is missing from the latest release (a build issue), or the download failed.$\r$\n$\r$\nPlease try again in a few minutes, or download a previous version from:$\r$\nhttps://github.com/Tri-Lumen/F1/releases" /SD IDOK
    Quit
    done:
SectionEnd
