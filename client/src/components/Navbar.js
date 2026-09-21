import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react'
import { Fragment } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { useDispatch, useSelector } from 'react-redux';
import { checkSession, destroySession } from '../redux/session/sessionSlice';

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.sessionReducer.user)

  const logout = async () => {
    dispatch(destroySession())
  }

  const handleKeyUp = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      navigate(`/search?query=${encodeURIComponent(e.target.value)}`)
    }
  }

  useEffect(() => {
    dispatch(checkSession())
  }, [dispatch])
  return (
    <nav className="flex border-b-4 border-white justify-between bg-gray-900">
      <NavLink className="bg-white text-blue text-lg font-sans font-bold py-2 px-8" to="/">
        Image Store
      </NavLink>
      <NavLink
        className="py-2 px-8 pointer font-bold text-lg text-white font-sans hover:bg-white hover:text-gray-900"
        to="/categories"
      >Categories</NavLink>
      <input
        type="text"
        placeholder="Search..."
        onKeyUp={handleKeyUp}
      />
      {user ?
        <>
          <NavLink
            className="py-2 px-8 pointer font-bold text-lg text-white font-sans hover:bg-white hover:text-gray-900"
            to="/upload"
          >Add Image</NavLink>
          <NavLink
            className="py-2 px-8 pointer font-bold text-lg text-white font-sans hover:bg-white hover:text-gray-900"
            to="/add_category"
          >Add Category</NavLink>
          <Menu
            as="div"
            className="py-2 px-8 pointer font-bold text-lg text-white 
            font-sans hover:bg-white hover:text-gray-900"
          >
            <MenuButton>
              {user.username}
            </MenuButton>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                    <MenuItem>
                        <button
                          className='bg-gray-100 text-gray-900 block 
                          w-full px-4 py-2 text-left text-sm'
                          onClick={() => logout()}
                        >
                          Sign out
                        </button>
                    </MenuItem>
                </div>
              </MenuItems>
            </Transition>
          </Menu>
        </>
        :
        <div className="flex justify-between bg-gray-900">
          <NavLink
            className="py-2 px-8 pointer font-bold text-lg text-white 
          font-sans hover:bg-white hover:text-gray-900"
            to="/signup"
          >Sign Up</NavLink>
          <NavLink
            className="py-2 px-8 pointer font-bold text-lg text-white 
          font-sans hover:bg-white hover:text-gray-900"
            to="/login"
          >Log In</NavLink>
        </div>}
    </nav>
  )
}

export default Navbar;
