import React, { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { getCategories } from "../redux/categories/categorySlice";
import { useForm } from "react-hook-form";
import { addImage } from "../redux/images/imagesSlice";
import { useNavigate } from "react-router-dom";
import { checkSession } from "../redux/session/sessionSlice";
import { mainClass, h1Class, formClass, labelClass } from "../constants";

const Upload = () => {
  const categories = useSelector((state) => state.categoriesReducer.categories ?? [])
  const { register, handleSubmit } = useForm();
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      const session = await dispatch(checkSession())
      if (!session.payload?.user) {
        navigate('/')
      }
      dispatch(getCategories())
    }
    load()
  }, [dispatch, navigate])

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("img_name", data.img_name)
    formData.append("category", data.category)
    formData.append("files", data.files[0]);
    const res = await dispatch(addImage(formData))
    const message = res.payload?.message || res.error?.message || 'Upload failed';
    alert(message);
  }

  return (
    <main className={mainClass}>
      <h1 className={h1Class}>Upload image to server</h1>
      <form className={formClass} onSubmit={handleSubmit(onSubmit)}>
        <select
          className="p-2 rounded-md border-2 cursor-pointer 
          border-gray-400 bg-gray-800 text-white w-full"
          {...register("category")} required defaultValue="">
            <option value="" disabled>
              Select a Category
            </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.categoryname}
            </option>
          ))}
        </select>
        <label className={labelClass}>
          Image Name:
          <input className="p-2 rounded-md border-2 cursor-pointer 
            border-gray-400 bg-gray-800 text-white w-full"
            type="text" {...register("img_name")} required />
        </label>
        <input
          className="block w-full text-sm text-white border rounded-md 
          cursor-pointer bg-gray-700 border-gray-600 placeholder-gray-400
          file:bg-gray-900 file:text-white file:border-0 file:p-2"
          type="file" {...register("files")} required />
        <button
          className="w-full p-2 border-4 border-white border-double 
          rounded-md text-white font-bold text-lg bg-gray-700"
          type="submit">
            Upload Image
        </button>
      </form>
    </main>
  )
}

export default Upload;