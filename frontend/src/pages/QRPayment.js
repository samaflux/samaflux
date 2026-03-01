import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import api from '../utils/api';
import { QrCode, Download, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const QRPayment = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    
    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/payments/generate-qr', {
        amount: parseFloat(amount)
      });
      
      setQrData(response.data);
      toast.success('QR Code generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `samaflux-qr-${qrData.reference}.png`;
      link.href = url;
      link.click();
      toast.success('QR Code downloaded!');
    }
  };

  const copyPaymentLink = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData.payment_link);
      toast.success('Payment link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="qr-payment-page">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{fontFamily: 'DM Sans'}} data-testid="page-heading">QR Payment</h1>
          <p className="text-muted-foreground" data-testid="page-description">Generate QR codes for instant payments</p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" data-testid="generate-tab">Generate QR</TabsTrigger>
            <TabsTrigger value="scan" data-testid="scan-tab">Scan QR</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <Card className="border shadow-sm" data-testid="generate-qr-card">
              <CardHeader>
                <CardTitle data-testid="card-title">Generate Payment QR Code</CardTitle>
                <CardDescription data-testid="card-description">Create a QR code for others to scan and pay you</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateQR} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount to Request (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="1000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      step="0.01"
                      required
                      data-testid="amount-input"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full rounded-full bg-primary hover:bg-primary/90 payment-button"
                    disabled={loading}
                    data-testid="generate-qr-button"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    {loading ? 'Generating...' : 'Generate QR Code'}
                  </Button>
                </form>

                {qrData && (
                  <div className="mt-8 space-y-6" data-testid="qr-code-display">
                    <div className="qr-code-container mx-auto w-fit" data-testid="qr-code-container">
                      <QRCodeCanvas
                        id="qr-code-canvas"
                        value={qrData.payment_link}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Amount</p>
                        <p className="text-2xl font-bold text-primary" data-testid="qr-amount">₦{qrData.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Reference</p>
                        <p className="font-mono text-sm" data-testid="qr-reference">{qrData.reference}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        onClick={downloadQRCode}
                        variant="outline"
                        className="rounded-full"
                        data-testid="download-qr-button"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download QR
                      </Button>
                      <Button 
                        onClick={copyPaymentLink}
                        variant="outline"
                        className="rounded-full"
                        data-testid="copy-link-button"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scan">
            <Card className="border shadow-sm" data-testid="scan-qr-card">
              <CardHeader>
                <CardTitle data-testid="scan-card-title">Scan QR Code</CardTitle>
                <CardDescription data-testid="scan-card-description">Scan a QR code to make a payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12" data-testid="scan-placeholder">
                  <QrCode className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">QR Code scanner coming soon</p>
                  <p className="text-sm text-muted-foreground">
                    For now, you can share the payment link directly or have the payer open it in their browser.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QRPayment;