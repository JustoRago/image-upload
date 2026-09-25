import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { getCategoryById, updateCategory } from '../redux/categories/categorySlice';
import { getImagesPerCategory } from "../redux/images/imagesSlice";
import { useParams } from "react-router-dom";
import { mainClass, h1Class, pClass, imageUrl, inputClass, errorPClass, submitButtonClass } from "../constants";

const Category = () => {
  let { categoryId } = useParams()

  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [error, setError] = useState('')

  const category = useSelector((state) => state.categoriesReducer.currentCategory)
  const images = useSelector((state) => state.imagesReducer.images ?? [])
  const user = useSelector((state) => state.sessionReducer.user)
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCategoryById(categoryId))
    dispatch(getImagesPerCategory(categoryId))
  }, [categoryId, dispatch])

  const isOwner = Boolean(user && category && user.id === category.creator_id)

  const startEditing = () => {
    setDescriptionDraft(category.description || '')
    setEditingDescription(true)
    setError('')
  }

  const handleDescriptionSubmit = async (e) => {
    e.preventDefault()
    const resp = await dispatch(updateCategory({ id: category.id, description: descriptionDraft.trim() }))
    if (resp.payload?.status === 'success') {
      setEditingDescription(false)
      setDescriptionDraft('')
      setError('')
    } else {
      setError(resp.payload?.message || 'Could not update description')
    }
  }

  return (
    <main className={mainClass}>
      <h1 className={h1Class}>Shows images from {category?.categoryname ?? 'category'}</h1>

      {category?.description && !editingDescription && (
        <p className="text-white text-left max-w-xl whitespace-pre-line">{category.description}</p>
      )}

      {isOwner && !editingDescription && (
        <button
          className="px-3 py-1 border-2 border-white rounded-md text-white font-bold bg-gray-700"
          onClick={startEditing}
        >
          {category?.description ? 'Edit description' : 'Add description'}
        </button>
      )}

      {isOwner && editingDescription && (
        <form className="flex flex-col items-center gap-2 w-full max-w-xl" onSubmit={handleDescriptionSubmit}>
          <textarea
            className={inputClass(false)}
            style={{ minHeight: '6rem' }}
            placeholder="Description (optional) — one or more paragraphs"
            value={descriptionDraft}
            onChange={(e) => setDescriptionDraft(e.target.value)}
          />
          {error && <p className={errorPClass}>{error}</p>}
          <div className="flex gap-4">
            <button className={submitButtonClass} type="submit">Save description</button>
            <button className={submitButtonClass} type="button" onClick={() => setEditingDescription(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="flex flex-col items-center">
        {images.map((image) => (
          <div className="flex flex-col items-center" key={image.id}>
            <p className={pClass}>{image.img_name}</p>
            <p className={pClass}>{image.created_at}</p>
            {image.filepath && <img className="w-full rounded-sm" alt='' src={imageUrl(image.filepath)} />}
          </div>
        ))}
        {!images.length && <p className={pClass}>No images in this category</p>}
      </div>
    </main>
  )
}

export default Category;