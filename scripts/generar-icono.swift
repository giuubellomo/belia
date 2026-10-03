// Genera el icono: swift scripts/generar-icono.swift <lado> <destino.png>
// Usos (fase 10, cambio 87): assets/icon.png 1024, assets/favicon.png 48,
// public/apple-touch-icon.png 180, public/icon-192.png y public/icon-512.png.
import AppKit

// Icono de BELIA: cuadrado en la tinta de la app (#1C1C1E) con una «B» blanca.
func icono(lado: Int, destino: String) {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: lado, pixelsHigh: lado,
                               bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                               colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    let l = CGFloat(lado)
    NSColor(srgbRed: 0x1C/255, green: 0x1C/255, blue: 0x1E/255, alpha: 1).setFill()
    NSRect(x: 0, y: 0, width: l, height: l).fill()
    let fuente = NSFont.systemFont(ofSize: l * 0.62, weight: .heavy)
    let attrs: [NSAttributedString.Key: Any] = [.font: fuente, .foregroundColor: NSColor.white]
    let texto = NSAttributedString(string: "B", attributes: attrs)
    let tam = texto.size()
    // Centrado optico: por la altura de la mayuscula, no por la caja de la linea.
    // draw(at:) ubica la base de la caja, que queda `descender` por debajo de la linea de base.
    let y = (l - fuente.capHeight) / 2 + fuente.descender
    texto.draw(at: NSPoint(x: (l - tam.width) / 2, y: y))
    NSGraphicsContext.restoreGraphicsState()
    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: destino))
}

let args = CommandLine.arguments
icono(lado: Int(args[1])!, destino: args[2])
