import React, { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { getCategoryById } from '../redux/categories/categorySlice';
import { getImagesPerCategory } from "../redux/images/imagesSlice";
import { useParams } from "react-router-dom";
import { mainClass, h1Class, pClass, imageUrl } from "../constants";

const Category = () => {
  let { categoryId } = useParams()

  const category = useSelector((state) => state.categoriesReducer.currentCategory)
  const images = useSelector((state) => state.imagesReducer.images ?? [])
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCategoryById(categoryId))
    dispatch(getImagesPerCategory(categoryId))
  }, [categoryId, dispatch])

  return (
    <main className={mainClass}>
      <h1 className={h1Class}>Shows images from {category?.categoryname ?? 'category'}</h1>
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