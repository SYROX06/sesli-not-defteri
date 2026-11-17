' Sesli Not Defteri - uygulama penceresi olarak acar, CMD penceresi gostermez.
' Sunucu (node server.js) gizli calisir; pencere kapaninca kendiliginden kapanir.
Option Explicit
Dim sh, fso, dir, url, browser, i, http, ok
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
url = "http://localhost:8080/Chrome-ile-Kullan.html"

' 0 = gizli pencere, False = bekleme
sh.CurrentDirectory = dir
sh.Run "node """ & dir & "\server.js""", 0, False

' Sunucu cevap verene kadar bekle (en fazla ~6 sn)
ok = False
For i = 1 To 30
  On Error Resume Next
  Set http = CreateObject("MSXML2.XMLHTTP")
  http.Open "GET", "http://localhost:8080/ping", False
  http.Send
  If Err.Number = 0 Then
    If http.Status = 204 Then ok = True
  End If
  On Error GoTo 0
  If ok Then Exit For
  WScript.Sleep 200
Next

browser = ""
If fso.FileExists("C:\Program Files\Google\Chrome\Application\chrome.exe") Then
  browser = "C:\Program Files\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe") Then
  browser = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists(sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Google\Chrome\Application\chrome.exe") Then
  browser = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") Then
  browser = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
End If

If browser = "" Then
  MsgBox "Chrome veya Edge bulunamadi.", 16, "Sesli Not Defteri"
Else
  ' --app: adres cubugu/sekme olmadan ayri uygulama penceresi
  sh.Run """" & browser & """ --app=" & url & " --window-size=1100,750", 1, False
End If
