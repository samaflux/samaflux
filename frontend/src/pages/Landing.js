import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowRight, Send, Receipt, QrCode, Shield, Zap, Globe } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b" data-testid="landing-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold text-primary" style={{fontFamily: 'DM Sans'}}>SamaFlux</span>
            </div>
            <div className="flex gap-4">
              <Link to="/login">
                <Button variant="ghost" className="rounded-full" data-testid="nav-login-button">Login</Button>
              </Link>
              <Link to="/register">
                <Button className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" data-testid="nav-signup-button">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="py-24 px-4" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6" style={{fontFamily: 'DM Sans'}} data-testid="hero-heading">
                Send Money.
                <br />
                <span className="text-primary">Simply. Securely.</span>
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground mb-8" data-testid="hero-description">
                SamaFlux is your modern payment platform for seamless transactions. Send money, create invoices, and receive payments with ease.
              </p>
              <div className="flex gap-4">
                <Link to="/register">
                  <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 payment-button" data-testid="hero-cta-button">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1753351057259-c3c6fdd5fcf3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHw0fHxwZXJzb24lMjBwYXlpbmclMjB3aXRoJTIwc21hcnRwaG9uZSUyMGNhZmV8ZW58MHx8fHwxNzY5NDQyOTk2fDA&ixlib=rb-4.1.0&q=85"
                alt="Person paying with smartphone"
                className="rounded-xl shadow-2xl"
                data-testid="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-muted" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{fontFamily: 'DM Sans'}} data-testid="features-heading">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground" data-testid="features-description">
              Powerful features for modern payments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-border/50 shadow-xl shadow-black/5 hover:border-primary/20 transition-colors" data-testid="feature-card-send">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3" style={{fontFamily: 'DM Sans'}}>Send Money</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Transfer funds instantly to anyone with just their email address. Fast, secure, and reliable.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-xl shadow-black/5 hover:border-primary/20 transition-colors" data-testid="feature-card-invoice">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3" style={{fontFamily: 'DM Sans'}}>Create Invoices</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Send professional invoices to clients via email. They can pay directly without creating an account.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-xl shadow-black/5 hover:border-primary/20 transition-colors" data-testid="feature-card-qr">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3" style={{fontFamily: 'DM Sans'}}>QR Payments</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate and scan QR codes for instant in-person payments. Perfect for businesses and events.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-xl shadow-black/5 hover:border-primary/20 transition-colors" data-testid="feature-card-security">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3" style={{fontFamily: 'DM Sans'}}>Bank-Level Security</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your money and data are protected with enterprise-grade encryption and security protocols.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-xl shadow-black/5 hover:border-primary/20 transition-colors" data-testid="feature-card-instant">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3" style={{fontFamily: 'DM Sans'}}>Instant Transfers</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Money arrives in seconds, not days. Experience the speed of modern digital payments.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-xl shadow-black/5 hover:border-primary/20 transition-colors" data-testid="feature-card-global">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3" style={{fontFamily: 'DM Sans'}}>Global Reach</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Send and receive money from anywhere. Connect with clients and customers worldwide.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 px-4" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{fontFamily: 'DM Sans'}} data-testid="cta-heading">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8" data-testid="cta-description">
            Join thousands of users who trust SamaFlux for their payment needs.
          </p>
          <Link to="/register">
            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 payment-button" data-testid="cta-button">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-12 px-4" data-testid="footer">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold text-primary" style={{fontFamily: 'DM Sans'}}>SamaFlux</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SamaFlux. All rights reserved. Secure payments powered by Paystack.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;