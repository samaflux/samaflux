import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LogOut, Wallet, Send, Receipt, QrCode, History, User, TrendingDown } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="navbar-glass sticky top-0 z-50" data-testid="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2" data-testid="logo-link">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary" style={{fontFamily: 'DM Sans'}}>SamaFlux</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-2">
              <Link to="/dashboard" data-testid="nav-dashboard">
                <Button variant={isActive('/dashboard') ? 'default' : 'ghost'} size="sm" className="rounded-full">
                  <Wallet className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/send" data-testid="nav-send">
                <Button variant={isActive('/send') ? 'default' : 'ghost'} size="sm" className="rounded-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </Link>
              <Link to="/invoice" data-testid="nav-invoice">
                <Button variant={isActive('/invoice') ? 'default' : 'ghost'} size="sm" className="rounded-full">
                  <Receipt className="h-4 w-4 mr-2" />
                  Invoice
                </Button>
              </Link>
              <Link to="/qr-payment" data-testid="nav-qr">
                <Button variant={isActive('/qr-payment') ? 'default' : 'ghost'} size="sm" className="rounded-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Pay
                </Button>
              </Link>
              <Link to="/transactions" data-testid="nav-transactions">
                <Button variant={isActive('/transactions') ? 'default' : 'ghost'} size="sm" className="rounded-full">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/profile" data-testid="nav-profile">
              <Button variant="ghost" size="sm" className="rounded-full">
                <User className="h-4 w-4 mr-2" />
                {user.first_name}
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="rounded-full" data-testid="logout-button">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};