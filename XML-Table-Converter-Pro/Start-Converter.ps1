$ErrorActionPreference = "Stop"
$root = (Resolve-Path $PSScriptRoot).Path
$port = 8766
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
try { $listener.Start() } catch {
  Write-Host "Could not start local server on port $port. Close another instance and retry." -ForegroundColor Red
  Read-Host "Press Enter to close"; exit 1
}
$url = "http://127.0.0.1:$port/XML-Table-Converter.html"
Start-Process $url
Write-Host "XML Table Converter Pro is running locally. Keep this window open." -ForegroundColor Green
Write-Host "No internet connection is used. Press Ctrl+C to stop."
try {
 while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
   $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
   if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "XML-Table-Converter.html" }
   $full = [IO.Path]::GetFullPath((Join-Path $root $rel))
   if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $full -PathType Leaf)) {
    $ctx.Response.StatusCode = 404; $ctx.Response.Close(); continue
   }
   $ext = [IO.Path]::GetExtension($full).ToLowerInvariant()
   $mime = switch ($ext) { ".html" {"text/html; charset=utf-8"} ".js" {"text/javascript; charset=utf-8"} ".css" {"text/css; charset=utf-8"} ".xml" {"application/xml; charset=utf-8"} ".txt" {"text/plain; charset=utf-8"} default {"application/octet-stream"} }
   $bytes = [IO.File]::ReadAllBytes($full)
   $ctx.Response.ContentType = $mime; $ctx.Response.ContentLength64 = $bytes.Length
   $ctx.Response.Headers.Add("X-Content-Type-Options","nosniff")
   $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length); $ctx.Response.Close()
  } catch { try {$ctx.Response.StatusCode=500;$ctx.Response.Close()} catch {} }
 }
} finally { $listener.Stop(); $listener.Close() }
