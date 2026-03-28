import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PenLine, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantSignature({ existingSignature, onSave, isAdmin }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [lastPos, setLastPos] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    setIsDrawing(true);
    setLastPos(pos);
    setHasDrawn(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const signatureDataUrl = canvas.toDataURL('image/png');
    onSave({
      signature_image: signatureDataUrl,
      tenant_name: tenantName,
      signed_at: new Date().toISOString(),
    });
  };

  if (existingSignature?.signed_at) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Signed by tenant
        </div>
        <div className="border rounded-xl p-4 bg-muted/20 space-y-2">
          <img
            src={existingSignature.signature_image}
            alt="Tenant signature"
            className="max-h-24 border rounded bg-white"
          />
          <p className="text-sm font-medium">{existingSignature.tenant_name}</p>
          <p className="text-xs text-muted-foreground">
            Signed {format(new Date(existingSignature.signed_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => onSave(null)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove Signature
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tenant Name</Label>
        <Input
          placeholder="Full name of tenant or representative"
          value={tenantName}
          onChange={e => setTenantName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Signature</Label>
          {hasDrawn && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearCanvas}>
              <RotateCcw className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
        <div className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-white touch-none">
          <canvas
            ref={canvasRef}
            width={600}
            height={160}
            className="w-full cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        <p className="text-xs text-muted-foreground">Draw your signature in the box above</p>
      </div>

      <Button
        onClick={handleSave}
        disabled={!hasDrawn || !tenantName.trim()}
        className="w-full gap-2"
      >
        <PenLine className="w-4 h-4" /> Confirm & Save Signature
      </Button>
    </div>
  );
}