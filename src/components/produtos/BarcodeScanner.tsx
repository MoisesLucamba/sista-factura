import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, ScanLine } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
    ]);
    
    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    reader.decodeFromConstraints(
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
      videoRef.current!,
      (result, err) => {
        setStarting(false);
        if (result) {
          const text = result.getText();
          if (text) {
            stopScanner();
            onScan(text);
          }
        }
      }
    ).catch((e) => {
      setStarting(false);
      setError('Não foi possível aceder à câmara. Verifique as permissões.');
      console.error('Scanner error:', e);
    });

    return () => stopScanner();
  }, [onScan, stopScanner]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => { stopScanner(); onClose(); }}
        className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full w-10 h-10"
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="relative w-full max-w-lg mx-auto">
        {/* Video */}
        <video ref={videoRef} className="w-full rounded-2xl" />

        {/* Scan overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-40 border-2 border-primary rounded-xl relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
            {/* Animated scan line */}
            <div className="absolute left-2 right-2 h-0.5 bg-primary/80 animate-bounce" style={{ top: '50%' }} />
          </div>
        </div>

        {starting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">A iniciar câmara...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl">
            <div className="text-center text-white p-6">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-4 text-white border-white/30" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-white/60 text-sm mt-4">Aponte a câmara para o código de barras</p>
    </div>
  );
}

interface BarcodeInputProps {
  value: string;
  onChange: (barcode: string) => void;
  onProductFound?: (product: OpenFoodFactsProduct | null) => void;
  className?: string;
}

export interface OpenFoodFactsProduct {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  image_url: string | null;
}

export async function lookupBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    return {
      barcode,
      name: p.product_name || p.product_name_pt || p.product_name_en || '',
      brand: p.brands || '',
      category: p.categories?.split(',')[0]?.trim() || '',
      image_url: p.image_front_url || p.image_url || null,
    };
  } catch {
    return null;
  }
}

export function BarcodeInput({ value, onChange, onProductFound, className }: BarcodeInputProps) {
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBarcode = useCallback(async (barcode: string) => {
    onChange(barcode);
    if (barcode.length >= 8 && onProductFound) {
      setLooking(true);
      const product = await lookupBarcode(barcode);
      onProductFound(product);
      setLooking(false);
    }
  }, [onChange, onProductFound]);

  return (
    <>
      <div className={`flex gap-2 ${className || ''}`}>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handleBarcode(e.target.value)}
            placeholder="Código de barras (EAN-13, Code 128...)"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
          />
          {looking && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setScanning(true)}
          className="h-10 w-10 flex-shrink-0"
          title="Digitalizar código de barras"
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>

      {scanning && (
        <BarcodeScanner
          onScan={(barcode) => { setScanning(false); handleBarcode(barcode); }}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  );
}
