param([string]$Folder = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$brief = Get-Content (Join-Path $Folder 'brief.json') -Raw -Encoding utf8 | ConvertFrom-Json
$items = @($brief.items)
if ($items.Count -ne 10) { throw 'La planche attend dix paires.' }

$sheet = [Drawing.Bitmap]::new(1520, 742)
$g = [Drawing.Graphics]::FromImage($sheet)
$g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$color = { param($hex) [Drawing.ColorTranslator]::FromHtml($hex) }
$paper = & $color '#F5EEF0'
$white = [Drawing.SolidBrush]::new((& $color '#FFFAFB'))
$ink = [Drawing.SolidBrush]::new((& $color '#3A2636'))
$muted = [Drawing.SolidBrush]::new((& $color '#80506A'))
$line = [Drawing.Pen]::new((& $color '#D8C2D0'))
$font = { param($family,$size) [Drawing.Font]::new($family,$size,[Drawing.FontStyle]::Regular,[Drawing.GraphicsUnit]::Pixel) }
$title = & $font Georgia 48
$label = & $font Georgia 29
$note = & $font 'Segoe UI' 19
$tag = & $font 'Segoe UI' 15
$crops = @{}
try {
  $g.Clear($paper)
  $g.DrawString("UN PETIT MONDE  /  ATELIER D’IRIS  /  CAPSULE CHAUSSURES", $tag, $muted, 32, 22)
  $g.DrawString('Dix paires pour Iris', $title, $ink, 29, 46)
  $caption = if ($brief.validated) {'Baskets, bottines et talons · Vues de face · Capsule validée'} else {'Baskets, bottines et talons · Essayages de face et détails · À valider'}
  $g.DrawString($caption, $note, $muted, 32, 110)
  for ($i = 0; $i -lt 10; $i++) {
    $item = $items[$i]
    $x = 32 + 292 * ($i % 5)
    $y = 155 + 279 * [int][Math]::Floor($i / 5)
    $g.FillRectangle($white, $x, $y, 278, 262)
    $g.DrawRectangle($line, $x, $y, 278, 262)
    $file = Join-Path $Folder ($item.file ?? ('sources/' + $item.id + '.png'))
    $img = [Drawing.Image]::FromFile($file)
    try {
      $unit = $img.Height / 1774.0
      $full = [Drawing.RectangleF]::new(([float](($img.Width - 887*$unit)/2)),0,([float](887*$unit)),$img.Height)
      if ($full.X -lt 0) { throw "Cadrage trop étroit : $($item.id)" }
      $g.DrawImage($img, [Drawing.RectangleF]::new(($x + 9), ($y + 9), 88, 176), $full, [Drawing.GraphicsUnit]::Pixel)
      $detail = [Drawing.Rectangle]::new(($x + 102), ($y + 9), 167, 176)
      $crop = [Drawing.Rectangle]::new([int]($full.X+243*$unit), [int](1352*$unit), [int](401*$unit), [int](422*$unit))
      $crops[$item.id] = @{ view = "$($crop.X) $($crop.Y) $($crop.Width) $($crop.Height)"; w = $img.Width; h = $img.Height }
      $g.DrawImage($img, $detail, $crop, [Drawing.GraphicsUnit]::Pixel)
    } finally { $img.Dispose() }
    $g.DrawString($item.id.Substring(0, 2), $tag, $muted, ($x + 10), ($y + 200))
    $g.DrawString($item.name, $label, $ink, ($x + 39), ($y + 191))
    $g.DrawString($item.style, $note, $muted, ($x + 10), ($y + 230))
  }
  $sheet.Save((Join-Path $Folder 'planche.png'), [Drawing.Imaging.ImageFormat]::Png)
} finally {
  foreach ($value in @($g,$sheet,$white,$ink,$muted,$line,$title,$label,$note,$tag)) { $value.Dispose() }
}

function Html([string]$s) { [Net.WebUtility]::HtmlEncode($s) }
$families = @('Baskets', 'Bottines', 'Talons classiques')
$groups = @(@(0,3), @(4,6), @(7,9))
$sections = for ($group=0; $group -lt $families.Count; $group++) {
  $from, $to = $groups[$group]
  $cards = foreach ($item in $items[$from..$to]) {
    $src = $item.file ?? ('sources/' + $item.id + '.png')
    $name = Html $item.name
    $style = Html $item.style
    $details = Html $item.details
    $num = $item.id.Substring(0,2)
    $crop = $crops[$item.id]
    @"
      <article>
        <a class="images" href="$src" aria-label="Voir $name en pleine résolution">
          <img src="$src" width="887" height="1774" alt="Iris porte $name, de face">
          <svg viewBox="$($crop.view)" role="img" aria-label="Gros plan de la paire $name">
            <image href="$src" width="$($crop.w)" height="$($crop.h)"/>
          </svg>
        </a>
        <div class="copy"><h3><span>$num</span> $name</h3><p><strong>$style</strong></p><p>$details</p></div>
      </article>
"@
  }
  "<section><h2>$($families[$group])</h2><div class='grid'>$($cards -join "`n")</div></section>"
}
$availability = if ($brief.validated) {'Capsule validée · Boutique → Chaussures.'} else {"Planche de validation. Aucun modèle n’est en boutique."}
@"
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dix paires pour Iris — Un petit monde</title>
<style>
  :root{font:16px/1.5 system-ui,sans-serif;color:#3a2636;background:#f5eef0}
  body{margin:0}main{max-width:1440px;margin:auto;padding:clamp(1rem,4vw,3rem)}
  h1,h2,h3{font-family:Georgia,serif;font-weight:500;line-height:1.12;margin:.3em 0}
  h1{font-size:clamp(2.5rem,5vw,5rem)}h2{font-size:2rem;margin-bottom:.6em}h3{font-size:1.55rem}
  h3 span{font:700 .82rem system-ui,sans-serif;color:#80506a;vertical-align:middle}
  .kicker{color:#80506a;font-size:.79rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
  section,footer{border-top:1px solid #d8c2d0;margin-top:1.6rem;padding-top:1rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:1rem}
  article{background:#fffafb;border:1px solid #d8c2d0;border-radius:.65rem;overflow:hidden}
  .images{display:grid;grid-template-columns:1fr 1.85fr;gap:.25rem;background:#d4d6dc;padding:.25rem}
  .images img,.images svg{display:block;width:100%;height:auto;align-self:center}
  .images img{aspect-ratio:1/2;object-fit:cover}
  .copy{padding:.8rem 1rem}.copy p{margin:.4em 0;color:#523d50}a{color:#743955}a:focus-visible{outline:3px solid #833d67;outline-offset:-3px}
</style>
</head>
<body>
<main>
  <header>
    <p class="kicker">Un petit monde · Atelier d’Iris</p>
    <h1>Dix paires pour Iris</h1>
    <p>Vues de face et gros plans. Clique sur une paire pour ouvrir l’essayage en pleine résolution.</p>
  </header>
  $($sections -join "`n")
  <footer>
    <p>$availability</p>
    <p>Inspirations : <a href="https://newsroom.pinterest.com/news/summer-trend-report-2026/">Pinterest · Tendances été 2026</a> et <a href="https://newsroom.pinterest.com/pdf/pinterest-palette-2026-pdf/">Pinterest Palette 2026</a>.</p>
  </footer>
</main>
</body>
</html>
"@ | Set-Content (Join-Path $Folder 'planche.html') -Encoding utf8
