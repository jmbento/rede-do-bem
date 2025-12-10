import { useState, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera } from 'lucide-react'

/**
 * Scanner de QR Code usando câmera
 */
const QRScanner = ({ onScan, onClose, title = "Escanear QR Code" }) => {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let html5QrCode

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader")
        
        await html5QrCode.start(
          { facingMode: "environment" }, // Câmera traseira
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // QR Code detectado
            if (navigator.vibrate) {
              navigator.vibrate(200) // Vibração de feedback
            }
            onScan(decodedText)
            stopScanner()
          },
          (errorMessage) => {
            // Erro de leitura (normal durante processo)
            console.log(errorMessage)
          }
        )
        setScanning(true)
      } catch (err) {
        setError('Erro ao acessar câmera: ' + err.message)
        console.error(err)
      }
    }

    const stopScanner = async () => {
      if (html5QrCode && html5QrCode.isScanning) {
        await html5QrCode.stop()
        html5QrCode.clear()
      }
      setScanning(false)
    }

    startScanner()

    return () => {
      stopScanner()
    }
  }, [onScan])

  return (
    <div className="qr-scanner-container">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/70 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Camera className="text-white" size={24} />
          <h2 className="text-white text-lg font-semibold">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-red-400 transition-colors"
        >
          <X size={28} />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="qr-scanner-overlay">
        <div id="qr-reader" className="w-full max-w-md" />
        {!scanning && !error && (
          <div className="qr-scanner-frame">
            <div className="flex items-center justify-center h-full">
              <p className="text-white text-center">Inicializando câmera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Instruções */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/70 p-6">
        {error ? (
          <p className="text-red-400 text-center">{error}</p>
        ) : (
          <p className="text-white text-center">
            Posicione o QR Code dentro do quadrado
          </p>
        )}
      </div>
    </div>
  )
}

export default QRScanner
