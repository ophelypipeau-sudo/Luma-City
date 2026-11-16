$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$folder = $PSScriptRoot
$brief = Get-Content -LiteralPath (Join-Path $folder 'brief.json') -Raw | ConvertFrom-Json
$out = [Drawing.Bitmap]::new(2120, 1265)
$g = [Drawing.Graphics]::FromImage($out)
$g.Clear([Drawing.Color]::FromArgb(243,237,236))
$g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$ink = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(44,30,46))
$muted = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(107,72,95))
$card = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(255,252,251))
$line = [Drawing.Pen]::new([Drawing.Color]::FromArgb(220,202,211),1)
$hero = [Drawing.Font]::new('Georgia', 40, [Drawing.GraphicsUnit]::Pixel)
$heading = [Drawing.Font]::new('Georgia', 27, [Drawing.GraphicsUnit]::Pixel)
$label = [Drawing.Font]::new('Segoe UI', 18, [Drawing.GraphicsUnit]::Pixel)
$small = [Drawing.Font]::new('Segoe UI', 15, [Drawing.GraphicsUnit]::Pixel)
$g.DrawString('Luma City · Pantalons et leggings', $hero, $ink, 32, 20)
$g.DrawString('Dix propositions sur Iris de face', $label, $muted, 36, 79)
for ($i=0; $i -lt $brief.models.Count; $i++) {
  $piece = $brief.models[$i]
  $x = 28 + ($i % 5)*415
  $y = 124 + [int][Math]::Floor($i/5)*563
  $g.FillRectangle($card, $x, $y, 404, 545)
  $g.DrawRectangle($line, $x, $y, 403, 544)
  $preview = Join-Path $folder "vues/$($piece.id).png"
  if (!(Test-Path -LiteralPath $preview)) { $preview = Join-Path $folder "sources/$($piece.id).png" }
  if (Test-Path -LiteralPath $preview) {
    $painting = [Drawing.Bitmap]::new($preview)
    $g.DrawImage($painting, [Drawing.Rectangle]::new($x+10, $y+98, 145, 290))
    $detail = [Drawing.Rectangle]::new(160, 570, 570, 1198)
    $g.DrawImage($painting, [Drawing.Rectangle]::new($x+163, $y+11, 230, 481), $detail, [Drawing.GraphicsUnit]::Pixel)
    $painting.Dispose()
  }
  $g.DrawString(('{0:00} · {1}' -f ($i+1), $piece.name), $heading, $ink, $x+12, $y+495)
  $g.DrawString($piece.style, $small, $muted, $x+13, $y+524)
}
$out.Save((Join-Path $folder 'planche.png'), [Drawing.Imaging.ImageFormat]::Png)
$edits = [Drawing.Bitmap]::new(840, 575)
$editView = [Drawing.Graphics]::FromImage($edits)
$editView.Clear([Drawing.Color]::FromArgb(243,237,236))
$editView.DrawImage($out, [Drawing.Rectangle]::new(11,14,404,545), [Drawing.Rectangle]::new(443,687,404,545), [Drawing.GraphicsUnit]::Pixel)
$editView.DrawImage($out, [Drawing.Rectangle]::new(425,14,404,545), [Drawing.Rectangle]::new(1273,124,404,545), [Drawing.GraphicsUnit]::Pixel)
$edits.Save((Join-Path $folder 'retouches.png'), [Drawing.Imaging.ImageFormat]::Png)
$editView.Dispose(); $edits.Dispose()
$g.Dispose(); $out.Dispose(); $ink.Dispose(); $muted.Dispose(); $card.Dispose(); $line.Dispose()
$hero.Dispose(); $heading.Dispose(); $label.Dispose(); $small.Dispose()
