import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import api from '../utils/api';
import { Receipt, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const Invoice = () => {
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/invoices/create', {
        customer_email: customerEmail,
        customer_name: customerName,
        description: description,
        amount: parseFloat(amount)
      });
      
      setInvoiceData(response.data);
      setShowSuccessDialog(true);
      setCustomerEmail('');
      setCustomerName('');
      setDescription('');
      setAmount('');
      toast.success('Invoice created and sent!');
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-background" data-testid="invoice-page">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{fontFamily: 'DM Sans'}} data-testid="page-heading">Invoices</h1>
          <p className="text-muted-foreground" data-testid="page-description">Create and manage payment requests</p>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" data-testid="create-tab">Create Invoice</TabsTrigger>
            <TabsTrigger value="list" data-testid="list-tab">My Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card className="border shadow-sm" data-testid="create-invoice-card">
              <CardHeader>
                <CardTitle data-testid="card-title">Create New Invoice</CardTitle>
                <CardDescription data-testid="card-description">Send a payment request to anyone via email</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Customer Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="customer@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                        data-testid="customer-email-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        type="text"
                        placeholder="John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        data-testid="customer-name-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      type="text"
                      placeholder="Payment for services rendered"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      data-testid="description-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="5000"
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
                    data-testid="create-invoice-button"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    {loading ? 'Creating...' : 'Create & Send Invoice'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card className="border shadow-sm" data-testid="invoices-list-card">
              <CardHeader>
                <CardTitle data-testid="list-card-title">Your Invoices</CardTitle>
                <CardDescription data-testid="list-card-description">View and manage all your invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12" data-testid="no-invoices">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No invoices yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice, index) => (
                      <div key={invoice.invoice_id} className="border rounded-lg p-4 transaction-card" data-testid={`invoice-item-${index}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold" data-testid={`invoice-customer-${index}`}>{invoice.customer_name}</p>
                            <p className="text-sm text-muted-foreground" data-testid={`invoice-email-${index}`}>{invoice.customer_email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary" data-testid={`invoice-amount-${index}`}>₦{invoice.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`} data-testid={`invoice-status-${index}`}>
                              {invoice.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm mb-3" data-testid={`invoice-description-${index}`}>{invoice.description}</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1" data-testid={`invoice-id-${index}`}>{invoice.invoice_id}</code>
                          {invoice.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="rounded-full"
                              onClick={() => window.open(invoice.payment_link, '_blank')}
                              data-testid={`view-payment-link-${index}`}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Payment Link
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent data-testid="success-dialog">
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl mb-2" data-testid="success-dialog-title">Invoice Created!</DialogTitle>
            <DialogDescription className="mb-4" data-testid="success-dialog-description">
              Invoice sent to customer via email.
            </DialogDescription>
            {invoiceData && (
              <div className="bg-muted p-4 rounded-lg space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Invoice ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{invoiceData.invoice_id}</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(invoiceData.invoice_id)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-primary">₦{invoiceData.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => copyToClipboard(invoiceData.payment_link)}
                  data-testid="copy-link-button"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Payment Link
                </Button>
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

export default Invoice;