# Pre-generate short Opus voice clips (16 kbps mono WebM) for static voice alerts.
# Windows-only dev tool: uses the built-in System.Speech voices + an ffmpeg binary you pass in.
#   powershell -File scripts/gen-audio.ps1 -Ffmpeg C:\path\to\ffmpeg.exe
# One clip per rail and message (relief = the base wording, pmfby = the .pmfby variant). Only English is generated: this
# machine has no Hindi/Punjabi offline voices, so the app falls back to the browser's speechSynthesis for HI/PA (see README).
# Texts MUST match src/i18n/en.ts (al.voice, reg.voice and their .pmfby variants).
param([Parameter(Mandatory = $true)][string]$Ffmpeg)

Add-Type -AssemblyName System.Speech
$clips = @{
  'alert-relief-en' = 'Saboot alert. A flood is likely at your field. Please take three photos soon. This is advice, not a deadline.'
  'reg-relief-en'   = 'Your field is registered. If a flood hits your field, Saboot will call you and ask for three photos.'
  'alert-pmfby-en'  = 'Saboot alert. Flooding detected at your field. Your 72-hour reporting clock has started. Tap Take photos now, and take three photos.'
  'reg-pmfby-en'    = 'Your field is registered. If a flood hits your field, Saboot will call you. You will then have 72 hours to report.'
}
$out = Join-Path $PSScriptRoot '..\public\audio'
New-Item -ItemType Directory -Force $out | Out-Null
$tmp = [System.IO.Path]::GetTempPath()
foreach ($id in $clips.Keys) {
  $wav = Join-Path $tmp "$id.wav"
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $female = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Gender -eq 'Female' } | Select-Object -First 1
  if ($female) { $s.SelectVoice($female.VoiceInfo.Name) }
  $s.Rate = 1
  $s.SetOutputToWaveFile($wav)
  $s.Speak($clips[$id])
  $s.Dispose()
  & $Ffmpeg -hide_banner -loglevel error -y -i $wav -ac 1 -ar 16000 -c:a libopus -b:a 16k -application voip (Join-Path $out "$id.webm")
  Remove-Item $wav
  Write-Host "$id.webm" (Get-Item (Join-Path $out "$id.webm")).Length 'bytes'
}
