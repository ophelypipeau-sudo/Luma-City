$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
public class DogBounds05 {
  public static int[] Measure(string path) {
    using (var b = new Bitmap(path)) {
      int l=b.Width,t=b.Height,r=0,d=0;
      for(int y=0;y<b.Height;y++) for(int x=0;x<b.Width;x++) {
        if(b.GetPixel(x,y).A<16) continue;
        l=Math.Min(l,x); t=Math.Min(t,y); r=Math.Max(r,x+1); d=Math.Max(d,y+1);
      }
      return new int[]{l,t,r,d};
    }
  }
}
'@
$entries = Get-Content "$PSScriptRoot/prompts.json" -Raw -Encoding utf8 | ConvertFrom-Json
$sheet = [System.Drawing.Bitmap]::new(1200, 1080)
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::White)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$font = [System.Drawing.Font]::new('Arial', 13)
$i = 0
foreach ($entry in $entries) {
  Copy-Item -LiteralPath $entry.sourceImage -Destination $entry.fichier
  $b = [System.Drawing.Bitmap]::new((Join-Path (Get-Location) $entry.fichier))
  $entry | Add-Member canvas @($b.Width, $b.Height) -Force
  $entry | Add-Member bounds ([DogBounds05]::Measure((Join-Path (Get-Location) $entry.fichier))) -Force
  $x = ($i % 2) * 600
  $y = [Math]::Floor($i / 2) * 360
  $g.DrawString(($entry.name + ' - ' + $entry.coat), $font, [System.Drawing.Brushes]::Black, $x+12, $y+8)
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
$sheet.Save("$PSScriptRoot/controle-fonds.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $sheet.Dispose(); $font.Dispose()
$entries | ConvertTo-Json -Depth 8 | Set-Content "$PSScriptRoot/prompts.json" -Encoding utf8
