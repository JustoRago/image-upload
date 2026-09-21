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
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resp = await dispatch(createSession({ username, password }))
    if (resp.payload?.logged) {
      navigate('/')
    } else if (resp.payload?.message) {
      setErrors({ user: null, password: null })
      const firstWord = String(resp.payload.message).split(' ')[0]
      if (firstWord === "User") {
        setErrors((prevState) => ({ ...prevState, user: resp.payload.message }))
      } else {
        setErrors((prevState) => ({ ...prevState, password: resp.payload.message }))
      }
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