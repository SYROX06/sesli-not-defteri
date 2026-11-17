' Sesli Not Defteri - uygulama penceresi olarak acar, CMD penceresi gostermez.
' Sunucu (node server.js) gizli calisir; pencere kapaninca kendiliginden kapanir.
Option Explicit
Dim sh, fso, dir, url, browser, i, http, ok, node, p, cands
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
url = "http://localhost:8080/Chrome-ile-Kullan.html"

' 1) ZIP'in icinden acildiysa diger dosyalar yoktur
If Not fso.FileExists(dir & "\server.js") Then
  MsgBox "Uygulama dosyalari bulunamadi." & vbCrLf & vbCrLf & _
    "ZIP dosyasinin icinden acmayin:" & vbCrLf & _
    "1) ZIP'e sag tiklayin > Tumunu ayikla > Ayikla" & vbCrLf & _
    "2) Acilan YENI klasordeki 'Sesli Not Defteri.vbs' dosyasini acin.", 48, "Sesli Not Defteri"
  WScript.Quit
End If

' 2) Node.js'i bul (kurulumdan sonra bilgisayar yeniden baslatilmasa da bulunur)
node = ""
cands = Array( _
  sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe", _
  sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\nodejs\node.exe", _
  sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\nodejs\node.exe", _
  sh.ExpandEnvironmentStrings("%NVM_SYMLINK%") & "\node.exe")
For Each p In cands
  If node = "" And fso.FileExists(p) Then node = p
Next
If node = "" Then
  If sh.Run("cmd /c where node >nul 2>nul", 0, True) = 0 Then node = "node"
End If
If node = "" Then
  If MsgBox("Node.js kurulu degil. Uygulama Node.js ile calisir." & vbCrLf & vbCrLf & _
    "1) Acilacak sayfadan LTS surumunu indirip kurun (hep Ileri deyin)." & vbCrLf & _
    "2) Sonra bu dosyayi tekrar acin." & vbCrLf & vbCrLf & _
    "Indirme sayfasi simdi acilsin mi?", 36, "Sesli Not Defteri") = 6 Then
    sh.Run "https://nodejs.org/"
  End If
  WScript.Quit
End If

' 3) Sunucuyu gizli baslat (0 = gizli pencere, False = bekleme)
sh.CurrentDirectory = dir
If node = "node" Then
  sh.Run "node """ & dir & "\server.js""", 0, False
Else
  sh.Run """" & node & """ """ & dir & "\server.js""", 0, False
End If

' Sunucu cevap verene kadar bekle (en fazla ~8 sn)
ok = False
For i = 1 To 40
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
If Not ok Then
  MsgBox "Sunucu baslatilamadi." & vbCrLf & vbCrLf & _
    "Bilgisayari yeniden baslatip tekrar deneyin." & vbCrLf & _
    "Olmazsa ayni klasordeki 'Chrome-ile-Ac.bat' dosyasini acin; hata siyah pencerede gorunur.", 48, "Sesli Not Defteri"
  WScript.Quit
End If

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
  MsgBox "Chrome veya Edge bulunamadi. Google Chrome'u kurup tekrar deneyin.", 16, "Sesli Not Defteri"
Else
  ' --app: adres cubugu/sekme olmadan ayri uygulama penceresi
  sh.Run """" & browser & """ --app=" & url & " --window-size=1100,750", 1, False
End If
