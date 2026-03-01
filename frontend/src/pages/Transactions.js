import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import api from '../utils/api';
import { History, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data.transactions);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'credit') return transaction.amount > 0;
    if (filter === 'debit') return transaction.amount < 0;
    return true;
  });

  const getTransactionIcon = (amount) => {
    return amount > 0 ? ArrowDownLeft : ArrowUpRight;
  };

  const getTransactionColor = (amount) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionBgColor = (amount) => {
    return amount > 0 ? 'bg-green-100' : 'bg-red-100';
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
    <div className="min-h-screen bg-background" data-testid="transactions-page">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{fontFamily: 'DM Sans'}} data-testid="page-heading">Transaction History</h1>
          <p className="text-muted-foreground" data-testid="page-description">View all your payment activities</p>
        </div>

        <Card className="border shadow-sm" data-testid="transactions-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle data-testid="card-title">All Transactions</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-32" data-testid="filter-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12" data-testid="no-transactions">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction, index) => {
                  const Icon = getTransactionIcon(transaction.amount);
                  return (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 border rounded-lg transaction-card"
                      data-testid={`transaction-item-${index}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          getTransactionBgColor(transaction.amount)
                        }`}>
                          <Icon className={`h-6 w-6 ${getTransactionColor(transaction.amount)}`} />
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
                          {transaction.reference && (
                            <p className="text-xs text-muted-foreground font-mono mt-1" data-testid={`transaction-reference-${index}`}>
                              {transaction.reference}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-semibold ${
                          getTransactionColor(transaction.amount)
                        }`} data-testid={`transaction-amount-${index}`}>
                          {transaction.amount > 0 ? '+' : ''}
                          ₦{Math.abs(transaction.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize mt-1" data-testid={`transaction-status-${index}`}>{transaction.status}</p>
                        <p className="text-xs text-muted-foreground capitalize" data-testid={`transaction-type-${index}`}>{transaction.type?.replace('_', ' ')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;