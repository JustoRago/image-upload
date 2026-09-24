import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { checkSession } from '../redux/session/sessionSlice';

// Route guard for pages that need a logged-in user. Verifies the session on
// mount (so a stale store never grants access) and renders nothing until the
// check has finished — protected forms don't flash before an anonymous user
// is redirected to /login.
const RequireAuth = ({ children }) => {
  const user = useSelector((state) => state.sessionReducer.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      await dispatch(checkSession());
      if (active) setChecked(true);
    };
    check();
    return () => {
      active = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (checked && !user) {
      navigate('/login', { replace: true });
    }
  }, [checked, user, navigate]);

  if (!checked || !user) return null;
  return children;
};

export default RequireAuth;