import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import api from '../utils/api';
import { Send, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';

const SendMoney = () => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transferData, setTransferData] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!recipientEmail || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmTransfer = async () => {
    setLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const response = await api.post('/payments/send-money', {
        recipient_email: recipientEmail,
        amount: parseFloat(amount),
        description: description || undefined
      });
      
      setTransferData(response.data);
      setShowSuccessDialog(true);
      setRecipientEmail('');
      setAmount('');
      setDescription('');
      toast.success('Money sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="send-money-page">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{fontFamily: 'DM Sans'}} data-testid="page-heading">Send Money</h1>
          <p className="text-muted-foreground" data-testid="page-description">Transfer funds to other SamaFlux users</p>
        </div>

        <Card className="border shadow-sm" data-testid="send-money-card">
          <CardHeader>
            <CardTitle data-testid="card-title">Transfer Details</CardTitle>
            <CardDescription data-testid="card-description">Enter the recipient's email and amount to send</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Recipient Email Address</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  data-testid="recipient-email-input"
                />
                <p className="text-sm text-muted-foreground">The recipient must have a SamaFlux account</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Payment for services"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="description-input"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full rounded-full bg-primary hover:bg-primary/90 payment-button"
                disabled={loading}
                data-testid="send-money-button"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Processing...' : 'Send Money'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent data-testid="confirm-dialog">
          <DialogHeader>
            <DialogTitle data-testid="confirm-dialog-title">Confirm Transfer</DialogTitle>
            <DialogDescription data-testid="confirm-dialog-description">
              Please review the transfer details before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recipient</p>
              <p className="font-medium" data-testid="confirm-recipient">{recipientEmail}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold text-primary" data-testid="confirm-amount">₦{parseFloat(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
            </div>
            {description && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium" data-testid="confirm-description">{description}</p>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 rounded-full"
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmTransfer}
                disabled={loading}
                className="flex-1 rounded-full payment-button"
                data-testid="confirm-button"
              >
                Confirm Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent data-testid="success-dialog">
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl mb-2" data-testid="success-dialog-title">Transfer Successful!</DialogTitle>
            <DialogDescription className="mb-4" data-testid="success-dialog-description">
              Your money has been sent successfully.
            </DialogDescription>
            {transferData && (
              <div className="bg-muted p-4 rounded-lg space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">₦{transferData.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-semibold">{transferData.recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-sm">{transferData.reference}</span>
                </div>
              </div>
            )}
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              className="mt-6 w-full rounded-full"
              data-testid="close-success-button"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SendMoney;