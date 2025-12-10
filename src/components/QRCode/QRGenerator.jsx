import { QRCodeSVG } from 'qrcode.react'

/**
 * Gerador de QR Code para itens
 */
const QRGenerator = ({ itemId, size = 200, className = '' }) => {
  if (!itemId) return null

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <QRCodeSVG
        value={itemId}
        size={size}
        level="H"
        includeMargin
        className="shadow-lg rounded-lg"
      />
      <p className="text-xs text-gray-500 mt-2 font-mono">ID: {itemId.slice(0, 8)}...</p>
    </div>
  )
}

export default QRGenerator
