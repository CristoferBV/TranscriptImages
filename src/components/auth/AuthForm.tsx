import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { useAuthActions } from '../../hooks/useAuth';

interface AuthFormProps {
  mode: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login, register, loading } = useAuthActions();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'register') {
      if (!formData.displayName) {
        newErrors.displayName = 'Name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          console.error('Login failed:', result.error);
        }
      } else {
        const result = await register(formData.email, formData.password, formData.displayName);
        if (!result.success) {
          console.error('Registration failed:', result.error);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-sm sm:max-w-md">
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 mx-auto w-full max-w-sm sm:max-w-md">
        <Card className="shadow-xl border-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <Input
                label="Full Name"
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                error={errors.displayName}
                placeholder="Enter your full name"
                className="text-base"
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Enter your email"
              className="text-base"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
              className="text-base"
              required
            />

            {mode === 'register' && (
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
                className="text-base"
                required
              />
            )}

            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full text-base py-3"
              >
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;