$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$board = [Drawing.Bitmap]::new(1110, 820)
$g = [Drawing.Graphics]::FromImage($board)
$g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$paper = [Drawing.ColorTranslator]::FromHtml('#F5EEF0')
$tile = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#FFFAFB'))
$ink = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#3A2636'))
$accent = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#80506A'))
$title = [Drawing.Font]::new('Georgia', 43, [Drawing.FontStyle]::Regular, [Drawing.GraphicsUnit]::Pixel)
$name = [Drawing.Font]::new('Georgia', 30, [Drawing.FontStyle]::Regular, [Drawing.GraphicsUnit]::Pixel)
$small = [Drawing.Font]::new('Segoe UI', 19, [Drawing.FontStyle]::Regular, [Drawing.GraphicsUnit]::Pixel)
$cards = @(
  @{ id='02-rocade-r2'; title='02 · Rocade'; caption='Élastiques au-dessus des escarpins' },
  @{ id='03-granit-r2'; title='03 · Granit'; caption='Contour de la cuisse sans patte' },
  @{ id='05-velin'; title='05 · Vélin'; caption='Nouveau · Velours côtelé chocolat' }
)
try {
  $g.Clear($paper)
  $g.DrawString("UN PETIT MONDE  /  ATELIER D’IRIS", $small, $accent, 32, 20)
  $g.DrawString('Deux retouches, un nouveau modèle', $title, $ink, 29, 49)
  $g.DrawString('Iris de face · Propositions à valider', $small, $accent, 32, 110)
  for ($i=0; $i -lt $cards.Count; $i++) {
    $card = $cards[$i]
    $x = 32 + $i * 353
    $g.FillRectangle($tile, $x, 152, 340, 644)
    $source = [Drawing.Image]::FromFile((Join-Path $PSScriptRoot ('retouches/' + $card.id + '.png')))
    try {
      if ($source.Width -ne 887 -or $source.Height -ne 1774) { throw "Cadrage inattendu : $($card.id)" }
      $g.DrawImage($source, ($x + 28), 162, 284, 568)
    } finally { $source.Dispose() }
    $g.DrawString($card.title, $name, $ink, ($x + 14), 736)
    $g.DrawString($card.caption, $small, $accent, ($x + 14), 771)
  }
  $board.Save((Join-Path $PSScriptRoot 'planche.png'), [Drawing.Imaging.ImageFormat]::Png)
} finally {
  foreach ($resource in @($g, $board, $tile, $ink, $accent, $title, $name, $small)) { $resource.Dispose() }
}
