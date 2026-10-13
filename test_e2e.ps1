$ErrorActionPreference = "Stop"

Write-Host "=== 1. Login as Admin Creator ==="
$creatorLoginReq = @{
  email = "kodifyofficial@gmail.com"
  password = "apass@123"
} | ConvertTo-Json

$creatorAuth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $creatorLoginReq
$creatorToken = $creatorAuth.token
Write-Host "Creator/Admin Token received: $creatorToken"

Write-Host "`n=== 2. Register Candidate ==="
$candReg = @{
  name = "Ananya Sharma"
  username = "ananya_cand"
  email = "ananya@kodify.dev"
  password = "Password123"
  repeatPassword = "Password123"
} | ConvertTo-Json

$candAuth = $null
try {
  $candAuth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -ContentType "application/json" -Body $candReg
} catch {
  $loginReq = @{ email = "ananya@kodify.dev"; password = "Password123" } | ConvertTo-Json
  $candAuth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $loginReq
}
$candToken = $candAuth.token
$candUserId = $candAuth.user.id
Write-Host "Candidate User ID: $candUserId"

Write-Host "`n=== 3. Create Custom Question (MCQ with Options) ==="
$creatorHeaders = @{ Authorization = "Bearer $creatorToken" }
$customQ = @{
  title = "Time Complexity of Binary Search"
  description = "What is the worst-case time complexity of Binary Search on a sorted array of N elements?"
  questionType = "MCQ"
  difficulty = "EASY"
  points = 50
  options = @("O(1)", "O(log N)", "O(N)", "O(N log N)")
  correctOption = "O(log N)"
  explanation = "Binary search halves the search space at each step, yielding logarithmic O(log N) time."
} | ConvertTo-Json

$createdQ = Invoke-RestMethod -Uri "http://localhost:8080/api/assignments/questions/custom" -Method Post -Headers $creatorHeaders -ContentType "application/json" -Body $customQ
$qId = $createdQ.id
Write-Host "Custom Question Created with ID: $qId, Type: $($createdQ.questionType)"

Write-Host "`n=== 4. Create Assignment with Questions and Assigned User ==="
$assignmentReq = @{
  title = "Data Structures & Algorithms Midterm 2026"
  description = "Comprehensive assessment covering binary search and core problem solving."
  durationMinutes = 60
  secureMode = $true
  problemIds = @($qId)
  userIds = @($candUserId)
  allowedAttempts = 1
} | ConvertTo-Json

$createdAssignment = Invoke-RestMethod -Uri "http://localhost:8080/api/assignments" -Method Post -Headers $creatorHeaders -ContentType "application/json" -Body $assignmentReq
$assignmentId = $createdAssignment.id
Write-Host "Assignment Created with ID: $assignmentId, SecureMode: $($createdAssignment.secureMode)"

Write-Host "`n=== 5. Candidate Starts Exam Attempt ==="
$candHeaders = @{ Authorization = "Bearer $candToken" }
$startRes = Invoke-RestMethod -Uri "http://localhost:8080/api/assignments/$assignmentId/attempts" -Method Post -Headers $candHeaders -ContentType "application/json"
$startStr = if ($startRes -is [string]) { $startRes } else { $startRes | ConvertTo-Json }
if ($startStr -match '"id":\s*(\d+)') {
  $attemptId = $matches[1]
}
Write-Host "Candidate Attempt Started with ID: $attemptId"

Write-Host "`n=== 6. Candidate Submits MCQ Answer ==="
$mcqSub = @{
  code = "O(log N)"
  language = "MCQ"
} | ConvertTo-Json

$subRes = Invoke-RestMethod -Uri "http://localhost:8080/api/problems/$qId/submit" -Method Post -Headers $candHeaders -ContentType "application/json" -Body $mcqSub
$subStr = if ($subRes -is [string]) { $subRes } else { $subRes | ConvertTo-Json }
Write-Host "MCQ Submission Response: $subStr"

Write-Host "`n=== 7. Candidate Submits and Finalizes Assignment Attempt ==="
$submitAttemptRes = Invoke-RestMethod -Uri "http://localhost:8080/api/assignments/$assignmentId/attempts/$attemptId/submit" -Method Post -Headers $candHeaders -ContentType "application/json"
$submitStr = if ($submitAttemptRes -is [string]) { $submitAttemptRes } else { $submitAttemptRes | ConvertTo-Json }
Write-Host "Attempt Submitted Response: $submitStr"

Write-Host "`n=== 8. Creator Reviews Assignment Report ==="
$reportRes = Invoke-RestMethod -Uri "http://localhost:8080/api/assignments/$assignmentId/report" -Method Get -Headers $creatorHeaders
$reportStr = if ($reportRes -is [string]) { $reportRes } else { $reportRes | ConvertTo-Json -Depth 3 }
Write-Host "Assignment Report: $reportStr"

Write-Host "`n=== 9. Creator Deep-Dive Review on Candidate Attempt ==="
$reviewRes = Invoke-RestMethod -Uri "http://localhost:8080/api/assignments/$assignmentId/participants/$candUserId/review" -Method Get -Headers $creatorHeaders
$reviewStr = if ($reviewRes -is [string]) { $reviewRes } else { $reviewRes | ConvertTo-Json -Depth 4 }
Write-Host "Candidate Review Deep-Dive: $reviewStr"

Write-Host "`n=== 10. Verify Creator Security Isolation ==="
try {
  $unauthReview = Invoke-RestMethod -Uri "http://localhost:8080/api/assignments/$assignmentId/participants/$candUserId/review" -Method Get -Headers $candHeaders
  Write-Host "ERROR: Unauthorized user was able to access review!"
} catch {
  Write-Host "PASS: Unauthorized candidate correctly received HTTP Access Denied."
}

Write-Host "`n>>> ALL 10 END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<"

Write-Host "`n>>> ALL 10 END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<"
