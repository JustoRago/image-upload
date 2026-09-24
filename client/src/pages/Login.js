import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../redux/session/sessionSlice';
import { useDispatch } from 'react-redux';
import { checkSession } from '../redux/session/sessionSlice';
import { mainClass, h1Class, formClass, inputClass, labelClass, errorPClass, submitButtonClass } from '../constants';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    user: null,
    password: null
  })
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Maps a login response to per-field errors. The server returns either
  // field-keyed validation errors ({ errors: [...] }) or a plain message.
  const errorsFromLoginResponse = (payload) => {
    if (!payload) return { user: null, password: 'Login failed' }
    if (Array.isArray(payload.errors) && payload.errors.length) {
      const first = payload.errors[0]
      if (first.param === 'username') return { user: first.msg, password: null }
      if (first.param === 'password') return { user: null, password: first.msg }
      return { user: null, password: first.msg || 'Invalid login' }
    }
    if (typeof payload.message === 'string') {
      if (payload.message.includes('User Does Not Exist')) {
        return { user: payload.message, password: null }
      }
      return { user: null, password: payload.message }
    }
    return { user: null, password: 'Invalid username or password' }
  }

  useEffect(() => {
    const load = async () => {
      const res = await dispatch(checkSession())
      if (res.payload?.user) {
        navigate('/')
      }
    }
    load()
  }, [dispatch, navigate])

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    setErrors((prevState) => ({ ...prevState, user: null }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setErrors((prevState) => ({ ...prevState, password: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resp = await dispatch(createSession({ username, password }))
    if (resp.payload?.logged) {
      navigate('/')
    } else {
      setErrors(errorsFromLoginResponse(resp.payload))
    }
  };

  return (
    <main className={mainClass}>
      <h2 className={h1Class}>Login</h2>
      <form className={formClass} onSubmit={handleSubmit}>
        <div>
          <label className={labelClass}>Username:</label>
          <input className={inputClass(errors.user)}
            type="text" value={username} onChange={handleUsernameChange} />
          {errors.user && <p className={errorPClass}>{errors.user}</p>}
        </div>
        <div>
          <label className={labelClass}>Password:</label>
          <input className={inputClass(errors.password)}
            type="password" value={password} onChange={handlePasswordChange} />
          {errors.password && <p className={errorPClass}>{errors.password}</p>}
        </div>
        <button className={submitButtonClass}
          type="submit">Login</button>
      </form>
    </main>
  );
};

export default Login;