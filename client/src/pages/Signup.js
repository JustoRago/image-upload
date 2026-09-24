import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createRegistration } from '../redux/registration/registrationSlice';
import { createSession } from '../redux/session/sessionSlice';
import { mainClass, h1Class, formClass, inputClass, errorPClass, submitButtonClass, labelClass } from '../constants';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    email: null,
    user: null,
    password: null
  })
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Maps a signup response to per-field errors: field-keyed validation errors
  // from the server, or a plain message for the duplicate checks.
  const errorsFromSignupResponse = (payload) => {
    if (!payload) return { email: null, user: null, password: null }
    if (Array.isArray(payload.errors) && payload.errors.length) {
      const first = payload.errors[0]
      if (first.param === 'email') return { email: first.msg, user: null, password: null }
      if (first.param === 'username') return { email: null, user: first.msg, password: null }
      if (first.param === 'password') return { email: null, user: null, password: first.msg }
      return { email: null, user: null, password: first.msg || 'Invalid signup' }
    }
    if (typeof payload.message === 'string') {
      if (payload.message.includes('Email Already Exists')) {
        return { email: payload.message, user: null, password: null }
      }
      if (payload.message.includes('User Already Exists')) {
        return { email: null, user: payload.message, password: null }
      }
      return { email: null, user: null, password: payload.message }
    }
    return { email: null, user: null, password: null }
  }

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setErrors((prevState) => ({ ...prevState, email: null }));
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
    setErrors((prevState) => ({ ...prevState, user: null }));
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setErrors((prevState) => ({ ...prevState, password: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const signup = await dispatch(createRegistration({ email, username, password }))
    if (signup.payload?.success) {
      const login = await dispatch(createSession({ username, password }))
      if (login.payload?.logged) {
        navigate('/')
      }
    } else {
      setErrors(errorsFromSignupResponse(signup.payload))
    }
  };

  return (
    <main className={mainClass}>
      <h2 className={h1Class}>Signup</h2>
      <form className={formClass} onSubmit={handleSubmit}>
        <label className={labelClass}>
          Email:
          <input
            className={inputClass(errors.email)}
            type="email" value={email} onChange={handleEmailChange} />
        </label>
        {errors.email && <p className={errorPClass}>{errors.email}</p>}
        <label className={labelClass}>
          Username:
          <input
            className={inputClass(errors.user)}
            type="text" value={username} onChange={handleUsernameChange} />
        </label>
        {errors.user && <p className={errorPClass}>{errors.user}</p>}
        <label className={labelClass}>
          Password:
          <input
            className={inputClass(errors.password)}
            type="password" value={password} onChange={handlePasswordChange} />
        </label>
        {errors.password && <p className={errorPClass}>{errors.password}</p>}
        <br />
        <button
          className={submitButtonClass}
          type="submit">Sign up</button>
      </form>
    </main>
  );
};

export default Signup;