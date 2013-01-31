Option Explicit

Dim shell, net, xml, ad, user, env
Dim strHTTPURL, strHTTPUsername, strHTTPPassword
Dim strLUsername, strLComputer, strLDate, strLTime, strOU, strType
Dim strFormData, intType, strResponse
Dim staff, student

' Create objects
Set shell = WScript.CreateObject("WScript.Shell")
Set net = Wscript.CreateObject("WScript.Network")
Set xml = CreateObject("Microsoft.XMLHttp")
Set ad = CreateObject("ADSystemInfo")
Set user = GetObject("LDAP://" & ad.UserName)
Set env = shell.Environment("User")

' Configuration for HTTP - change these
strHTTPURL		= "http://webserver.internal/logintracker/update.php"
strHTTPUsername	= ""
strHTTPPassword	= ""

' User descriptions. Change to suit your environment
staff = "Teaching Staff User,System Administrator User,Non-Teaching Staff User,Support Staff User,Admin User,Head Teacher,Built-in account for administering the computer/domain,Support Staff Users,Deputy Head Teacher,Student Teacher"
student = "Student User,CyberCafe User"

' Gather required information
strLUsername = net.username
strLComputer = net.computername
strLDate = CStr(Date)
strLTime = CStr(Time)
strOU = LCase(GetDN)
If InStr(staff, user.Description) Then
	strType = "staff"
Else
	strType = "student"
End If

' Build form data to send (basic key=val& pairs)
strFormData = "username=" & strLUsername & "&" & _
			  "workstation=" & strLComputer & "&" & _
			  "date=" & strLDate & "&" & _
			  "time=" & strLTime & "&" & _
			  "ou=" & strOU & "&" & _
			  "type=" & strType & "&" & _
			  "action=logon"

' Data that is being sent
'msgbox strFormData, vbInformation, "Data to send:"

' Open connection
xml.Open "POST", strHTTPURL, False, strHTTPUsername, strHTTPPassword
xml.setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
xml.send lcase(strFormData)

' Check the response
if(isnumeric(xml.responseText)) Then
	intType = 0
	strResponse = "Logon for user " & strLUsername & " successfully logged to database with ID " & xml.responseText
	' Store session_id as environment variable for later use by logoff script
	env("session_id") = xml.responseText
else
	intType = 1
	strResponse = "Logon for user " & strLUsername & " failed to be added to the database. Response: " & vbCrlf & vbcrlf & xml.responseText
end if
' Log event
shell.LogEvent intType, strResponse


Function GetDN()
	' Use the NameTranslate object to convert the NT name of the computer to
	' the Distinguished name required for the LDAP provider. Computer names
	' must end with "$". Returns comma delimited string to calling code.
	Dim objTrans, objDomain, arrDN, strDN
	
	' Constants for the NameTranslate object.
	Const ADS_NAME_INITTYPE_GC = 3
	Const ADS_NAME_TYPE_NT4 = 3
	Const ADS_NAME_TYPE_1779 = 1

	' Object creation etc
	Set objTrans = CreateObject("NameTranslate")
	Set objDomain = getObject("LDAP://rootDse")
	objTrans.Init ADS_NAME_INITTYPE_GC, ""
	objTrans.Set ADS_NAME_TYPE_NT4, net.UserDomain & "\" & strLComputer & "$"
	strDN = objTrans.Get(ADS_NAME_TYPE_1779)
	' Get whole DN string and split it (we only want first OU)
	arrDN = split(strDN, ",")
	' First section
	strDN = arrDN(1)
	' Finally replace OU= with nothing, leaving just the OU name
	strDN = replace(strDN, "OU=", "")
	GetDN = strDN
End Function