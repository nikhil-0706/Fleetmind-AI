import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { loginUser, registerUser } from '../services/auth';

const roleConfig = {
  driver: { title: 'Driver Portal' },
  shipper: { title: 'Shipper Portal' },
  warehouse: { title: 'Warehouse Portal' },
  admin: { title: 'Admin Portal' },
};

export default function LoginRegister() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const config = roleConfig[role];

  if (!config) return <div className="p-8 text-center">Invalid role</div>;

  const onSubmit = async (data) => {
    try {
      if (isLogin) {
        await loginUser(role, data.id, data.password);
        toast.success(`Welcome back, ${data.id}`);
        navigate(`/${role}`);
      } else {
        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        await registerUser(role, data.id, data.password);
        toast.success('Registration successful! Please log in.');
        setIsLogin(true);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
        <div className="bg-primary px-6 py-5"><h2 className="text-white text-xl font-semibold">{config.title}</h2><p className="text-primary-200 text-sm mt-1">{isLogin ? 'Sign in' : 'Create account'}</p></div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div><label className="label">ID</label><input className="input-field" {...register('id', { required: 'Required' })} />{errors.id && <p className="text-red-500 text-xs mt-1">{errors.id.message}</p>}</div>
          <div><label className="label">Password</label><input type="password" className="input-field" {...register('password', { required: 'Required' })} />{errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}</div>
          {!isLogin && (<div><label className="label">Confirm Password</label><input type="password" className="input-field" {...register('confirmPassword', { required: 'Required' })} />{errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}</div>)}
          <button type="submit" className="btn-primary w-full">{isLogin ? 'Sign In' : 'Register'}</button>
        </form>
        <div className="px-6 pb-6 text-center"><button onClick={() => setIsLogin(!isLogin)} className="text-sm text-accent hover:underline">{isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}</button></div>
      </div>
    </div>
  );
}