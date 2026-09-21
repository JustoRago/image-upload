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

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const signup = await dispatch(createRegistration({ email, username, password }))
    if (signup.payload?.success) {
      const login = await dispatch(createSession({ username, password }))
      if (login.payload?.logged) {
        navigate('/')
      }
    } else if (signup.payload?.message) {
      setErrors({ email: null, user: null, password: null })
      const firstWord = String(signup.payload.message).split(' ')[0]
      if (firstWord === "User") {
        setErrors((prevState) => ({ ...prevState, user: signup.payload.message }))
      } else if (firstWord === "Email") {
        setErrors((prevState) => ({ ...prevState, email: signup.payload.message }))
      }
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
            className="p-2 rounded-md border-2 cursor-pointer 
            border-gray-400 bg-gray-800 text-white w-full"
            type="password" value={password} onChange={handlePasswordChange} />
        </label>
        <br />
        <button
          className={submitButtonClass}
          type="submit">Sign up</button>
      </form>
    </main>
  );
};

export default Signup;