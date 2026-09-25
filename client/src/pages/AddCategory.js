import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addCategory } from '../redux/categories/categorySlice';
import { useNavigate } from 'react-router-dom';
import { mainClass, h1Class, formClass, errorPClass } from '../constants';

const AddCategory = () => {
  const [category, setCategory] = useState('')
  const [privacy, setPrivacy] = useState(false)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const dispatch = useDispatch();
  const navigate = useNavigate()

  const handleCheckbox = (e) => {
    setPrivacy(e.currentTarget.checked)
  }

  const handleChange = (e) => {
    setCategory(`${e.target.value}`)
    setError('')
  }

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resp = await dispatch(addCategory({ category, privacy, description }));
    if (resp.payload?.status === 'success') {
      navigate('/')
    } else {
      const firstError = resp.payload?.errors?.[0]
      setError(firstError?.msg || resp.payload?.message || 'Could not create category')
    }
  };

  return (
    <main className={mainClass}>
      <h1 className={h1Class}>Create Category</h1>
      {error && <p className={errorPClass}>{error}</p>}
      <form className={formClass} onSubmit={handleSubmit}>
        <input
          className="p-2 rounded-md border-2 cursor-pointer 
          border-gray-400 bg-gray-800 text-white w-full"
          type="text" placeholder="Category" onChange={handleChange}/>
        <textarea
          className="p-2 rounded-md border-2 cursor-pointer 
          border-gray-400 bg-gray-800 text-white w-full"
          style={{ minHeight: '6rem' }}
          placeholder="Description (optional) — one or more paragraphs"
          value={description}
          onChange={handleDescriptionChange}
        />
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