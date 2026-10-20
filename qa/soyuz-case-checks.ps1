$ErrorActionPreference = 'Stop'
$pagePath = Join-Path $PSScriptRoot 'soyuz-testing.html'
$homePath = Join-Path (Split-Path $PSScriptRoot -Parent) 'index.html'

if (-not (Test-Path -LiteralPath $pagePath)) { throw 'Missing public Soyuz QA case page.' }
$page = Get-Content -LiteralPath $pagePath -Raw
$homeContent = Get-Content -LiteralPath $homePath -Raw

foreach ($phrase in @('восемь pytest-тестов', '28 августа 2026', 'Проверяю новые изменения вручную', 'только тесты, которые написал сам', 'не указываю как завершённую работу', 'все 8 прошли')) {
  if ($page -notmatch [regex]::Escape($phrase)) { throw "Case page is missing required disclosure/evidence: $phrase" }
}
if ($page -match 'Репозиторий с исходным кодом не публичен') {
  throw 'Do not claim that the source repository is private; describe only what is or is not included on this case page.'
}
if ($page -match '(?i)unit tests completed|юнит-тесты выполнены|e2e tests completed|e2e-тесты выполнены') {
  throw 'Planned unit/E2E work must not be presented as completed.'
}
if ($page -match 'github\.com/Babenich988/my-soyuz') { throw 'Do not expose the private source repository URL.' }
if ($homeContent -notmatch 'qa/soyuz-testing\.html') { throw 'The existing portfolio must link to the standalone case.' }

Write-Output 'Soyuz QA case disclosures and portfolio link: PASS'
