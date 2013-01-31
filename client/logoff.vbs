Option Explicit

Dim shell, net, xml, env
Dim strHTTPURL, strHTTPUsername, strHTTPPassword
Dim strLUsername, strLComputer, strLDate, strLTime
Dim strFormData, intType, strResponse

' Create objects
Set shell = WScript.CreateObject("WScript.Shell")
Set net = Wscript.CreateObject("WScript.Network")
Set xml = CreateObject("Microsoft.XMLHttp")
Set env = shell.Environment("User")

' Configuration for HTTP - change these.
strHTTPURL		= "http://webserver.internal/logintracker/update.php"
strHTTPUsername	= ""
strHTTPPassword	= ""

' Gather required information
strLUsername = net.username
strLComputer = net.computername
strLDate = CStr(Date)
strLTime = CStr(Time)

' Build form data to send
strFormData = "username=" & strLUsername & "&" & _
			  "workstation=" & strLComputer & "&" & _
			  "date=" & strLDate & "&" & _
			  "time=" & strLTime & "&" & _
			  "session_id=" & env("session_id") & "&" & _
			  "action=logoff"

' Data that is being sent
'msgbox strFormData, vbInformation, "Data to send:"

' Open connection
xml.Open "POST", strHTTPURL, False, strHTTPUsername, strHTTPPassword
xml.setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
xml.send lcase(strFormData)

' Show the response
'msgbox xml.responseText, vbInformation, "Server response"

' Check the response
if(isnumeric(xml.responseText)) Then
	intType = 0
	strResponse = "Logoff successful for user " & strLUsername & ". Database updated. Response: " & xml.responseText
else
	intType = 1
	strResponse = "Logoff failed for user " & strLUsername & ". Database not updated. Response: " & vbCrlf & vbcrlf & xml.responseText
end if
shell.LogEvent intType, strResponse