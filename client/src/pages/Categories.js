import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories, updateCategory, deleteCategory } from '../redux/categories/categorySlice';
import { NavLink } from 'react-router-dom';
import { mainClass, h1Class, inputClass, errorPClass } from '../constants';

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editPrivate, setEditPrivate] = useState(false)
  const [message, setMessage] = useState('')

  const user = useSelector((state) => state.sessionReducer.user)
  const dispatch = useDispatch();

  const load = async () => {
    const categoryArray = await dispatch(getCategories())
    setCategories(categoryArray.payload?.data?.categories || [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  const startEditing = (category) => {
    setEditingId(category.id)
    setEditName(category.categoryname)
    setEditPrivate(Boolean(category.private))
    setMessage('')
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    const name = editName.trim()
    if (!name) {
      setMessage('Category name cannot be empty')
      return
    }
    const resp = await dispatch(updateCategory({ id: editingId, category: name, privacy: editPrivate }))
    if (resp.payload?.status === 'success') {
      setEditingId(null)
      await load()
    } else {
      setMessage(resp.payload?.message || 'Could not update category')
    }
  }

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.categoryname}"? This cannot be undone.`)) return
    const resp = await dispatch(deleteCategory(category.id))
    if (resp.payload?.status === 'success') {
      await load()
    } else {
      setMessage(resp.payload?.message || 'Could not delete category')
    }
  }

  const isOwner = (category) => Boolean(user && category.creator_id && user.id === category.creator_id)

  return (
    <main className={mainClass}>
      <h1 className={h1Class}>Look at images per category</h1>
      {message && <p className={errorPClass}>{message}</p>}
      <div className='flex flex-col gap-4 w-full p-2'>
        {categories.map((category) => (
          <div
            key={category.id}
            className='flex justify-between items-center border-2 p-2 border-double border-white'
          >
            <NavLink to={`/category/${category.id}`} className='flex items-center gap-4'>
              <p className="text-lg text-white font-bold">
                {category.categoryname}
              </p>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  category.private ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
                }`}
              >
                {category.private ? 'Private' : 'Public'}
              </span>
            </NavLink>

            {isOwner(category) && (
              <div className="flex items-center gap-4">
                {editingId === category.id ? (
                  <form className="flex flex-col gap-1" onSubmit={handleEditSubmit}>
                    <input
                      className={inputClass(false)}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <label className="text-white text-sm">
                      <input
                        type="checkbox"
                        checked={editPrivate}
                        onChange={(e) => setEditPrivate(e.currentTarget.checked)}
                      />{' '}
                      Private
                    </label>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 border-2 border-white rounded-md text-white font-bold bg-gray-700"
                        type="submit"
                      >
                        Save
                      </button>
                      <button
                        className="px-3 py-1 border-2 border-white rounded-md text-white font-bold bg-gray-700"
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      className="px-3 py-1 border-2 border-white rounded-md text-white font-bold bg-gray-700"
                      onClick={() => startEditing(category)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 border-2 border-red-400 rounded-md text-red-400 font-bold bg-gray-700"
                      onClick={() => handleDelete(category)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}

export default Categories;