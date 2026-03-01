import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import api from '../utils/api';
import { Wallet, Send, Receipt, QrCode, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const Dashboard = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [fundLoading, setFundLoading] = useState(false);

  useEffect(() => {
    fetchWallet();
    const interval = setInterval(fetchWallet, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await api.get('/wallet');
      setWallet(response.data);
    } catch (error) {
      toast.error('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleFundWallet = async () => {
    if (!fundAmount || parseFloat(fundAmount) < 100) {
      toast.error('Minimum funding amount is ₦100');
      return;
    }

    setFundLoading(true);
    try {
      const response = await api.post('/payments/initialize', {
        amount: parseFloat(fundAmount)
      });
      
      window.open(response.data.authorization_url, '_blank', 'width=600,height=700');
      toast.success('Payment window opened. Complete payment to fund wallet.');
      setShowFundDialog(false);
      setFundAmount('');
      
      setTimeout(fetchWallet, 5000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initialize payment');
    } finally {
      setFundLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{fontFamily: 'DM Sans'}} data-testid="dashboard-heading">Dashboard</h1>
          <p className="text-muted-foreground" data-testid="dashboard-description">Manage your payments and transactions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="md:col-span-2 border shadow-sm" data-testid="wallet-balance-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold balance-display" data-testid="wallet-balance">
                    <span className="currency-symbol">₦</span>{wallet?.balance?.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Nigerian Naira</p>
                </div>
                <Button 
                  onClick={() => setShowFundDialog(true)} 
                  size="sm" 
                  className="rounded-full"
                  data-testid="fund-wallet-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Fund Wallet
                </Button>
              </div>
            </CardContent>
          </Card>

          <Link to="/send" className="block" data-testid="quick-action-send">
            <Card className="border shadow-sm hover:border-primary/20 transition-colors h-full cursor-pointer">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Send Money</h3>
                <p className="text-sm text-muted-foreground">Transfer to users</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/invoice" className="block" data-testid="quick-action-invoice">
            <Card className="border shadow-sm hover:border-primary/20 transition-colors h-full cursor-pointer">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Create Invoice</h3>
                <p className="text-sm text-muted-foreground">Request payment</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="border shadow-sm" data-testid="recent-transactions-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle data-testid="recent-transactions-title">Recent Transactions</CardTitle>
              <Link to="/transactions">
                <Button variant="ghost" size="sm" className="rounded-full" data-testid="view-all-link">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!wallet?.transactions || wallet.transactions.length === 0 ? (
              <div className="text-center py-12" data-testid="no-transactions">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-2">Start by funding your wallet or sending money</p>
              </div>
            ) : (
              <div className="space-y-4">
                {wallet.transactions.map((transaction, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 border rounded-lg transaction-card"
                    data-testid={`transaction-item-${index}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.amount > 0 ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`transaction-description-${index}`}>{transaction.description}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`transaction-date-${index}`}>
                          {new Date(transaction.created_at).toLocaleDateString('en-NG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`} data-testid={`transaction-amount-${index}`}>
                        {transaction.amount > 0 ? '+' : ''}
                        ₦{Math.abs(transaction.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">{transaction.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent data-testid="fund-wallet-dialog">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">Fund Your Wallet</DialogTitle>
            <DialogDescription data-testid="dialog-description">
              Enter the amount you want to add to your wallet. Minimum amount is ₦100.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="1000"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                min="100"
                step="100"
                data-testid="fund-amount-input"
              />
            </div>
            <Button 
              onClick={handleFundWallet} 
              disabled={fundLoading || !fundAmount}
              className="w-full rounded-full payment-button"
              data-testid="proceed-payment-button"
            >
              {fundLoading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;