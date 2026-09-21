import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addCategory } from '../redux/categories/categorySlice';
import { useNavigate } from 'react-router-dom';
import { checkSession } from '../redux/session/sessionSlice';
import { mainClass, h1Class, formClass } from '../constants';

const AddCategory = () => {
  const [category, setCategory] = useState('')
  const [privacy, setPrivacy] = useState(false)

  const dispatch = useDispatch();
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      const res = await dispatch(checkSession())
      if (!res.payload?.user) {
        navigate('/')
      }
    }
    load()
  }, [dispatch, navigate])

  const handleCheckbox = (e) => {
    setPrivacy(e.currentTarget.checked)
  }

  const handleChange = (e) => {
    setCategory(`${e.target.value}`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resp = await dispatch(addCategory({ category, privacy }));
    if (resp.payload?.message) {
      navigate('/')
    }
  };

  return (
    <main className={mainClass}>
      <h1 className={h1Class}>Create Category</h1>
      <form className={formClass} onSubmit={handleSubmit}>
        <input
          className="p-2 rounded-md border-2 cursor-pointer 
          border-gray-400 bg-gray-800 text-white w-full"
          type="text" placeholder="Category" onChange={handleChange}/>
        <label>
          Private:
          <input type="checkbox" onChange={handleCheckbox} />
        </label>
        <button
          className="w-full p-2 border-4 border-white border-double 
          rounded-md text-white font-bold text-lg bg-gray-700"
          type="submit">
          Submit Category
        </button>
      </form>
    </main>
  )
}

export default AddCategory;