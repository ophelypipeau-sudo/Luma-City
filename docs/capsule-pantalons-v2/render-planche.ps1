$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$brief = Get-Content (Join-Path $PSScriptRoot 'brief.json') -Raw -Encoding utf8 | ConvertFrom-Json
$items = @($brief.items)
if ($items.Count -ne 10) { throw 'La planche attend dix pantalons.' }
$assetDir = Join-Path $PSScriptRoot 'sources'
$families = @('Les baggys modernes', 'Les classiques')
$colors = @('#F5EEF0', '#FFFAFB', '#3A2636', '#80506A', '#D8C2D0') | ForEach-Object {
  [Drawing.ColorTranslator]::FromHtml($_)
}
$board = [Drawing.Bitmap]::new(1500, 1450)
$g = [Drawing.Graphics]::FromImage($board)
$g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$brushes = @($colors | ForEach-Object { [Drawing.SolidBrush]::new($_) })
$pen = [Drawing.Pen]::new($colors[4])
$fonts = @(
  [Drawing.Font]::new('Segoe UI', 19, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel),
  [Drawing.Font]::new('Georgia', 60, [Drawing.FontStyle]::Regular, [Drawing.GraphicsUnit]::Pixel),
  [Drawing.Font]::new('Georgia', 29, [Drawing.FontStyle]::Regular, [Drawing.GraphicsUnit]::Pixel),
  [Drawing.Font]::new('Segoe UI', 20, [Drawing.FontStyle]::Regular, [Drawing.GraphicsUnit]::Pixel)
)
try {
  $g.Clear($colors[0])
  $g.DrawString("UN PETIT MONDE  /  ATELIER D’IRIS  /  PLANCHE 02", $fonts[0], $brushes[3], 40, 24)
  $g.DrawString('Baggys & classiques', $fonts[1], $brushes[2], 36, 50)
  $g.DrawString('Dix propositions · Iris de face · À valider', $fonts[3], $brushes[3], 40, 127)
  for ($row = 0; $row -lt 2; $row++) {
    $labelY = 178 + $row * 620
    $g.DrawLine($pen, 40, ($labelY - 8), 1460, ($labelY - 8))
    $g.DrawString($families[$row], $fonts[2], $brushes[2], 40, $labelY)
    for ($column = 0; $column -lt 5; $column++) {
      $item = $items[$row * 5 + $column]
      $x = 40 + 287 * $column
      $y = $labelY + 43
      $g.FillRectangle($brushes[1], $x, $y, 272, 550)
      $g.DrawRectangle($pen, $x, $y, 272, 550)
      $source = [Drawing.Image]::FromFile((Join-Path $assetDir ($item.id + '.png')))
      try {
        if ($source.Width -ne 887 -or $source.Height -ne 1774) { throw "Cadrage inattendu : $($item.id)" }
        $g.DrawImage($source, ($x + 17), ($y + 8), 238, 476)
      } finally { $source.Dispose() }
      $g.DrawString($item.id.Substring(0, 2), $fonts[0], $brushes[3], ($x + 16), ($y + 497))
      $g.DrawString($item.name, $fonts[2], $brushes[2], ($x + 52), ($y + 487))
      $g.DrawString($item.style, $fonts[3], $brushes[3], ($x + 16), ($y + 523))
    }
  }
  $board.Save((Join-Path $PSScriptRoot 'planche.png'), [Drawing.Imaging.ImageFormat]::Png)
} finally {
  $g.Dispose(); $board.Dispose(); $pen.Dispose()
  foreach ($resource in $fonts + $brushes) { $resource.Dispose() }
}

function Encode([string] $value) { [Net.WebUtility]::HtmlEncode($value) }
$sections = for ($row = 0; $row -lt 2; $row++) {
  $cards = foreach ($item in $items[($row * 5)..($row * 5 + 4)]) {
    $src = 'sources/' + $item.id + '.png'
    $name = Encode $item.name
    $style = Encode $item.style
    $details = Encode $item.details
    $num = $item.id.Substring(0, 2)
    @"
    <article>
      <a class="look" href="$src"><img width="887" height="1774" src="$src" alt="Iris de face en pantalon $name"></a>
      <div class="copy"><h3><span>$num</span>$name</h3><p class="style">$style</p><p class="details">$details</p></div>
    </article>
"@
  }
  "<section><h2>$($families[$row])</h2><div class='grid'>$($cards -join "`n")</div></section>"
}
@"
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Baggys &amp; classiques — Un petit monde</title>
<style>
  :root { color-scheme: light; background: #f5eef0; color: #3a2636; font: 16px/1.5 system-ui, sans-serif }
  body { margin: 0 }
  main { max-width: 1440px; margin: auto; padding: clamp(1rem,4vw,3.5rem) }
  h1, h2, h3 { font-family: Georgia, serif; font-weight: 500; line-height: 1.12 }
  h1 { font-size: clamp(2.5rem,5vw,5rem); margin: .15em 0 }
  h2 { font-size: clamp(1.5rem,3vw,2.15rem); margin: 0 0 .65em }
  h3 { font-size: 1.65rem; margin: 0 }
  h3 span { color: #80506a; margin-right: .45em; font: 700 .82rem/1 system-ui, sans-serif; vertical-align: middle }
  .kicker { color: #80506a; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; font-size: .78rem }
  section, footer { margin-top: 1.7rem; padding-top: 1.4rem; border-top: 1px solid #d8c2d0 }
  .grid { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 1rem }
  article { border: 1px solid #d8c2d0; background: #fffafb; border-radius: .65rem; overflow: hidden }
  .look { display: block; background: #d4d6dc }
  img { display: block; width: 100%; height: auto }
  .copy { padding: .9rem; }
  p { margin: .5em 0 }
  .style { font-weight: 650; color: #683d57 }
  .details, footer { color: #523d50 }
  .details { font-size: .88rem }
  a { color: #743955; text-underline-offset: .2em }
  a:focus-visible { outline: 3px solid #833d67; outline-offset: -3px }
  @media (max-width: 1000px) { .grid { grid-template-columns: repeat(auto-fit,minmax(min(100%,195px),1fr)) } }
</style>
</head>
<body>
<main>
  <header>
    <p class="kicker">Un petit monde · Atelier d’Iris · Planche 02</p>
    <h1>Baggys &amp; classiques</h1>
    <p>Dix propositions de face. Clique sur une silhouette pour voir la coupe, la taille et les détails en grand.</p>
  </header>
  $($sections -join "`n")
  <footer>
    <p>Essayages pour validation. Le haut court sert de repère pour lire les ceintures. Les pantalons ne sont pas encore en boutique.</p>
    <p>Inspirations : <a href="https://newsroom.pinterest.com/news/summer-trend-report-2026/">Pinterest · Tendances été 2026</a> · <a href="https://business.pinterest.com/fr/pdf/pinterest-predicts/2026-trend-report/">Pinterest Predicts 2026</a>.</p>
  </footer>
</main>
</body>
</html>
"@ | Set-Content (Join-Path $PSScriptRoot 'planche.html') -Encoding utf8
