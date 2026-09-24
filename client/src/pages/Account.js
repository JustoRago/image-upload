import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updatePassword, deleteAccount } from '../redux/session/sessionSlice';
import {
  mainClass,
  h1Class,
  formClass,
  labelClass,
  inputClass,
  errorPClass,
  submitButtonClass,
} from '../constants';

const Account = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    const resp = await dispatch(updatePassword({
      current_password: currentPassword,
      new_password: newPassword,
    }))
    if (resp.payload?.status === 'success') {
      setSuccess('Password updated')
      setCurrentPassword('')
      setNewPassword('')
    } else {
      setError(resp.payload?.message || 'Could not update password')
    }
  }

  const handleDeleteAccount = async () => {
    setError('')
    setSuccess('')
    if (!window.confirm('Delete your account and all your data? This cannot be undone.')) return
    const resp = await dispatch(deleteAccount())
    if (resp.payload?.status === 'success') {
      navigate('/')
    } else {
      setError(resp.payload?.message || 'Could not delete account')
    }
  }

  return (
    <main className={mainClass}>
      <h1 className={h1Class}>Account</h1>
      {error && <p className={errorPClass}>{error}</p>}
      {success && <p className="text-green-400 p-1 text-xs">{success}</p>}

      <form className={formClass} onSubmit={handlePasswordSubmit}>
        <h2 className="text-lg text-white font-bold">Change password</h2>
        <label className={labelClass}>
          Current password:
          <input
            className={inputClass(false)}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label className={labelClass}>
          New password:
          <input
            className={inputClass(false)}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <button className={submitButtonClass} type="submit">
          Update password
        </button>
      </form>

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-lg text-white font-bold">Danger zone</h2>
        <button
          className="w-full p-2 border-4 border-red-400 border-double rounded-md text-red-400 font-bold text-lg bg-gray-700"
          onClick={handleDeleteAccount}
        >
          Delete account
        </button>
      </div>
    </main>
  )
}

export default Account;