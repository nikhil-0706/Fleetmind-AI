import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { registerUser, loginUser } from '../services/auth'

const roleConfig = {
  driver: {
    title: 'Driver Portal',
    registerFields: [
      { name: 'id', label: 'Driver ID', placeholder: 'DRV_001' },
      { name: 'password', label: 'Password', type: 'password', placeholder: '••••••' },
      { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••' },
      { name: 'truckId', label: 'Truck ID', placeholder: 'T1' },
      { name: 'capacity', label: 'Capacity (tons)', type: 'number', placeholder: '20' },
      { name: 'preferredRate', label: 'Preferred Rate (₹/km)', type: 'number', placeholder: '45' },
      { name: 'startNode', label: 'Starting Node', placeholder: 'N1' },
      { name: 'availableFrom', label: 'Available From', type: 'time', placeholder: '09:00' },
    ],
  },
  shipper: {
    title: 'Shipper Portal',
    registerFields: [
      { name: 'id', label: 'Shipper ID', placeholder: 'SHIP_001' },
      { name: 'password', label: 'Password', type: 'password', placeholder: '••••••' },
      { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••' },
      { name: 'company', label: 'Company Name (optional)', placeholder: 'Sunrise Logistics' },
    ],
  },
  warehouse: {
    title: 'Warehouse Portal',
    registerFields: [
      { name: 'id', label: 'Warehouse ID', placeholder: 'WH_MUM' },
      { name: 'password', label: 'Password', type: 'password', placeholder: '••••••' },
      { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••' },
      { name: 'nodeId', label: 'Node ID', placeholder: 'N1' },
      { name: 'totalDocks', label: 'Total Docks', type: 'number', placeholder: '4' },
      { name: 'compatibleTypes', label: 'Compatible Load Types (comma separated)', placeholder: 'fragile, general' },
    ],
  },
  admin: {
    title: 'Admin Portal',
    registerFields: [
      { name: 'id', label: 'Admin ID', placeholder: 'admin' },
      { name: 'password', label: 'Password', type: 'password', placeholder: '••••••' },
      { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••' },
    ],
  },
}

export default function LoginRegister() {
  const { role } = useParams()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const config = roleConfig[role]

  if (!config) {
    return <div className="p-8 text-center">Invalid role</div>
  }

  const onSubmit = async (data) => {
    try {
      if (isLogin) {
        await loginUser(role, data.id, data.password)
        toast.success(`Welcome back, ${data.id}`)
        navigate(`/${role}`)
      } else {
        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match')
          return
        }
        // Remove confirmPassword from stored data
        const { confirmPassword, ...userData } = data
        await registerUser(role, userData)
        toast.success('Registration successful! Redirecting...')
        navigate(`/${role}`)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  const toggleMode = () => setIsLogin(!isLogin)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
        <div className="bg-primary px-6 py-5">
          <h2 className="text-white text-xl font-semibold">{config.title}</h2>
          <p className="text-primary-200 text-sm mt-1">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {config.registerFields.map((field) => {
            // For login, only show id and password fields
            if (isLogin && field.name !== 'id' && field.name !== 'password') return null
            // For registration, show all fields
            return (
              <div key={field.name}>
                <label className="label">{field.label}</label>
                <input
                  type={field.type || 'text'}
                  className="input-field"
                  placeholder={field.placeholder}
                  {...register(field.name, { required: !isLogin || field.name === 'id' || field.name === 'password' ? 'Required' : false })}
                />
                {errors[field.name] && <p className="text-red-500 text-xs mt-1">{errors[field.name].message}</p>}
              </div>
            )
          })}
          <button type="submit" className="btn-primary w-full">
            {isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>
        <div className="px-6 pb-6 text-center">
          <button onClick={toggleMode} className="text-sm text-accent hover:underline">
            {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}