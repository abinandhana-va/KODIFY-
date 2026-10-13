$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"kodifyofficial@gmail.com","password":"apass@123"}'
$h = @{ Authorization = "Bearer " + $login.token }
try {
  $res = Invoke-RestMethod -Uri "http://localhost:8080/api/assignments/23/participants/19/review" -Headers $h
  $res | ConvertTo-Json -Depth 5
} catch {
  Write-Host "Caught Exception:" $_.Exception.Message
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Body:" $reader.ReadToEnd()
  }
}
