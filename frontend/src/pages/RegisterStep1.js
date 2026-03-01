import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import api from '../utils/api';
import { Wallet, ArrowLeft } from 'lucide-react';

const RegisterStep1 = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        confirm_password: confirmPassword
      });
      
      login(response.data.token, { email, id: response.data.user_id });
      toast.success('Account created! Please complete your profile.');
      navigate('/register/step2');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-muted" data-testid="register-step1-page">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8" data-testid="back-link">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>
        
        <Card className="border border-border/50 shadow-xl" data-testid="register-card">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Wallet className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary" style={{fontFamily: 'DM Sans'}}>SamaFlux</span>
            </div>
            <CardTitle className="text-2xl" style={{fontFamily: 'DM Sans'}} data-testid="card-title">Create Account</CardTitle>
            <CardDescription data-testid="card-description">Step 1 of 2: Account Credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="email-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  data-testid="password-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  data-testid="confirm-password-input"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full rounded-full bg-primary hover:bg-primary/90 payment-button" 
                disabled={loading}
                data-testid="submit-button"
              >
                {loading ? 'Creating Account...' : 'Continue'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline font-medium" data-testid="login-link">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterStep1;