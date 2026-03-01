import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import api from '../utils/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Loader2, CheckCircle, AlertCircle, CreditCard, Landmark, TrendingDown } from 'lucide-react';

const Withdraw = () => {
  const [wallet, setWallet] = useState(null);
  const [banks, setBanks] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletRes, banksRes, accountsRes, withdrawalsRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/banks'),
        api.get('/withdrawals/bank-accounts'),
        api.get('/withdrawals')
      ]);
      
      setWallet(walletRes.data);
      setBanks(banksRes.data.banks || []);
      setBankAccounts(accountsRes.data.bank_accounts || []);
      setWithdrawals(withdrawalsRes.data.withdrawals || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!accountNumber || !selectedBank) {
      toast.error('Please select bank and enter account number');
      return;
    }

    setVerifying(true);
    try {
      const response = await api.post('/withdrawals/verify-account', null, {
        params: { account_number: accountNumber, bank_code: selectedBank }
      });
      
      if (response.data.success) {
        setAccountName(response.data.account_name);
        setVerified(true);
        toast.success(`Account verified: ${response.data.account_name}`);
      } else {
        toast.error(response.data.error || 'Account verification failed');
        setVerified(false);
      }
    } catch (error) {
      toast.error('Failed to verify account');
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleAddBankAccount = async () => {
    if (!verified) {
      toast.error('Please verify your account first');
      return;
    }

    setAddingAccount(true);
    try {
      await api.post('/withdrawals/add-bank-account', null, {
        params: {
          account_number: accountNumber,
          bank_code: selectedBank,
          account_name: accountName
        }
      });
      
      toast.success('Bank account added successfully');
      setShowAddBankDialog(false);
      setAccountNumber('');
      setAccountName('');
      setSelectedBank('');
      setVerified(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add bank account');
    } finally {
      setAddingAccount(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedRecipient || !withdrawAmount) {
      toast.error('Please select account and enter amount');
      return;
    }

    if (parseFloat(withdrawAmount) > wallet?.balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (parseFloat(withdrawAmount) < 50) {
      toast.error('Minimum withdrawal is ₦50');
      return;
    }

    setWithdrawing(true);
    try {
      await api.post('/withdrawals/initiate', null, {
        params: {
          recipient_code: selectedRecipient,
          amount: parseFloat(withdrawAmount)
        }
      });
      
      toast.success('Withdrawal initiated successfully!');
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      setSelectedRecipient('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
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
    <div className="min-h-screen bg-background" data-testid="withdraw-page">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{fontFamily: 'DM Sans'}} data-testid="page-heading">Withdraw Funds</h1>
          <p className="text-muted-foreground" data-testid="page-description">Transfer money to your Nigerian bank account</p>
        </div>

        <Tabs defaultValue="withdraw" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="withdraw" data-testid="withdraw-tab">Withdraw</TabsTrigger>
            <TabsTrigger value="accounts" data-testid="accounts-tab">Bank Accounts</TabsTrigger>
            <TabsTrigger value="history" data-testid="history-tab">History</TabsTrigger>
          </TabsList>

          <TabsContent value="withdraw">
            <Card className="border shadow-sm" data-testid="withdraw-card">
              <CardHeader>
                <CardTitle data-testid="withdraw-title">Withdraw to Bank</CardTitle>
                <CardDescription data-testid="wallet-balance-display">
                  Available Balance: <span className="font-semibold text-primary">₦{wallet?.balance?.toLocaleString('en-NG', { minimumFractionDigits: 2 }) || '0.00'}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-12" data-testid="no-bank-accounts">
                    <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No bank accounts added yet</p>
                    <Button onClick={() => setShowAddBankDialog(true)} className="rounded-full" data-testid="add-first-bank-button">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Bank Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="bank-account">Select Bank Account</Label>
                      <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                        <SelectTrigger data-testid="bank-account-select">
                          <SelectValue placeholder="Choose your bank account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((account) => (
                            <SelectItem key={account.recipient_code} value={account.recipient_code}>
                              {account.bank_name} - {account.account_number} ({account.account_name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₦)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="50"
                        step="0.01"
                        data-testid="withdraw-amount-input"
                      />
                      <p className="text-sm text-muted-foreground">Minimum withdrawal: ₦50</p>
                    </div>

                    <Button
                      onClick={() => setShowWithdrawDialog(true)}
                      disabled={!selectedRecipient || !withdrawAmount || parseFloat(withdrawAmount) < 50}
                      className="w-full rounded-full payment-button"
                      data-testid="proceed-withdraw-button"
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Proceed to Withdrawal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card className="border shadow-sm" data-testid="bank-accounts-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle data-testid="accounts-title">Bank Accounts</CardTitle>
                    <CardDescription data-testid="accounts-description">Manage your linked bank accounts</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddBankDialog(true)} className="rounded-full" data-testid="add-bank-button">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-12" data-testid="no-accounts-message">
                    <p className="text-muted-foreground">No bank accounts added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankAccounts.map((account, index) => (
                      <Card key={account.recipient_code} className="border" data-testid={`account-item-${index}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Landmark className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold" data-testid={`account-bank-${index}`}>{account.bank_name}</p>
                                <p className="text-sm text-muted-foreground" data-testid={`account-name-${index}`}>{account.account_name}</p>
                                <p className="text-sm text-muted-foreground" data-testid={`account-number-${index}`}>{account.account_number}</p>
                              </div>
                            </div>
                            {account.is_default && (
                              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm" data-testid={`default-badge-${index}`}>
                                Default
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border shadow-sm" data-testid="history-card">
              <CardHeader>
                <CardTitle data-testid="history-title">Withdrawal History</CardTitle>
                <CardDescription data-testid="history-description">View all your withdrawal transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-12" data-testid="no-withdrawals">
                    <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No withdrawals yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal, index) => (
                      <div key={index} className="border rounded-lg p-4 transaction-card" data-testid={`withdrawal-item-${index}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium" data-testid={`withdrawal-bank-${index}`}>
                              {withdrawal.bank_name} - {withdrawal.account_number}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`withdrawal-date-${index}`}>
                              {new Date(withdrawal.initiated_at).toLocaleDateString('en-NG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-1" data-testid={`withdrawal-reference-${index}`}>
                              {withdrawal.transfer_reference}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-red-600" data-testid={`withdrawal-amount-${index}`}>
                              -₦{withdrawal.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              withdrawal.status === 'completed' ? 'bg-green-100 text-green-700' :
                              withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`} data-testid={`withdrawal-status-${index}`}>
                              {withdrawal.status}
                            </span>
                          </div>
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

      <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
        <DialogContent data-testid="add-bank-dialog">
          <DialogHeader>
            <DialogTitle data-testid="add-bank-dialog-title">Add Bank Account</DialogTitle>
            <DialogDescription data-testid="add-bank-dialog-description">
              Add a Nigerian bank account for withdrawals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bank">Select Bank</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger data-testid="select-bank-input">
                  <SelectValue placeholder="Choose your bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="Enter 10-digit account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                maxLength={10}
                data-testid="account-number-input"
              />
            </div>

            {accountNumber.length === 10 && selectedBank && (
              <Button
                onClick={handleVerifyAccount}
                disabled={verifying}
                variant="secondary"
                className="w-full rounded-full"
                data-testid="verify-account-button"
              >
                {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Account
              </Button>
            )}

            {verified && (
              <div className="flex items-center gap-2 rounded bg-green-50 p-3" data-testid="verified-message">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">
                  Account verified: {accountName}
                </span>
              </div>
            )}

            {verified && (
              <Button
                onClick={handleAddBankAccount}
                disabled={addingAccount}
                className="w-full rounded-full payment-button"
                data-testid="save-bank-button"
              >
                {addingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Bank Account
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent data-testid="confirm-withdraw-dialog">
          <DialogHeader>
            <DialogTitle data-testid="confirm-dialog-title">Confirm Withdrawal</DialogTitle>
            <DialogDescription data-testid="confirm-dialog-description">
              Please review the withdrawal details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-primary" data-testid="confirm-amount">
                  ₦{parseFloat(withdrawAmount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Account</span>
                <span className="font-semibold" data-testid="confirm-bank">
                  {bankAccounts.find(a => a.recipient_code === selectedRecipient)?.bank_name}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowWithdrawDialog(false)}
                className="flex-1 rounded-full"
                data-testid="cancel-withdraw-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 rounded-full payment-button"
                data-testid="confirm-withdraw-button"
              >
                {withdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Withdraw;