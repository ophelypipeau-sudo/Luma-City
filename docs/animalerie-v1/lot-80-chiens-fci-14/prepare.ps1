$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
public class DogBounds14 {
  public static int[] Measure(string path) {
    using (var b = new Bitmap(path)) {
      int l=b.Width,t=b.Height,r=0,d=0;
      for(int y=0;y<b.Height;y++) for(int x=0;x<b.Width;x++) {
        if(b.GetPixel(x,y).A<16) continue;
        l=Math.Min(l,x); t=Math.Min(t,y); r=Math.Max(r,x+1); d=Math.Max(d,y+1);
      }
      if(l<=0 || t<=0 || r>=b.Width || d>=b.Height) throw new Exception("Silhouette touches canvas edge: " + path);
      if(b.GetPixel(0,0).A > 2 || b.GetPixel(b.Width-1,b.Height-1).A > 2) throw new Exception("Background is not transparent: " + path);
      return new int[]{l,t,r,d};
    }
  }
}
'@
$entries = Get-Content "$PSScriptRoot/prompts.json" -Raw -Encoding utf8 | ConvertFrom-Json
$pages = @(for ($p=0; $p -lt 8; $p++) { [System.Drawing.Bitmap]::new(1200, 1800) })
$canvases = @($pages | ForEach-Object { [System.Drawing.Graphics]::FromImage($_) })
foreach ($canvas in $canvases) {
  $canvas.Clear([System.Drawing.Color]::White)
  $canvas.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
}
$font = [System.Drawing.Font]::new('Arial', 12)
$i = 0
$issues = @()
foreach ($entry in $entries) {
  if (Test-Path -LiteralPath $entry.sourceImage) {
    Copy-Item -LiteralPath $entry.sourceImage -Destination $entry.fichier
  } elseif (-not (Test-Path -LiteralPath $entry.fichier)) {
    throw "Missing source and project asset: $($entry.id)"
  }
  $b = [System.Drawing.Bitmap]::new((Join-Path (Get-Location) $entry.fichier))
  $entry | Add-Member canvas @($b.Width, $b.Height) -Force
  try {
    $entry | Add-Member bounds ([DogBounds14]::Measure((Join-Path (Get-Location) $entry.fichier))) -Force
  } catch {
    $issues += $_.Exception.Message
  }
  $x = ($i % 2) * 600
  $g = $canvases[[int][Math]::Floor($i / 10)]
  $y = [Math]::Floor(($i % 10) / 2) * 360
  $g.DrawString(($entry.name + ' - ' + $entry.coat), $font, [System.Drawing.Brushes]::Black, [System.Drawing.RectangleF]::new($x+12, $y+2, 576, 36))
  $colors = @('#f4efe7','#242135','#84b9af')
  for ($j=0; $j -lt 3; $j++) {
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($colors[$j]))
    $g.FillRectangle($brush, $x+$j*200, $y+38, 200, 310)
    $scale = [Math]::Min(190.0/$b.Width, 296.0/$b.Height)
    $w = [int]($b.Width*$scale); $h = [int]($b.Height*$scale)
    $g.DrawImage($b, [int]($x+$j*200+(200-$w)/2), [int]($y+45+(296-$h)/2), $w, $h)
    $brush.Dispose()
  }
  $b.Dispose(); $i++
}
$canvases | ForEach-Object { $_.Dispose() }
$sheet = [System.Drawing.Bitmap]::new(1200, 14400)
$overview = [System.Drawing.Graphics]::FromImage($sheet)
for ($page=0; $page -lt 8; $page++) {
  $pages[$page].Save("$PSScriptRoot/controle-fonds-$($page+1).png", [System.Drawing.Imaging.ImageFormat]::Png)
  $overview.DrawImageUnscaled($pages[$page], 0, $page*1800)
  $pages[$page].Dispose()
}
$overview.Dispose()
$sheet.Save("$PSScriptRoot/controle-fonds.png", [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose(); $font.Dispose()
$entries | ConvertTo-Json -Depth 8 | Set-Content "$PSScriptRoot/prompts.json" -Encoding utf8
if ($issues.Count) { throw ($issues -join [Environment]::NewLine) }









